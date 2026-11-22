/**
 * Coleta todas as referências ativas de todas as lojas.
 * Uso: npm run coletar   (bom para agendar no cron, ex.: todo dia às 6h)
 */
import { coletarLoja, criarColetor } from '../src/lib/server/coleta';
import { criarDb, migrar } from '../src/lib/server/db/client';
import { lojas } from '../src/lib/server/db/schema';
import { garantirLojaPadrao } from '../src/lib/server/loja';

const db = criarDb(process.env.DATABASE_URL ?? 'file:local.db');
await migrar(db);
await garantirLojaPadrao(db);

const coletor = criarColetor({
	COLETOR: process.env.COLETOR === 'meta' ? 'meta' : 'exemplo',
	META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || undefined,
	META_IG_USER_ID: process.env.META_IG_USER_ID || undefined,
	META_GRAPH_VERSION: process.env.META_GRAPH_VERSION || 'v27.0'
});

console.log(`[${new Date().toISOString()}] coleta iniciada`);
let falhou = false;
for (const loja of await db.select().from(lojas)) {
	console.log(`\n${loja.nome} (fonte: ${coletor.fonte})`);
	try {
		for (const r of await coletarLoja(db, coletor, loja.id)) {
			console.log(
				r.ok ? `  ✓ @${r.handle}: ${r.postsColetados} posts` : `  ✗ @${r.handle}: ${r.erro}`
			);
			if (!r.ok) falhou = true;
		}
	} catch (e) {
		console.error(`  ✗ coleta interrompida: ${e instanceof Error ? e.message : String(e)}`);
		falhou = true;
	}
}
process.exit(falhou ? 1 : 0);
