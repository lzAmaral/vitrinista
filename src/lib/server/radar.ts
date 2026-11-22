import { and, desc, eq, gte } from 'drizzle-orm';
import { calcularDestaque, linhaDeBase, type Destaque } from '../radar/destaque';
import type { Db } from './db/client';
import { posts, referencias, type TipoMidia } from './db/schema';

export interface FiltrosRadar {
	dias: number;
	tipo?: TipoMidia;
	referenciaId?: string;
	etiqueta?: string;
}

export interface ItemRadar extends Destaque {
	id: string;
	permalink: string;
	tipo: TipoMidia;
	legenda: string | null;
	imagem: string | null;
	publicadoEm: Date;
	curtidas: number | null;
	comentarios: number;
	visualizacoes: number | null;
	exemplo: boolean;
	referencia: { id: string; handle: string; seguidores: number | null; etiquetas: string[] };
}

/** Janela usada para calcular a linha de base de cada conta, independente do filtro de período. */
const DIAS_HISTORICO = 180;

export async function buscarRadar(
	db: Db,
	lojaId: string,
	filtros: FiltrosRadar,
	agora: Date = new Date()
): Promise<ItemRadar[]> {
	const desde = new Date(agora.getTime() - DIAS_HISTORICO * 86_400_000);

	const linhas = await db
		.select({ post: posts, ref: referencias })
		.from(posts)
		.innerJoin(referencias, eq(posts.referenciaId, referencias.id))
		.where(
			and(
				eq(referencias.lojaId, lojaId),
				eq(referencias.ativa, true),
				gte(posts.publicadoEm, desde)
			)
		)
		.orderBy(desc(posts.publicadoEm));

	// Linha de base por conta
	const porConta = new Map<string, typeof linhas>();
	for (const l of linhas) {
		const lista = porConta.get(l.ref.id) ?? [];
		lista.push(l);
		porConta.set(l.ref.id, lista);
	}
	const bases = new Map(
		[...porConta].map(([id, ls]) => [
			id,
			linhaDeBase(
				ls.map((l) => l.post),
				agora
			)
		])
	);

	const corte = new Date(agora.getTime() - filtros.dias * 86_400_000);

	return linhas
		.filter(({ post, ref }) => {
			if (post.publicadoEm < corte) return false;
			if (filtros.tipo && post.tipo !== filtros.tipo) return false;
			if (filtros.referenciaId && ref.id !== filtros.referenciaId) return false;
			if (filtros.etiqueta && !ref.etiquetas.includes(filtros.etiqueta)) return false;
			return true;
		})
		.map(({ post, ref }) => ({
			...calcularDestaque(post, bases.get(ref.id) ?? null, ref.seguidores, agora),
			id: post.id,
			permalink: post.permalink,
			tipo: post.tipo,
			legenda: post.legenda,
			imagem: post.thumbnailUrl ?? post.mediaUrl,
			publicadoEm: post.publicadoEm,
			curtidas: post.curtidas,
			comentarios: post.comentarios,
			visualizacoes: post.visualizacoes,
			exemplo: post.id.startsWith('exemplo_'),
			referencia: {
				id: ref.id,
				handle: ref.handle,
				seguidores: ref.seguidores,
				etiquetas: ref.etiquetas
			}
		}))
		.sort((a, b) => (b.destaque ?? -1) - (a.destaque ?? -1));
}
