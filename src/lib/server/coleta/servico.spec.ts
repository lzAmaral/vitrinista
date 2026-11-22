import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { criarDb, migrar, type Db } from '../db/client';
import { metricasPost, posts, referencias, type Referencia } from '../db/schema';
import { garantirLojaPadrao } from '../loja';
import { buscarRadar } from '../radar';
import { criarColetorExemplo } from './exemplo';
import { coletarReferencia } from './servico';
import { ErroColeta, type Coletor } from './tipos';

let db: Db;
let ref: Referencia;
const agora = new Date('2026-11-22T12:00:00Z');

beforeEach(async () => {
	db = criarDb(':memory:');
	await migrar(db);
	const loja = await garantirLojaPadrao(db);
	[ref] = await db
		.insert(referencias)
		.values({ lojaId: loja.id, handle: 'loja.teste' })
		.returning();
});

describe('coletarReferencia', () => {
	it('grava perfil, posts e histórico; rodar de novo não duplica', async () => {
		const coletor = criarColetorExemplo(() => agora);

		const r1 = await coletarReferencia(db, coletor, ref, agora);
		const r2 = await coletarReferencia(db, coletor, ref, new Date(agora.getTime() + 3_600_000));

		expect(r1.ok && r2.ok).toBe(true);
		const totalPosts = await db.$count(posts);
		expect(totalPosts).toBe(r1.postsColetados);
		expect(await db.$count(metricasPost)).toBe(totalPosts * 2);

		const [atualizada] = await db.select().from(referencias).where(eq(referencias.id, ref.id));
		expect(atualizada.seguidores).toBeGreaterThan(0);
		expect(atualizada.erroColeta).toBeNull();
	});

	it('registra o erro na referência sem derrubar o lote', async () => {
		const quebrado: Coletor = {
			fonte: 'meta',
			buscarPerfil: () =>
				Promise.reject(new ErroColeta('nao_encontrada', '@loja.teste não foi encontrada'))
		};

		const r = await coletarReferencia(db, quebrado, ref, agora);

		expect(r.ok).toBe(false);
		const [atualizada] = await db.select().from(referencias).where(eq(referencias.id, ref.id));
		expect(atualizada.erroColeta).toContain('não foi encontrada');
	});

	it('erro de token interrompe (afeta todas as referências)', async () => {
		const semToken: Coletor = {
			fonte: 'meta',
			buscarPerfil: () => Promise.reject(new ErroColeta('token', 'token expirado'))
		};
		await expect(coletarReferencia(db, semToken, ref, agora)).rejects.toThrow('token expirado');
	});
});

describe('buscarRadar', () => {
	it('ordena pelo destaque e respeita o filtro de período', async () => {
		await coletarReferencia(
			db,
			criarColetorExemplo(() => agora),
			ref,
			agora
		);

		const itens = await buscarRadar(db, ref.lojaId, { dias: 30 }, agora);

		expect(itens.length).toBeGreaterThan(0);
		expect(itens.every((i) => i.publicadoEm >= new Date(agora.getTime() - 30 * 86_400_000))).toBe(
			true
		);
		const destaques = itens.map((i) => i.destaque ?? -1);
		expect(destaques).toEqual([...destaques].sort((a, b) => b - a));
		expect(itens[0].exemplo).toBe(true);
	});
});
