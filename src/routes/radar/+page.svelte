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
						{#if item.visualizacoes != null}<div>
								<dt>Views</dt>
								<dd>{compacto(item.visualizacoes)}</dd>
							</div>{/if}
						<div>
							<dt>Engaj.</dt>
							<dd>{porcentagem(item.engajamento)}</dd>
						</div>
					</dl>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.topo {
		margin-bottom: 1.25rem;
	}
	.topo p {
		margin: 0.3rem 0 0;
		color: var(--tinta-suave);
	}
	.filtros {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	.filtros .campo {
		min-width: 150px;
	}
	.vazio .botao {
		margin-top: 0.75rem;
	}
	.resumo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.numero {
		padding: 0.9rem 1rem;
		display: grid;
		gap: 0.1rem;
	}
	.numero span,
	.numero small {
		font-size: 0.8rem;
		color: var(--tinta-suave);
	}
	.numero strong {
		font-family: var(--fonte-titulo);
		font-size: 1.6rem;
		font-weight: 600;
	}
	.grade {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 1rem;
	}
	.post {
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.capa {
		position: relative;
		display: block;
		aspect-ratio: 4 / 5;
		background: var(--superficie-2);
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
		color: var(--tinta-suave);
		font-size: 1.1rem;
	}
	.pilula {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.92);
		font-weight: 600;
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
	}
	.pilula.bom {
		background: var(--destaque-suave);
		color: var(--destaque);
	}
	.pilula.forte {
		background: var(--destaque);
		color: #fff;
	}
	.corpo {
		padding: 0.8rem 0.9rem 0.9rem;
		display: grid;
		gap: 0.45rem;
	}
	.linha-topo {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin: 0;
		font-size: 0.88rem;
	}
	.linha-topo span {
		color: var(--tinta-suave);
		white-space: nowrap;
	}
	.selos {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		margin: 0;
	}
	.legenda {
		margin: 0;
		font-size: 0.85rem;
		color: var(--tinta-suave);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.metricas {
		display: flex;
		gap: 0.9rem;
		margin: 0.2rem 0 0;
		font-size: 0.8rem;
	}
	.metricas dt {
		color: var(--tinta-suave);
		font-size: 0.72rem;
	}
	.metricas dd {
		margin: 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
