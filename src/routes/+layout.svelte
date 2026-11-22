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
			<p class="faixa-exemplo">
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
		grid-template-columns: 220px 1fr;
		min-height: 100dvh;
	}
	.lateral {
		position: sticky;
		top: 0;
		height: 100dvh;
		padding: 1.5rem 1rem;
		border-right: 1px solid var(--borda);
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.marca {
		text-decoration: none;
		display: grid;
		padding-inline: 0.6rem;
	}
	.logo {
		font-family: var(--fonte-titulo);
		font-size: 1.4rem;
		font-weight: 600;
	}
	.loja {
		font-size: 0.8rem;
		color: var(--tinta-suave);
	}
	nav {
		display: grid;
		gap: 0.15rem;
	}
	nav a,
	.em-breve {
		padding: 0.5rem 0.6rem;
		border-radius: var(--raio-p);
		text-decoration: none;
		color: var(--tinta-suave);
		font-weight: 500;
	}
	nav a:hover {
		background: var(--superficie-2);
		color: var(--tinta);
	}
	nav a[aria-current='page'] {
		background: var(--superficie);
		color: var(--tinta);
		box-shadow: var(--sombra);
	}
	.em-breve {
		opacity: 0.55;
		cursor: default;
	}
	.em-breve small {
		font-size: 0.7rem;
		margin-left: 0.25rem;
	}
	main {
		padding: 2rem clamp(1rem, 3vw, 2.5rem) 4rem;
		min-width: 0;
		max-width: 1280px;
	}
	.faixa-exemplo {
		margin: 0 0 1.5rem;
		padding: 0.6rem 1rem;
		border-radius: var(--raio-p);
		background: var(--alerta-suave);
		color: var(--alerta);
		font-size: 0.85rem;
	}

	@media (max-width: 760px) {
		.app {
			grid-template-columns: 1fr;
		}
		.lateral {
			position: static;
			height: auto;
			flex-direction: row;
			align-items: center;
			flex-wrap: wrap;
			gap: 0.75rem;
			padding: 0.75rem 1rem;
			border-right: 0;
			border-bottom: 1px solid var(--borda);
		}
		nav {
			display: flex;
			overflow-x: auto;
			width: 100%;
		}
		.em-breve {
			display: none;
		}
		main {
			padding-top: 1.25rem;
		}
	}
</style>
