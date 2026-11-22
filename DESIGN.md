# DESIGN.md · Vitrinista

> Se este arquivo e o código discordarem, o código vale até o Luiz decidir. Anote o conflito em Perguntas em aberto.

## Product

Assistente de conteúdo para lojas de moda. Acompanha o Instagram de lojas de referência, mostra o
que deu mais certo (Radar) e ajuda a criar posts e carrosséis a partir das fotos da loja (Estúdio).
Primeira loja: Ana Modas (moda feminina, Cerquilho-SP).

Uso misto por tela:

- **Radar, Referências, análise e Configurações** → computador (1280 px), sentado, com tempo para ler dados.
- **Estúdio** (fotos → carrossel, legendas) → celular (375–390 px), onde estão as fotos dos produtos.

Trabalho principal da tela mais usada (Radar): descobrir em menos de 1 minuto quais posts das
referências estão bombando e por quê.

## Audience and voice

Duas pessoas com papéis diferentes:

- **Luiz** (técnico) configura, acompanha o Radar e a análise. Telas de análise podem mostrar mais dados.
- **A dona da loja** (não técnica) cria conteúdo no Estúdio. Ali, linguagem simples e passo a passo,
  sem jargão ("engajamento", "mediana") sem explicação.

Voz: calorosa, próxima e curta. Português do Brasil; datas 22/11 ou "22 de nov.", números
compactos "12,1 mil", dinheiro R$ 89,90, multiplicador "4,2x".

## Mood

Palavras: **acolhedor, caloroso**.
Nunca como: **neon / gradiente "de IA"** (roxo-azul brilhante, brilhos, glow).

## Brand

Fonte da verdade do sistema: **código** (`src/tokens.css` + `src/app.css`). Guias em `design/`.

Identidade própria do Vitrinista, mantida como base oficial (aprovada em 2026-11-22).
Tokens em `src/app.css`:

- Fundo creme `#f7f4ef`, superfícies brancas `#ffffff` e `#f0ebe3`, bordas `#e4ddd2`
- Tinta `#1f1b16`, tinta suave `#6b6259`
- Destaque terracota `#b4532a` (suave `#f6e3d8`)
- Estados: ok `#2f6b3f`, alerta `#8a5a00`, erro `#a3261b`, cada um com fundo suave
- Títulos: **Fraunces** (serifada). Texto: **Instrument Sans**. Ambas do Google Fonts
- Raios 14 px (cartões) e 8 px (campos); botões em pílula
- Logo: só o nome "Vitrinista" em Fraunces (assumido, não há logo)

## References

- **Airbnb**: pegar fotos grandes como protagonistas, cantos arredondados, textos calorosos;
  evitar excesso de filtros e modais empilhados (assumido).
- **Pinterest**: pegar a grade de imagens e o foco total no visual; evitar poluição visual e
  rolagem infinita sem hierarquia (assumido).
- **Canva**: pegar a criação guiada passo a passo, simples para quem não é técnico; evitar
  painéis laterais cheios de opções e os gradientes roxo-azul (assumido).

## Constraints

- Computador 1280 px e celular 375 px; nenhuma rolagem horizontal em 375 px.
- WCAG AA de contraste; texto base 15 px (16 px no Estúdio); alvos de toque ≥ 44 px no celular (assumido).
- Só tema claro por enquanto (assumido).
- Ícones: um único set em traço (outline); ainda não escolhido.
- Movimento: só para confirmar ações e transições curtas (≤ 200 ms) (assumido).

## Decisions log

- 2026-11-22: Uso misto por tela (análise no computador, Estúdio no celular), porque as fotos dos produtos estão no celular.
- 2026-11-22: Duas camadas de linguagem: telas de análise com dados, Estúdio sem jargão, porque são dois públicos diferentes.
- 2026-11-22: Identidade atual (creme + terracota + Fraunces/Instrument Sans) vira base oficial, porque combina com "acolhedor".
- 2026-11-22: Referências Airbnb, Pinterest e Canva, sugeridas e aceitas pelo Luiz.
- 2026-11-22: Fundamentos aprovados (`src/tokens.css`, guia em `design/guia-fundamentos.html`):
  tokens por papel `--cor-*`, 7 tamanhos de texto, espaço base 4 px, sombra só no que flutua.
- 2026-11-22: Selo terracota ganhou texto próprio `#98431f` (4,0:1 → 5,4:1) para passar no AA.
- 2026-11-22: Componentes com matriz de estados em `design/guia-componentes.html`; carregando usa
  `aria-busy` e mantém a largura do botão.

## Open questions

- O nome "Vitrinista" é definitivo? (sugerido, não confirmado)
- O que evitar de cada referência foi inferido; confirmar.
- Precisa de tema escuro?
- Qual set de ícones (sugestão: Lucide, traço)?
- Texto base de 16 px também nas telas de computador?
