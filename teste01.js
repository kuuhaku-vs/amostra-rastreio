
/* ================= CONFIG ================= */
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?gid=0&single=true&output=csv";

/* ================= ESTADO ================= */
let dados = [];
let dadosVendedora = [];
let csvCarregado = false;
let situacaoSelecionada = null;
let notificacoesLidas = new Set();
let tipoFiltro = "nota";


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
const btnNotificacoes = document.getElementById("btnNotificacoes");
const contadorNotificacoes = document.getElementById("contadorNotificacoes");
const overlayNotificacoes = document.getElementById("overlayNotificacoes");
const listaNotificacoes = document.getElementById("listaNotificacoes");
const selectTipoFiltro = document.getElementById("tipoFiltro");

const btnAjudaSuporte = document.getElementById("btnAjudaSuporte");


const placeholders = {
  nota: "Busca p. Nota Fiscal",
  pedido: "Busca p. Pedido",
  cliente: "Busca p. Cód Cliente",
  representante: "Busca p. Cód Representante"
};

selectTipoFiltro.addEventListener("change", () => {
  tipoFiltro = selectTipoFiltro.value;

  campoBusca.placeholder =
    placeholders[tipoFiltro] || "Buscar…";

  campoBusca.value = "";
  campoBusca.focus();

  filtrar();
});

