/* ============================================================
   RADAR 6×1 — renderizador
   Lê o objeto global DATA (data/data.js) e monta o painel.
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const CHIP_CLASSES = {
    "Favorável": "favoravel",
    "Provavelmente favorável": "prov-favoravel",
    "Indeciso/Sem posição": "indeciso",
    "Provavelmente contrário": "prov-contrario",
    "Contrário": "contrario",
  };

  const CORES_PLACAR = {
    "Favorável": "#2c6e49",
    "Provavelmente favorável": "#5f8d4e",
    "Indeciso/Sem posição": "#e2a23b",
    "Provavelmente contrário": "#c05621",
    "Contrário": "#c8311b",
  };

  const ORDEM_PROPENSAO = [
    "Favorável",
    "Provavelmente favorável",
    "Indeciso/Sem posição",
    "Provavelmente contrário",
    "Contrário",
  ];

  function fmtData(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
      day: "numeric", month: "long", year: "numeric",
    });
  }

  function esc(s) {
    const div = document.createElement("div");
    div.textContent = s ?? "";
    return div.innerHTML;
  }

  /* ===== cabeçalho e rodapé ===== */
  function renderDatas() {
    const txt = "Atualizado em " + fmtData(DATA.atualizadoEm);
    $("#masthead-date").textContent = txt;
    $("#rodape-data").textContent = fmtData(DATA.atualizadoEm);
    $("#rodape-fontes-count").textContent = DATA.totalFontes;
  }

  /* ===== ficha da proposta ===== */
  function renderFicha() {
    $("#ficha").innerHTML = DATA.proposta.map(
      (f) => `<div class="ficha-item"><span class="k">${esc(f.k)}</span><span class="v">${f.v}</span></div>`
    ).join("");
  }

  /* ===== índice de calor ===== */
  function renderIndice() {
    const idx = DATA.indice;
    const ARCO = 251.3;

    $("#gauge-value").textContent = idx.valor;
    $("#gauge-label").textContent = idx.classificacao;
    $("#gauge-note").textContent = idx.nota;
    $("#metodologia-texto").textContent = idx.metodologia;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        $("#gauge-arc").style.strokeDashoffset = ARCO * (1 - idx.valor / 100);
        $("#gauge-needle").setAttribute(
          "transform-origin", "100 110"
        );
        $("#gauge-needle").style.transform = `rotate(${-90 + (idx.valor / 100) * 180}deg)`;
        $("#gauge-needle").style.transformOrigin = "100px 110px";
      });
    });

    const cores = ["", "azul", "ambar"];
    $("#componentes").innerHTML = idx.componentes.map((c, i) => `
      <div class="componente ${cores[i] || ""}">
        <div class="componente-head">
          <div>
            <div class="componente-nome">${esc(c.nome)}</div>
            <div class="componente-peso">peso ${Math.round(c.peso * 100)}% no índice</div>
          </div>
          <span class="componente-valor">${c.valor}<small>/100</small></span>
        </div>
        <div class="barra"><div class="barra-fill" data-w="${c.valor}"></div></div>
        <p class="componente-nota">${esc(c.nota)}</p>
      </div>
    `).join("");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll(".barra-fill").forEach((b) => {
          b.style.width = b.dataset.w + "%";
        });
      });
    });
  }

  /* ===== placar e tabela de senadores ===== */
  let filtroAtivo = "Todos";
  let termoBusca = "";
  let ordenacao = { campo: "propensao", asc: true };

  function contagem() {
    const c = {};
    ORDEM_PROPENSAO.forEach((p) => (c[p] = 0));
    DATA.senadores.forEach((s) => c[s.propensao]++);
    return c;
  }

  function renderPlacar() {
    const c = contagem();
    const blocos = ORDEM_PROPENSAO.map((p) => `
      <div class="placar-bloco">
        <span class="n" style="color:${CORES_PLACAR[p]}">${c[p]}</span>
        <span class="l">${esc(p)}</span>
      </div>
    `).join("");

    const segs = ORDEM_PROPENSAO.map(
      (p) => `<div class="maioria-seg" style="width:${(c[p] / 81) * 100}%;background:${CORES_PLACAR[p]}"></div>`
    ).join("");

    const favoraveis = c["Favorável"] + c["Provavelmente favorável"];
    $("#placar").innerHTML = blocos + `
      <div class="placar-meta">
        Base potencial favorável: <em>${favoraveis} de 81</em> · necessários <em>49 votos</em> em dois turnos para aprovar uma PEC
        <div class="maioria-barra" style="margin-top:0.6rem">${segs}<div class="maioria-marco"></div></div>
      </div>`;
  }

  function senadoresFiltrados() {
    let lista = DATA.senadores.slice();
    if (filtroAtivo !== "Todos") lista = lista.filter((s) => s.propensao === filtroAtivo);
    if (termoBusca) {
      const t = termoBusca.toLowerCase();
      lista = lista.filter((s) =>
        (s.nome + " " + s.partido + " " + s.uf + " " + s.vies).toLowerCase().includes(t)
      );
    }
    const { campo, asc } = ordenacao;
    lista.sort((a, b) => {
      let va, vb;
      if (campo === "propensao") {
        va = ORDEM_PROPENSAO.indexOf(a.propensao);
        vb = ORDEM_PROPENSAO.indexOf(b.propensao);
        if (va === vb) return a.nome.localeCompare(b.nome, "pt-BR");
      } else {
        va = a[campo]; vb = b[campo];
        if (typeof va === "string") return asc ? va.localeCompare(vb, "pt-BR") : vb.localeCompare(va, "pt-BR");
      }
      return asc ? va - vb : vb - va;
    });
    return lista;
  }

  function renderTabela() {
    const lista = senadoresFiltrados();
    $("#tabela-corpo").innerHTML = lista.map((s) => `
      <tr>
        <td class="td-nome">${esc(s.nome)}</td>
        <td class="td-partido">${esc(s.partido)}</td>
        <td class="td-uf">${esc(s.uf)}</td>
        <td><span class="chip ${CHIP_CLASSES[s.propensao]}">${esc(s.propensao)}</span></td>
        <td class="td-vies">${esc(s.vies)}</td>
        <td class="td-base">${s.fonteUrl ? `<a href="${esc(s.fonteUrl)}" target="_blank" rel="noopener">${esc(s.fonte)}</a>` : esc(s.fonte)}</td>
      </tr>
    `).join("");
    $("#tabela-rodape").textContent =
      `Exibindo ${lista.length} de ${DATA.senadores.length} senadores · ` + DATA.notaTabela;
  }

  function renderFiltros() {
    const c = contagem();
    const botoes = ["Todos", ...ORDEM_PROPENSAO];
    $("#filtros-propensao").innerHTML = botoes.map((p) => `
      <button class="filtro-btn ${p === filtroAtivo ? "ativo" : ""}" data-filtro="${esc(p)}">
        ${esc(p)}${p === "Todos" ? " (81)" : ` (${c[p]})`}
      </button>
    `).join("");

    document.querySelectorAll(".filtro-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        filtroAtivo = btn.dataset.filtro;
        renderFiltros();
        renderTabela();
      });
    });
  }

  function bindControles() {
    $("#busca-senador").addEventListener("input", (e) => {
      termoBusca = e.target.value.trim();
      renderTabela();
    });

    document.querySelectorAll(".tabela-senadores th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const campo = th.dataset.sort;
        if (ordenacao.campo === campo) ordenacao.asc = !ordenacao.asc;
        else ordenacao = { campo, asc: true };
        renderTabela();
      });
    });
  }

  /* ===== debates ===== */
  function renderDebates() {
    const d = DATA.debatesSenado;
    $("#sumario-senado").innerHTML =
      d.paragrafos.map((p) => `<p>${p}</p>`).join("") +
      `<span class="palavras">${d.contagemPalavras} palavras · fontes: ${esc(d.fontes)}</span>`;

    $("#debates-temas").innerHTML =
      `<h3 style="font-family:var(--mono);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--tinta-60)">Principais pontos em disputa</h3>` +
      d.temas.map((t) => `
        <div class="tema-card">
          <h4>${esc(t.titulo)}</h4>
          <p>${esc(t.descricao)}</p>
          <span class="quem">${esc(t.quem)}</span>
        </div>
      `).join("");
  }

  /* ===== notícias ===== */
  function renderNoticias() {
    const e = DATA.empresas;
    $("#sumario-empresas").innerHTML =
      e.paragrafos.map((p) => `<p>${p}</p>`).join("") +
      `<span class="palavras">${e.contagemPalavras} palavras · síntese das posições do setor produtivo</span>`;

    $("#noticias-grid").innerHTML = DATA.noticias.map((n) => `
      <a class="noticia-card" href="${esc(n.url)}" target="_blank" rel="noopener">
        <div class="noticia-meta">
          <span class="noticia-fonte">${esc(n.fonte)}</span>
          <span>${esc(n.data)}</span>
        </div>
        <h4>${esc(n.titulo)}</h4>
        <p>${esc(n.resumo)}</p>
        <span class="noticia-tag">${esc(n.categoria)}</span>
      </a>
    `).join("");
  }

  /* ===== pesquisas e prediction markets ===== */
  function renderPesquisas() {
    $("#pesquisas-lista").innerHTML = DATA.pesquisas.map((p) => {
      const neutro = Math.max(0, 100 - p.aFavor - p.contra);
      return `
        <div class="pesquisa-item">
          <div class="pesquisa-head">
            <span class="pesquisa-instituto">${esc(p.instituto)}</span>
            <span class="pesquisa-data">${esc(p.data)}</span>
          </div>
          <div class="pesquisa-barra" title="${p.aFavor}% a favor · ${p.contra}% contra">
            <div class="pesquisa-favor" style="width:${p.aFavor}%">${p.aFavor}%</div>
            <div class="pesquisa-neutro" style="width:${neutro}%"></div>
            <div class="pesquisa-contra" style="width:${p.contra}%">${p.contra}%</div>
          </div>
          <p class="pesquisa-nota">${esc(p.nota)}</p>
        </div>`;
    }).join("");
  }

  function renderPolymarket() {
    const pm = DATA.predictionMarkets;
    if (!pm.mercados.length) {
      $("#polymarket-conteudo").innerHTML = `<p class="poly-vazio">${pm.nota}</p>`;
      return;
    }
    $("#polymarket-conteudo").innerHTML =
      pm.mercados.map((m) => `
        <div class="poly-mercado">
          <span class="poly-prob">${esc(m.probabilidade)}</span>
          <p class="poly-titulo">${esc(m.titulo)}</p>
          <p class="poly-meta">${esc(m.meta)}</p>
          <a href="${esc(m.url)}" target="_blank" rel="noopener">ver mercado →</a>
        </div>
      `).join("") +
      (pm.nota ? `<p class="poly-vazio" style="margin-top:0.8rem">${pm.nota}</p>` : "");
  }

  /* ===== zoom: Alcolumbre ===== */
  function renderAlcolumbre() {
    const a = DATA.alcolumbre;
    const sec = document.getElementById("alcolumbre");
    if (!a) { if (sec) sec.style.display = "none"; return; }

    $("#alco-cargo").textContent = a.cargo;

    $("#alco-termometros").innerHTML = a.termometros.map((t) => `
      <div class="alco-termo">
        <div class="t-head"><span class="t-nome">${esc(t.nome)}</span><span class="t-valor">${t.valor}<small>/100</small></span></div>
        <div class="t-barra"><div class="t-fill" data-w="${t.valor}"></div></div>
        <p class="t-nota">${esc(t.nota)}</p>
      </div>
    `).join("");

    $("#alco-leitura").innerHTML =
      a.leitura.map((p) => `<p>${p}</p>`).join("") +
      `<span class="assinatura">Leitura do Radar · baseada em ${esc(a.baseLeitura)}</span>`;

    $("#alco-timeline").innerHTML = a.timeline.map((e) => `
      <div class="alco-evento">
        <span class="e-data">${esc(e.data)}</span>
        <p class="e-titulo">${esc(e.titulo)}</p>
        ${e.citacao ? `<p class="e-citacao">“${esc(e.citacao)}”</p>` : ""}
        <span class="e-fonte">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.fonte)}</a>` : esc(e.fonte)}</span>
      </div>
    `).join("");

    $("#alco-incentivos").innerHTML = a.incentivos.map((i) => `
      <div class="alco-incentivo"><h4>${esc(i.titulo)}</h4><p>${esc(i.descricao)}</p></div>
    `).join("");

    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll(".alco-termo .t-fill").forEach((b) => { b.style.width = b.dataset.w + "%"; });
    }));
  }

  /* ===== zoom: ofensiva empresarial ===== */
  function renderOfensiva() {
    const o = DATA.ofensiva;
    const sec = document.getElementById("ofensiva");
    if (!o) { if (sec) sec.style.display = "none"; return; }

    $("#ofensiva-veredicto").innerHTML =
      `<span class="v-rotulo">Veredicto do Radar</span>` + o.veredicto;

    $("#ofensiva-ranking").innerHTML = o.ranking.map((e, idx) => `
      <div class="of-item ${idx === 0 ? "of-lider" : ""}">
        <span class="of-pos">${idx + 1}º</span>
        <div class="of-quem">
          <span class="of-nome">${esc(e.nome)}</span>
          <span class="of-citacao">“${esc(e.citacao)}”</span>
          <span class="of-acoes">${esc(e.acoes)}</span>
        </div>
        <div class="of-dims">
          ${e.notas.map((n, i) => `
            <div class="of-dim">
              <span class="d-nome">${esc(o.dimensoes[i])}</span>
              <div class="d-barra"><div class="d-fill" data-w="${n * 10}"></div></div>
              <span class="d-num">${n}</span>
            </div>
          `).join("")}
        </div>
        <div class="of-geral">
          <span class="g-num">${e.notaGeral.toFixed(1).replace(".", ",")}</span>
          <span class="g-rotulo">nota geral</span>
        </div>
      </div>
    `).join("");

    $("#ofensiva-nota").textContent = o.nota;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll(".of-dim .d-fill").forEach((b) => { b.style.width = b.dataset.w + "%"; });
    }));
  }

  /* ===== playbook corporativo ===== */
  function renderPlaybook() {
    const p = DATA.playbook;
    const sec = document.getElementById("playbook");
    if (!p) { if (sec) sec.style.display = "none"; return; }

    $("#pb-contexto").innerHTML = p.contexto.map((t) => `<p>${t}</p>`).join("");

    $("#pb-cenarios").innerHTML = p.cenarios.map((c) => `
      <div class="pb-cenario ${c.base ? "c-base" : ""}">
        <span class="c-prob">${esc(c.prob)}</span>
        <span class="c-rotulo">${esc(c.rotulo)}</span>
        <h4>${esc(c.nome)}</h4>
        <p>${esc(c.desc)}</p>
      </div>
    `).join("");

    $("#pb-frentes").innerHTML = p.frentes.map((f) => `
      <div class="pb-frente">
        <div class="pb-frente-head">
          <span class="f-num">${esc(f.num)}</span>
          <h3>${esc(f.titulo)}</h3>
          <p>${esc(f.intro)}</p>
        </div>
        <ul class="pb-acoes">
          ${f.acoes.map((a) => `
            <li>
              <span class="a-titulo">${esc(a.t)}</span>
              <span class="a-desc">${esc(a.d)}</span>
            </li>
          `).join("")}
        </ul>
      </div>
    `).join("");

    $("#pb-disclaimer").textContent = p.disclaimer;
  }

  /* ===== boot ===== */
  renderDatas();
  renderFicha();
  renderIndice();
  renderPlacar();
  renderFiltros();
  renderTabela();
  bindControles();
  renderDebates();
  renderNoticias();
  renderPesquisas();
  renderPolymarket();
  renderAlcolumbre();
  renderOfensiva();
  renderPlaybook();
})();
