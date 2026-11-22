/**
 * Configura o acesso à Meta a partir de um token de curta duração do Graph API Explorer.
 *  1. troca por um token de longa duração (~60 dias)
 *  2. descobre o ID da conta comercial do Instagram ligada à Página
 *  3. testa a Business Discovery e grava META_ACCESS_TOKEN / META_IG_USER_ID no .env
 *
 * Uso: npm run meta:configurar -- <token-curto>
 * Requer META_APP_ID e META_APP_SECRET no .env.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const versao = process.env.META_GRAPH_VERSION || 'v27.0';
const base = `https://graph.facebook.com/${versao}`;
const handleLoja = process.env.LOJA_INSTAGRAM || 'anamodascerquilho';

function sair(msg: string): never {
	console.error(`✗ ${msg}`);
	process.exit(1);
}

async function graph<T>(caminho: string, token?: string): Promise<T> {
	const r = await fetch(`${base}${caminho}`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {}
	});
	const corpo = (await r.json()) as T & { error?: { message: string } };
	if (!r.ok || corpo.error) sair(`Meta respondeu: ${corpo.error?.message ?? r.status}`);
	return corpo;
}

function gravarEnv(valores: Record<string, string>) {
	let conteudo = readFileSync('.env', 'utf8');
	for (const [chave, valor] of Object.entries(valores)) {
		const linha = `${chave}=${valor}`;
		const regex = new RegExp(`^${chave}=.*$`, 'm');
		conteudo = regex.test(conteudo)
			? conteudo.replace(regex, linha)
			: `${conteudo.trimEnd()}\n${linha}\n`;
	}
	writeFileSync('.env', conteudo);
}

const tokenCurto = process.argv[2];
if (!tokenCurto) sair('Passe o token: npm run meta:configurar -- <token>');
const { META_APP_ID: appId, META_APP_SECRET: appSecret } = process.env;
if (!appId || !appSecret) sair('Coloque META_APP_ID e META_APP_SECRET no .env primeiro.');

// 1. Token de longa duração (troca servidor-a-servidor documentada pela Meta)
const troca = await graph<{ access_token: string; expires_in?: number }>(
	`/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(tokenCurto)}`
);
const token = troca.access_token;
const dias = troca.expires_in ? Math.round(troca.expires_in / 86400) : 60;
console.log(`✓ Token de longa duração obtido (vale ~${dias} dias)`);

// 2. Página → conta comercial do Instagram
const paginas = await graph<{
	data: {
		id: string;
		name: string;
		instagram_business_account?: { id: string; username?: string };
	}[];
}>('/me/accounts?fields=id,name,instagram_business_account{id,username}', token);

const comInstagram = paginas.data.filter((p) => p.instagram_business_account);
if (comInstagram.length === 0) {
	sair(
		'Nenhuma Página com Instagram comercial encontrada. Confira se o token tem pages_show_list e se você administra a Página.'
	);
}
const pagina =
	comInstagram.find((p) => p.instagram_business_account?.username === handleLoja) ??
	comInstagram[0];
const ig = pagina.instagram_business_account!;
console.log(`✓ Página "${pagina.name}" → Instagram @${ig.username ?? '?'} (id ${ig.id})`);

// 3. Teste da Business Discovery na própria conta
await graph(
	`/${ig.id}?fields=${encodeURIComponent(`business_discovery.username(${ig.username ?? handleLoja}){followers_count,media_count}`)}`,
	token
);
console.log('✓ Business Discovery funcionando');

gravarEnv({ META_ACCESS_TOKEN: token, META_IG_USER_ID: ig.id });
console.log('✓ .env atualizado. Agora troque COLETOR=meta e reinicie o servidor.');
