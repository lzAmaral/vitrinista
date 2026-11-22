import { describe, expect, it } from 'vitest';
import { calcularDestaque, interacoes, linhaDeBase, mediana } from './destaque';

const agora = new Date('2026-11-22T12:00:00Z');
const diasAtras = (d: number) => new Date(agora.getTime() - d * 86_400_000);

describe('interacoes', () => {
	it('comentário vale o dobro da curtida', () => {
		expect(interacoes({ curtidas: 100, comentarios: 10 })).toBe(120);
	});
	it('curtidas ocultas contam como zero', () => {
		expect(interacoes({ curtidas: null, comentarios: 10 })).toBe(20);
	});
});

describe('mediana', () => {
	it('lista vazia', () => expect(mediana([])).toBeNull());
	it('ímpar', () => expect(mediana([5, 1, 3])).toBe(3));
	it('par', () => expect(mediana([1, 2, 3, 10])).toBe(2.5));
});

describe('linhaDeBase', () => {
	it('ignora posts com menos de 48h', () => {
		const posts = [
			{ curtidas: 100, comentarios: 0, publicadoEm: diasAtras(5) },
			{ curtidas: 200, comentarios: 0, publicadoEm: diasAtras(4) },
			{ curtidas: 9999, comentarios: 0, publicadoEm: diasAtras(1) }
		];
		expect(linhaDeBase(posts, agora)).toBe(150);
	});

	it('usa só os 30 posts maduros mais recentes', () => {
		const recentes = Array.from({ length: 30 }, (_, i) => ({
			curtidas: 100,
			comentarios: 0,
			publicadoEm: diasAtras(3 + i)
		}));
		const antigos = Array.from({ length: 30 }, (_, i) => ({
			curtidas: 5000,
			comentarios: 0,
			publicadoEm: diasAtras(100 + i)
		}));
		expect(linhaDeBase([...antigos, ...recentes], agora)).toBe(100);
	});
});

describe('calcularDestaque', () => {
	it('compara com o normal da conta, não com o tamanho dela', () => {
		const pequena = calcularDestaque(
			{ curtidas: 400, comentarios: 0, publicadoEm: diasAtras(3) },
			100,
			2_000,
			agora
		);
		const gigante = calcularDestaque(
			{ curtidas: 20_000, comentarios: 0, publicadoEm: diasAtras(3) },
			10_000,
			500_000,
			agora
		);
		expect(pequena.destaque).toBe(4);
		expect(gigante.destaque).toBe(2);
		expect(pequena.engajamento).toBeCloseTo(0.2);
	});

	it('sem base ou seguidores devolve null em vez de dividir por zero', () => {
		const r = calcularDestaque(
			{ curtidas: 10, comentarios: 0, publicadoEm: agora },
			0,
			null,
			agora
		);
		expect(r.destaque).toBeNull();
		expect(r.engajamento).toBeNull();
		expect(r.maduro).toBe(false);
	});
});
