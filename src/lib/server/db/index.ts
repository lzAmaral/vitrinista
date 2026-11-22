import { DATABASE_URL } from '$app/env/private';
import { criarDb } from './client';

export const db = criarDb(DATABASE_URL);
