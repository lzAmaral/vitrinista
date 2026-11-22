<script lang="ts">
	import { resolve } from '$app/paths';
	import { compacto, dataCurta, multiplo, NOMES_TIPO, porcentagem } from '#lib/formato.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const melhorFormato = $derived(
		[...data.resumo.porFormato].sort(
			(a, b) => (b.destaqueMediano ?? 0) - (a.destaqueMediano ?? 0)
		)[0]
	);

	function nivel(destaque: number | null) {
		if (destaque == null) return '';
		if (destaque >= 3) return 'forte';
		if (destaque >= 1.5) return 'bom';
		return '';
	}
</script>

<svelte:head><title>Radar · Vitrinista</title></svelte:head>

<header class="topo">
	<h1>Radar</h1>
	<p>O que deu mais certo nas suas referências — comparado com o normal de cada loja.</p>
</header>

<form class="filtros" method="GET" data-sveltekit-keepfocus data-sveltekit-noscroll>
	<label class="campo">
		Período
		<select name="dias" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			{#each data.periodos as p (p)}
				<option value={p} selected={data.filtros.dias === p}>Últimos {p} dias</option>
			{/each}
		</select>
	</label>
	<label class="campo">
		Formato
		<select name="tipo" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			<option value="">Todos</option>
			{#each data.tipos as t (t)}
				<option value={t} selected={data.filtros.tipo === t}>{NOMES_TIPO[t]}</option>
			{/each}
		</select>
	</label>
	<label class="campo">
		Loja
		<select name="ref" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			<option value="">Todas</option>
			{#each data.referencias as r (r.id)}
				<option value={r.id} selected={data.filtros.referenciaId === r.id}>@{r.handle}</option>
			{/each}
		</select>
	</label>
	{#if data.etiquetas.length > 0}
		<label class="campo">
			Etiqueta
			<select name="etiqueta" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				<option value="">Todas</option>
				{#each data.etiquetas as e (e)}
					<option value={e} selected={data.filtros.etiqueta === e}>{e}</option>
				{/each}
			</select>
		</label>
	{/if}
	<noscript><button class="botao">Filtrar</button></noscript>
</form>

{#if data.referencias.length === 0}
	<div class="vazio cartao">
		<h2>Comece pelas referências</h2>
		<p>
			Adicione as lojas que você quer acompanhar e o Radar mostra os posts que mais deram certo.
		</p>
		<a class="botao primario" href={resolve('/referencias')}>Adicionar referências</a>
	</div>
{:else if data.itens.length === 0}
	<div class="vazio cartao">
		<h2>Nada neste filtro</h2>
		<p>
			Tente um período maior ou outro formato. Se acabou de adicionar lojas, clique em "Atualizar"
			nas Referências.
		</p>
	</div>
{:else}
	<section class="resumo" aria-label="Resumo do período">
		<div class="cartao numero">
			<span>Posts analisados</span>
			<strong>{data.resumo.total}</strong>
		</div>
		<div class="cartao numero">
			<span>Acima de 2x o normal</span>
			<strong>{data.resumo.acimaDe2x}</strong>
		</div>
		{#if melhorFormato}
			<div class="cartao numero">
				<span>Formato em alta</span>
				<strong>{NOMES_TIPO[melhorFormato.tipo]}</strong>
				<small>mediana {multiplo(melhorFormato.destaqueMediano)} o normal</small>
			</div>
		{/if}
	</section>

	<ul class="grade">
		{#each data.itens as item (item.id)}
			<li class="cartao post">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link externo (Instagram) -->
				<a class="capa" href={item.permalink} target="_blank" rel="noreferrer">
					{#if item.imagem}
						<img src={item.imagem} alt="" loading="lazy" referrerpolicy="no-referrer" />
					{:else}
						<span class="sem-imagem">{NOMES_TIPO[item.tipo]}</span>
					{/if}
					<span
						class="pilula {nivel(item.destaque)}"
						title="Interações em relação ao normal desta loja"
					>
						{multiplo(item.destaque)}
					</span>
				</a>
				<div class="corpo">
					<p class="linha-topo">
						<strong>@{item.referencia.handle}</strong>
						<span>{dataCurta(item.publicadoEm)}</span>
					</p>
					<p class="selos">
						<span class="selo">{NOMES_TIPO[item.tipo]}</span>
						{#if !item.maduro}<span
								class="selo alerta"
								title="Menos de 48h: os números ainda estão subindo"
							>
								recente
							</span>{/if}
						{#if item.exemplo}<span class="selo">exemplo</span>{/if}
					</p>
					{#if item.legenda}<p class="legenda">{item.legenda}</p>{/if}
					<dl class="metricas">
						<div>
							<dt>Curtidas</dt>
							<dd>{item.curtidas == null ? 'ocultas' : compacto(item.curtidas)}</dd>
						</div>
						<div>
							<dt>Coment.</dt>
							<dd>{compacto(item.comentarios)}</dd>
						</div>
						{#if item.tipo === 'VIDEO' && item.visualizacoes != null}
							<div>
								<dt>Views</dt>
								<dd>{compacto(item.visualizacoes)}</dd>
							</div>
						{:else}
							<div>
								<dt>Engaj.</dt>
								<dd>{porcentagem(item.engajamento)}</dd>
							</div>
						{/if}
					</dl>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.topo {
		margin-bottom: var(--espaco-5);
	}
	.topo p {
		margin: var(--espaco-1) 0 0;
		color: var(--cor-texto-suave);
	}
	.filtros {
		display: flex;
		gap: var(--espaco-3);
		flex-wrap: wrap;
		margin-bottom: var(--espaco-6);
	}
	.filtros .campo {
		min-width: 150px;
		flex: 0 1 auto;
	}
	.resumo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--espaco-3);
		margin-bottom: var(--espaco-6);
	}
	.numero {
		padding: var(--espaco-4);
		display: grid;
		gap: 2px;
	}
	.numero span,
	.numero small {
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
		color: var(--cor-texto-suave);
	}
	.numero strong {
		font-family: var(--fonte-titulo);
		font-size: var(--texto-numero);
		line-height: var(--linha-numero);
		font-weight: var(--peso-forte);
	}
	.grade {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: var(--espaco-4);
	}
	/* Cartão com borda: o hover só escurece a borda */
	.post {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: border-color var(--duracao-rapida) var(--curva);
	}
	.post:hover {
		border-color: var(--cor-borda-hover);
	}
	.capa {
		position: relative;
		display: block;
		aspect-ratio: 4 / 5;
		background: var(--cor-preenchimento-1);
	}
	.capa:focus-visible {
		outline-offset: -2px;
	}
	.capa img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.sem-imagem {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-family: var(--fonte-titulo);
		font-size: var(--texto-subtitulo);
		color: var(--cor-texto-suave);
	}
	.pilula {
		position: absolute;
		top: var(--espaco-3);
		left: var(--espaco-3);
		padding: 2px var(--espaco-3);
		border-radius: var(--raio-pilula);
		background: var(--cor-veu-foto);
		color: var(--cor-texto);
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
		font-weight: var(--peso-forte);
		font-variant-numeric: tabular-nums;
	}
	.pilula.bom {
		background: var(--cor-destaque-fundo);
		color: var(--cor-destaque-texto);
	}
	.pilula.forte {
		background: var(--cor-destaque);
		color: var(--cor-sobre-escuro);
	}
	.corpo {
		padding: var(--espaco-3) var(--espaco-4) var(--espaco-4);
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--espaco-2);
	}
	.linha-topo {
		display: flex;
		justify-content: space-between;
		gap: var(--espaco-2);
		margin: 0;
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
	}
	.linha-topo strong {
		font-weight: var(--peso-forte);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.linha-topo span {
		color: var(--cor-texto-suave);
		white-space: nowrap;
	}
	.selos {
		display: flex;
		gap: var(--espaco-1);
		flex-wrap: wrap;
		margin: 0;
	}
	.legenda {
		margin: 0;
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
		color: var(--cor-texto-suave);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.metricas {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--espaco-2);
		margin: var(--espaco-1) 0 0;
		padding-top: var(--espaco-3);
		border-top: 1px solid var(--cor-divisoria);
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
	}
	.metricas dt {
		color: var(--cor-texto-suave);
		font-size: var(--texto-legenda);
		line-height: var(--linha-legenda);
	}
	.metricas dd {
		margin: 0;
		font-weight: var(--peso-forte);
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 760px) {
		.filtros {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
		.filtros .campo {
			min-width: 0;
		}
		.grade {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: var(--espaco-3);
		}
		.corpo {
			padding: var(--espaco-3);
		}
		.linha-topo {
			flex-direction: column;
			gap: 0;
		}
		.metricas {
			grid-template-columns: repeat(3, auto);
			justify-content: space-between;
			gap: var(--espaco-1);
		}
		.metricas dd {
			font-size: var(--texto-legenda);
			line-height: var(--linha-legenda);
		}
		.resumo {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: var(--espaco-2);
		}
		.numero {
			padding: var(--espaco-3);
		}
		.numero strong {
			font-size: var(--texto-subtitulo);
			line-height: var(--linha-subtitulo);
		}
	}
</style>
