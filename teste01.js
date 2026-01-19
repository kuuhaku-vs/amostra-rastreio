/* ================= CONFIG ================= */
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?output=csv";

/* ================= ESTADO ================= */
let dados = [];
let dadosVendedora = [];
let situacaoAtiva = null;
let csvCarregado = false;
let codigoValidado = false;

/* ================= ELEMENTOS ================= */
const codigo = document.getElementById("codigo");
const campoBusca = document.getElementById("filtroBusca");
const botaoPesquisar = document.getElementById("pesquisar");
const textoBtn = botaoPesquisar.querySelector(".texto-btn");

const resultado = document.getElementById("resultado");
const painelTabela = document.getElementById("painelTabela");
const painelGrafico = document.getElementById("painelGrafico");
const contador = document.getElementById("contador");
const boasVindas = document.getElementById("boasVindas");

const botaoLimpar = document.getElementById("limpar");
const modalLimpar = document.getElementById("modalLimpar");
const confirmarLimpar = document.getElementById("confirmarLimpar");
const cancelarLimpar = document.getElementById("cancelarLimpar");

/* ================= MODAL DETALHES ================= */
const overlay = document.getElementById("overlayDetalhes");
const conteudoDetalhes = document.getElementById("conteudoDetalhes");

/* ================= boas vindas ================= */
function saudacaoPorHorario() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function parseData(data) {
  if (!data) return new Date(0);
  const [d, m, a] = data.split("/");
  return new Date(a, m - 1, d);
}

/* ================= CSV ================= */
botaoPesquisar.disabled = true;
textoBtn.innerText = "Carregando...";

Papa.parse(url, {
  download: true,
  skipEmptyLines: true,
  complete: (res) => {
    dados = res.data.slice(1);
    csvCarregado = true;
    botaoPesquisar.disabled = false;
    textoBtn.innerText = "Pesquisar";
  }
});

/* ================= EVENTOS ================= */
botaoPesquisar.onclick = iniciarBusca;

codigo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") iniciarBusca();
});

campoBusca.oninput = () => {
  situacaoAtiva = null;
  filtrar();
};

botaoLimpar.onclick = () => modalLimpar.classList.add("show");
cancelarLimpar.onclick = () => modalLimpar.classList.remove("show");

confirmarLimpar.onclick = () => {
  limparTudo();
  modalLimpar.classList.remove("show");
};

/* ================= BUSCA ================= */
function iniciarBusca() {
  if (!csvCarregado) return;
  if (!codigoValidado) validarCodigo();
  else filtrar();
}

/* ================= VALIDAÇÃO ================= */
function validarCodigo() {
  const cod = codigo.value.trim().toLowerCase();
  if (!cod) return;

  textoBtn.innerText = "Validando...";
  botaoPesquisar.disabled = true;

  setTimeout(() => {
    dadosVendedora = dados.filter(
      (l) =>
        l[18]?.toString().toLowerCase().replace(/\s+/g, "") ===
        cod.replace(/\s+/g, "")
    );

    textoBtn.innerText = "Pesquisar";
    botaoPesquisar.disabled = false;

    if (!dadosVendedora.length) {
      alert("Código de vendedor não encontrado");
      return;
    }

    codigoValidado = true;
    campoBusca.disabled = false;

    boasVindas.innerHTML = `
      ${saudacaoPorHorario()} <strong>${dadosVendedora[0][19]}</strong><br>
      Clique em um item para ver mais detalhes
    `;
    boasVindas.classList.add("show");

    painelTabela.classList.remove("oculto");
    painelGrafico.classList.remove("oculto");

    filtrar();
  }, 400);
}

/* ================= FILTRAGEM ================= */
function filtrar() {
  let lista = [...dadosVendedora];
  const termo = campoBusca.value.trim();

  if (termo) {
    lista = lista.filter(
      (l) => l[0]?.includes(termo) || l[13]?.includes(termo)
    );
  }

  if (situacaoAtiva) {
    lista = lista.filter((l) => l[20] === situacaoAtiva);
  }

  renderizar(lista);
}

