import { criarColetorExemplo } from './exemplo';
import { criarColetorMeta } from './meta';
import { ErroColeta, type Coletor } from './tipos';

export interface ConfigColeta {
	COLETOR: 'exemplo' | 'meta';
	META_ACCESS_TOKEN?: string;
	META_IG_USER_ID?: string;
	META_GRAPH_VERSION: string;
}

export function criarColetor(config: ConfigColeta): Coletor {
	if (config.COLETOR === 'exemplo') return criarColetorExemplo();

	if (!config.META_ACCESS_TOKEN || !config.META_IG_USER_ID) {
		throw new ErroColeta(
			'configuracao',
			'COLETOR=meta, mas META_ACCESS_TOKEN ou META_IG_USER_ID não estão no .env. Rode "npm run meta:configurar".'
		);
	}
	return criarColetorMeta({
		accessToken: config.META_ACCESS_TOKEN,
		igUserId: config.META_IG_USER_ID,
		versao: config.META_GRAPH_VERSION
	});
}

export { ErroColeta, normalizarHandle } from './tipos';
export { coletarLoja, coletarReferencia } from './servico';
