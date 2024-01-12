let selecoes = new Set()
let tabelas = {}
let relacoes = []
let nodes = []
let edges = []
let clausulaSQL = ""

fetch(
  "https://raw.githubusercontent.com/vitorgt/TOTVS-RM-SQL/main/dados/tabelas.json",
)
  .then((resposta) => resposta.json())
  .then((dados) => {
    lerJSONTabelas(dados)
  })
  .catch((erro) => {
    notificar("Não foi possível carregar os dados das tabelas.")
    console.error("Erro ao carregar os dados das tabelas:", erro)
  })

fetch(
  "https://raw.githubusercontent.com/vitorgt/TOTVS-RM-SQL/main/dados/relacoes.json",
)
  .then((resposta) => resposta.json())
  .then((dados) => {
    lerJSONRelacoes(dados)
  })
  .catch((erro) => {
    notificar("Não foi possível carregar os dados das relações.")
    console.error("Erro ao carregar os dados das relacoes:", erro)
  })

if (document.readyState == "complete") {
  DOMpronto()
} else {
  document.addEventListener("DOMContentLoaded", DOMpronto)
}

function DOMpronto() {
  document
    .getElementById("in-busca-tabela")
    .addEventListener("input", atualizarListaTabelas)
  document
    .getElementById("btn-limpar-selecao")
    .addEventListener("click", limparSelecao)

  document.getElementById("btn-sql-copiar").addEventListener("click", copiarSQL)
  document.getElementById("btn-sql-baixar").addEventListener("click", baixarSQL)

  document
    .getElementById("in-descricoes-select")
    .addEventListener("change", atualizarSQL)
  document
    .getElementById("in-descricoes-join")
    .addEventListener("change", atualizarSQL)
  document
    .getElementById("in-colunas-modificacao")
    .addEventListener("change", atualizarSQL)
  document
    .getElementById("frm-tipo-join")
    .addEventListener("change", atualizarSQL)

  window.onscroll = exibirOcultarBtnVoltar
  document.getElementById("btn-voltar-topo").onclick = voltarAoTopo

  configurarTema()
  document
    .getElementById("btn-alternar-tema")
    .addEventListener("click", alternarTema)

  // document.getElementById("btn-disconexas").addEventListener("click", () => {
  //   document.getElementById("disconexas").classList.toggle("on")
  //   this.classList.toggle("on")
  // })

  Prism.languages.insertBefore("sql", "keyword", {
    table: {
      pattern: /\b(?:from|join)\s+\w+\b/i,
      inside: {
        keyword: Prism.languages.sql.keyword,
      },
      greedy: true,
    },
    column: {
      pattern: /\b\w+\.\w+\b/,
      inside: {
        punctuation: Prism.languages.sql.punctuation,
      },
      greedy: true,
    },
  })
}

function notificar(texto, cor = "red", duracao_segundos = 4) {
  const notificacao = document.getElementById("not-sql-copia")
  notificacao.textContent = texto
  // Se tem a cor declarada como var no CSS, usar ela, senao usar o parametro
  const cor_ = getComputedStyle(document.documentElement).getPropertyValue(cor)
  notificacao.style.backgroundColor = cor_ ? cor_ : cor

  const coresClaras = new Set(["orange", "yellow", "mint", "cyan"])
  const coresEscuras = new Set(["green", "blue", "indigo"])
  if (coresClaras.has(cor)) notificacao.style.color = "black"
  else if (coresEscuras.has(cor)) notificacao.style.color = "white"
  else
    notificacao.style.color = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("text-color")

  // Mostrar notificação
  notificacao.style.display = "block"
  // Ocultar notificação após X segundos
  setTimeout(() => {
    notificacao.style.display = "none"
  }, duracao_segundos * 1000)
}

