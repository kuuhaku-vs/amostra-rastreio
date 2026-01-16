const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?gid=0&single=true&output=csv";

let dados = [];
let dadosVendedora = [];
let csvCarregado = false;

const codigo = document.getElementById("codigo");
const nota = document.getElementById("filtroNota");
const pedido = document.getElementById("filtroPedido");
const botao = document.getElementById("pesquisar");
const botaoLimpar = document.getElementById("limpar");
const resultado = document.getElementById("resultado");
const contador = document.getElementById("contador");
const textoBtn = botao.querySelector(".texto-btn");
const boasVindas = document.getElementById("boasVindas");

/* MODAL */
const modal = document.getElementById("modalLimpar");
const confirmarLimpar = document.getElementById("confirmarLimpar");
const cancelarLimpar = document.getElementById("cancelarLimpar");

/* SAUDAÇÃO */
function saudacaoPorHorario() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Bom dia";
    if (h >= 12 && h < 18) return "Boa tarde";
    return "Boa noite";
}

/* CARREGA CSV */
botao.disabled = true;
textoBtn.innerText = "Carregando...";

Papa.parse(url, {
    download: true,
    skipEmptyLines: true,
    complete: r => {
        dados = r.data.slice(1);
        csvCarregado = true;
        botao.disabled = false;
        textoBtn.innerText = "Pesquisar";
    }
});

/* BOTÃO LIMPAR */
function atualizarBotaoLimpar() {
    botaoLimpar.disabled = !(
        codigo.value.trim() ||
        nota.value.trim() ||
        pedido.value.trim()
    );
}

/* BUSCA */
function iniciarBusca() {
    botao.classList.add("loading");
    botao.disabled = true;
    textoBtn.innerText = "Buscando...";
}

function finalizarBusca() {
    botao.classList.remove("loading");
    botao.disabled = false;
    textoBtn.innerText = "Pesquisar";
}

/* PESQUISAR */
botao.onclick = () => {
    if (!csvCarregado) return;

    iniciarBusca();
    resultado.innerHTML = "";
    contador.innerText = "";

    const cod = codigo.value.toLowerCase().replace(/\s+/g, "");

    if (!cod) {
        resultado.innerHTML = "<p style='color:white'>Digite o código da vendedora</p>";
        finalizarBusca();
        atualizarBotaoLimpar();
        return;
    }

    // cod vendedor → índice 18
    dadosVendedora = dados.filter(l =>
        l[18]?.toString().toLowerCase().replace(/\s+/g, "") === cod
    );

    if (!dadosVendedora.length) {
        resultado.innerHTML = "<p style='color:white'>Código não encontrado</p>";
        nota.disabled = pedido.disabled = true;
        boasVindas.classList.remove("show");
        boasVindas.innerHTML = "";
        finalizarBusca();
        return;
    }

    // nome vendedor → índice 19
    const nomeVendedora = dadosVendedora[0][19];
    const saudacao = saudacaoPorHorario();

    boasVindas.innerHTML = `
        ${saudacao} <strong>${nomeVendedora}</strong> ✔️<br>
        <span class="status-ok">Código validado. Para rastrear seu pedido, preencha os campos abaixo.</span>
    `;
    boasVindas.classList.add("show");

    nota.disabled = pedido.disabled = false;
    renderizar(dadosVendedora);
};

/* FILTROS */
[nota, pedido].forEach(i => i.oninput = filtrar);

function filtrar() {
    const n = nota.value.trim();
    const p = pedido.value.trim();

    let filtrados = dadosVendedora;

    if (n && !p) {
        filtrados = dadosVendedora.filter(l => l[0].includes(n));
    }

    if (!n && p) {
        filtrados = dadosVendedora.filter(l => l[13].includes(p));
    }

    if (n && p) {
        filtrados = dadosVendedora.filter(l =>
            l[0].includes(n) && l[13].includes(p)
        );
    }

    renderizar(filtrados);
    atualizarBotaoLimpar();
}

/* LIMPAR */
botaoLimpar.onclick = () => modal.classList.add("show");
cancelarLimpar.onclick = () => modal.classList.remove("show");
confirmarLimpar.onclick = limparTudo;

function limparTudo() {
    document.querySelectorAll(".card").forEach(c => c.classList.add("saindo"));

    setTimeout(() => {
        codigo.value = nota.value = pedido.value = "";
        nota.disabled = pedido.disabled = true;
        dadosVendedora = [];
        resultado.innerHTML = "";
        contador.innerText = "";
        modal.classList.remove("show");
        boasVindas.classList.remove("show");
        boasVindas.innerHTML = "";
        atualizarBotaoLimpar();
        codigo.focus();
    }, 250);
}

/* RENDER */
function destacar(texto, termo) {
    if (!termo) return texto;
    return texto.replace(new RegExp(`(${termo})`, "gi"), `<span class="highlight">$1</span>`);
}

function renderizar(lista) {
    resultado.innerHTML = "";
    contador.innerText = `${lista.length} resultado(s) encontrado(s)`;

    if (!lista.length) {
        resultado.innerHTML = "<p style='color:white'>Nenhum resultado encontrado</p>";
        finalizarBusca();
        atualizarBotaoLimpar();
        return;
    }

    lista.forEach(l => {
        resultado.innerHTML += `
        <div class="card">
            <strong>Nota Fiscal:</strong> ${destacar(l[0], nota.value)}<br>
            <strong>Pedido:</strong> ${destacar(l[13], pedido.value)}<br>
            <strong>Rastreio:</strong> ${l[1]}<br>
            <strong>Envio:</strong> ${l[5]}<br>
            <strong>Destinatário:</strong> ${l[7]}<br>
            <strong>Cidade/UF:</strong> ${l[10]} - ${l[11]}<br>
            <strong>Situação:</strong> ${l[20]}<br>
            <strong>Prazo:</strong> ${l[12]}<br>
            <strong>Vendedor:</strong> ${l[19]}
        </div>
        `;
    });

    finalizarBusca();
    atualizarBotaoLimpar();
}

/* ENTER */
[codigo, nota, pedido].forEach(i =>
    i.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            botao.click();
        }
    })
);

atualizarBotaoLimpar();


