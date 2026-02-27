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
const tipoBusca = document.getElementById("tipoBusca");
const btnAjudaSuporte = document.getElementById("btnAjudaSuporte");
const btnTipoBusca = document.getElementById("btnTipoBusca");
const menuTipoBusca = document.getElementById("menuTipoBusca");
const labelTipoBusca = document.getElementById("labelTipoBusca");
const btnAnalises = document.getElementById("btnAnalises");


function formatarAmostraDetalhe(i) {
  const tipo = normalizar(i[17] || "");

  // 🟡 cartela de cores → só descrição
  if (tipo.includes("CARTELA")) {
  return `${i[16]} - ${i[15]}`;
}


  // padrão
  return `${i[16]} - ${i[17]} - ${i[15]}`;
}

function atualizarItemAtivoMenu() {
  if (!menuTipoBusca) return;

  menuTipoBusca.querySelectorAll(".menu-item").forEach(item => {
    item.classList.toggle(
      "ativo",
      item.dataset.tipo === tipoBusca.value
    );
  });
}

function obterPedidosPendentes() {
  const mapa = new Map();

  dadosVendedora.forEach(l => {
    const situacao = normalizar(l[26] || "");
    if (!situacao.includes("PENDENTE")) return;

    const nota = l[0];
    if (!mapa.has(nota)) mapa.set(nota, l);
  });

  return [...mapa.values()];
}


/* ================= INICIALIZA TIPO DE BUSCA PADRÃO ================= */
(function initTipoBuscaPadrao() {
  tipoBusca.value = "nota";

  labelTipoBusca.innerText = "📄 Nota Fiscal";
  campoBusca.placeholder = "📄 Buscar por Nota Fiscal";
})();



function atualizarPlaceholderBusca() {
  const placeholders = {
    nota: "Buscar por Nota Fiscal",
    pedido: "Buscar por Pedido",
    cliente: "Buscar por Nº do Cliente",
    representante: "Buscar por Nº do Representante"
  };

  const tipo = tipoBusca.value;
  campoBusca.placeholder = placeholders[tipo] || "Digite para buscar";
}

function atualizarMenuTipoBusca() {
  const itemRepresentante = menuTipoBusca.querySelector(
    '.menu-item[data-tipo="representante"]'
  );

  if (!itemRepresentante) return;

  if (window.exibirRepresentante) {
    itemRepresentante.classList.remove("oculto");
  } else {
    itemRepresentante.classList.add("oculto");

    // se estava selecionado, volta pra Nota Fiscal
    if (tipoBusca.value === "representante") {
      tipoBusca.value = "nota";
      labelTipoBusca.innerText = "📄 Nota Fiscal";
      atualizarPlaceholderBusca();
    }
  }
  atualizarItemAtivoMenu();
}



/* ================= TIPO DE BUSCA ================= */
btnTipoBusca.onclick = () => {
  menuTipoBusca.classList.toggle("oculto");
  atualizarItemAtivoMenu()
};

    // visual ativo
    menuTipoBusca.querySelectorAll(".menu-item").forEach(item => {
  item.onclick = () => {

    const tipo = item.dataset.tipo;

    tipoBusca.value = tipo;
    labelTipoBusca.innerText = item.innerText;

    // 🔥 AQUI é o ponto-chave
    const placeholders = {
      nota: "Buscar por Nota Fiscal",
      pedido: "Buscar por Pedido",
      cliente: "Buscar por Nº do Cliente",
      representante: "Buscar por Nº do Representante"
    };

    atualizarPlaceholderBusca();
    campoBusca.value = "";


    filtrar();
    atualizarItemAtivoMenu();
    menuTipoBusca.classList.add("oculto");
  };
});


// fecha ao clicar fora
document.addEventListener("click", e => {
  if (!e.target.closest(".tipo-busca-wrapper")) {
    menuTipoBusca.classList.add("oculto");
  }
});



