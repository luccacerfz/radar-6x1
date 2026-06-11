/* ============================================================
   RADAR 6×1 — monitor ao vivo
   - Gráfico do histórico do índice (data/history.json, alimentado
     pelo robô de 30 em 30 minutos)
   - Volume de notícias em tempo real (GDELT Project)
   - Probabilidade em tempo real (Manifold Markets)
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  /* ---------- utilidades ---------- */
  function tempoRelativo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.round(diff / 60000);
    if (min < 1) return "agora mesmo";
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 48) return `há ${h} h`;
    return `há ${Math.round(h / 24)} dias`;
  }

  function fmtCurto(iso) {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
  }

  function corDoIndice(v) {
    if (v < 25) return "#2456a6";
    if (v < 50) return "#e2a23b";
    if (v < 75) return "#c8311b";
    return "#7a1505";
  }

  /* ---------- gráfico de temperatura ---------- */
  function renderGrafico(hist) {
    const pts = hist.pontos;
    if (!pts.length) return;

    const W = 820, H = 300, M = { t: 18, r: 16, b: 44, l: 38 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const x = (i) => M.l + (pts.length === 1 ? iw / 2 : (i / (pts.length - 1)) * iw);
    const y = (v) => M.t + ih - (v / 100) * ih;

    const faixas = [
      { de: 0, ate: 25, cor: "rgba(36, 86, 166, 0.06)", rotulo: "frio" },
      { de: 25, ate: 50, cor: "rgba(226, 162, 59, 0.08)", rotulo: "morno" },
      { de: 50, ate: 75, cor: "rgba(200, 49, 27, 0.07)", rotulo: "quente" },
      { de: 75, ate: 100, cor: "rgba(122, 21, 5, 0.10)", rotulo: "fervendo" },
    ];

    const bandas = faixas.map((f) => `
      <rect x="${M.l}" y="${y(f.ate)}" width="${iw}" height="${y(f.de) - y(f.ate)}" fill="${f.cor}"/>
      <text x="${M.l + iw - 4}" y="${y(f.ate) + 13}" text-anchor="end" class="g-banda">${f.rotulo}</text>
    `).join("");

    const grade = [0, 25, 50, 75, 100].map((v) => `
      <line x1="${M.l}" y1="${y(v)}" x2="${M.l + iw}" y2="${y(v)}" class="g-grade"/>
      <text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end" class="g-eixo">${v}</text>
    `).join("");

    const linha = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.indice).toFixed(1)}`).join(" ");
    const area = linha + ` L ${x(pts.length - 1).toFixed(1)} ${y(0)} L ${x(0).toFixed(1)} ${y(0)} Z`;

    const marcadores = pts.map((p, i) => {
      const ultimo = i === pts.length - 1;
      const titulo = `${fmtCurto(p.t)} — índice ${p.indice}${p.evento ? "\n" + p.evento : ""}${p.retroativo ? "\n(reconstituição retroativa)" : ""}`;
      return `
        <g class="g-ponto ${ultimo ? "g-ponto-ultimo" : ""} ${p.retroativo ? "g-ponto-retro" : ""}">
          <circle cx="${x(i).toFixed(1)}" cy="${y(p.indice).toFixed(1)}" r="${ultimo ? 7 : p.evento ? 4.5 : 3}"
                  fill="${corDoIndice(p.indice)}" stroke="#f7f2e7" stroke-width="1.5">
            <title>${titulo.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>
          </circle>
          ${ultimo ? `<circle class="g-pulso" cx="${x(i).toFixed(1)}" cy="${y(p.indice).toFixed(1)}" r="7" fill="none" stroke="${corDoIndice(p.indice)}"/>` : ""}
        </g>`;
    }).join("");

    // rótulos do eixo X: primeiro, último e pontos com evento (máx. ~6)
    const idxRotulos = new Set([0, pts.length - 1]);
    pts.forEach((p, i) => { if (p.evento && idxRotulos.size < 7) idxRotulos.add(i); });
    const rotulosX = [...idxRotulos].sort((a, b) => a - b).map((i) => `
      <text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="g-eixo">${fmtCurto(pts[i].t)}</text>
    `).join("");

    $("#grafico-temperatura").innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="g-svg" role="img" aria-label="Gráfico do índice de calor ao longo do tempo">
        ${bandas}${grade}
        <path d="${area}" fill="rgba(200, 49, 27, 0.08)"/>
        <path d="${linha}" fill="none" stroke="#c8311b" stroke-width="2.5" stroke-linejoin="round" class="g-linha"/>
        ${marcadores}${rotulosX}
      </svg>`;

    const ultimo = pts[pts.length - 1];
    $("#grafico-status").innerHTML = `<span class="live-dot-mini"></span> ${ultimo.indice}/100 · ${tempoRelativo(ultimo.t)}`;
    $("#grafico-legenda").textContent = ultimo.evento
      ? `Última leitura: ${ultimo.evento}`
      : "Pontos com contorno são marcos editoriais; a linha avança a cada leitura do robô (30 em 30 min).";
    $("#ultima-leitura").textContent = new Date(ultimo.t).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  async function carregarHistorico() {
    try {
      const r = await fetch("data/history.json?v=" + Date.now(), { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      renderGrafico(await r.json());
    } catch (e) {
      $("#grafico-status").textContent = "histórico indisponível no momento";
    }
  }

  /* ---------- GDELT: volume de notícias em tempo real ---------- */
  const GDELT_QUERIES = [
    '"escala 6x1" sourcelang:por',
    '"escala 6x1"',
    '"6x1" jornada sourcelang:por',
  ];

  async function carregarGdelt(tentativa = 0) {
    if (tentativa >= GDELT_QUERIES.length) {
      $("#gdelt-spark").innerHTML = '<span class="live-carregando">GDELT sem dados no momento — tente recarregar.</span>';
      return;
    }
    try {
      const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
        encodeURIComponent(GDELT_QUERIES[tentativa]) +
        "&mode=timelinevol&timespan=2months&format=json";
      const r = await fetch(url);
      const j = await r.json();
      const serie = j && j.timeline && j.timeline[0] && j.timeline[0].data;
      if (!serie || !serie.length) return carregarGdelt(tentativa + 1);
      renderSpark(serie);
    } catch (e) {
      carregarGdelt(tentativa + 1);
    }
  }

  function renderSpark(serie) {
    const W = 320, H = 84, P = 4;
    const vals = serie.map((d) => d.value);
    const max = Math.max(...vals, 0.0001);
    const x = (i) => P + (i / (serie.length - 1)) * (W - 2 * P);
    const y = (v) => H - P - (v / max) * (H - 2 * P);
    const linha = vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const area = linha + ` L ${x(vals.length - 1).toFixed(1)} ${H - P} L ${P} ${H - P} Z`;
    const ult = serie[serie.length - 1];
    const pico = serie.reduce((a, b) => (b.value > a.value ? b : a));

    $("#gdelt-spark").innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="spark-svg" role="img" aria-label="Volume de notícias sobre a escala 6x1">
        <path d="${area}" fill="rgba(36, 86, 166, 0.12)"/>
        <path d="${linha}" fill="none" stroke="#2456a6" stroke-width="2"/>
        <circle cx="${x(vals.length - 1)}" cy="${y(ult.value)}" r="3.5" fill="#2456a6"/>
      </svg>`;
    $("#gdelt-nota").textContent =
      `Cobertura global (GDELT, últimos 2 meses). Pico em ${fmtCurto(pico.date.replace(/^(\d{4})(\d{2})(\d{2}).*/, "$1-$2-$3"))}; ` +
      `leitura mais recente: ${(ult.value).toFixed(2)}% do noticiário monitorado.`;
  }

  /* ---------- GDELT: últimas notícias em tempo real ---------- */
  function escHtml(s) {
    const d = document.createElement("div");
    d.textContent = s ?? "";
    return d.innerHTML;
  }

  function fmtSeenDate(seen) {
    // formato GDELT: 20260611T143000Z
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/.exec(seen || "");
    if (!m) return "";
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    return tempoRelativo(d.toISOString()) + " · " +
      d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  async function carregarUltimas(tentativa = 0) {
    const alvo = $("#ultimas-grid");
    if (!alvo) return;
    if (tentativa >= GDELT_QUERIES.length) {
      alvo.innerHTML = '<span class="live-carregando">Sem resultados em tempo real agora — veja a cobertura selecionada abaixo.</span>';
      return;
    }
    try {
      const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
        encodeURIComponent(GDELT_QUERIES[tentativa]) +
        "&mode=artlist&maxrecords=10&sort=datedesc&timespan=1week&format=json";
      const r = await fetch(url);
      const j = await r.json();
      const arts = j && j.articles;
      if (!arts || !arts.length) return carregarUltimas(tentativa + 1);

      // dedup por domínio+título e mantém as 8 mais recentes
      const vistos = new Set();
      const lista = arts.filter((a) => {
        const k = a.domain + "|" + a.title;
        if (vistos.has(k)) return false;
        vistos.add(k);
        return true;
      }).slice(0, 8);

      alvo.innerHTML = lista.map((a) => `
        <a class="ultima-item" href="${escHtml(a.url)}" target="_blank" rel="noopener">
          <span class="ultima-meta"><strong>${escHtml(a.domain)}</strong> · ${fmtSeenDate(a.seendate)}</span>
          <span class="ultima-titulo">${escHtml(a.title)}</span>
        </a>
      `).join("");
    } catch (e) {
      carregarUltimas(tentativa + 1);
    }
  }

  /* ---------- Manifold: probabilidade em tempo real ---------- */
  async function carregarManifold() {
    try {
      const r = await fetch("https://api.manifold.markets/v0/slug/will-brazil-implement-a-fourday-wor");
      const j = await r.json();
      const pct = (j.probability * 100).toFixed(1).replace(".", ",");
      $("#manifold-prob").innerHTML = `
        <span class="manifold-num">${pct}%</span>
        <a class="manifold-link" href="https://manifold.markets/FranklinBaldo/will-brazil-implement-a-fourday-wor" target="_blank" rel="noopener">ver mercado →</a>`;
    } catch (e) {
      $("#manifold-prob").innerHTML = '<span class="live-carregando">indisponível agora</span>';
    }
  }

  /* ---------- boot + auto-atualização ---------- */
  carregarHistorico();
  carregarManifold();
  // chamadas GDELT espaçadas para respeitar o limite de 1 req/5s por IP
  carregarUltimas();
  setTimeout(carregarGdelt, 6000);

  setInterval(carregarHistorico, 5 * 60 * 1000);   // histórico: a cada 5 min
  setInterval(carregarUltimas, 5 * 60 * 1000 + 7000); // últimas notícias: a cada 5 min
  setInterval(carregarGdelt, 15 * 60 * 1000);      // volume GDELT: a cada 15 min
  setInterval(carregarManifold, 10 * 60 * 1000);   // Manifold: a cada 10 min
})();
