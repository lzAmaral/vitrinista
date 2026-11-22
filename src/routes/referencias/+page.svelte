<script lang="ts">
	import { enhance } from '$app/forms';
	import { compacto, dataEHora } from '#lib/formato.ts';
	import type { SubmitFunction } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	/** Qual formulário está enviando (ex.: "coletar:<id>"), para desabilitar só ele. */
	let enviando = $state<string | null>(null);
	let confirmarRemocao = $state<string | null>(null);

	const marcar =
		(chave: string): SubmitFunction =>
		() => {
			enviando = chave;
			return async ({ update }) => {
				await update();
				enviando = null;
				confirmarRemocao = null;
			};
		};

	const valores = $derived(form && 'valores' in form ? form.valores : undefined);
</script>

<svelte:head><title>Referências · Vitrinista</title></svelte:head>

<header class="topo">
	<div>
		<h1>Referências</h1>
		<p>Lojas que você acompanha. O Radar mostra o que deu certo para elas.</p>
	</div>
	{#if data.referencias.length > 0}
		<form method="POST" action="?/coletarTodas" use:enhance={marcar('todas')}>
			<button class="botao" disabled={enviando !== null} aria-busy={enviando === 'todas'}>
				Atualizar todas
			</button>
		</form>
	{/if}
</header>

{#if form?.sucesso}
	<p class="aviso ok" role="status">{form.sucesso}</p>
{/if}
{#if form?.erro}
	<p class="aviso erro" role="alert">{form.erro}</p>
{/if}

<form class="cartao nova" method="POST" action="?/adicionar" use:enhance={marcar('adicionar')}>
	<label class="campo">
		@ da loja
		<input
			name="handle"
			placeholder="@lojaexemplo"
			required
			autocomplete="off"
			value={valores?.handle ?? ''}
		/>
	</label>
	<label class="campo">
		Site (opcional)
		<input name="siteUrl" type="url" placeholder="https://…" value={valores?.siteUrl ?? ''} />
	</label>
	<label class="campo">
		Etiquetas (separe por vírgula)
		<input
			name="etiquetas"
			placeholder="concorrente, inspiração"
			value={valores?.etiquetas ?? ''}
		/>
	</label>
	<button class="botao primario" disabled={enviando !== null} aria-busy={enviando === 'adicionar'}>
		Adicionar
	</button>
	<p class="dica">
		A API do Instagram só lê contas <strong>comerciais ou de criador</strong> — quase toda loja é.
	</p>
</form>

{#if data.referencias.length === 0}
	<div class="vazio">
		<h2>Nenhuma referência ainda</h2>
		<p>Adicione 5 a 10 lojas parecidas com a sua — concorrentes da região e marcas que inspiram.</p>
	</div>
{:else}
	<ul class="lista">
		{#each data.referencias as ref (ref.id)}
			<li class="cartao" class:inativa={!ref.ativa}>
				<div class="identidade">
					{#if ref.fotoUrl}
						<img src={ref.fotoUrl} alt="" referrerpolicy="no-referrer" />
					{:else}
						<span class="avatar" aria-hidden="true">{ref.handle[0].toUpperCase()}</span>
					{/if}
					<div>
						<a
							class="handle"
							href="https://www.instagram.com/{ref.handle}/"
							target="_blank"
							rel="noreferrer"
						>
							@{ref.handle}
						</a>
						<p class="meta">
							{compacto(ref.seguidores)} seguidores · atualizada {dataEHora(ref.ultimaColetaEm)}
							{#if ref.siteUrl}·
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link externo -->
								<a href={ref.siteUrl} target="_blank" rel="noreferrer"> site </a>{/if}
						</p>
						<p class="etiquetas">
							{#if !ref.ativa}<span class="selo">pausada</span>{/if}
							{#each ref.etiquetas as e (e)}<span class="selo">{e}</span>{/each}
						</p>
						{#if ref.erroColeta}<p class="erro-linha">{ref.erroColeta}</p>{/if}
					</div>
				</div>

				<div class="acoes">
					<form method="POST" action="?/coletar" use:enhance={marcar(`coletar:${ref.id}`)}>
						<input type="hidden" name="id" value={ref.id} />
						<button
							class="botao"
							disabled={enviando !== null}
							aria-busy={enviando === `coletar:${ref.id}`}
						>
							Atualizar
						</button>
					</form>
					<form method="POST" action="?/alternar" use:enhance={marcar(`alternar:${ref.id}`)}>
						<input type="hidden" name="id" value={ref.id} />
						<button class="botao discreto" disabled={enviando !== null}>
							{ref.ativa ? 'Pausar' : 'Reativar'}
						</button>
					</form>
					{#if confirmarRemocao === ref.id}
						<form method="POST" action="?/remover" use:enhance={marcar(`remover:${ref.id}`)}>
							<input type="hidden" name="id" value={ref.id} />
							<button
								class="botao perigo"
								disabled={enviando !== null}
								aria-busy={enviando === `remover:${ref.id}`}
							>
								Remover @{ref.handle}
							</button>
						</form>
						<button class="botao discreto" onclick={() => (confirmarRemocao = null)}>
							Cancelar
						</button>
					{:else}
						<button class="botao discreto" onclick={() => (confirmarRemocao = ref.id)}>
							Remover
						</button>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.topo {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: var(--espaco-4);
		margin-bottom: var(--espaco-6);
		flex-wrap: wrap;
	}
	.topo p {
		margin: var(--espaco-1) 0 0;
		color: var(--cor-texto-suave);
	}
	.aviso {
		margin-bottom: var(--espaco-4);
	}
	.nova {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr auto;
		align-items: end;
		gap: var(--espaco-3);
		padding: var(--espaco-4);
		margin-bottom: var(--espaco-8);
	}
	.dica {
		grid-column: 1 / -1;
		margin: 0;
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
		color: var(--cor-texto-suave);
	}
	.lista {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--espaco-3);
	}
	.lista li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--espaco-4);
		padding: var(--espaco-4);
		flex-wrap: wrap;
	}
	.inativa .identidade {
		opacity: 0.6;
	}
	.identidade {
		display: flex;
		gap: var(--espaco-3);
		align-items: flex-start;
		min-width: 0;
	}
	.identidade > div {
		min-width: 0;
	}
	.identidade img,
	.avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		flex: none;
		object-fit: cover;
	}
	.avatar {
		display: grid;
		place-items: center;
		background: var(--cor-destaque-fundo);
		color: var(--cor-destaque-texto);
		font-family: var(--fonte-titulo);
		font-weight: var(--peso-forte);
		font-size: var(--texto-subtitulo);
	}
	.handle {
		font-weight: var(--peso-forte);
		text-decoration: none;
	}
	.handle:hover {
		text-decoration: underline;
	}
	.meta,
	.etiquetas,
	.erro-linha {
		margin: 2px 0 0;
		font-size: var(--texto-pequeno);
		line-height: var(--linha-pequeno);
		color: var(--cor-texto-suave);
	}
	.etiquetas {
		display: flex;
		gap: var(--espaco-1);
		flex-wrap: wrap;
	}
	.etiquetas:empty {
		display: none;
	}
	.erro-linha {
		color: var(--cor-erro-texto);
	}
	.acoes {
		display: flex;
		align-items: center;
		gap: var(--espaco-1);
		flex-wrap: wrap;
	}

	@media (max-width: 760px) {
		.nova {
			grid-template-columns: 1fr;
		}
		.lista li {
			align-items: stretch;
			flex-direction: column;
		}
		.acoes {
			padding-top: var(--espaco-3);
			border-top: 1px solid var(--cor-divisoria);
		}
	}
</style>
