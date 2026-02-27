const url =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?gid=0&single=true&output=csv";

const tabela = document.getElementById("listaAnalises");

let dadosGlobais = [];
let scrollPosition = 0;

// 🔥 Define automaticamente a data fim como hoje
document.addEventListener("DOMContentLoaded", () => {

    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const hojeFormatado = `${ano}-${mes}-${dia}`;

    document.getElementById("dataFim").value = hojeFormatado;

});

Papa.parse(url, {
    download: true,
    skipEmptyLines: true,
    complete: res => {
        dadosGlobais = res.data.slice(1);
        renderizarTabela(dadosGlobais);
    }
});

function renderizarTabela(dados) {

    tabela.innerHTML = "";

    let totalRastreios = 0;
    let totalValorGeral = 0;

    const grupos = {};

    dados.forEach(l => {
        const rastreio = l[1];
        if (!rastreio) return;

        if (!grupos[rastreio]) grupos[rastreio] = [];
        grupos[rastreio].push(l);
    });

    Object.values(grupos).forEach(grupo => {

        totalRastreios++;

        const l = grupo[0];

        const rastreio = l[1];
        const cliente = `${l[18]} - ${l[19]}`;
        const representante = `${l[20]} - ${l[21]}`;
        const vendedor = `${l[22]} - ${l[23]}`;

        // 🔵 LOCALIZAÇÃO FORMATADA CIDADE - UF
        const cidade = (l[11] || "").toUpperCase();
        const uf = (l[12] || "").toUpperCase();
        const localizacao = cidade && uf ? `${cidade} - ${uf}` : "";

       const valorUnitario = parseFloat((l[6] || "0").replace(",", ".")) || 0;

totalValorGeral += valorUnitario;


        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input type="checkbox" class="check-item" data-rastreio="${rastreio}"></td>
            <td>${rastreio}</td>
            <td>${cliente}</td>
            <td>${representante}</td>
            <td>${vendedor}</td>
            <td>R$ ${valorUnitario.toFixed(2)}</td>
            <td class="btn-detalhes">🔎</td>
        `;

        // 🔵 OBJETO COMPLETO DE DADOS
        const dadosDetalhes = {
            nota: l[0],
            pedido: l[14],
            cliente: cliente,
            representante: representante,
            vendedor: vendedor,
            localizacao: localizacao,
            situacao: l[26] || "",
            postagem: l[27] || "",
            prazo: l[13] || "",
            valor: valorUnitario.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
}),
           amostras: grupo.map(g => {

    const codigo = g[17] || "";
    const descricao = g[15] || "";
    const quantidade = parseInt(g[16]) || 1;

    return `${quantidade} ${codigo} - ${descricao}`;

})
        };

        // 🔵 EVENT LISTENER PROFISSIONAL
        tr.querySelector(".btn-detalhes").addEventListener("click", () => {
            abrirDetalhes(dadosDetalhes);
        });

        tabela.appendChild(tr);
    });

    document.getElementById("totalRastreios").innerText = totalRastreios;

    document.getElementById("totalValor").innerText =
        totalValorGeral.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
}

function filtrarPorData() {

    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    if (!dataInicio || !dataFim) {
        renderizarTabela(dadosGlobais);
        return;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    inicio.setHours(0,0,0,0);
    fim.setHours(23,59,59,999);

    const filtrados = dadosGlobais.filter(l => {
        const dataPedido = converterDataBR(l[5]);
        if (!dataPedido) return false;

        return dataPedido >= inicio && dataPedido <= fim;
    });

    renderizarTabela(filtrados);
}

function converterDataBR(dataBR) {
    if (!dataBR) return null;

    const [dia, mes, ano] = dataBR.split("/");
    return new Date(ano, mes - 1, dia);
}

function converterValorBR(valor) {
    if (!valor) return 0;

    return parseFloat(
        valor
            .toString()
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    ) || 0;
}

function abrirDetalhes(dados) {

    document.getElementById("detNota").innerText = dados.nota || "";
    document.getElementById("detPedido").innerText = dados.pedido || "";
    document.getElementById("detCliente").innerText = dados.cliente || "";
    document.getElementById("detRepresentante").innerText = dados.representante || "";
    document.getElementById("detLocalizacao").innerText = dados.localizacao || "";
    document.getElementById("detSituacao").innerText = dados.situacao || "";
    document.getElementById("detPostagem").innerText = dados.postagem || "";
    document.getElementById("detPrazo").innerText = dados.prazo || "";

    const lista = document.getElementById("detAmostras");
    lista.innerHTML = "";

    if (dados.amostras && dados.amostras.length > 0) {
        dados.amostras.forEach(item => {
            const li = document.createElement("li");
            li.innerText = item;
            lista.appendChild(li);
        });
    }

    const modal = document.getElementById("modalDetalhes");

    // 🔒 Salva posição do scroll
    scrollPosition = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = "100%";

    modal.classList.add("ativo");
}

function fecharModal() {

    const modal = document.getElementById("modalDetalhes");

    modal.classList.remove("ativo");

    // 🔓 Restaura scroll original
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";

    window.scrollTo(0, scrollPosition);
}
const modal = document.getElementById("modalDetalhes");

modal.addEventListener("click", function(e) {

    // Se clicar no fundo (overlay) fecha
    if (e.target === modal) {
        fecharModal();
    }

});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        const modal = document.getElementById("modalDetalhes");
        if (modal.classList.contains("ativo")) {
            fecharModal();
        }
    }
});

let logoBase64 = null;

function carregarLogo() {
    return new Promise((resolve, reject) => {

        if (logoBase64) {
            resolve();
            return;
        }

        const img = new Image();
        img.src = "/Imagens/4k BRANCO.png"; // 🔥 coloque aqui o caminho real da sua logo

        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            logoBase64 = canvas.toDataURL("image/png");
            resolve();
        };

        img.onerror = reject;
    });
}

async function gerarPDFSelecionados() {

    await carregarLogo(); // 🔥 garante que a logo carregou

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4");

    const checkboxes = document.querySelectorAll(".check-item:checked");

    if (checkboxes.length === 0) {
        alert("Selecione pelo menos um item.");
        return;
    }

    let totalGeral = 0;
    const corpoTabela = [];

    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    let baseDados = dadosGlobais;

    if (dataInicio && dataFim) {

        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        inicio.setHours(0,0,0,0);
        fim.setHours(23,59,59,999);

        baseDados = dadosGlobais.filter(l => {
            const dataPedido = converterDataBR(l[5]);
            if (!dataPedido) return false;
            return dataPedido >= inicio && dataPedido <= fim;
        });
    }

    checkboxes.forEach((checkbox) => {

        const rastreioSelecionado = checkbox.dataset.rastreio;

        const grupo = baseDados.filter(l => l[1] === rastreioSelecionado);
        if (grupo.length === 0) return;

        const l = grupo[0];

        const rastreio = l[1] || "";
        const tipoEnvio = l[2] || "";
        const nota = l[0] || "";
        const pedido = l[14] || "";

        const cliente = `${l[18] || ""} - ${l[19] || ""}`;
        const representante = `${l[20] || ""} - ${l[21] || ""}`;
        const vendedor = `${l[22] || ""} - ${l[23] || ""}`;

let descricaoCompleta = "";
let resumoItens = {};
let totalRastreio = converterValorBR(l[6]);

grupo.forEach(g => {

    const descricaoOriginal = (g[17] || "").toUpperCase();
    const quantidade = parseInt(g[16]) || 1;

    // 🔎 Extrai apenas o tipo principal (primeira palavra)
    let tipo = descricaoOriginal.split(" ")[0];

    // 🔥 Padroniza manualmente casos importantes
    if (descricaoOriginal.includes("BANDEIRA")) tipo = "BANDEIRA";
    if (descricaoOriginal.includes("PILOTAGEM")) tipo = "PILOTAGEM";
    if (descricaoOriginal.includes("CARTELA")) tipo = "CARTELA";

    if (!resumoItens[tipo]) {
        resumoItens[tipo] = 0;
    }

    resumoItens[tipo] += quantidade;
});

// 🔥 Monta descrição final consolidada
descricaoCompleta = Object.entries(resumoItens)
    .map(([tipo, qtd]) => `${qtd} ${tipo}`)
    .join("\n");

// 🔥 Monta descrição final agrupada

        totalGeral += totalRastreio;

        corpoTabela.push([
            rastreio,
            tipoEnvio,
            nota,
            pedido,
            cliente,
            representante,
            vendedor,
            descricaoCompleta.trim(),
            totalRastreio.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            })
        ]);
    });

    // 🔥 AGORA SIM GERA A TABELA

    // ===== HEADER AZUL PADRÃO EMPRESA =====

// Faixa azul
doc.setFillColor(19, 51, 102); // Azul corporativo (ajuste se necessário)
doc.rect(0, 0, 297, 25, "F"); // largura A4 paisagem = 297mm

// Logo 4K (texto estilizado)
doc.addImage(logoBase64, "PNG", 10, 4, 20, 15);
doc.setTextColor(255, 255, 255);

// Título
doc.setFontSize(14);
doc.setFont(undefined, "normal");
doc.text("RELATÓRIO DE ENVIO DE AMOSTRAS", 35, 15);

// Subtítulo período
doc.setFontSize(8);
doc.text(
    `Período: ${dataInicio || "Todos os registros"} ${
        dataFim ? "até " + dataFim : ""
    }`,
    35,
    20
);

// Reset cor do texto
doc.setTextColor(0, 0, 0);

    doc.autoTable({
    startY: 35,

    head: [[
        "Rastreio",
        "Tipo Envio",
        "NF",
        "Pedido",
        "Cliente",
        "Representante",
        "Vendedor",
        "Descrição",
        "Valor"
    ]],

    body: corpoTabela,


    styles: {
        fontSize: 7,
        halign: "center",
        valign: "middle"
    },
    
    headStyles: {
        fillColor: [220, 226, 238],
        textColor: 0,
        fontStyle: "bold",
        halign: "center",
        overflow: "visible"
    },

columnStyles: {
    0: { cellWidth: 25, overflow: "hidden" },
    1: { cellWidth: 15, overflow: "hidden" },
    2: { cellWidth: 15, overflow: "hidden" },
    3: { cellWidth: 15, overflow: "hidden" },
    4: { cellWidth: 55, overflow: "hidden" },
    5: { cellWidth: 55, overflow: "hidden" },
    6: { cellWidth: 40, overflow: "hidden" },

    // 🔥 SOMENTE DESCRIÇÃO quebra linha
    7: { cellWidth: 35, overflow: "linebreak", valign: "top" },

    8: { cellWidth: 20, overflow: "hidden" }
},

    theme: "grid",
    margin: { left: 10, right: 10 }
});

const totalPages = doc.internal.getNumberOfPages();

for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
        `Página ${i} de ${totalPages}`,
        270,
        200,
        { align: "right" }
    );
}

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(
        `TOTAL GERAL: ${totalGeral.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })}`,
        14,
        finalY
    );

    doc.save("Relatorio_Envio_Amostras_4K.pdf");
}

let ordemCrescente = true;

function selecionarTodosFiltrados(masterCheckbox) {

    const linhas = document.querySelectorAll("#listaAnalises tr");

    linhas.forEach(linha => {
        if (linha.style.display !== "none") {
            const checkbox = linha.querySelector("input[type='checkbox']");
            if (checkbox) {
                checkbox.checked = masterCheckbox.checked;
            }
        }
    });
}

function ordenarPorValor() {

    const tbody = document.getElementById("listaAnalises");
    const linhas = Array.from(tbody.querySelectorAll("tr"));

    linhas.sort((a, b) => {

        const valorA = extrairValor(a);
        const valorB = extrairValor(b);

        return ordemCrescente ? valorA - valorB : valorB - valorA;
    });

    ordemCrescente = !ordemCrescente;

    linhas.forEach(linha => tbody.appendChild(linha));
}

function extrairValor(linha) {

    const colunaValor = linha.children[5];

    if (!colunaValor) return 0;

    return parseFloat(
        colunaValor.innerText
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    ) || 0;
}

function aplicarFiltroValor() {

    const somenteAcima100 = document.getElementById("filtro100").checked;

    let base = dadosGlobais;

    // 🔵 Primeiro aplica filtro de data se existir
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        inicio.setHours(0,0,0,0);
        fim.setHours(23,59,59,999);

        base = base.filter(l => {
            const dataPedido = converterDataBR(l[5]);
            if (!dataPedido) return false;
            return dataPedido >= inicio && dataPedido <= fim;
        });
    }

    // 🔵 Depois aplica filtro de valor
    if (somenteAcima100) {
        base = base.filter(l => converterValorBR(l[6]) > 100);
    }

    renderizarTabela(base);
}