function copiarSQL() {
  if (!clausulaSQL || !clausulaSQL.trim()) {
    notificar("Consulta vazia. Por favor, selecione uma tabela.", "yellow")
    return
  }
  navigator.clipboard
    .writeText(clausulaSQL)
    .then(() => {
      notificar("Consulta SQL copiada com sucesso!", "mint", 3)
    })
    .catch((erro) => {
      notificar("Não foi possível copiar a Consulta SQL.")
      console.error("Erro ao copiar SQL:", erro)
    })
}

function baixarSQL() {
  if (!clausulaSQL || !clausulaSQL.trim()) {
    notificar("Consulta vazia. Por favor, selecione uma tabela.", "yellow")
    return
  }
  try {
    const binario = new Blob([clausulaSQL], { type: "text/sql" })
    const url = URL.createObjectURL(binario)
    let agora = new Date()
    agora.setTime(agora.getTime() - agora.getTimezoneOffset() * 60 * 1000)
    agora = agora.toISOString().replace(/:|T/g, "-").substring(0, 19)
    const a = document.createElement("a")
    a.href = url
    const nome = Array.from(selecoes)[0] ? Array.from(selecoes)[0] : "TOTVS-RM"
    a.download = nome + "-" + agora + ".sql"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (erro) {
    notificar("Não foi possível baixar a Consulta SQL.")
    console.error("Erro ao baixar SQL:", erro)
  }
}

function limparSelecao() {
  // Desmarcar todas as caixas de seleção
  document
    .querySelectorAll('#lst-tabelas input[type="checkbox"]')
    .forEach((checkbox) => (checkbox.checked = false))
  selecoes.clear()
  atualizarGrafo()
  atualizarConsultaSQL()
}

function exibirOcultarBtnVoltar() {
  const btnVoltarTopo = document.getElementById("btn-voltar-topo")
  if (
    btnVoltarTopo &&
    (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200)
  ) {
    btnVoltarTopo.style.display = "block"
  } else {
    btnVoltarTopo.style.display = "none"
  }
}

function voltarAoTopo() {
  document.body.scrollTop = 0 // Para Safari
  document.documentElement.scrollTop = 0 // Para Chrome, Firefox, IE e Opera
}

function configurarTema() {
  let temaSalvo = localStorage.getItem("tema")
  if (!temaSalvo) {
    temaSalvo = "dark"
    localStorage.setItem("tema", temaSalvo)
  }
  document.documentElement.setAttribute("data-theme", temaSalvo)
  document.getElementById("btn-alternar-tema").textContent =
    temaSalvo === "light" ? "🌙" : "☀️"
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme")
  const novo = atual === "light" ? "dark" : "light"
  localStorage.setItem("tema", novo)
  document.documentElement.setAttribute("data-theme", novo)
  this.textContent = novo === "light" ? "🌙" : "☀️"
}

function atualizarListaTabelas() {
  if (!tabelas) return

  const filtro = document.getElementById("in-busca-tabela").value || ""
  const lstTabelas = document.getElementById("lst-tabelas")
  lstTabelas.innerHTML = "" // Limpa a lista atual

  const tabelas_ids_filtrados = Object.keys(tabelas || {}).filter((tabela) =>
    (tabela + " " + tabelas[tabela]["#"])
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(filtro.toLowerCase()),
  )

  tabelas_ids_filtrados.forEach((tabela) => {
    const itemLista = document.createElement("li")
    const checkbox = document.createElement("input")
    const label = document.createElement("label")

    checkbox.type = "checkbox"
    checkbox.id = tabela
    checkbox.value = tabela
    checkbox.checked = selecoes.has(tabela)
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selecoes.add(tabela)
      else selecoes.delete(tabela)
      atualizarGrafo()
      atualizarSQL()
    })

    label.htmlFor = tabela
    label.textContent = tabela + ": " + (tabelas[tabela]["#"] || "")

    itemLista.appendChild(checkbox)
    itemLista.appendChild(label)
    lstTabelas.appendChild(itemLista)
  })
}

