import { z } from 'zod';
import {
	ErroColeta,
	type Coletor,
	type OpcoesColeta,
	type PerfilColetado,
	type PostColetado
} from './tipos';

/**
 * Coleta via API oficial da Meta — endpoint Business Discovery.
 * Usa a conta comercial da própria loja (META_IG_USER_ID) para ler dados públicos
 * de outras contas comerciais/criador. Docs:
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery
 */

const CAMPOS_MIDIA = [
	'id',
	'caption',
	'media_type',
	'media_product_type',
	'permalink',
	'timestamp',
	'like_count',
	'comments_count',
	'view_count',
	'media_url',
	'thumbnail_url'
].join(',');

const CAMPOS_PERFIL = ['username', 'name', 'profile_picture_url', 'followers_count', 'media_count'];

const POR_PAGINA = 50;

const midiaSchema = z.object({
	id: z.string(),
	caption: z.string().optional(),
	media_type: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']),
	media_product_type: z.string().optional(),
	permalink: z.string(),
	timestamp: z.string(),
	like_count: z.number().optional(), // ausente quando a conta oculta curtidas
	comments_count: z.number().optional(),
	view_count: z.number().optional(),
	media_url: z.string().optional(),
	thumbnail_url: z.string().optional()
});

const respostaSchema = z.object({
	business_discovery: z.object({
		username: z.string(),
		name: z.string().optional(),
		profile_picture_url: z.string().optional(),
		followers_count: z.number().optional(),
		media_count: z.number().optional(),
		media: z
			.object({
				data: z.array(midiaSchema),
				paging: z
					.object({ cursors: z.object({ after: z.string().optional() }).optional() })
					.optional()
			})
			.optional()
	})
});

const erroSchema = z.object({
	error: z.object({
		message: z.string(),
		code: z.number().optional(),
		error_subcode: z.number().optional()
	})
});

export interface ConfigMeta {
	accessToken: string;
	igUserId: string;
	versao: string;
	/** Injetável para testes. */
	fetch?: typeof fetch;
}

export function criarColetorMeta(config: ConfigMeta): Coletor {
	const fazerFetch = config.fetch ?? fetch;

	async function pagina(handle: string, limite: number, depois?: string) {
		const media = `media${depois ? `.after(${depois})` : ''}.limit(${limite}){${CAMPOS_MIDIA}}`;
		const campos = `business_discovery.username(${handle}){${[...CAMPOS_PERFIL, media].join(',')}}`;
		const url = `https://graph.facebook.com/${config.versao}/${config.igUserId}?fields=${encodeURIComponent(campos)}`;

		// Token no header, nunca na URL (URLs acabam em logs)
		const resposta = await fazerFetch(url, {
			headers: { Authorization: `Bearer ${config.accessToken}` }
		});
		const corpo: unknown = await resposta.json().catch(() => null);

		if (!resposta.ok) throw traduzirErro(handle, corpo, resposta.status);

		const lido = respostaSchema.safeParse(corpo);
		if (!lido.success) {
			throw new ErroColeta('outro', `Resposta inesperada da Meta para @${handle}.`);
		}
		return lido.data.business_discovery;
	}

	return {
		fonte: 'meta',
		async buscarPerfil(handle: string, opcoes: OpcoesColeta = {}): Promise<PerfilColetado> {
			const limite = opcoes.limitePosts ?? 50;
			const primeira = await pagina(handle, Math.min(limite, POR_PAGINA));
			const midias = [...(primeira.media?.data ?? [])];
			let cursor = primeira.media?.paging?.cursors?.after;

			while (cursor && midias.length < limite) {
				const proxima = await pagina(handle, Math.min(limite - midias.length, POR_PAGINA), cursor);
				const dados = proxima.media?.data ?? [];
				if (dados.length === 0) break;
				midias.push(...dados);
				cursor = proxima.media?.paging?.cursors?.after;
			}

			return {
				handle: primeira.username,
				nome: primeira.name ?? null,
				fotoUrl: primeira.profile_picture_url ?? null,
				seguidores: primeira.followers_count ?? null,
				totalPosts: primeira.media_count ?? null,
				posts: midias.slice(0, limite).map(paraPost)
			};
		}
	};
}

function paraPost(m: z.infer<typeof midiaSchema>): PostColetado {
	return {
		id: m.id,
		permalink: m.permalink,
		tipo: m.media_type,
		produto: m.media_product_type ?? null,
		legenda: m.caption ?? null,
		mediaUrl: m.media_url ?? null,
		thumbnailUrl: m.thumbnail_url ?? null,
		publicadoEm: new Date(m.timestamp),
		curtidas: m.like_count ?? null,
		comentarios: m.comments_count ?? 0,
		visualizacoes: m.view_count ?? null
	};
}

function traduzirErro(handle: string, corpo: unknown, status: number): ErroColeta {
	const lido = erroSchema.safeParse(corpo);
	if (!lido.success) {
		return new ErroColeta('outro', `A Meta respondeu ${status} ao buscar @${handle}.`);
	}
	const { code, error_subcode, message } = lido.data.error;

	if (code === 190 || code === 10 || (code !== undefined && code >= 200 && code < 300)) {
		return new ErroColeta(
			'token',
			`Token da Meta inválido, expirado ou sem permissão. Gere um novo com "npm run meta:configurar". (${message})`
		);
	}
	if (code === 4 || code === 17 || code === 32 || code === 613) {
		return new ErroColeta(
			'limite',
			'Limite de chamadas da Meta atingido. Tente de novo em 1 hora.'
		);
	}
	if (code === 110 || error_subcode === 2207013 || (code === 100 && /username/i.test(message))) {
		return new ErroColeta(
			'nao_encontrada',
			`@${handle} não foi encontrada ou não é conta comercial/criador (a API só lê esse tipo de conta).`
		);
	}
	return new ErroColeta('outro', `Erro da Meta ao buscar @${handle}: ${message}`);
}
