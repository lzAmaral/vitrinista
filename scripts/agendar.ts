/**
 * Agenda a coleta diária no macOS (launchd).
 *   npm run agendar               → instala às 06:00
 *   npm run agendar -- 07:30      → instala no horário escolhido
 *   npm run agendar -- remover    → remove o agendamento
 *   npm run agendar -- status     → mostra se está ativo
 * Rodar de novo substitui o agendamento (não duplica).
 * Depois de atualizar o Node, rode de novo (o caminho do node fica gravado).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { gerarPlist, ROTULO_AGENDAMENTO, validarHorario } from '../src/lib/server/agendamento';

if (process.platform !== 'darwin') {
	console.error(
		'✗ O agendamento automático é só para macOS. Em Linux, use cron: 0 6 * * * cd <projeto> && npm run coletar'
	);
	process.exit(1);
}

const projeto = process.cwd();
const plistPath = join(homedir(), 'Library', 'LaunchAgents', `${ROTULO_AGENDAMENTO}.plist`);
const dominio = `gui/${process.getuid?.() ?? 501}`;
const comando = process.argv[2] ?? '06:00';

function launchctl(...args: string[]) {
	return execFileSync('launchctl', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function descarregar() {
	try {
		launchctl('bootout', `${dominio}/${ROTULO_AGENDAMENTO}`);
	} catch {
		// não estava carregado
	}
}

if (comando === 'remover') {
	descarregar();
	rmSync(plistPath, { force: true });
	console.log('✓ Agendamento removido.');
} else if (comando === 'status') {
	try {
		const info = launchctl('print', `${dominio}/${ROTULO_AGENDAMENTO}`);
		const ultimo = info.match(/last exit code = (.*)/)?.[1] ?? '—';
		console.log(
			`✓ Ativo (${plistPath})\n  último código de saída: ${ultimo}\n  log: ${projeto}/logs/coleta.log`
		);
	} catch {
		console.log('✗ Não agendado. Rode: npm run agendar');
	}
} else {
	const { hora, minuto } = validarHorario(comando);
	if (!existsSync(join(projeto, '.env'))) {
		console.error('✗ Rode dentro da pasta do projeto (falta o .env).');
		process.exit(1);
	}
	mkdirSync(join(projeto, 'logs'), { recursive: true });
	mkdirSync(join(homedir(), 'Library', 'LaunchAgents'), { recursive: true });
	writeFileSync(plistPath, gerarPlist({ node: process.execPath, projeto, hora, minuto }));
	descarregar();
	launchctl('bootstrap', dominio, plistPath);
	const hh = String(hora).padStart(2, '0');
	const mm = String(minuto).padStart(2, '0');
	console.log(`✓ Coleta agendada todo dia às ${hh}:${mm}.\n  log: ${projeto}/logs/coleta.log`);
	console.log('  O Mac precisa estar ligado (se estiver dormindo, roda quando acordar).');
}