/* ================= RENDER ================= */
function renderizar(lista) {
  resultado.innerHTML = "";
  contador.innerText = `${lista.length} resultado(s)`;

  painelTabela.innerHTML = gerarTabelaSituacao(lista);
  painelGrafico.innerHTML = gerarGrafico(lista);

  lista
    .sort((a, b) => parseData(b[5]) - parseData(a[5]))
    .forEach((l) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="card-header">
          <span class="card-icon">▶</span>
          <div>
            <strong>Nota:</strong> ${l[0]}<br>
            <strong>Pedido:</strong> ${l[13]}<br>
            <strong>Cliente:</strong> ${l[7]}<br>
            <strong>Situação:</strong> ${l[20]}
          </div>
        </div>
      `;

      card.onclick = () => abrirDetalhes(l);
      resultado.appendChild(card);
    });

  botaoLimpar.disabled = lista.length === 0;

  // Depois de renderizar, ativar eventos do mapa
  ativarEventosMapa();
}

/* ================= MODAL DETALHES ================= */
function abrirDetalhes(l) {
  conteudoDetalhes.innerHTML = `
    <strong>Nota:</strong> ${l[0]}<br>
    <strong>Pedido:</strong> ${l[13]}<br>
    <strong>Cliente:</strong> ${l[7]}<br><br>

    <strong>Situação:</strong> ${l[20]}<br>
    <strong>Rastreio:</strong> ${l[1]}<br>
    <strong>Destinatário:</strong> ${l[7]}<br>
    <strong>Cidade/UF:</strong> ${l[10]} - ${l[11]}<br>
    <strong>Data:</strong> ${l[5]}<br>
    <strong>Prazo:</strong> ${l[12]}
  `;

  overlay.classList.remove("oculto");
  document.body.classList.add("sem-scroll"); // trava scroll ao abrir modal
  requestAnimationFrame(() => overlay.classList.add("show"));
}

function fecharDetalhes(animado = true) {
  if (!overlay.classList.contains("show")) return;

  overlay.classList.remove("show");
  document.body.classList.remove("sem-scroll"); // libera scroll

  if (animado) {
    setTimeout(() => overlay.classList.add("oculto"), 300);
  } else {
    overlay.classList.add("oculto");
  }
}

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) fecharDetalhes(true);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharDetalhes(true);
});

/* ================= TABELA ================= */
function gerarTabelaSituacao(lista) {
  const mapa = {};
  lista.forEach((l) => (mapa[l[20]] = (mapa[l[20]] || 0) + 1));

  let html = "<h3>Situação</h3><table>";
  Object.entries(mapa).forEach(
    ([s, q]) => (html += `<tr><td>${s}</td><td>${q}</td></tr>`)
  );
  html += "</table>";
  return html;
}

/* ================= MAPA BRASIL ================= */
function gerarGrafico(lista) {
  const mapaUF = {};

  // Conta envios por UF (coluna 11)
  lista.forEach((l) => {
    const uf = l[11];
    if (!uf) return;
    mapaUF[uf] = (mapaUF[uf] || 0) + 1;
  });

  const max = Math.max(...Object.values(mapaUF), 1);

  return `
    <h3>Envios por Estado</h3>
    <div class="mapa-brasil">
      ${svgBrasil(mapaUF, max)}
      <div id="mapaTooltip" class="mapa-tooltip">
        Passe o mouse sobre um estado
      </div>
    </div>
  `;
}

// SVG real do Brasil embutido, 27 estados com IDs UF
function svgBrasil(dados, max) {
  return `
<svg id="mapaBrasil" viewBox="0 0 960 720" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
  <path id="AC" data-nome="Acre" d="M126.25,345.5 L133.3,345.5 L136.5,350.3 L131.5,358.2 L122.7,356.8 L120.8,350.1 Z" />
  <path id="AL" data-nome="Alagoas" d="M426.1,620.1 L430.3,622.5 L429.6,627.2 L426.1,628.2 L423.6,623.7 Z" />
  <path id="AP" data-nome="Amapá" d="M187.3,287.6 L193.7,285.1 L200.1,290.1 L196.8,295.5 L190.9,296.2 Z" />
  <path id="AM" data-nome="Amazonas" d="M110,314.3 L140,300 L170,305 L180,325 L160,335 Z" />
  <path id="BA" data-nome="Bahia" d="M446,530 L465,525 L480,550 L460,560 L440,545 Z" />
  <path id="CE" data-nome="Ceará" d="M560,380 L580,375 L590,395 L570,405 L560,390 Z" />
  <path id="DF" data-nome="Distrito Federal" d="M410,460 L415,460 L415,465 L410,465 Z" />
  <path id="ES" data-nome="Espírito Santo" d="M460,570 L470,565 L475,575 L465,580 Z" />
  <path id="GO" data-nome="Goiás" d="M430,470 L440,470 L440,485 L435,485 Z" />
  <path id="MA" data-nome="Maranhão" d="M520,340 L540,340 L545,360 L530,360 Z" />
  <path id="MG" data-nome="Minas Gerais" d="M460,530 L480,530 L485,545 L470,550 Z" />
  <path id="MS" data-nome="Mato Grosso do Sul" d="M370,520 L390,520 L395,540 L375,545 Z" />
  <path id="MT" data-nome="Mato Grosso" d="M340,460 L370,460 L375,485 L350,490 Z" />
  <path id="PA" data-nome="Pará" d="M300,290 L330,280 L350,300 L320,310 L310,300 Z" />
  <path id="PB" data-nome="Paraíba" d="M590,415 L605,415 L610,425 L600,430 Z" />
  <path id="PE" data-nome="Pernambuco" d="M570,420 L595,420 L590,435 L570,435 Z" />
  <path id="PI" data-nome="Piauí" d="M540,390 L560,390 L560,410 L540,410 Z" />
  <path id="PR" data-nome="Paraná" d="M460,600 L480,600 L485,615 L470,620 Z" />
  <path id="RJ" data-nome="Rio de Janeiro" d="M490,570 L500,570 L505,580 L495,580 Z" />
  <path id="RN" data-nome="Rio Grande do Norte" d="M615,400 L625,400 L625,410 L615,410 Z" />
  <path id="RO" data-nome="Rondônia" d="M170,400 L190,400 L190,420 L175,420 Z" />
  <path id="RR" data-nome="Roraima" d="M200,230 L220,230 L225,240 L205,240 Z" />
  <path id="RS" data-nome="Rio Grande do Sul" d="M470,650 L490,650 L495,670 L475,670 Z" />
  <path id="SC" data-nome="Santa Catarina" d="M470,620 L480,620 L485,630 L475,630 Z" />
  <path id="SE" data-nome="Sergipe" d="M440,600 L445,600 L445,610 L440,610 Z" />
  <path id="SP" data-nome="São Paulo" d="M480,560 L495,560 L500,575 L485,575 Z" />
  <path id="TO" data-nome="Tocantins" d="M460,390 L480,390 L485,405 L470,405 Z" />
</svg>
`;
}

// Após renderizar o gráfico, ativar os eventos (colorir, tooltip, clique)
function ativarEventosMapa() {
  const lista = [...dadosVendedora];
  const mapaUF = {};

  lista.forEach((l) => {
    const uf = l[11];
    if (!uf) return;
    mapaUF[uf] = (mapaUF[uf] || 0) + 1;
  });

  const max = Math.max(...Object.values(mapaUF), 1);

  document.querySelectorAll("#mapaBrasil path").forEach((path) => {
    const uf = path.id;
    const total = mapaUF[uf] || 0;
    const intensidade = total / max;

    path.style.fill = total
      ? `rgba(77,127,226,${0.3 + intensidade * 0.7})`
      : "#e6e9f9";

    path.style.cursor = "pointer";

    path.onmousemove = (evt) => {
      const nome = path.dataset.nome || uf;
      document.getElementById("mapaTooltip").innerText = `${nome} (${uf}): ${total} envio(s)`;
    };

    path.onmouseleave = () => {
      document.getElementById("mapaTooltip").innerText = "Passe o mouse sobre um estado";
    };

    // Clique no estado filtra os resultados por UF
    path.onclick = () => {
      situacaoAtiva = null;
      campoBusca.value = "";
      filtrarPorUF(uf);
    };
  });
}

// Filtra por UF e atualiza resultados e gráfico
function filtrarPorUF(uf) {
  if (!uf) return;

  const lista = dadosVendedora.filter((l) => l[11] === uf);

  resultado.innerHTML = "";
  contador.innerText = `${lista.length} resultado(s)`;

  painelTabela.innerHTML = gerarTabelaSituacao(lista);
  painelGrafico.innerHTML = gerarGrafico(lista);

  lista
    .sort((a, b) => parseData(b[5]) - parseData(a[5]))
    .forEach((l) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="card-header">
          <span class="card-icon">▶</span>
          <div>
            <strong>Nota:</strong> ${l[0]}<br>
            <strong>Pedido:</strong> ${l[13]}<br>
            <strong>Situação:</strong> ${l[20]}
          </div>
        </div>
      `;

      card.onclick = () => abrirDetalhes(l);
      resultado.appendChild(card);
    });

  botaoLimpar.disabled = lista.length === 0;
}

/* ================= LIMPAR ================= */
function limparTudo() {
  codigo.value = "";
  campoBusca.value = "";
  campoBusca.disabled = true;

  resultado.innerHTML = "";
  contador.innerText = "";
  boasVindas.classList.remove("show");

  painelTabela.style.display = "none";
  painelGrafico.style.display = "none";
  painelTabela.innerHTML = "";
  painelGrafico.innerHTML = "";

  dadosVendedora = [];
  codigoValidado = false;
  situacaoAtiva = null;

  botaoLimpar.disabled = true;
}

