<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i = $derived(data.integracoes);
</script>

<svelte:head><title>Configurações · Vitrinista</title></svelte:head>

<header class="topo">
	<h1>Configurações</h1>
	<p>As chaves ficam no arquivo <code>.env</code> do servidor e nunca aparecem no navegador.</p>
</header>

<section class="cartao bloco">
	<div class="titulo">
		<h2>Instagram (Meta Graph API)</h2>
		{#if i.coletor === 'meta' && i.meta}
			<span class="selo ok">Conectado</span>
		{:else if i.coletor === 'meta'}
			<span class="selo erro">Faltam chaves</span>
		{:else}
			<span class="selo alerta">Dados de exemplo</span>
		{/if}
	</div>
	<p>
		Busca os posts das referências pela API oficial (Business Discovery), usando a conta comercial @{data
			.loja.handle}.
	</p>
	<ol>
		<li>
			Criar um app em <a
				href="https://developers.facebook.com/apps/"
				target="_blank"
				rel="noreferrer"
			>
				developers.facebook.com
			</a>
			e colocar <code>META_APP_ID</code> e <code>META_APP_SECRET</code> no <code>.env</code>.
		</li>
		<li>
			No Graph API Explorer, gerar um token com <code>instagram_basic</code>,
			<code>instagram_manage_insights</code>, <code>pages_show_list</code> e
			<code>pages_read_engagement</code>.
		</li>
		<li>
			Rodar <code>npm run meta:configurar -- &lt;token&gt;</code>: troca por um token de 60 dias,
			descobre o ID da conta e grava no <code>.env</code>.
		</li>
		<li>
			Trocar <code>COLETOR=meta</code> e reiniciar. Os dados de exemplo somem na próxima coleta.
		</li>
	</ol>
</section>

<section class="cartao bloco">
	<div class="titulo">
		<h2>Gemini</h2>
		{#if i.gemini}<span class="selo ok">Chave configurada</span>{:else}<span class="selo">
				Fase 2
			</span>{/if}
	</div>
	<p>
		Vai analisar por que cada post funcionou e alimentar o Estúdio. Modelo: <code>
			{i.geminiModelo}
		</code>.
	</p>
	<ol>
		<li>
			Gerar a chave em <a
				href="https://aistudio.google.com/apikey"
				target="_blank"
				rel="noreferrer"
			>
				aistudio.google.com
			</a>.
		</li>
		<li>Colocar em <code>GEMINI_API_KEY</code> no <code>.env</code>.</li>
	</ol>
</section>

<section class="cartao bloco">
	<div class="titulo"><h2>Coleta automática</h2></div>
	<p>
		Para atualizar todo dia sem abrir o sistema, agende <code>npm run coletar</code> (ex.: cron às 6h).
	</p>
</section>

<style>
	.topo {
		margin-bottom: 1.5rem;
	}
	.topo p {
		margin: 0.3rem 0 0;
		color: var(--tinta-suave);
	}
	.bloco {
		padding: 1.1rem 1.25rem;
		margin-bottom: 1rem;
		max-width: 760px;
	}
	.titulo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		justify-content: space-between;
	}
	h2 {
		font-size: 1.15rem;
	}
	p,
	ol {
		color: var(--tinta-suave);
		font-size: 0.92rem;
	}
	ol {
		padding-left: 1.2rem;
		display: grid;
		gap: 0.35rem;
	}
	code {
		font-size: 0.85em;
		background: var(--superficie-2);
		padding: 0.05rem 0.35rem;
		border-radius: 4px;
		color: var(--tinta);
	}
</style>
