import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { db } from '#lib/server/db/index.ts';
import { migrar } from '#lib/server/db/client.ts';
import { garantirLojaPadrao } from '#lib/server/loja.ts';

export const init: ServerInit = async () => {
	await migrar(db);
	await garantirLojaPadrao(db);
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.loja = await garantirLojaPadrao(db);
	return resolve(event);
};