/* ================= UTIL ================= */
function saudacaoPorHorario() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia,";
  if (h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function normalizarTextoOrdenacao(txt) {
  if (!txt) return "";

  // remove tudo até o terceiro hífen
  // exemplo: "1 - Pilotagem - PUNHO AP INFINITY BCO 1Q"
  // vira: "PUNHO AP INFINITY BCO 1Q"
  const descricao = txt.replace(/^.*?-\s*.*?-\s*/, "");

  return descricao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
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
  btnAjudaSuporte.classList.add("oculto");


  document.getElementById("boxFiltros").classList.remove("oculto");
  campoBusca.disabled = false;
  campoBusca.placeholder = placeholders[tipoFiltro];


  boasVindas.innerHTML = `
    ${saudacaoPorHorario()} <strong>${dadosVendedora[0][23]}</strong><br>
    Abaixo, envios realizados nos últimos 6 meses.
  `;

  painelGrafico.classList.remove("oculto");
  resultado.classList.remove("oculto");

  /* ================= TEMA + LOGO ================= */
  const marca = normalizar(dadosVendedora[0][24]);

  document.body.classList.remove("tema-luara", "tema-quatrok");

  const logoMarcaBox = document.getElementById("logoMarcaBox");

  if (marca === "LUARA") {
    document.body.classList.add("tema-luara");
    logoMarca.src = "luara branco.png";
    logoMarcaBox.src = "luara branco.png";
  } else {
    document.body.classList.add("tema-quatrok");
    logoMarca.src = "4k BRANCO.png";
    logoMarcaBox.src = "4k BRANCO.png";
  }

  atualizarNotificacoes();
  btnNotificacoes.classList.remove("oculto");

  filtrar();
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
    lista = lista.filter(l => {
      switch (tipoFiltro) {
        case "nota":
          return l[0]?.includes(termo);

        case "pedido":
          return l[14]?.includes(termo);

        case "cliente":
          return l[18]?.includes(termo);

        case "representante":
          return l[20]?.includes(termo);

        default:
          return false;
      }
    });
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

    const situacao = normalizar(l[25]);

    let classeStatus = "outro";
    let classeAlerta = "";

    if (
      situacao.includes("REMETENTE") ||
      situacao.includes("RETORN") ||
      situacao.includes("DEVOL")
    ) {
      classeStatus = "retornado"; // 🔴 vermelho
    }
    else if (situacao.includes("PENDENTE")) {
      classeStatus = "pendente"; // 🟡 amarelo
    }
    else if (situacao.includes("ENTREGUE")) {
      classeStatus = "entregue"; // 🟢 verde
    }


    /* ⚠️ ALERTA DE RETIRADA */
    if (situacao.includes("AGUARDANDO RETIRADA")) {
      classeAlerta = "alerta-retirada";
    }

    card.className = `card ${classeStatus} ${classeAlerta}`;


    card.onclick = () => abrirDetalhes(grupo);

    
    const tipoEnvio = normalizar(l[2]); // PAC ou SEDEX

    let logoEnvio = `<strong>${tipoEnvio || "ENVIO"}</strong>`;

    if (tipoEnvio === "PAC") {
      logoEnvio = `<img src="pac.png" alt="PAC" class="logo-envio">`;
    } else if (tipoEnvio === "SEDEX") {
      logoEnvio = `<img src="sedex.png" alt="SEDEX" class="logo-envio">`;
    }

    card.innerHTML = `
  <div class="card-topo">
    ${logoEnvio}
  </div>
  <div class="linha-info">
    <strong>Nota Fiscal:</strong> ${l[0]}
    <span class="separador">|</span>
    <strong>Pedido:</strong> ${l[14]}
  </div>
  <div class="card-divisor"></div>

  

  <div class="linha-info"><strong>Cliente:</strong> ${l[7]}</div>
  <div class="linha-info"><strong>Situação:</strong> ${l[25]}</div>
  <div class="linha-info"><strong>Itens:</strong> ${grupo.length}</div>
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

  function filtrar() {
    let lista = [...dadosVendedora];
    const termo = campoBusca.value.trim();

    // 🔍 filtro texto
    if (termo) {
      lista = lista.filter(l => {
        switch (tipoFiltro) {
          case "nota":
            return l[0]?.includes(termo);
          case "pedido":
            return l[14]?.includes(termo);
          case "cliente":
            return l[18]?.includes(termo);
          case "representante":
            return l[20]?.includes(termo);
          default:
            return false;
        }
      });
    }

    // 📊 filtro do gráfico (AQUI ESTAVA FALTANDO)
    if (situacaoSelecionada) {
      lista = lista.filter(
        l => normalizar(l[26]) === normalizar(situacaoSelecionada)
      );
    }

    renderizar(lista);
  }

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

  ${situacaoSelecionada
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
  const l = grupo[0];
  const rastreio = l[1] || "Não informado";
  // 🔔 ALERTA DE RETIRADA (DETALHES)
  const situacao = normalizar(l[25]);
  const painelDetalhes = document.querySelector(".painel-detalhes");

  // limpa estado anterior
  painelDetalhes.classList.remove("alerta-retirada");

  // aplica alerta se necessário
  if (situacao.includes("AGUARDANDO RETIRADA")) {
    painelDetalhes.classList.add("alerta-retirada");
  }

  const temScroll = grupo.length > 10;
  const codigoLoginVendedor = normalizar(codigoVendedor.value);
  const mostrarRepresentante = codigoLoginVendedor.startsWith("V");

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
      <span><strong>Cliente:</strong> ${l[18]}<span>
      <span><strong>-</strong> ${l[7]}</span>
      ${mostrarRepresentante ? `
      <p>
      <span><strong>Representante:</strong> ${l[20]}</span>
      <span><strong> - </strong>${l[21]}</span>
      </p>
      ` : ""}
      <p></p>
      <span><strong>Cidade:</strong> ${l[11]}<span>
      <span><strong>-</strong> ${l[12]}</span>
      <p><strong>Situação:</strong> ${l[25]}</p>

      <div class="linha-dupla">
        <span><strong>Postagem:</strong> ${l[5] || "-"}</span>
        <span><strong>Prazo:</strong> ${l[13] || "-"}</span>
      </div>

      <hr>

      <ul class="lista-itens ${temScroll ? "lista-scroll" : ""}">
  ${[...grupo]
      .sort((a, b) => {
        const da = normalizarTextoOrdenacao(a[15]);
        const db = normalizarTextoOrdenacao(b[15]);
        return da.localeCompare(db, "pt-BR");
      })
      .map(i => `
      <li>${i[16]} - ${i[17]} - ${i[15]}</li>
    `)
      .join("")}
</ul>




    </div>
  `;
  

  function fecharNotificacoes() {
    overlayNotificacoes.classList.remove("show");
    overlayNotificacoes.classList.add("oculto");
    liberarScroll();
  }

  overlay.classList.add("show");
  overlay.classList.remove("oculto");
  travarScroll();
}

/* ================= FECHAR ================= */
function fecharDetalhes() {
  overlay.classList.remove("show");
  overlay.classList.add("oculto");

  // limpa alerta do painel de detalhes
  const painelDetalhes = document.querySelector(".painel-detalhes");
  painelDetalhes.classList.remove("alerta-retirada");

  liberarScroll();
}

function fecharNotificacoes() {
  overlayNotificacoes.classList.remove("show");
  overlayNotificacoes.classList.add("oculto");
  liberarScroll();
}


overlay.addEventListener("click", e => {
  if (e.target === overlay) fecharDetalhes();
});
overlayNotificacoes.addEventListener("click", e => {
  if (e.target === overlayNotificacoes) {
    fecharNotificacoes();
  }
});
document.addEventListener("keydown", e => {
  if (
    e.key === "Escape" &&
    overlayNotificacoes.classList.contains("show")
  ) {
    fecharNotificacoes();
  }
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
  btnAjudaSuporte.classList.remove("oculto");
  document.getElementById("logoMarcaBox").src = "";
  document.body.classList.remove("modo-busca");
  btnNotificacoes.classList.add("oculto");
  contadorNotificacoes.innerText = "0";
  listaNotificacoes.innerHTML = "";


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

btnNotificacoes.addEventListener("click", (e) => {
  e.stopPropagation();

  overlayNotificacoes.classList.add("show");
  overlayNotificacoes.classList.remove("oculto");
  travarScroll();

});


/* Notificações */
function atualizarNotificacoes() {
  const pendentes = {};

  dadosVendedora.forEach(l => {
    if (
      normalizar(l[26]) ===
      normalizar("⚠️ Pendente")
    ) {
      if (!pendentes[l[0]]) pendentes[l[0]] = [];
      pendentes[l[0]].push(l);
    }
  });

  const grupos = Object.values(pendentes);

  contadorNotificacoes.innerText = grupos.length;
  btnNotificacoes.classList.toggle("oculto", grupos.length === 0);

  listaNotificacoes.innerHTML = "";

  if (!grupos.length) {
    listaNotificacoes.innerHTML =
      "<p style='text-align:center'>Nenhuma notificação no momento.</p>";
    return;
  }

  grupos.forEach(grupo => {
    const l = grupo[0];
    const situacao = normalizar(l[25]);

    const div = document.createElement("div");

    // 🔔 alerta de retirada nas notificações
    let classeAlerta = "";
    if (situacao.includes("AGUARDANDO RETIRADA")) {
      classeAlerta = "alerta-retirada";
    }

    div.className = `notificacao-item ${classeAlerta}`;

    div.innerHTML = `
    <strong>Nota:</strong> ${l[0]}<br>
    <strong>Cliente:</strong> ${l[7]}<br>
    <strong>Situação:</strong> ${l[25]}
  `;

    div.onclick = () => {
      fecharNotificacoes();
      abrirDetalhes(grupo);
    };

    listaNotificacoes.appendChild(div);
  });

}