function lerJSONTabelas(dados) {
  tabelas = dados
  atualizarListaTabelas()
  Object.keys(tabelas).forEach((tabela) => {
    nodes.push({
      id: tabela,
      label: tabela,
      title: tabela,
      group: tabela.substring(0, 2) == "SZ" ? "SZ" : tabela.substring(0, 1),
    })
  })
}

function lerJSONRelacoes(dados) {
  relacoes = dados
  relacoes.forEach((relacao) => {
    edges.push({
      from: relacao[0],
      source: relacao[0],
      to: relacao[1],
      target: relacao[1],
    })
  })
}

function atualizarGrafo() {
  const nosFiltrados = nodes.filter((node) => selecoes.has(node.id))
  const idsNosFiltrados = new Set(nosFiltrados.map((node) => node.id))
  const arestasFiltradas = edges.filter(
    (edge) => idsNosFiltrados.has(edge.from) && idsNosFiltrados.has(edge.to),
  )

  const grafo = document.getElementById("grafo")
  const dados = {
    nodes: new vis.DataSet(nosFiltrados),
    edges: new vis.DataSet(arestasFiltradas),
  }
  return new vis.Network(grafo, dados, {})
}

function comporSelect(selecionadas, descricoes = true) {
  if (!selecionadas || selecionadas.length == 0) return ""

  const incluirCol = document.getElementById("in-colunas-modificacao").checked

  // Descobre o maior comprimento dos nomes das tabelas selecionadas para
  // alinhar a formatacao
  let preenche = 0
  selecionadas.forEach((t) => {
    Object.keys(tabelas[t] || {}).map((c) => {
      preenche = Math.max(preenche, t.length + c.length + 1)
    })
  })

  let clausula = "SELECT "
  selecionadas.forEach((tabela, t) => {
    let colunas = tabelas[tabela]
    Object.keys(colunas || {})
      .filter(
        (coluna) =>
          !["IDFT", "#"].includes(coluna) &&
          (incluirCol ||
            ![
              "RECCREATEDBY",
              "RECCREATEDON",
              "RECMODIFIEDBY",
              "RECMODIFIEDON",
            ].includes(coluna)),
      )
      .sort()
      .forEach((coluna, c, colunas_) => {
        clausula += t == 0 && c == 0 ? "" : "       "
        clausula += `${tabela}.${coluna}`.padEnd(preenche, " ")
        clausula += ` AS ${tabela}_${coluna}`
        clausula +=
          t == selecionadas.length - 1 && c == colunas_.length - 1 ? "" : ","
        if (descricoes) {
          const ultimoAS = clausula.length - clausula.lastIndexOf(" AS ")
          clausula += " ".repeat(Math.abs(preenche - ultimoAS + 5))
          clausula += ` /* ${colunas[coluna]} */`
        }
        clausula += "\n"
      })
  })
  return clausula
}

