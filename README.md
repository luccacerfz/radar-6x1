# Radar 6×1

Painel de monitoramento da proposta de emenda à Constituição que extingue a escala de trabalho 6×1 (seis dias de trabalho por um de descanso), em tramitação no Senado Federal.

## O que o painel mostra

1. **Índice de calor da discussão** — termômetro de 0 a 100 que combina três componentes ponderados:
   - volume de notícias na imprensa;
   - favorabilidade da população (pesquisas de opinião);
   - inclinação do Senado em aprovar a proposta.
2. **Mapa de votos** — tabela com os 81 senadores, a propensão de voto de cada um e uma linha descrevendo o viés político do parlamentar, com busca, filtros e ordenação.
3. **Debates no Senado** — sumário (máx. 250 palavras) das discussões sobre mudanças no texto da proposta.
4. **Painel de notícias** — sumário (máx. 100 palavras) do que associações e empresas estão dizendo, mais cards com a cobertura recente.
5. **Pesquisas & prediction markets** — números dos institutos de pesquisa e o que apostam mercados de previsão (Polymarket e similares).

## Fontes

Agência Senado, Agência Câmara, JOTA, Valor Econômico, Folha de S.Paulo, Estadão, g1/O Globo, Correio Braziliense, Poder360, Metrópoles, institutos de pesquisa (Datafolha, Quaest, AtlasIntel e outros) e mercados de previsão.

## Estrutura

```
index.html        página única do painel
css/styles.css    identidade visual (editorial, papel-jornal + vermelho-urucum)
js/app.js         renderizador — lê DATA e monta o DOM
data/data.js      todos os dados do painel em um único objeto JS
```

Site 100% estático, sem build. Para atualizar o painel manualmente, edite `data/data.js` (conteúdo) ou `data/history.json` (série do índice).

## Atualização automática (100% na nuvem)

Três rotinas de cloud agents (Claude Code Routines) mantêm o painel sem nenhuma máquina local ligada — cada push na `main` dispara redeploy automático no Vercel:

| Rotina | Cron (UTC) | O que faz |
|---|---|---|
| `Radar 6x1 — leitura :00` | `0 * * * *` | Pesquisa notícias, recalcula o índice e adiciona um ponto em `data/history.json` |
| `Radar 6x1 — leitura :30` | `30 * * * *` | Idem, defasada 30 min (juntas = leitura a cada 30 minutos) |
| `Radar 6x1 — atualização profunda diária` | `0 9 * * *` | Revisa todo o `data/data.js`: ficha, senadores, sumários, notícias, pesquisas, zoom Alcolumbre, ranking empresarial e prediction markets |

Além disso, o navegador do visitante busca em tempo real: últimas notícias e volume de cobertura (GDELT, a cada 5/15 min) e probabilidade do Manifold Markets (a cada 10 min). Gerenciamento das rotinas: https://claude.ai/code/routines

## Aviso

As classificações de propensão de voto são estimativas editoriais baseadas em declarações públicas e orientação partidária — não representam compromisso de voto.
