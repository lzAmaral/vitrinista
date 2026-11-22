import type { TipoMidia } from '../db/schema';

export interface PostColetado {
	id: string;
	permalink: string;
	tipo: TipoMidia;
	produto: string | null;
	legenda: string | null;
	mediaUrl: string | null;
	thumbnailUrl: string | null;
	publicadoEm: Date;
	curtidas: number | null;
	comentarios: number;
	visualizacoes: number | null;
}

export interface PerfilColetado {
	handle: string;
	nome: string | null;
	fotoUrl: string | null;
	seguidores: number | null;
	totalPosts: number | null;
	posts: PostColetado[];
}

export interface OpcoesColeta {
	/** Máximo de posts recentes a buscar (padrão 50). */
	limitePosts?: number;
}

/** Fonte de dados do Instagram. Trocar a implementação não muda o resto do sistema. */
export interface Coletor {
	readonly fonte: 'exemplo' | 'meta';
	buscarPerfil(handle: string, opcoes?: OpcoesColeta): Promise<PerfilColetado>;
}

export type MotivoErroColeta =
	| 'handle_invalido'
	| 'nao_encontrada' // não existe ou não é conta comercial/criador
	| 'token' // token inválido, expirado ou sem permissão
	| 'limite' // limite de chamadas da Meta
	| 'configuracao'
	| 'outro';

export class ErroColeta extends Error {
	readonly motivo: MotivoErroColeta;

	constructor(motivo: MotivoErroColeta, mensagem: string) {
		super(mensagem);
		this.name = 'ErroColeta';
		this.motivo = motivo;
	}
}

const HANDLE_VALIDO = /^[a-z0-9._]{1,30}$/;

/** Aceita "@loja", "loja", "instagram.com/loja/" e devolve "loja". */
export function normalizarHandle(entrada: string): string {
	let h = entrada.trim().toLowerCase();
	const url = h.match(/instagram\.com\/([^/?#]+)/);
	if (url) h = url[1];
	h = h.replace(/^@/, '').replace(/\/+$/, '');
	if (!HANDLE_VALIDO.test(h)) {
		throw new ErroColeta('handle_invalido', `"${entrada}" não parece um @ válido do Instagram.`);
	}
	return h;
}
