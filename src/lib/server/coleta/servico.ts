import { and, eq, like } from 'drizzle-orm';
import type { Db } from '../db/client';
import { coletas, metricasPost, posts, referencias, type Referencia } from '../db/schema';
import { PREFIXO_EXEMPLO } from './exemplo';
import { ErroColeta, type Coletor } from './tipos';

export interface ResultadoColeta {
	referenciaId: string;
	handle: string;
	ok: boolean;
	postsColetados: number;
	erro?: string;
}

/**
 * Coleta uma referência e grava perfil, posts e o histórico de métricas.
 * Idempotente: rodar duas vezes atualiza os mesmos posts (chave = media id).
 */
export async function coletarReferencia(
	db: Db,
	coletor: Coletor,
	ref: Referencia,
	agora: Date = new Date()
): Promise<ResultadoColeta> {
	const [coleta] = await db
		.insert(coletas)
		.values({ referenciaId: ref.id, fonte: coletor.fonte, status: 'rodando', iniciadoEm: agora })
		.returning({ id: coletas.id });

	try {
		const perfil = await coletor.buscarPerfil(ref.handle);

		await db.transaction(async (tx) => {
			// Ao passar para dados reais, some com os fictícios desta referência
			if (coletor.fonte !== 'exemplo') {
				await tx
					.delete(posts)
					.where(and(eq(posts.referenciaId, ref.id), like(posts.id, `${PREFIXO_EXEMPLO}%`)));
			}

			await tx
				.update(referencias)
				.set({
					nome: perfil.nome,
					fotoUrl: perfil.fotoUrl,
					seguidores: perfil.seguidores,
					totalPosts: perfil.totalPosts,
					ultimaColetaEm: agora,
					erroColeta: null
				})
				.where(eq(referencias.id, ref.id));

			for (const p of perfil.posts) {
				const metricas = {
					curtidas: p.curtidas,
					comentarios: p.comentarios,
					visualizacoes: p.visualizacoes
				};
				await tx
					.insert(posts)
					.values({ ...p, referenciaId: ref.id, atualizadoEm: agora })
					.onConflictDoUpdate({
						target: posts.id,
						set: {
							...metricas,
							legenda: p.legenda,
							mediaUrl: p.mediaUrl, // URLs do CDN expiram; renovamos a cada coleta
							thumbnailUrl: p.thumbnailUrl,
							atualizadoEm: agora
						}
					});
				await tx
					.insert(metricasPost)
					.values({ postId: p.id, coletadoEm: agora, seguidores: perfil.seguidores, ...metricas })
					.onConflictDoNothing();
			}

			await tx
				.update(coletas)
				.set({ status: 'ok', postsColetados: perfil.posts.length, finalizadoEm: new Date() })
				.where(eq(coletas.id, coleta.id));
		});

		return {
			referenciaId: ref.id,
			handle: ref.handle,
			ok: true,
			postsColetados: perfil.posts.length
		};
	} catch (e) {
		const mensagem = e instanceof ErroColeta ? e.message : 'Erro inesperado na coleta.';
		if (!(e instanceof ErroColeta)) console.error(`[coleta] @${ref.handle}`, e);

		await db.update(referencias).set({ erroColeta: mensagem }).where(eq(referencias.id, ref.id));
		await db
			.update(coletas)
			.set({ status: 'erro', erro: mensagem, finalizadoEm: new Date() })
			.where(eq(coletas.id, coleta.id));

		// Problema de token/limite afeta todas as referências: interrompe o lote
		if (e instanceof ErroColeta && (e.motivo === 'token' || e.motivo === 'limite')) throw e;

		return {
			referenciaId: ref.id,
			handle: ref.handle,
			ok: false,
			postsColetados: 0,
			erro: mensagem
		};
	}
}

/** Coleta todas as referências ativas de uma loja, uma de cada vez (respeita o limite da Meta). */
export async function coletarLoja(
	db: Db,
	coletor: Coletor,
	lojaId: string,
	pausaMs = 1_000
): Promise<ResultadoColeta[]> {
	const lista = await db
		.select()
		.from(referencias)
		.where(and(eq(referencias.lojaId, lojaId), eq(referencias.ativa, true)));

	const resultados: ResultadoColeta[] = [];
	for (const [i, ref] of lista.entries()) {
		if (i > 0 && pausaMs > 0) await new Promise((r) => setTimeout(r, pausaMs));
		resultados.push(await coletarReferencia(db, coletor, ref));
	}
	return resultados;
}
