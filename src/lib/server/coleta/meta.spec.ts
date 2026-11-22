import { describe, expect, it, vi } from 'vitest';
import { criarColetorMeta } from './meta';
import { ErroColeta, normalizarHandle } from './tipos';

function respostaJson(corpo: unknown, status = 200) {
	return new Response(JSON.stringify(corpo), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

const midia = (id: string, extra: Record<string, unknown> = {}) => ({
	id,
	media_type: 'IMAGE',
	permalink: `https://www.instagram.com/p/${id}/`,
	timestamp: '2026-11-01T15:00:00+0000',
	like_count: 120,
	comments_count: 8,
	...extra
});

describe('normalizarHandle', () => {
	it.each([
		['@Loja.Exemplo', 'loja.exemplo'],
		['https://www.instagram.com/loja_x/', 'loja_x'],
		['instagram.com/loja_x?igsh=abc', 'loja_x'],
		['  lojinha  ', 'lojinha']
	])('%s → %s', (entrada, esperado) => {
		expect(normalizarHandle(entrada)).toBe(esperado);
	});

	it('recusa entradas inválidas', () => {
		expect(() => normalizarHandle('loja com espaço')).toThrow(ErroColeta);
	});
});

describe('criarColetorMeta', () => {
	const base = { accessToken: 'tk', igUserId: '1784', versao: 'v27.0' };

	it('monta a chamada Business Discovery com o token no header e converte os posts', async () => {
		const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(
			respostaJson({
				business_discovery: {
					username: 'loja',
					followers_count: 5000,
					media_count: 300,
					media: {
						data: [
							midia('1'),
							midia('2', { like_count: undefined, media_type: 'VIDEO', view_count: 9000 })
						]
					}
				},
				id: '1784'
			})
		);
		const coletor = criarColetorMeta({ ...base, fetch: fetchFalso });

		const perfil = await coletor.buscarPerfil('loja', { limitePosts: 10 });

		const [entrada, init] = fetchFalso.mock.calls[0];
		const url = entrada as string;
		expect(decodeURIComponent(url)).toContain('business_discovery.username(loja)');
		expect(url).not.toContain('tk');
		expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer tk');
		expect(perfil.seguidores).toBe(5000);
		expect(perfil.posts).toHaveLength(2);
		expect(perfil.posts[1]).toMatchObject({ curtidas: null, tipo: 'VIDEO', visualizacoes: 9000 });
		expect(perfil.posts[0].publicadoEm.toISOString()).toBe('2026-11-01T15:00:00.000Z');
	});

	it('pagina até o limite pedido', async () => {
		const fetchFalso = vi
			.fn()
			.mockResolvedValueOnce(
				respostaJson({
					business_discovery: {
						username: 'loja',
						media: { data: [midia('1'), midia('2')], paging: { cursors: { after: 'C1' } } }
					}
				})
			)
			.mockResolvedValueOnce(
				respostaJson({ business_discovery: { username: 'loja', media: { data: [midia('3')] } } })
			);
		const coletor = criarColetorMeta({ ...base, fetch: fetchFalso });

		const perfil = await coletor.buscarPerfil('loja', { limitePosts: 3 });

		expect(perfil.posts.map((p) => p.id)).toEqual(['1', '2', '3']);
		expect(decodeURIComponent(String(fetchFalso.mock.calls[1][0]))).toContain(
			'media.after(C1).limit(1)'
		);
	});

	it.each([
		[{ code: 190, message: 'Error validating access token' }, 'token'],
		[{ code: 4, message: 'Application request limit reached' }, 'limite'],
		[{ code: 110, error_subcode: 2207013, message: 'Cannot find user' }, 'nao_encontrada']
	])('traduz erro da Meta %o → %s', async (erro, motivo) => {
		const coletor = criarColetorMeta({
			...base,
			fetch: vi.fn<typeof fetch>().mockResolvedValue(respostaJson({ error: erro }, 400))
		});
		await expect(coletor.buscarPerfil('loja')).rejects.toMatchObject({ motivo });
	});
});
