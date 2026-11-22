/**
 * Geração do LaunchAgent (macOS) que roda a coleta todo dia.
 * Puro (sem I/O) para poder ser testado; quem instala é scripts/agendar.ts.
 */

export const ROTULO_AGENDAMENTO = 'com.vitrinista.coletar';

export interface OpcoesAgendamento {
	/** Caminho absoluto do node (process.execPath) — launchd não carrega o PATH do terminal. */
	node: string;
	/** Pasta do projeto. */
	projeto: string;
	hora: number;
	minuto: number;
}

const escaparXml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function validarHorario(entrada: string): { hora: number; minuto: number } {
	const m = entrada.match(/^(\d{1,2}):(\d{2})$/);
	const hora = m ? Number(m[1]) : NaN;
	const minuto = m ? Number(m[2]) : NaN;
	if (!(hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59)) {
		throw new Error(`Horário inválido: "${entrada}". Use HH:MM, ex.: 06:00`);
	}
	return { hora, minuto };
}

export function gerarPlist({ node, projeto, hora, minuto }: OpcoesAgendamento): string {
	const args = [node, '--env-file=.env', '--import', 'tsx', 'scripts/coletar.ts'];
	const log = `${projeto}/logs/coleta.log`;
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>${ROTULO_AGENDAMENTO}</string>
	<key>ProgramArguments</key>
	<array>
${args.map((a) => `\t\t<string>${escaparXml(a)}</string>`).join('\n')}
	</array>
	<key>WorkingDirectory</key>
	<string>${escaparXml(projeto)}</string>
	<key>StartCalendarInterval</key>
	<dict>
		<key>Hour</key>
		<integer>${hora}</integer>
		<key>Minute</key>
		<integer>${minuto}</integer>
	</dict>
	<key>StandardOutPath</key>
	<string>${escaparXml(log)}</string>
	<key>StandardErrorPath</key>
	<string>${escaparXml(log)}</string>
	<key>ProcessType</key>
	<string>Background</string>
</dict>
</plist>
`;
}
