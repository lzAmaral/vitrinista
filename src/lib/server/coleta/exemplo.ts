import type { TipoMidia } from '../db/schema';
import type { Coletor, PerfilColetado, PostColetado } from './tipos';

/**
 * Coletor de DADOS FICTÍCIOS, para desenvolver e testar a interface antes de o app
 * da Meta estar configurado. Determinístico: o mesmo @ gera sempre os mesmos dados.
 * Os ids começam com "exemplo_" para serem apagados quando a coleta real entrar.
 */

export const PREFIXO_EXEMPLO = 'exemplo_';

const LEGENDAS = [
	'Look do dia: vestido midi + sandália nude. Qual você usaria? 💛',
	'Chegou coleção nova! Arraste para ver todas as cores →',
	'3 jeitos de usar a mesma camisa de linho',
	'Promo de fim de semana: 20% off em toda a vitrine 🛍️',
	'Bastidores: como escolhemos as peças da semana',
	'Provador real: veste do 38 ao 48 ✨',
	'Peça coringa: blazer alfaiataria em 4 produções',
	'Comenta "EU QUERO" que a gente te manda o link',
	'Tendência verão 2027: tons terrosos e tecidos leves',
	'Antes e depois: transformando o básico em look de festa'
];

function geradorAleatorio(semente: string) {
	let h = 2166136261;
	for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	return () => {
		h = Math.imul(h ^ (h >>> 15), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		return ((h ^= h >>> 16) >>> 0) / 4294967296;
	};
}

export function criarColetorExemplo(agora: () => Date = () => new Date()): Coletor {
	return {
		fonte: 'exemplo',
		buscarPerfil(handle, opcoes = {}): Promise<PerfilColetado> {
			const rnd = geradorAleatorio(handle);
			const seguidores = Math.round(2_000 + rnd() * 120_000);
			const taxaBase = 0.01 + rnd() * 0.03;
			const total = Math.min(opcoes.limitePosts ?? 50, 36);
			const hoje = agora().getTime();

			const posts: PostColetado[] = Array.from({ length: total }, (_, i) => {
				const tipo: TipoMidia = (['IMAGE', 'CAROUSEL_ALBUM', 'VIDEO'] as const)[
					Math.floor(rnd() * 3)
				];
				// ~1 em cada 8 posts "estoura" (3x a 8x o normal)
				const fator = rnd() < 0.12 ? 3 + rnd() * 5 : 0.5 + rnd();
				const curtidas = Math.round(seguidores * taxaBase * fator);
				return {
					id: `${PREFIXO_EXEMPLO}${handle}_${i}`,
					permalink: `https://www.instagram.com/${handle}/`,
					tipo,
					produto: tipo === 'VIDEO' ? 'REELS' : 'FEED',
					legenda: LEGENDAS[Math.floor(rnd() * LEGENDAS.length)],
					mediaUrl: null,
					thumbnailUrl: null,
					publicadoEm: new Date(hoje - (i * 2.5 + rnd()) * 86_400_000),
					curtidas,
					comentarios: Math.round(curtidas * (0.01 + rnd() * 0.05)),
					visualizacoes: tipo === 'VIDEO' ? Math.round(curtidas * (8 + rnd() * 20)) : null
				};
			});

			return Promise.resolve({
				handle,
				nome: null,
				fotoUrl: null,
				seguidores,
				totalPosts: 100 + Math.round(rnd() * 900),
				posts
			});
		}
	};
}
