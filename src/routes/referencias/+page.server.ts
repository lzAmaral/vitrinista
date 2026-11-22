import { fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
	coletarLoja,
	coletarReferencia,
	ErroColeta,
	normalizarHandle
} from '#lib/server/coleta/index.ts';
import { obterColetor } from '#lib/server/config.ts';
import { db } from '#lib/server/db/index.ts';
import { referencias } from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const lista = await db
		.select()
		.from(referencias)
		.where(eq(referencias.lojaId, locals.loja.id))
		.orderBy(asc(referencias.handle));
	return { referencias: lista };
};

const novaReferencia = z.object({
	handle: z.string().min(1, 'Informe o @ da loja.'),
	siteUrl: z
		.string()
		.trim()
		.transform((v) => v || null)
		.pipe(z.url({ message: 'Site inválido. Use o endereço completo, com https://' }).nullable()),
	etiquetas: z.string().transform((v) =>
		[
			...new Set(
				v
					.split(',')
					.map((e) => e.trim().toLowerCase())
					.filter(Boolean)
			)
		].slice(0, 8)
	)
});

/** Busca a referência garantindo que pertence à loja atual. */
async function referenciaDaLoja(lojaId: string, id: FormDataEntryValue | null) {
	if (typeof id !== 'string') return null;
	const [ref] = await db
		.select()
		.from(referencias)
		.where(and(eq(referencias.id, id), eq(referencias.lojaId, lojaId)));
	return ref ?? null;
}

function mensagemDeErro(e: unknown) {
	if (e instanceof ErroColeta) return e.message;
	console.error(e);
	return 'Erro inesperado na coleta.';
}

export const actions: Actions = {
	adicionar: async ({ request, locals }) => {
		const form = Object.fromEntries(await request.formData());
		const valores = { handle: '', siteUrl: '', etiquetas: '', ...form } as Record<string, string>;
		const lido = novaReferencia.safeParse(valores);
		if (!lido.success) {
			return fail(400, { acao: 'adicionar', valores, erro: lido.error.issues[0].message });
		}

		let handle: string;
		try {
			handle = normalizarHandle(lido.data.handle);
		} catch (e) {
			return fail(400, { acao: 'adicionar', valores, erro: mensagemDeErro(e) });
		}
		if (handle === locals.loja.handleInstagram) {
			return fail(400, { acao: 'adicionar', valores, erro: 'Esse é o Instagram da própria loja.' });
		}

		const [criada] = await db
			.insert(referencias)
			.values({
				lojaId: locals.loja.id,
				handle,
				siteUrl: lido.data.siteUrl,
				etiquetas: lido.data.etiquetas
			})
			.onConflictDoNothing()
			.returning();
		if (!criada) {
			return fail(400, { acao: 'adicionar', valores, erro: `@${handle} já está na lista.` });
		}

		// Já busca os posts para a referência aparecer no Radar
		try {
			const r = await coletarReferencia(db, obterColetor(), criada);
			return {
				acao: 'adicionar',
				sucesso: r.ok
					? `@${handle} adicionada com ${r.postsColetados} posts.`
					: `@${handle} adicionada, mas a coleta falhou.`
			};
		} catch (e) {
			return { acao: 'adicionar', sucesso: `@${handle} adicionada.`, erro: mensagemDeErro(e) };
		}
	},

	coletar: async ({ request, locals }) => {
		const ref = await referenciaDaLoja(locals.loja.id, (await request.formData()).get('id'));
		if (!ref) return fail(404, { acao: 'coletar', erro: 'Referência não encontrada.' });
		try {
			const r = await coletarReferencia(db, obterColetor(), ref);
			return r.ok
				? { acao: 'coletar', sucesso: `@${ref.handle}: ${r.postsColetados} posts atualizados.` }
				: fail(502, { acao: 'coletar', erro: r.erro });
		} catch (e) {
			return fail(502, { acao: 'coletar', erro: mensagemDeErro(e) });
		}
	},

	coletarTodas: async ({ locals }) => {
		try {
			const resultados = await coletarLoja(db, obterColetor(), locals.loja.id);
			const falhas = resultados.filter((r) => !r.ok);
			return {
				acao: 'coletarTodas',
				sucesso: `${resultados.length - falhas.length} de ${resultados.length} referências atualizadas.`,
				erro: falhas.length
					? `Falharam: ${falhas.map((f) => '@' + f.handle).join(', ')}`
					: undefined
			};
		} catch (e) {
			return fail(502, { acao: 'coletarTodas', erro: mensagemDeErro(e) });
		}
	},

	alternar: async ({ request, locals }) => {
		const ref = await referenciaDaLoja(locals.loja.id, (await request.formData()).get('id'));
		if (!ref) return fail(404, { acao: 'alternar', erro: 'Referência não encontrada.' });
		await db.update(referencias).set({ ativa: !ref.ativa }).where(eq(referencias.id, ref.id));
	},

	remover: async ({ request, locals }) => {
		const ref = await referenciaDaLoja(locals.loja.id, (await request.formData()).get('id'));
		if (!ref) return fail(404, { acao: 'remover', erro: 'Referência não encontrada.' });
		await db.delete(referencias).where(eq(referencias.id, ref.id));
		return { acao: 'remover', sucesso: `@${ref.handle} removida (e os posts dela).` };
	}
};
