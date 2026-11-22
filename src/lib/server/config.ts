import * as env from '$app/env/private';
import { criarColetor } from './coleta';

export const config = {
	COLETOR: env.COLETOR,
	META_ACCESS_TOKEN: env.META_ACCESS_TOKEN,
	META_IG_USER_ID: env.META_IG_USER_ID,
	META_GRAPH_VERSION: env.META_GRAPH_VERSION,
	GEMINI_API_KEY: env.GEMINI_API_KEY,
	GEMINI_MODEL: env.GEMINI_MODEL
};

export const obterColetor = () => criarColetor(config);

/** Estado das integrações, sem expor segredos ao navegador. */
export function statusIntegracoes() {
	return {
		coletor: config.COLETOR,
		meta: Boolean(config.META_ACCESS_TOKEN && config.META_IG_USER_ID),
		gemini: Boolean(config.GEMINI_API_KEY),
		geminiModelo: config.GEMINI_MODEL
	};
}
