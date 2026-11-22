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
		Atualiza as referências todo dia, mesmo com o sistema fechado. No Mac:
		<code>npm run agendar</code> (6h por padrão; <code>npm run agendar -- 07:30</code> muda o
		horário, <code>status</code> mostra se está ativo e <code>remover</code> desliga).
	</p>
</section>

<style>
	.topo {
		margin-bottom: var(--espaco-6);
	}
	.topo p {
		margin: var(--espaco-1) 0 0;
		color: var(--cor-texto-suave);
	}
	.bloco {
		padding: var(--espaco-5) var(--espaco-6);
		margin-bottom: var(--espaco-4);
		max-width: var(--largura-leitura);
	}
	.titulo {
		display: flex;
		align-items: center;
		gap: var(--espaco-3);
		justify-content: space-between;
		flex-wrap: wrap;
	}
	p,
	ol {
		color: var(--cor-texto-suave);
	}
	ol {
		padding-left: var(--espaco-5);
		display: grid;
		gap: var(--espaco-2);
	}
	code {
		font-size: var(--texto-pequeno);
		background: var(--cor-preenchimento-1);
		padding: 1px var(--espaco-1);
		border-radius: var(--raio-p);
		color: var(--cor-texto);
		overflow-wrap: anywhere;
	}

	@media (max-width: 760px) {
		.bloco {
			padding: var(--espaco-4);
		}
	}
</style>
