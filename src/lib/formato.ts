const numero = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const compacto = (n: number | null | undefined) => (n == null ? '—' : numero.format(n));
export const dataCurta = (d: Date) => data.format(d);
export const dataEHora = (d: Date | null) => (d ? dataHora.format(d) : 'nunca');
export const multiplo = (n: number | null) =>
	n == null
		? '—'
		: `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}x`;
export const porcentagem = (n: number | null) =>
	n == null ? '—' : `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export const NOMES_TIPO = {
	IMAGE: 'Foto',
	CAROUSEL_ALBUM: 'Carrossel',
	VIDEO: 'Reels'
} as const;
