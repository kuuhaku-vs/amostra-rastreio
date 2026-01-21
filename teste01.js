/* ================= CONFIG ================= */
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?gid=0&single=true&output=csv";

/* ================= ESTADO ================= */
let dados = [];
let dadosVendedora = [];
let csvCarregado = false;
let situacaoSelecionada = null;

/* ================= ELEMENTOS ================= */
const loginBox = document.getElementById("loginVendedor");
const codigoVendedor = document.getElementById("codigoVendedor");
const btnLogin = document.getElementById("btnLoginVendedor");
const erroLogin = document.getElementById("erroLogin");
const logoMarca = document.getElementById("logoMarca");

const sistema = document.getElementById("sistema");
const trocarVendedor = document.getElementById("trocarVendedor");

const campoBusca = document.getElementById("filtroBusca");
const resultado = document.getElementById("resultado");
const painelGrafico = document.getElementById("painelGrafico");
const contador = document.getElementById("contador");
const boasVindas = document.getElementById("boasVindas");

const overlay = document.getElementById("overlayDetalhes");
const conteudoDetalhes = document.getElementById("conteudoDetalhes");

/* ================= UTIL ================= */
function saudacaoPorHorario() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia,";
  if (h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function normalizar(v) {
  return v?.toString().trim().toUpperCase();
}

function parseDataBR(data) {
  if (!data) return new Date(0);
  const [dia, mes, ano] = data.split("/");
  return new Date(ano, mes - 1, dia);
}

/* ================= SCROLL ================= */
function travarScroll() {
  document.body.style.overflow = "hidden";
}
function liberarScroll() {
  document.body.style.overflow = "";
}

/* ================= CSV ================= */
Papa.parse(url, {
  download: true,
  skipEmptyLines: true,
  complete: (res) => {
    dados = res.data.slice(1);
    csvCarregado = true;
  }
});

/* ================= CAPSLOCK ================= */
codigoVendedor.addEventListener("input", () => {
  codigoVendedor.value = codigoVendedor.value.toUpperCase();
});

/* ================= LOGIN ================= */
btnLogin.onclick = validarCodigo;
codigoVendedor.addEventListener("keydown", e => {
  if (e.key === "Enter") validarCodigo();
});

function validarCodigo() {
  if (!csvCarregado) return;

  const cod = normalizar(codigoVendedor.value);
  if (!cod) return;

  dadosVendedora = dados.filter(l => normalizar(l[22]) === cod);

  if (!dadosVendedora.length) {
    erroLogin.innerText = "Código do vendedor não encontrado";
    return;
  }

  erroLogin.innerText = "";
  loginBox.classList.add("oculto");
  sistema.classList.remove("oculto");
  trocarVendedor.classList.remove("oculto");

  document.getElementById("boxFiltros").classList.remove("oculto");
  campoBusca.disabled = false;

  boasVindas.innerHTML = `
    ${saudacaoPorHorario()} <strong>${dadosVendedora[0][23]}</strong><br>
    Abaixo, envios realizados nos últimos 6 meses.
  `;

  painelGrafico.classList.remove("oculto");
  resultado.classList.remove("oculto");

  /* ================= TEMA + LOGO ================= */
  const marca = normalizar(dadosVendedora[0][24]);

  document.body.classList.remove("tema-luara", "tema-quatrok");

  if (marca === "LUARA") {
    document.body.classList.add("tema-luara");
    logoMarca.src = "luara branco.png";
  } else {
    document.body.classList.add("tema-quatrok");
    logoMarca.src = "4k BRANCO.png";
  }

  filtrar();
}

/* ================= FILTRO ================= */
campoBusca.oninput = filtrar;

function filtrar() {
  let lista = [...dadosVendedora];
  const termo = campoBusca.value.trim();

  if (termo) {
    lista = lista.filter(l =>
      l[0]?.includes(termo) || l[14]?.includes(termo)
    );
  }

  if (situacaoSelecionada) {
    lista = lista.filter(l =>
      normalizar(l[26]) === normalizar(situacaoSelecionada)
    );
  }

  renderizar(lista);
}

/* ================= AGRUPAR ================= */
function agruparPorNota(lista) {
  const mapa = {};
  lista.forEach(l => {
    if (!mapa[l[0]]) mapa[l[0]] = [];
    mapa[l[0]].push(l);
  });
  return Object.values(mapa);
}

/* ================= RENDER ================= */
function renderizar(lista) {
  resultado.innerHTML = "";

  let grupos = agruparPorNota(lista);

  // 🔒 ORDEM FIXA: MAIS RECENTE PRIMEIRO
  grupos.sort((a, b) => {
    const dataA = Math.max(...a.map(i => parseDataBR(i[5])));
    const dataB = Math.max(...b.map(i => parseDataBR(i[5])));
    return dataB - dataA;
  });

  contador.innerText = `${grupos.length} envio(s)`;

  painelGrafico.innerHTML = gerarGraficoSituacao(dadosVendedora);
  atualizarSelecaoGrafico();

  grupos.forEach(grupo => {
    const l = grupo[0];
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => abrirDetalhes(grupo);

    card.innerHTML = `
      <strong>Nota:</strong> ${l[0]}<br>
      <strong>Pedido:</strong> ${l[14]}<br>
      <strong>Cliente:</strong> ${l[7]}<br>
      <strong>Situação:</strong> ${l[25]}<br>
      <strong>Itens:</strong> ${grupo.length}
    `;

    resultado.appendChild(card);
  });
}

/* ================= GRÁFICO CLICK ================= */
painelGrafico.addEventListener("click", e => {
  const linha = e.target.closest(".grafico-linha");
  if (!linha) return;

  const situacao = linha.dataset.situacao;
  situacaoSelecionada =
    situacaoSelecionada === situacao ? null : situacao;

  atualizarSelecaoGrafico();
  filtrar();
});

function atualizarSelecaoGrafico() {
  document.querySelectorAll(".grafico-linha").forEach(linha => {
    const s = linha.dataset.situacao;
    linha.classList.toggle(
      "grafico-ativo",
      normalizar(situacaoSelecionada) === normalizar(s)
    );
  });
}

/* ================= GRÁFICO ================= */
function gerarGraficoSituacao(listaBase) {
  const mapa = {};

  listaBase.forEach(l => {
    const situacao = l[26];
    const nota = l[0];
    if (!situacao) return;
    if (!mapa[situacao]) mapa[situacao] = new Set();
    mapa[situacao].add(nota);
  });

  const limite = 600;

  const entries = Object.entries(mapa)
    .sort((a, b) => b[1].size - a[1].size);

  return `
    <strong>Gráfico de Situações</strong><br><br>
    <div class="grafico">
      ${entries.map(([s, setNotas]) => {
        const q = setNotas.size;
        const pct = Math.min((q / limite) * 100, 100);
        const ativo =
          normalizar(situacaoSelecionada) === normalizar(s);

        return `
          <div 
            class="grafico-linha ${ativo ? "grafico-ativo" : ""}"
            data-situacao="${s}"
            data-tooltip="Situação: ${s} • ${q} envio(s)"
          >
            <div class="grafico-label">${s}</div>
            <div class="grafico-barra-bg">
              <div class="grafico-barra" style="width:${pct}%"></div>
            </div>
            <div class="grafico-valor">${q}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ================= DETALHES ================= */
function abrirDetalhes(grupo) {
  const l = grupo[0];
  const rastreio = l[1] || "Não informado";

  conteudoDetalhes.innerHTML = `
    <div class="detalhes-centro">
      <h3>Detalhes da Nota</h3>

      <div class="linha-dupla">
        <span><strong>Nota Fiscal:</strong> ${l[0]}</span>
        <span><strong>Pedido:</strong> ${l[14]}</span>
      </div>

      <div class="linha-rastreio-central">
        <strong>Rastreio:</strong>
        <span>${rastreio}</span>
        ${rastreio !== "Não informado"
          ? `<button onclick="rastrearCorreios('${rastreio}')">📦 Rastrear</button>`
          : ""}
      </div>

      <p><strong>Cliente:</strong> ${l[7]}</p>
      <p><strong>Situação:</strong> ${l[25]}</p>

      <div class="linha-dupla">
        <span><strong>Postagem:</strong> ${l[5] || "-"}</span>
        <span><strong>Prazo:</strong> ${l[13] || "-"}</span>
      </div>

      <hr>

      <ul class="lista-itens">
        ${grupo.map(i => `
          <li>${i[16]} - ${i[17]} - ${i[15]}</li>
        `).join("")}
      </ul>
    </div>
  `;

  overlay.classList.add("show");
  overlay.classList.remove("oculto");
  travarScroll();
}

/* ================= FECHAR ================= */
function fecharDetalhes() {
  overlay.classList.remove("show");
  overlay.classList.add("oculto");
  liberarScroll();
}

overlay.addEventListener("click", e => {
  if (e.target === overlay) fecharDetalhes();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && overlay.classList.contains("show")) {
    fecharDetalhes();
  }
});

/* ================= RASTREIO ================= */
function rastrearCorreios(codigo) {
  navigator.clipboard.writeText(codigo);
  window.open(
    `https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}`,
    "_blank"
  );
}

/* ================= TROCAR VENDEDOR ================= */
trocarVendedor.addEventListener("click", () => {
  dadosVendedora = [];
  situacaoSelecionada = null;

  codigoVendedor.value = "";
  campoBusca.value = "";
  contador.innerText = "";
  boasVindas.innerHTML = "";
  resultado.innerHTML = "";
  painelGrafico.innerHTML = "";

  campoBusca.disabled = true;

  sistema.classList.add("oculto");
  trocarVendedor.classList.add("oculto");
  document.getElementById("boxFiltros").classList.add("oculto");

  document.body.classList.remove("tema-luara", "tema-quatrok");
  logoMarca.src = "Logo - Grupo 4k - Branco.png";

  loginBox.classList.remove("oculto");
  codigoVendedor.focus();
});

