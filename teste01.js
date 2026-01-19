/* ================= CONFIG ================= */
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?output=csv";

/* ================= ESTADO ================= */
let dados = [];
let dadosVendedora = [];
let csvCarregado = false;

/* ================= ELEMENTOS ================= */
const loginBox = document.getElementById("loginVendedor");
const codigoVendedor = document.getElementById("codigoVendedor");
const btnLogin = document.getElementById("btnLoginVendedor");
const erroLogin = document.getElementById("erroLogin");

const sistema = document.getElementById("sistema");
const trocarVendedor = document.getElementById("trocarVendedor");

const campoBusca = document.getElementById("filtroBusca");
const resultado = document.getElementById("resultado");
const painelTabela = document.getElementById("painelTabela");
const contador = document.getElementById("contador");
const boasVindas = document.getElementById("boasVindas");

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
    Estes são todos os seus envios
  `;

  painelTabela.classList.remove("oculto");
  resultado.classList.remove("oculto");

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
  const grupos = agruparPorNota(lista);
  contador.innerText = `${grupos.length} envio(s)`;

  painelTabela.innerHTML = gerarTabelaSituacao(lista);

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

/* ================= TABELA ================= */
function gerarTabelaSituacao(lista) {
  const mapa = {};
  lista.forEach(l => mapa[l[25]] = (mapa[l[25]] || 0) + 1);

  return `
    <strong>Situação dos pedidos</strong><br>
    ${Object.entries(mapa).map(([s, q]) => `${s}: ${q}`).join("<br>")}
  `;
}

/* ================= DETALHES ================= */
function abrirDetalhes(grupo) {
  const l = grupo[0];
  const rastreio = l[1] || "Não informado";

  conteudoDetalhes.innerHTML = `
    <h3>Detalhes da Nota</h3>

    <div class="linha-dupla">
      <span><strong>Nota:</strong> ${l[0]}</span>
      <span><strong>Pedido:</strong> ${l[14]}</span>
    </div>

    <p class="linha-rastreio">
      <strong>Rastreio:</strong>
      <span class="rastreio-link" onclick="abrirRastreio('${rastreio}')">
        ${rastreio}
      </span>
      ${rastreio !== "Não informado"
      ? `<button class="btn-copiar" onclick="copiarRastreio('${rastreio}')">📋</button>
           <button class="btn-rastrear" onclick="abrirRastreio('${rastreio}')">📦</button>`
      : ""
    }
    </p>

    <p><strong>Cliente:</strong> ${l[7]}</p>
    <p><strong>Situação:</strong> ${l[25]}</p>

    <div class="linha-dupla">
      <span><strong>Postagem:</strong> ${l[5] || "-"}</span>
      <span><strong>Prazo:</strong> ${l[13] || "-"}</span>
    </div>

    <hr>

    <strong>Itens da nota:</strong>
    <ul class="lista-itens">
      ${grupo.map(i =>
      `<li>${i[16]} - ${i[17]} - ${i[15]}</li>`
    ).join("")}
    </ul>
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
        <span class="codigo-rastreio">${rastreio}</span>

        ${rastreio !== "Não informado"
      ? `
              <button class="btn-rastrear-unico"
                onclick="rastrearCorreios('${rastreio}')">
                📦 Rastrear
              </button>
            `
      : ""
    }
      </div>

      <p class="linha-simples">
        <strong>Cliente:</strong> ${l[7]}
      </p>

      <p class="linha-simples">
        <strong>Situação:</strong> ${l[25]}
      </p>

      <div class="linha-dupla">
        <span><strong>Postagem:</strong> ${l[5] || "-"}</span>
        <span><strong>Prazo:</strong> ${l[13] || "-"}</span>
      </div>

      <hr>

      <strong>Itens da nota:</strong>
      <ul class="lista-itens">
        ${grupo.map(i => `
          <li>
            ${i[16]} - ${i[17]} - ${i[15]}
          </li>
        `).join("")}
      </ul>

    </div>
  `;

  overlay.classList.add("show");
  overlay.classList.remove("oculto");
  travarScroll();
}


function copiarRastreio(codigo) {
  navigator.clipboard.writeText(codigo).then(() => {
    mostrarToast("📋 Código copiado!");
  });
}

/* ================= TOAST ================= */
function mostrarToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function rastrearCorreios(codigo) {
  if (!codigo) return;

  // Copia o código
  navigator.clipboard.writeText(codigo);

  // Abre site dos Correios com o rastreio
  const url = `https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}`;
  window.open(url, "_blank");
}
