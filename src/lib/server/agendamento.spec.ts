import { describe, expect, it } from 'vitest';
import { gerarPlist, validarHorario } from './agendamento';

describe('validarHorario', () => {
	it('aceita HH:MM', () => {
		expect(validarHorario('06:00')).toEqual({ hora: 6, minuto: 0 });
		expect(validarHorario('23:59')).toEqual({ hora: 23, minuto: 59 });
	});
	it.each(['24:00', '6h', '07:60', ''])('recusa "%s"', (h) => {
		expect(() => validarHorario(h)).toThrow('Horário inválido');
	});
});

describe('gerarPlist', () => {
	const plist = gerarPlist({
		node: '/opt/node/bin/node',
		projeto: '/Users/x/Meus Projetos & Cia/vitrinista',
		hora: 6,
		minuto: 30
	});

	it('usa caminho absoluto do node e roda o script de coleta', () => {
		expect(plist).toContain('<string>/opt/node/bin/node</string>');
		expect(plist).toContain('<string>scripts/coletar.ts</string>');
		expect(plist).toContain('<string>--env-file=.env</string>');
	});

	it('agenda no horário pedido', () => {
		expect(plist).toMatch(/<key>Hour<\/key>\s*<integer>6<\/integer>/);
		expect(plist).toMatch(/<key>Minute<\/key>\s*<integer>30<\/integer>/);
	});

	it('escapa caracteres especiais do caminho', () => {
		expect(plist).toContain('Meus Projetos &amp; Cia');
		expect(plist).not.toContain('& Cia');
	});
});
