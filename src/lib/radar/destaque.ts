/**
 * Nota de destaque: quanto um post performou em relação ao normal da PRÓPRIA conta.
 *
 * Curtidas absolutas não servem para comparar lojas (conta grande sempre ganha).
 * "Este post teve 4,2x o normal desta loja" é comparável entre uma loja pequena e uma gigante.
 */

export const PESO_COMENTARIO = 2;
/** Posts mais novos que isso ainda estão acumulando métricas e não entram na linha de base. */
export const HORAS_PARA_MATURAR = 48;
/** Quantos posts maduros mais recentes formam a linha de base de cada conta. */
export const TAMANHO_LINHA_BASE = 30;

export interface MetricasParaDestaque {
	curtidas: number | null;
	comentarios: number;
	publicadoEm: Date;
}

export function interacoes(p: Pick<MetricasParaDestaque, 'curtidas' | 'comentarios'>): number {
	return (p.curtidas ?? 0) + PESO_COMENTARIO * p.comentarios;
}

export function mediana(valores: number[]): number | null {
	if (valores.length === 0) return null;
	const ordenados = [...valores].sort((a, b) => a - b);
	const meio = Math.floor(ordenados.length / 2);
	return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

export function estaMaduro(publicadoEm: Date, agora: Date): boolean {
	return agora.getTime() - publicadoEm.getTime() >= HORAS_PARA_MATURAR * 3_600_000;
}

/** Mediana de interações dos últimos posts maduros de uma conta. */
export function linhaDeBase(postsDaConta: MetricasParaDestaque[], agora: Date): number | null {
	const maduros = postsDaConta
		.filter((p) => estaMaduro(p.publicadoEm, agora))
		.sort((a, b) => b.publicadoEm.getTime() - a.publicadoEm.getTime())
		.slice(0, TAMANHO_LINHA_BASE)
		.map(interacoes);
	return mediana(maduros);
}

export interface Destaque {
	interacoes: number;
	/** Múltiplo do normal da conta (ex.: 4.2 = 4,2x). null quando não há base. */
	destaque: number | null;
	/** Interações / seguidores. null quando não sabemos os seguidores. */
	engajamento: number | null;
	maduro: boolean;
}

export function calcularDestaque(
	post: MetricasParaDestaque,
	base: number | null,
	seguidores: number | null,
	agora: Date
): Destaque {
	const total = interacoes(post);
	return {
		interacoes: total,
		destaque: base && base > 0 ? total / base : null,
		engajamento: seguidores && seguidores > 0 ? total / seguidores : null,
		maduro: estaMaduro(post.publicadoEm, agora)
	};
}
