CREATE TABLE `coletas` (
	`id` text PRIMARY KEY NOT NULL,
	`referencia_id` text NOT NULL,
	`fonte` text NOT NULL,
	`status` text NOT NULL,
	`posts_coletados` integer DEFAULT 0 NOT NULL,
	`erro` text,
	`iniciado_em` integer NOT NULL,
	`finalizado_em` integer,
	FOREIGN KEY (`referencia_id`) REFERENCES `referencias`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lojas` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`handle_instagram` text NOT NULL,
	`nicho` text,
	`cidade` text,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metricas_post` (
	`post_id` text NOT NULL,
	`coletado_em` integer NOT NULL,
	`curtidas` integer,
	`comentarios` integer NOT NULL,
	`visualizacoes` integer,
	`seguidores` integer,
	PRIMARY KEY(`post_id`, `coletado_em`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`referencia_id` text NOT NULL,
	`permalink` text NOT NULL,
	`tipo` text NOT NULL,
	`produto` text,
	`legenda` text,
	`media_url` text,
	`thumbnail_url` text,
	`publicado_em` integer NOT NULL,
	`curtidas` integer,
	`comentarios` integer DEFAULT 0 NOT NULL,
	`visualizacoes` integer,
	`atualizado_em` integer NOT NULL,
	FOREIGN KEY (`referencia_id`) REFERENCES `referencias`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_referencia` ON `posts` (`referencia_id`);--> statement-breakpoint
CREATE INDEX `posts_publicado` ON `posts` (`publicado_em`);--> statement-breakpoint
CREATE TABLE `referencias` (
	`id` text PRIMARY KEY NOT NULL,
	`loja_id` text NOT NULL,
	`handle` text NOT NULL,
	`site_url` text,
	`etiquetas` text DEFAULT '[]' NOT NULL,
	`ativa` integer DEFAULT true NOT NULL,
	`nome` text,
	`foto_url` text,
	`seguidores` integer,
	`total_posts` integer,
	`ultima_coleta_em` integer,
	`erro_coleta` text,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`loja_id`) REFERENCES `lojas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referencias_loja_handle` ON `referencias` (`loja_id`,`handle`);