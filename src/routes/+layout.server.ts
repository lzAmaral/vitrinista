import { statusIntegracoes } from '#lib/server/config.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	loja: { nome: locals.loja.nome, handle: locals.loja.handleInstagram },
	integracoes: statusIntegracoes()
});
