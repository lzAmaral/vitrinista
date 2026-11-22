import type { Loja } from '#lib/server/db/schema.ts';

declare global {
	namespace App {
		interface Locals {
			loja: Loja;
		}
	}
}

export {};
