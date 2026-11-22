# Vitrinista

Assistente de conteúdo para lojas de moda: acompanha o Instagram de lojas de referência,
mostra o que deu mais certo e (nas próximas fases) usa IA para explicar o porquê e ajudar a criar
posts e carrosséis. Primeira loja: **Ana Modas** (@anamodascerquilho).

## Rodar

```bash
npm install
cp .env.example .env      # já vem em modo COLETOR=exemplo (dados fictícios)
npm run dev               # http://localhost:5173 — o banco é criado e migrado sozinho
```

| Comando                              | O que faz                                                |
| ------------------------------------ | -------------------------------------------------------- |
| `npm run dev`                        | servidor de desenvolvimento                              |
| `npm run coletar`                    | atualiza todas as referências (agendar no cron, ex.: 6h) |
| `npm run meta:configurar -- <token>` | configura o acesso à Meta (veja abaixo)                  |
| `npm test`                           | testes unitários                                         |
| `npm run check` / `npm run lint`     | tipos / estilo                                           |
| `npm run db:generate`                | gera migração depois de mudar `schema.ts`                |

## Arquitetura

```
src/
├── env.ts                      variáveis de ambiente validadas
├── hooks.server.ts             migra o banco ao iniciar e resolve a loja atual
├── lib/
│   ├── radar/destaque.ts       nota de destaque (puro, testado)
│   └── server/
│       ├── db/                 schema Drizzle + cliente libsql
│       ├── coleta/
│       │   ├── tipos.ts        interface Coletor (troca a fonte sem mudar o resto)
│       │   ├── meta.ts         Graph API oficial — Business Discovery
│       │   ├── exemplo.ts      dados fictícios determinísticos (desenvolvimento)
│       │   └── servico.ts      grava perfil, posts e histórico (idempotente)
│       ├── radar.ts            ranking por destaque com filtros
│       └── loja.ts             loja atual (hoje fixa; vira sessão quando for SaaS)
└── routes/  radar · referencias · configuracoes
scripts/     coletar.ts · meta-configurar.ts
drizzle/     migrações versionadas
```

**Multi-loja desde o início:** toda referência pertence a uma `loja`. Hoje só existe a Ana
Modas (criada automaticamente); login e cobrança entram na fase de produto.

### Nota de destaque

```
interações = curtidas + 2 × comentários
destaque   = interações do post / mediana dos últimos 30 posts maduros da mesma conta
```

Posts com menos de 48h aparecem como "recente" e não entram na linha de base.
Isso permite comparar uma loja de 2 mil seguidores com uma de 500 mil.

## Conectar o Instagram (Meta)

1. Criar app em developers.facebook.com (modo desenvolvimento basta para uso próprio).
2. Copiar **ID do app** e **Chave secreta** (Configurações → Básico) para `META_APP_ID` e
   `META_APP_SECRET` no `.env`.
3. No Graph API Explorer, gerar token de usuário com `instagram_basic`,
   `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`.
4. `npm run meta:configurar -- <token>` → troca por token de 60 dias, descobre o ID da conta
   comercial e grava no `.env`.
5. `COLETOR=meta` e reiniciar. Os posts de exemplo somem na próxima coleta.

Limitações da API: só lê contas **comerciais ou de criador**; não traz "salvamentos" de
terceiros; `like_count` some quando a conta oculta curtidas; imagens podem não vir por
direitos autorais/configuração de download.

## Roadmap

- [x] **F1 Radar** — referências, coleta, ranking por destaque
- [ ] **F2 Análise** — Gemini 3.5 Flash explica cada post em destaque (saída estruturada + Zod)
- [ ] **F3 Estúdio** — carrossel a partir de fotos + descrição (mesmo motor da skill `carrossel`), legendas, pauta
- [ ] **F4 Aprendizado** — métricas da própria loja + memória de gosto
- [ ] **F5 Produto** — login, várias lojas, cada cliente conecta o próprio Instagram, cobrança