function correlacionarChaves(
  tabelaOrigem,
  tabelaDestino,
  descricoes = true,
  preenche = 0,
) {
  const tabelasOrdenadas = [tabelaOrigem, tabelaDestino].sort()
  let relacoes_ = relacoes.filter(
    (r) => r[0] === tabelasOrdenadas[0] && r[1] === tabelasOrdenadas[1],
  )

  if (
    relacoes_ === undefined ||
    relacoes_.length === 0 ||
    relacoes_[0] === undefined ||
    relacoes_[0].length === 0 ||
    relacoes_[0][2] === undefined ||
    relacoes_[0][2].length === 0
  )
    return ""
  relacoes_ = relacoes_[0][2]

  let clausula = " ".repeat(preenche)
  clausula += `/* Relações de chaves entre ${tabelaOrigem} e ${tabelaDestino} */\n`

  if (relacoes_.length > 1) {
    clausula += `${" ".repeat(preenche)}/* Existem ${relacoes_.length} relações`
    clausula += ` entre as tabelas ${tabelaOrigem} e ${tabelaDestino} */\n`
    clausula += `${" ".repeat(preenche)}/* Provavelmente você deve escolher `
    clausula += `apenas uma */\n`
  }

  relacoes_.forEach(([chavesOrigem, chavesDestino], r) => {
    if (relacoes_.length > 1)
      clausula += `${" ".repeat(preenche)}/* Alternativa ${r} */\n`

    if (tabelasOrdenadas[0] != tabelaOrigem) {
      ;[chavesOrigem, chavesDestino] = [chavesDestino, chavesOrigem]
    }

    chavesOrigem = chavesOrigem.split(",")
    chavesDestino = chavesDestino.split(",")

    chavesOrigem.forEach((chaveOrigem, c) => {
      if (c == 0) clausula += " ".repeat(preenche) + "ON "
      else clausula += " ".repeat(preenche + 3) + "AND "

      clausula += `${tabelaOrigem}.${chaveOrigem} = `
      clausula += `${tabelaDestino}.${chavesDestino[c]}`

      if (descricoes) {
        clausula += ` /* ${tabelas[tabelaOrigem][chaveOrigem]} - `
        clausula += `${tabelas[tabelaDestino][chavesDestino[c]]} */`
      }

      clausula += "\n"
    })
  })
  if (relacoes_.length > 1)
    clausula += " ".repeat(preenche) + "/* Fim alternativas */\n"
  return clausula
}

function comporJoin(selecionadas, tipo = "LEFT ", descricoes = true) {
  if (!selecionadas || selecionadas.length == 0) return ""

  let clausula = "/* IMPORTANTE: Por favor, revise os JOINs abaixo com atenção."
  clausula += "\n * Esta consulta inclui todas as combinações possíveis de "
  clausula += "JOINs entre as tabelas selecionadas.\n * No entanto, algumas "
  clausula += "dessas combinações podem não ser adequadas para o que você "
  clausula += "precisa.\n * Certifique-se de ajustar ou remover os JOINs que "
  clausula += "não se encaixam no seu contexto específico.\n */"

  clausula += `\nFROM   ${selecionadas[0]} (NOLOCK)`
  if (descricoes) clausula += ` /* ${tabelas[selecionadas[0]]["#"]} */`
  clausula += "\n"

  let visitadas = [selecionadas[0]]
  let preenche = `       ${tipo}JOIN `.length - 3

  selecionadas.slice(1).forEach((tabela) => {
    visitadas.push(tabela)

    clausula += `       ${tipo}JOIN ${tabela} (NOLOCK)`
    if (descricoes) clausula += ` /* ${tabelas[tabela]["#"]} */`
    clausula += "\n"

    const correlacoes = visitadas
      .map((v) => correlacionarChaves(v, tabela, descricoes, preenche))
      .join("")

    if (!correlacoes) {
      clausula += " ".repeat(preenche) + "/* Não foi possível encontrar relação"
      clausula += " de chaves para juntar essa tabela com as anteriores. */\n"
    } else {
      clausula += correlacoes
    }
  })
  return clausula
}

function atualizarSQL() {
  const sql = document.getElementById("sql")
  const selecionadas = Array.from(selecoes)

  if (selecionadas.length === 0) {
    clausulaSQL = ""
    sql.textContent = ""
    return ""
  }

  const descSelect = document.getElementById("in-descricoes-select").checked
  const clausulaSelect = comporSelect(selecionadas, descSelect)

  const tipoJoin = document.querySelector(
    'input[name="in-tipo-join"]:checked',
  ).value
  const descJoin = document.getElementById("in-descricoes-join").checked
  const clausulaJoin = comporJoin(selecionadas, tipoJoin, descJoin)

  clausulaSQL = clausulaSelect + clausulaJoin
  sql.textContent = clausulaSQL
  Prism.highlightElement(sql)
  return clausulaSQL
}
