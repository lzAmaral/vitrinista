<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const navegacao = [
		{ href: '/radar', rotulo: 'Radar', ativo: true },
		{ href: '/referencias', rotulo: 'Referências', ativo: true },
		{ href: '/estudio', rotulo: 'Estúdio', ativo: false },
		{ href: '/marca', rotulo: 'Marca', ativo: false },
		{ href: '/configuracoes', rotulo: 'Configurações', ativo: true }
	] as const;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap"
	/>
</svelte:head>

<div class="app">
	<aside class="lateral">
		<a class="marca" href={resolve('/radar')}>
			<span class="logo">Vitrinista</span>
			<span class="loja">{data.loja.nome}</span>
		</a>
		<nav aria-label="Principal">
			{#each navegacao as item (item.href)}
				{#if item.ativo}
					<a
						href={resolve(item.href)}
						aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}
					>
						{item.rotulo}
					</a>
				{:else}
					<span class="em-breve" title="Próximas fases">{item.rotulo} <small>em breve</small></span>
				{/if}
			{/each}
		</nav>
	</aside>

	<main>
		{#if data.integracoes.coletor === 'exemplo'}
			<p class="aviso alerta faixa-exemplo">
				Modo <strong>dados de exemplo</strong>: os números são fictícios até o app da Meta ser
				configurado. <a href={resolve('/configuracoes')}>Ver configuração</a>
			</p>
		{/if}
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: grid;
		grid-template-columns: var(--largura-menu) 1fr;
		min-height: 100dvh;
	}
	.lateral {
		position: sticky;
		top: 0;
		height: 100dvh;
		padding: var(--espaco-6) var(--espaco-4);
		border-right: 1px solid var(--cor-borda);
		display: flex;
		flex-direction: column;
		gap: var(--espaco-8);
	}
	.marca {
		text-decoration: none;
		display: grid;
		padding-inline: var(--espaco-3);
	}
	.logo {
		font-family: var(--fonte-titulo);
		font-size: var(--texto-numero);
		line-height: var(--linha-numero);
		font-weight: var(--peso-forte);
	}
	.loja {
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
		color: var(--cor-texto-suave);
	}
	nav {
		display: grid;
		gap: 2px;
	}
	/* Família "sem borda": véu no hover, véu mais forte no selecionado, sem mudar o peso */
	nav a,
	.em-breve {
		display: flex;
		align-items: center;
		gap: var(--espaco-2);
		min-height: 38px;
		padding: 0 var(--espaco-3);
		border-radius: var(--raio-campo);
		text-decoration: none;
		color: var(--cor-texto-suave);
		font-weight: var(--peso-medio);
		transition:
			background var(--duracao-rapida) var(--curva),
			color var(--duracao-rapida) var(--curva);
	}
	nav a:hover {
		background: var(--cor-veu-hover);
		color: var(--cor-texto);
	}
	nav a:active {
		background: var(--cor-veu-pressionado);
	}
	nav a[aria-current='page'] {
		background: var(--cor-veu-selecionado);
		color: var(--cor-texto);
	}
	.em-breve {
		color: var(--cor-texto-desativado);
		cursor: default;
	}
	.em-breve small {
		font-size: var(--texto-legenda);
		font-weight: var(--peso-normal);
	}
	main {
		padding: var(--espaco-8) clamp(var(--espaco-4), 3vw, 40px) var(--espaco-12);
		min-width: 0;
		max-width: var(--largura-conteudo);
	}
	.faixa-exemplo {
		margin-bottom: var(--espaco-6);
	}

	@media (max-width: 760px) {
		.app {
			grid-template-columns: 1fr;
		}
		.lateral {
			position: static;
			height: auto;
			gap: var(--espaco-2);
			padding: var(--espaco-3) var(--espaco-4) var(--espaco-2);
			border-right: 0;
			border-bottom: 1px solid var(--cor-borda);
		}
		.marca {
			grid-auto-flow: column;
			justify-content: start;
			align-items: baseline;
			gap: var(--espaco-2);
		}
		nav {
			display: flex;
			overflow-x: auto;
			scrollbar-width: none;
			margin-inline: calc(-1 * var(--espaco-4));
			padding-inline: var(--espaco-4);
		}
		nav a {
			min-height: var(--alvo-toque);
			flex: none;
		}
		.em-breve {
			display: none;
		}
		main {
			padding-top: var(--espaco-5);
		}
	}
</style>
