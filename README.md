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

Uma rotina de cloud agent (Claude Code Routine) mantém o painel sem nenhuma máquina local ligada — cada push na `main` dispara redeploy automático no Vercel:

| Rotina | Cron (UTC) | O que faz |
|---|---|---|
| `Radar 6x1 — monitor diário (só avisa em mudança)` | `0 9 * * *` | Verifica a PEC uma vez por dia. **Só commita/publica quando há mudança real** (relator, despacho na CCJ, votação, mudança de posição de senador, nova pesquisa, fato novo do lobby, ou índice variando ≥3 pontos), com commit marcado `[ALERTA]`. Sem novidade, não faz nada. |

Como **commit = mudança real**, basta dar *Watch* no repositório no GitHub para receber no celular um aviso apenas quando algo de fato muda — e nada nos dias sem novidade.

As duas rotinas de leitura a cada 30 minutos foram desativadas para não gerar notificação a cada meia hora. Além disso, o navegador do visitante busca em tempo real: últimas notícias e volume de cobertura (GDELT, a cada 5/15 min) e probabilidade do Manifold Markets (a cada 10 min). Gerenciamento das rotinas: https://claude.ai/code/routines

## Aviso

As classificações de propensão de voto são estimativas editoriais baseadas em declarações públicas e orientação partidária — não representam compromisso de voto.
