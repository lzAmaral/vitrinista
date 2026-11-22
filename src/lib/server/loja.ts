import { asc } from 'drizzle-orm';
import type { Db } from './db/client';
import { lojas, type Loja } from './db/schema';

/**
 * Por enquanto o sistema opera uma loja só (Ana Modas). Quando virar produto,
 * esta função passa a resolver a loja pela sessão do usuário logado.
 */
export async function garantirLojaPadrao(db: Db): Promise<Loja> {
	const [existente] = await db.select().from(lojas).orderBy(asc(lojas.criadoEm)).limit(1);
	if (existente) return existente;

	const [criada] = await db
		.insert(lojas)
		.values({
			nome: 'Ana Modas',
			handleInstagram: 'anamodascerquilho',
			nicho: 'Moda feminina',
			cidade: 'Cerquilho - SP'
		})
		.returning();
	return criada;
}
