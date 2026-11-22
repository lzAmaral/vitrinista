import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';

/** Cria a conexão. Sem dependência do SvelteKit para poder ser usada por scripts e testes. */
export function criarDb(url: string) {
	const client = createClient({ url });
	return drizzle(client, { schema });
}

export type Db = ReturnType<typeof criarDb>;

export async function migrar(db: Db, pasta = 'drizzle') {
	await migrate(db, { migrationsFolder: pasta });
}
