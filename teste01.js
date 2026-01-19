/* ================= CONFIG ================= */
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?output=csv";

/* ================= ESTADO ================= */
let dados = [];
let dadosVendedora = [];
let csvCarregado = false;

/* ================= ELEMENTOS LOGIN ================= */
const loginBox = document.getElementById("loginVendedor");
const codigoVendedor = document.getElementById("codigoVendedor");
const btnLogin = document.getElementById("btnLoginVendedor");
const erroLogin = document.getElementById("erroLogin");

/* ================= SISTEMA ================= */
const sistema = document.getElementById("sistema");
const trocarVendedor = document.getElementById("trocarVendedor");

const campoBusca = document.getElementById("filtroBusca");
const resultado = document.getElementById("resultado");
const painelTabela = document.getElementById("painelTabela");
const painelGrafico = document.getElementById("painelGrafico");
const contador = document.getElementById("contador");
const boasVindas = document.getElementById("boasVindas");

/* ================= MODAL DETALHES ================= */
const overlay = document.getElementById("overlayDetalhes");
const conteudoDetalhes = document.getElementById("conteudoDetalhes");

/* ================= UTIL ================= */
function saudacaoPorHorario() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function normalizar(v) {
  return v?.toString().trim().toUpperCase();
}

/* ================= TRAVAR SCROLL ================= */
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

/* ================= CAPS LOCK SEMPRE ATIVO ================= */
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
    Estes são todos os seus envios
  `;

  painelTabela.classList.remove("oculto");
  painelGrafico.classList.remove("oculto");
  resultado.classList.remove("oculto");

  filtrar();
}

/* ================= TROCAR VENDEDOR ================= */
trocarVendedor.onclick = () => location.reload();

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

  renderizar(lista);
}

/* ================= AGRUPAR POR NOTA ================= */
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
  const grupos = agruparPorNota(lista);
  contador.innerText = `${grupos.length} envio(s)`;

  painelTabela.innerHTML = gerarTabelaSituacao(lista);

  grupos.forEach(grupo => {
    const l = grupo[0];

    const card = document.createElement("div");
    card.className = "card";
    card.addEventListener("click", () => abrirDetalhes(grupo));

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

/* ================= TABELA SITUAÇÃO ================= */
function gerarTabelaSituacao(lista) {
  const mapa = {};
  lista.forEach(l => {
    mapa[l[25]] = (mapa[l[25]] || 0) + 1;
  });

  return `
    <strong>Situação dos pedidos</strong><br>
    ${Object.entries(mapa).map(([s, q]) => `${s}: ${q}`).join("<br>")}
  `;
}

/* ================= DETALHES ================= */
function abrirDetalhes(grupo) {
  const l = grupo[0];

  conteudoDetalhes.innerHTML = `
    <h3>Detalhes da Nota</h3>

    <p><strong>Nota:</strong> ${l[0]}</p>
    <p><strong>Pedido:</strong> ${l[14]}</p>
    <p><strong>Rastreio:</strong> ${l[1] || "Não informado"}</p>

    <p><strong>Cliente:</strong> ${l[7]}</p>
    <p><strong>Situação:</strong> ${l[25]}</p>

    <div style="display:flex; gap:20px; margin:10px 0;">
      <p><strong>Postagem:</strong><br>${l[5] || "-"}</p>
      <p><strong>Prazo:</strong><br>${l[13] || "-"}</p>
    </div>

    <hr>

    <strong>Itens da nota:</strong>
    <ul>
      ${grupo.map(i => `
        <li>
          ${i[15]} — ${i[16]} un  
          <br><small><strong>Tipo amostra:</strong> ${i[17] || "-"}</small>
        </li>
      `).join("")}
    </ul>
  `;

  overlay.classList.remove("oculto");
  overlay.classList.add("show");
  travarScroll();
}

/* ================= FECHAR DETALHES ================= */
function fecharDetalhes() {
  overlay.classList.remove("show");
  overlay.classList.add("oculto");
  liberarScroll();
}

overlay.addEventListener("click", e => {
  if (e.target === overlay) fecharDetalhes();
});

/* ================= FECHAR COM ESC ================= */
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && overlay.classList.contains("show")) {
    fecharDetalhes();
  }
});
