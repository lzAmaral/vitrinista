import { asc, eq } from 'drizzle-orm';
import { mediana } from '#lib/radar/destaque.ts';
import { db } from '#lib/server/db/index.ts';
import { referencias, type TipoMidia } from '#lib/server/db/schema.ts';
import { buscarRadar } from '#lib/server/radar.ts';
import type { PageServerLoad } from './$types';

const PERIODOS = [7, 30, 90] as const;
const TIPOS: TipoMidia[] = ['IMAGE', 'CAROUSEL_ALBUM', 'VIDEO'];
const LIMITE = 60;

export const load: PageServerLoad = async ({ url, locals }) => {
	const diasParam = Number(url.searchParams.get('dias'));
	const dias = (PERIODOS as readonly number[]).includes(diasParam) ? diasParam : 30;
	const tipoParam = url.searchParams.get('tipo') as TipoMidia | null;
	const tipo = tipoParam && TIPOS.includes(tipoParam) ? tipoParam : undefined;
	const referenciaId = url.searchParams.get('ref') || undefined;
	const etiqueta = url.searchParams.get('etiqueta') || undefined;

	const [itens, refs] = await Promise.all([
		buscarRadar(db, locals.loja.id, { dias, tipo, referenciaId, etiqueta }),
		db
			.select({ id: referencias.id, handle: referencias.handle, etiquetas: referencias.etiquetas })
			.from(referencias)
			.where(eq(referencias.lojaId, locals.loja.id))
			.orderBy(asc(referencias.handle))
	]);

	// Qual formato está performando melhor no período (mediana do destaque dos posts maduros)
	const porFormato = TIPOS.map((t) => {
		const valores = itens
			.filter((i) => i.tipo === t && i.maduro && i.destaque != null)
			.map((i) => i.destaque as number);
		return { tipo: t, posts: valores.length, destaqueMediano: mediana(valores) };
	}).filter((f) => f.posts > 0);

	return {
		filtros: { dias, tipo, referenciaId, etiqueta },
		periodos: PERIODOS,
		tipos: TIPOS,
		referencias: refs,
		etiquetas: [...new Set(refs.flatMap((r) => r.etiquetas))].sort(),
		resumo: {
			total: itens.length,
			acimaDe2x: itens.filter((i) => (i.destaque ?? 0) >= 2).length,
			porFormato
		},
		itens: itens.slice(0, LIMITE)
	};
};