/* ================= UTIL ================= */
function saudacaoPorHorario() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia,";
  if (h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function hashSimples(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0; // 🔥 força unsigned (corrige o ADM)
}

const HASH_ADM = 3872595084; // <-- use EXATAMENTE o número do console



function normalizarTextoOrdenacao(txt) {
  if (!txt) return "";

  // remove tudo até o terceiro hífen
  // exemplo: "1 - Pilotagem - PUNHO AP INFINITY BCO 1Q"
  // vira: "PUNHO AP INFINITY BCO 1Q"
  const descricao = txt.replace(/^.*?-\s*.*?-\s*/,"");

  return descricao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}



function normalizar(v) {
  return v
    ?.toString()
    .normalize("NFD")                 // quebra caracteres compostos
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .replace(/\uFE0F/g, "")           // 🔥 remove variation selector do emoji
    .replace(/⚠/g, "")                // 🔥 remove o emoji em si
    .trim()
    .toUpperCase();
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
window.exibirCliente = cod.startsWith("V") || cod.startsWith("S");
window.exibirRepresentante = cod.startsWith("V");

atualizarMenuTipoBusca();

  if (!cod) return;
  
  // ================= LOGIN MESTRE =================
  const isAdmin = hashSimples(cod) === HASH_ADM;
  window.isAdmin = isAdmin;

  if (isAdmin && btnAnalises) {
    btnAnalises.classList.remove("oculto");
  } else if (btnAnalises) {
    btnAnalises.classList.add("oculto");
  }

  if (isAdmin) {
    dadosVendedora = [...dados];
    window.exibirCliente = true;
    window.exibirRepresentante = true;
    
  } else {
    window.exibirCliente = cod.startsWith("V") || cod.startsWith("S");
    window.exibirRepresentante = cod.startsWith("V");

    dadosVendedora = dados.filter(l => normalizar(l[22]) === cod);

    if (!dadosVendedora.length) {
      erroLogin.innerText = "Código do vendedor não encontrado";
      return;
    }
  }



  erroLogin.innerText = "";
  loginBox.classList.add("oculto");
  sistema.classList.remove("oculto");
  trocarVendedor.classList.remove("oculto");
  btnAjudaSuporte.classList.add("oculto");


  const boxFiltros = document.getElementById("boxFiltros");
  if (boxFiltros) {
    boxFiltros.classList.remove("oculto");
  }

  campoBusca.disabled = false;
  btnTipoBusca.disabled = false;
  atualizarPlaceholderBusca();


  boasVindas.innerHTML = isAdmin
    ? `${saudacaoPorHorario()} <strong>Administrador</strong><br>
     Visualização completa de todos os envios.`
    : `${saudacaoPorHorario()} <strong>${dadosVendedora[0][23]}</strong><br>
     Abaixo, envios realizados nos últimos 6 meses.`;


  painelGrafico.classList.remove("oculto");
  resultado.classList.remove("oculto");

  /* ================= TEMA + LOGO ================= */
  const marca = isAdmin
    ? "QUATROK" // ou "LUARA", escolha uma padrão
    : normalizar(dadosVendedora[0][24]);

  window.marcaLogada = marca;


  document.body.classList.remove("tema-luara", "tema-quatrok");

 const logoMarcaBox = document.getElementById("logoMarcaBox");

if (marca === "LUARA") {
  document.body.classList.add("tema-luara");
  logoMarca.src = "/Imagens/luara branco.png";
  logoMarcaBox.src = "/Imagens/luara branco.png";
} else {
  document.body.classList.add("tema-quatrok");
  logoMarca.src = "/Imagens/4k BRANCO.png";
  logoMarcaBox.src = "/Imagens/4k BRANCO.png";
}


  filtrar();
  atualizarNotificacoes();
}
if (btnAnalises) {
  btnAnalises.addEventListener("click", () => {
    window.open("analytics.html", "_blank");
  });
}


const btnNotificacoes = document.getElementById("btnNotificacoes");
const contadorNotificacoes = document.getElementById("contadorNotificacoes");

function atualizarNotificacoes() {
  // 🔥 filtra apenas pendentes
  const pendentes = dadosVendedora.filter(l =>
    normalizar(l[26]).includes("PENDENTE")
  );

  // 🔥 AGRUPA POR RASTREIO (IGUAL AO CARD)
  const grupos = agruparPorRastreio(pendentes);

  contadorNotificacoes.innerText = grupos.length;

  const deveMostrarBotao =
    window.marcaLogada === "LUARA" || grupos.length > 0;

  btnNotificacoes.classList.toggle("oculto", !deveMostrarBotao);

  listaNotificacoes.innerHTML = "";

  if (!grupos.length) {
    listaNotificacoes.innerHTML =
      "<p style='text-align:center'>Nenhuma notificação no momento.</p>";
    return;
  }

  grupos.forEach(grupo => {
    const l = grupo[0];

    // 🔥 CONSOLIDAÇÃO IGUAL AO CARD
    const notasUnicas = [...new Set(grupo.map(i => i[0]))];
    const labelNota = notasUnicas.length === 1 ? "Nota" : "Notas";

    const situacaoTexto = normalizar(l[25] || "");

    const div = document.createElement("div");

    let classeAlerta = "";
    if (situacaoTexto.includes("AGUARDANDO RETIRADA")) {
      classeAlerta = "alerta-retirada";
    }

    div.className = `notificacao-item ${classeAlerta}`;

    div.innerHTML = `
      <strong>${labelNota}:</strong> ${notasUnicas.join(", ")}<br>
      <strong>Cliente:</strong> ${l[19]}<br>
      <strong>Situação:</strong> ${l[25]}
    `;

    // 👉 abre exatamente o mesmo grupo do card
    div.onclick = () => {
      fecharNotificacoes();
      abrirDetalhes(grupo);
    };

    listaNotificacoes.appendChild(div);
  });
}



const overlayNotificacoes = document.getElementById("overlayNotificacoes");
const listaNotificacoes = document.getElementById("listaNotificacoes");

btnNotificacoes.onclick = () => {
  overlayNotificacoes.classList.remove("oculto");
  overlayNotificacoes.classList.add("show");

   overlayNotificacoes
    .querySelector(".painel-detalhes")
    .classList.add("modo-legenda");

  const painelNotif = overlayNotificacoes?.querySelector(".painel-detalhes");

  if (painelNotif) {
    painelNotif.classList.add("modo-legenda");
  }

  travarScroll();
};

function fecharNotificacoes() {
  overlayNotificacoes.classList.add("oculto");
  overlayNotificacoes.classList.remove("show");

  overlayNotificacoes
    .querySelector(".painel-detalhes")
    .classList.remove("modo-legenda");

  liberarScroll();
}

/* ================= FILTRO ================= */
campoBusca.oninput = () => {
  const temBusca = campoBusca.value.trim().length > 5;

  document.body.classList.toggle("modo-busca", temBusca);

  filtrar();
};


function filtrar() {
  let lista = [...dadosVendedora];
  const termo = campoBusca.value.trim();

 if (termo) {
  const tipo = tipoBusca.value;

  lista = lista.filter(l => {
    switch (tipo) {
      case "nota":
        return l[0]?.includes(termo); // Nota Fiscal

      case "pedido":
        return l[14]?.includes(termo); // Pedido

      case "cliente":
        return l[18]?.includes(termo); // Nº Cliente

      case "representante":
        return l[20]?.includes(termo); // Nº Representante

      default:
        return false;
    }
  });
}


  if (situacaoSelecionada) {
    lista = lista.filter(l =>
      normalizar(l[26]) === normalizar(situacaoSelecionada)
    );
  }

  renderizar(lista);
}

/* ================= AGRUPAR ================= */
function agruparPorRastreio(lista) {
  const mapa = {};

  lista.forEach(l => {
    const rastreio = l[1] || "SEM_RASTREIO";

    if (!mapa[rastreio]) mapa[rastreio] = [];
    mapa[rastreio].push(l);
  });

  return Object.values(mapa);
}


/* ================= RENDER ================= */
function renderizar(lista) {
  resultado.innerHTML = "";

  let grupos = agruparPorRastreio(lista);


  // 🔒 ORDEM FIXA: MAIS RECENTE PRIMEIRO
  // 🔒 PRIORIDADE + ORDEM POR DATA
grupos.sort((a, b) => {
  const situacaoA = normalizar(a[0][25] || "");
  const situacaoB = normalizar(b[0][25] || "");

  const prioridadeA = situacaoA.includes("AGUARDANDO RETIRADA") ? 0 : 1;
  const prioridadeB = situacaoB.includes("AGUARDANDO RETIRADA") ? 0 : 1;

  // 1º: prioridade (aguardando retirada sempre em cima)
  if (prioridadeA !== prioridadeB) {
    return prioridadeA - prioridadeB;
  }

  // 2º: mais recente primeiro
  const dataA = Math.max(...a.map(i => parseDataBR(i[5])));
  const dataB = Math.max(...b.map(i => parseDataBR(i[5])));
  return dataB - dataA;
});


  contador.innerText = `${grupos.length} envio(s)`;

  painelGrafico.innerHTML = gerarGraficoSituacao(dadosVendedora);
  atualizarSelecaoGrafico();

  grupos.forEach(grupo => {
    const l = grupo[0];
      // 🔥 DADOS CONSOLIDADOS DO GRUPO (POR RASTREIO)
  const notasUnicas = [...new Set(grupo.map(i => i[0]))];
  const pedidosUnicos = [...new Set(grupo.map(i => i[14]))];
  const rastreio = l[1] || "Não informado";
  const labelNota = notasUnicas.length === 1 ? "Nota" : "Notas";
  const labelPedido = pedidosUnicos.length === 1 ? "Pedido" : "Pedidos";



      // ================= TIPO DE ENVIO (COLUNA C) =================
  const tipoEnvio = normalizar(l[2] || "");
  let iconeEnvio = "";

if (tipoEnvio.includes("SEDEX PAG")) {
  iconeEnvio =
    `<img src="/Imagens/sedexcobrar.png" class="icone-envio" alt="SEDEX PAG. ENTREGA">`;
}
else if (tipoEnvio.includes("SEDEX")) {
  iconeEnvio =
    `<img src="/Imagens/sedex.png" class="icone-envio" alt="SEDEX">`;
}
else if (tipoEnvio.includes("PAC")) {
  iconeEnvio =
    `<img src="/Imagens/pac.png" class="icone-envio" alt="PAC">`;
}


    const codigoCliente = l[18] || "-";
    const nomeCliente = l[19] || l[7] || "-";

    const numeroRepresentante = l[20] || "-";
    const nomeRepresentante = l[21] || "-";

    const card = document.createElement("div");

    const situacao = normalizar(l[26]);
    
    // 🔴 ALERTA: aguardando retirada no endereço indicado (coluna 25)
    const situacaoTexto = normalizar(l[25]);

    // ================= FAIXA LATERAL (ENTREGUE / RETORNOU) =================
const dataStatus = l[27]; // 🔥 coluna da DATA (ajuste se for outra)

let faixaHTML = "";

if (situacao.includes("ENTREGUE") && dataStatus) {
  faixaHTML = `
    <div class="faixa-status entregue">
      <span>ENTREGUE</span>
      <small>${dataStatus}</small>
    </div>
  `;
}
else if (
  situacao.includes("RETORN") ||
  situacao.includes("DEVOL")
) {
  faixaHTML = `
    <div class="faixa-status retornou">
      <span>RETORNOU</span>
      <small>${dataStatus || ""}</small>
    </div>
  `;
}
else if (situacao.includes("PENDENTE")) {
  faixaHTML = `
    <div class="faixa-status pendente">
      <span>PENDENTE</span>
    </div>
  `;
}


    const temAlertaRetirada =
      situacaoTexto.includes("AGUARDANDO RETIRADA");


    let classeStatus = "outro";

    if (situacao.includes("ENTREGUE")) {
      classeStatus = "entregue";
    } 
    else if (situacao.includes("PENDENTE")) {
      classeStatus = "pendente";
    } 
    else if (
      situacao.includes("RETORN") ||
      situacao.includes("DEVOL")
    ) {
      classeStatus = "retornado";
    }

card.className = `card ${classeStatus}`;


    card.className = `card ${classeStatus}`;

    card.onclick = () => abrirDetalhes(grupo);
    const codigoVendedorCard = l[22] || "-";
    const nomeVendedorCard = l[23] || "-";


    card.innerHTML = `
    ${faixaHTML}

    ${iconeEnvio}

    ${temAlertaRetirada ? `<div class="alerta-retirada">📦⛔</div>` : ""}

    <div class="linhacard">


      <strong>${labelNota}:</strong> ${notasUnicas.join(" / ")}<br>
      <strong>${labelPedido}:</strong> ${pedidosUnicos.join(" / ")}<br><br>


      ${window.isAdmin ? `
  <div class="card-vendedor">
    <strong>Vendedor:</strong>
    ${codigoVendedorCard} - ${nomeVendedorCard}
  </div>
` : ""}


      <div class="cardcliente">
        ${window.exibirCliente ? `
        <strong>Cliente: </strong>${nomeCliente}<br>
        ` : ""}
      </div>

      <div class="cardrepresentante">
      ${window.exibirRepresentante ? `
      <span class="linha-representante">
        <strong>Representante:</strong>
        ${nomeRepresentante}
      </span><br><br>
      ` : ""}</div>
      
      <div class="cardsituacao">
      <strong>Situação:</strong>
      <span class="situacao ${temAlertaRetirada ? "aguardando-retirada" : ""}">
        ${l[25]}
      </span><br></div>

      <strong>Itens:</strong> ${grupo.length}
  </div>
`;

    resultado.appendChild(card);
  });
}

/* ================= GRÁFICO CLICK ================= */
painelGrafico.addEventListener("click", e => {
  const linha = e.target.closest(".grafico-linha");
  if (!linha) return;

  // ✅ LIMPA O INPUT DE NOTA FISCAL
  campoBusca.value = "";
  document.body.classList.remove("modo-busca");

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

  // agrupa por situação e nota única
  listaBase.forEach(l => {
    const situacao = l[26];
    const nota = l[0];
    if (!situacao) return;

    if (!mapa[situacao]) mapa[situacao] = new Set();
    mapa[situacao].add(nota);
  });

  // 👉 TOTAL REAL DE PEDIDOS (somando todas as notas únicas)
  const totalPedidos = Object.values(mapa)
    .reduce((acc, setNotas) => acc + setNotas.size, 0);

  const entries = Object.entries(mapa)
    .sort((a, b) => b[1].size - a[1].size);

  return `
  <div class="grafico-header">
  <strong>Gráfico de Situações</strong>

  ${
    situacaoSelecionada
      ? `
        <span id="limparFiltroGrafico" title="Limpar filtro">
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <!-- Funil -->
    <path
      d="M3 5h18l-7 8v5l-4 2v-7L3 5z"
      fill="currentColor"/>

    <!-- X (limpar) -->
    <path
      d="M15.5 9.5l4 4m0-4l-4 4"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"/>
  </svg>
</span>

      `
      : ""
  }
</div>


  <div class="grafico">
    ${entries.map(([s, setNotas]) => {
      const q = setNotas.size;
      const pct = totalPedidos ? (q / totalPedidos) * 100 : 0;

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

painelGrafico.addEventListener("click", e => {
  if (e.target.closest("#limparFiltroGrafico")) {
    situacaoSelecionada = null;
    atualizarSelecaoGrafico();
    filtrar();
  }
});



/* ================= DETALHES ================= */
function abrirDetalhes(grupo) {
  grupo.sort((a, b) => {
  return prioridadeDescricao(a[17]) 
       - prioridadeDescricao(b[17]);
});
  const l = grupo[0];
  // 🔥 CONSOLIDAÇÃO POR RASTREIO (IGUAL AO CARD)
const notasUnicas = [...new Set(grupo.map(i => i[0]))];
const pedidosUnicos = [...new Set(grupo.map(i => i[14]))];

const labelNota = notasUnicas.length === 1 ? "Nota Fiscal" : "Notas Fiscais";
const labelPedido = pedidosUnicos.length === 1 ? "Pedido" : "Pedidos";

  // ================= TIPO DE ENVIO (DETALHES) =================
const tipoEnvio = normalizar(l[2] || "");
let iconeEnvioDetalhes = "";

if (tipoEnvio.includes("SEDEX PAG")) {
  iconeEnvioDetalhes =
    `<img src="/Imagens/sedexcobrar.png" class="icone-envio-detalhes" alt="SEDEX PAG. ENTREGA">`;
}
else if (tipoEnvio.includes("SEDEX")) {
  iconeEnvioDetalhes =
    `<img src="/Imagens/sedex.png" class="icone-envio-detalhes" alt="SEDEX">`;
}
else if (tipoEnvio.includes("PAC")) {
  iconeEnvioDetalhes =
    `<img src="/Imagens/pac.png" class="icone-envio-detalhes" alt="PAC">`;
}




  const uf = l[11] || "-";
  const estado = l[12] || "-";

  const codigoCliente = l[18] || "-";
  const nomeCliente = l[19] || l[7] || "-";

  const numeroRepresentante = l[20] || "-";
  const nomeRepresentante = l[21] || "-";

  const rastreio = l[1] || "Não informado";
  const temScroll = grupo.length > 2;

  conteudoDetalhes.innerHTML = `
    <div class="detalhes-centro">
  ${iconeEnvioDetalhes}

  <h3>Detalhes da Nota</h3>

      <div class="linha-dupla">
  <span>
    <strong>${labelNota}:</strong>
    ${notasUnicas.join(" / ")}
  </span>
  <span>
    <strong>${labelPedido}:</strong>
    ${pedidosUnicos.join(" / ")}
  </span>
</div>


      <div class="linha-rastreio-central">
        <strong>Rastreio:</strong>
        <span>${rastreio}</span>
        ${rastreio !== "Não informado"
          ? `<button onclick="rastrearCorreios('${rastreio}')">📦 Rastrear</button>`
          : ""}
      </div>

            ${window.exibirCliente ? `
      <p>
        <strong>Cliente:</strong>
        ${codigoCliente} - ${nomeCliente}
      </p>
    ` : ""}

        ${window.exibirRepresentante ? `
          <p class="linha-representante">
            <strong>Representante:</strong>
            ${numeroRepresentante} - ${nomeRepresentante}
          </p>
        ` : ""}
                ${window.exibirCliente ? `
          <p>
            <strong>Cidade - UF:</strong>
            ${uf} / ${estado}
          </p>
        ` : ""}

        <strong>Situação:</strong>
        <span class="situacao ${
          normalizar(l[25]).includes("AGUARDANDO RETIRADA")
            ? "aguardando-retirada"
            : ""
        }">
          ${l[25]}
        </span>
      </p>


      <div class="linha-dupla">
        <span><strong>Postagem:</strong> ${l[5] || "-"}</span>
        <span><strong>Prazo:</strong> ${l[13] || "-"}</span>
      </div>

      <hr>
      <p>
            <div class="amenv">
            <strong>Amostras Enviadas</strong>
            </div>
          </p>

      <ul class="lista-itens ${temScroll ? "lista-scroll" : ""}">
${[...grupo]
  .sort((a, b) => {
    const p =
      prioridadeDescricao(a[17]) - prioridadeDescricao(b[17]);
    if (p !== 0) return p;

    const da = normalizarTextoOrdenacao(a[15]);
    const db = normalizarTextoOrdenacao(b[15]);
    return da.localeCompare(db, "pt-BR");
  })
 .map(i => `
  <li>${formatarAmostraDetalhe(i)}</li>
`)

  .join("")}

</ul>




    </div>
  `;
    const painel = overlay.querySelector(".painel-detalhes");
  painel.style.animation = "none";
  painel.offsetHeight; // força reflow
  painel.style.animation = "";
  overlay.classList.add("show");
  overlay.classList.remove("oculto");
  travarScroll();
}

function prioridadeDescricao(texto) {
  const t = normalizar(texto || "");

  if (t.includes("PILOTAGEM")) return 1;
  if (t.includes("BANDEIRA")) return 2;
  if (t.includes("CARTELA")) return 3;

  return 99;
}


/* ================= FECHAR ================= */
function fecharDetalhes() {
  const painel = overlay.querySelector(".painel-detalhes");

  // ativa animação de saída
  painel.classList.add("saindo");

  // espera a animação terminar
  setTimeout(() => {
    overlay.classList.remove("show");
    overlay.classList.add("oculto");
    painel.classList.remove("saindo");
    liberarScroll();
  }, 300); // mesmo tempo do CSS
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
  const boxFiltros = document.getElementById("boxFiltros");
  if (boxFiltros) {
    boxFiltros.classList.remove("oculto");
  }


  btnNotificacoes.classList.add("oculto");
  contadorNotificacoes.innerText = "0";

  document.body.classList.remove("tema-luara", "tema-quatrok");
  logoMarca.src = "/Imagens/Logo - Grupo 4k - Branco.png";

  loginBox.classList.remove("oculto");
  codigoVendedor.focus();
  btnAjudaSuporte.classList.remove("oculto");
  document.getElementById("logoMarcaBox").src = "";
  document.body.classList.remove("modo-busca");

  if (btnAnalises) {
  btnAnalises.classList.add("oculto");
}


});

/* ================= AJUDA & SUPORTE ================= */
const menuAjuda = document.getElementById("menuAjuda");
const btnAjuda = document.getElementById("btnAjudaSuporte");
const ajudaChat = document.getElementById("ajudaChat");
const ajudaEmail = document.getElementById("ajudaEmail");




btnAjudaSuporte.addEventListener("click", () => {
  window.open(
    "https://mail.google.com/mail/u/0/?view=cm&fs=1&to=amostra024k@gmail.com&su=Login%20-%20Rastreamento%20de%20Amostras",
    "_blank"
  );
  menuAjuda.classList.add("oculto");
});

/* fecha o menu ao clicar fora */
document.addEventListener("click", () => {
  menuAjuda.classList.add("oculto");
});


