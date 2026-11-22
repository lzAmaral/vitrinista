import { defineEnvVars } from '@sveltejs/kit/env';

const opcional = (value: string | undefined) => (value ? value : undefined);

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'URL do banco (file:local.db em desenvolvimento).' },
	COLETOR: {
		description: 'Fonte da coleta do Instagram: "exemplo" (dados fictícios) ou "meta" (Graph API).',
		schema: (value): 'exemplo' | 'meta' => {
			const v = value || 'exemplo';
			if (v !== 'exemplo' && v !== 'meta') throw new Error('COLETOR deve ser "exemplo" ou "meta"');
			return v;
		}
	},
	META_ACCESS_TOKEN: { description: 'Token de usuário (longa duração) da Meta.', schema: opcional },
	META_IG_USER_ID: { description: 'ID da conta comercial do Instagram da loja.', schema: opcional },
	META_GRAPH_VERSION: {
		description: 'Versão da Graph API.',
		schema: (value) => value || 'v27.0'
	},
	GEMINI_API_KEY: { description: 'Chave da API do Gemini.', schema: opcional },
	GEMINI_MODEL: { description: 'Modelo do Gemini.', schema: (value) => value || 'gemini-3.5-flash' }
});
