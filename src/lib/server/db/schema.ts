import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const criadoEm = () =>
	integer('criado_em', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);

/**
 * Cada loja é um "cliente" do sistema. Hoje só existe a Ana Modas, mas todo dado
 * pertence a uma loja para o sistema poder ser vendido sem reescrita.
 */
export const lojas = sqliteTable('lojas', {
	id: id(),
	nome: text('nome').notNull(),
	handleInstagram: text('handle_instagram').notNull(),
	nicho: text('nicho'),
	cidade: text('cidade'),
	criadoEm: criadoEm()
});

/** Contas do Instagram que a loja acompanha como referência. */
export const referencias = sqliteTable(
	'referencias',
	{
		id: id(),
		lojaId: text('loja_id')
			.notNull()
			.references(() => lojas.id, { onDelete: 'cascade' }),
		handle: text('handle').notNull(),
		siteUrl: text('site_url'),
		etiquetas: text('etiquetas', { mode: 'json' }).$type<string[]>().notNull().default([]),
		ativa: integer('ativa', { mode: 'boolean' }).notNull().default(true),
		// Preenchidos pela coleta
		nome: text('nome'),
		fotoUrl: text('foto_url'),
		seguidores: integer('seguidores'),
		totalPosts: integer('total_posts'),
		ultimaColetaEm: integer('ultima_coleta_em', { mode: 'timestamp' }),
		erroColeta: text('erro_coleta'),
		criadoEm: criadoEm()
	},
	(t) => [uniqueIndex('referencias_loja_handle').on(t.lojaId, t.handle)]
);

export type TipoMidia = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

/** Posts das referências. O id é o media id do Instagram (coleta idempotente). */
export const posts = sqliteTable(
	'posts',
	{
		id: text('id').primaryKey(),
		referenciaId: text('referencia_id')
			.notNull()
			.references(() => referencias.id, { onDelete: 'cascade' }),
		permalink: text('permalink').notNull(),
		tipo: text('tipo').$type<TipoMidia>().notNull(),
		produto: text('produto'), // FEED | REELS
		legenda: text('legenda'),
		mediaUrl: text('media_url'),
		thumbnailUrl: text('thumbnail_url'),
		publicadoEm: integer('publicado_em', { mode: 'timestamp' }).notNull(),
		// Métricas mais recentes (curtidas = null quando a conta oculta)
		curtidas: integer('curtidas'),
		comentarios: integer('comentarios').notNull().default(0),
		visualizacoes: integer('visualizacoes'),
		atualizadoEm: integer('atualizado_em', { mode: 'timestamp' }).notNull()
	},
	(t) => [index('posts_referencia').on(t.referenciaId), index('posts_publicado').on(t.publicadoEm)]
);

/** Histórico das métricas a cada coleta — mostra como o post cresce no tempo. */
export const metricasPost = sqliteTable(
	'metricas_post',
	{
		postId: text('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		coletadoEm: integer('coletado_em', { mode: 'timestamp' }).notNull(),
		curtidas: integer('curtidas'),
		comentarios: integer('comentarios').notNull(),
		visualizacoes: integer('visualizacoes'),
		seguidores: integer('seguidores')
	},
	(t) => [primaryKey({ columns: [t.postId, t.coletadoEm] })]
);

export type StatusColeta = 'rodando' | 'ok' | 'erro';

/** Registro de cada coleta (auditoria e depuração). */
export const coletas = sqliteTable('coletas', {
	id: id(),
	referenciaId: text('referencia_id')
		.notNull()
		.references(() => referencias.id, { onDelete: 'cascade' }),
	fonte: text('fonte').notNull(),
	status: text('status').$type<StatusColeta>().notNull(),
	postsColetados: integer('posts_coletados').notNull().default(0),
	erro: text('erro'),
	iniciadoEm: integer('iniciado_em', { mode: 'timestamp' }).notNull(),
	finalizadoEm: integer('finalizado_em', { mode: 'timestamp' })
});

export type Loja = typeof lojas.$inferSelect;
export type Referencia = typeof referencias.$inferSelect;
export type Post = typeof posts.$inferSelect;
