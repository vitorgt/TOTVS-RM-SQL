document.addEventListener("DOMContentLoaded", function () {
  const listaTabelas = document.getElementById("table-list")
  const searchBox = document.getElementById("search-box")
  const checkboxDescSelect = document.getElementById("toggle-desc-select")
  const checkboxDescJoin = document.getElementById("toggle-desc-join")
  const btnClearSelection = document.getElementById("clear-selection")
  const btnCopySQL = document.getElementById("copy-sql")
  const btnDownloadSQL = document.getElementById("download-sql")
  const checkboxColExtras = document.getElementById("toggle-extra-columns")
  const joinTypeForm = document.getElementById("join-type-form")

  let selecoes = new Set()
  let tabelas = {}
  let relacoes = []
  let nodes = []
  let edges = []
  let incluirColunasExtras = false
  let clausulaSQL = ""
  let tipoJoinAtual = "LEFT "

  btnCopySQL.addEventListener("click", function () {
    navigator.clipboard.writeText(clausulaSQL)
  })

  btnDownloadSQL.addEventListener("click", function () {
    const blob = new Blob([clausulaSQL], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const d = new Date()
    if (d.getTimezoneOffset() > 0) {
      d.setTime(d.getTime() - d.getTimezoneOffset() * 60 * 1000)
    }
    const now = d
      .toISOString()
      .replace(/:/g, "-")
      .replace("T", "-")
      .replace("Z", "")
      .substring(0, 19)
    const a = document.createElement("a")
    a.href = url
    a.download = Array.from(selecoes)[0] + "-" + now + ".sql"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })

  btnClearSelection.addEventListener("click", () => {
    // Desmarca todas as caixas de seleção
    const checkboxes = document.querySelectorAll(
      '#table-list input[type="checkbox"]',
    )
    checkboxes.forEach((checkbox) => (checkbox.checked = false))
    // Limpa o conjunto de seleções
    selecoes.clear()
    criarGrafo()
    atualizarConsultaSQL()
  })

  checkboxDescSelect.addEventListener("change", atualizarConsultaSQL)
  checkboxDescJoin.addEventListener("change", atualizarConsultaSQL)
  checkboxColExtras.addEventListener("change", (event) => {
    incluirColunasExtras = event.target.checked
    atualizarConsultaSQL()
  })

  joinTypeForm.addEventListener("change", (event) => {
    tipoJoinAtual = event.target.value
    atualizarConsultaSQL()
  })

  function updateTableList(filter = "") {
    listaTabelas.innerHTML = "" // Limpa a lista atual

    // Filtra e lista as tabelas
    Object.keys(tabelas)
      .filter((tabela) =>
        (tabela + " " + tabelas[tabela]["#"])
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(filter.toLowerCase()),
      )
      .forEach((tabela) => {
        const listItem = document.createElement("li")
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.id = tabela
        checkbox.value = tabela

        // Verifica se a tabela está selecionada
        if (selecoes.has(tabela)) {
          checkbox.checked = true
        }

        checkbox.addEventListener("change", () => {
          // Atualiza o estado da seleção
          if (checkbox.checked) {
            selecoes.add(tabela)
          } else {
            selecoes.delete(tabela)
          }
          criarGrafo()
          atualizarConsultaSQL()
        })

        const label = document.createElement("label")
        label.htmlFor = tabela
        label.textContent = tabela
        if (tabelas[tabela]["#"]) {
          label.textContent = tabela + ": " + tabelas[tabela]["#"]
        }

        listItem.appendChild(checkbox)
        listItem.appendChild(label)
        listaTabelas.appendChild(listItem)
      })
  }

  fetch(
    "https://raw.githubusercontent.com/vitorgt/TOTVS-RM-SQL/main/dados/tabelas.json",
  )
    .then((response) => response.json())
    .then((data) => {
      tabelas = data
      updateTableList()
      searchBox.addEventListener("input", () => {
        updateTableList(searchBox.value)
      })
      Object.keys(tabelas).forEach((tabela) => {
        nodes.push({
          id: tabela,
          label: tabela,
          title: tabela,
          group: tabela.substring(0, 2) == "SZ" ? "SZ" : tabela.substring(0, 1),
        })
      })
    })
    .catch((error) =>
      console.error("Erro ao carregar os dados das tabelas:", error),
    )
  fetch(
    "https://raw.githubusercontent.com/vitorgt/TOTVS-RM-SQL/main/dados/relacoes.json",
  )
    .then((response) => response.json())
    .then((data) => {
      relacoes = data
      relacoes.forEach((relacao) => {
        edges.push({
          from: relacao[0],
          source: relacao[0],
          to: relacao[1],
          target: relacao[1],
        })
      })
    })
    .catch((error) =>
      console.error("Erro ao carregar os dados das relacoes:", error),
    )

  function criarGrafo() {
    const nosFiltrados = nodes.filter((node) => selecoes.has(node.id))
    const idsNosFiltrados = new Set(nosFiltrados.map((node) => node.id))
    const arestasFiltradas = edges.filter(
      (edge) => idsNosFiltrados.has(edge.from) && idsNosFiltrados.has(edge.to),
    )

    // Criação do grafo
    const container = document.getElementById("mynetwork")
    const dados = {
      nodes: new vis.DataSet(nosFiltrados),
      edges: new vis.DataSet(arestasFiltradas),
    }
    const opcoes = {} // Personalize as opções do grafo conforme necessário
    const network = new vis.Network(container, dados, opcoes)
  }

  function compoeSelect(tabelasSelecionadas, descricoes = true) {
    let selectClause = "SELECT "
    let max_len = 0
    tabelasSelecionadas.forEach((t) => {
      Object.keys(tabelas[t] || {}).map((c) => {
        max_len = Math.max(max_len, t.length + c.length + 1)
      })
    })
    tabelasSelecionadas.forEach((tabela, index) => {
      let colunas = tabelas[tabela]
      // if (descricoes && colunas["#"]) {
      //   selectClause += `\t/* ${colunas["#"]} */\n`
      // }
      Object.keys(colunas || {})
        .filter(
          (coluna) =>
            !["IDFT", "#"].includes(coluna) &&
            (incluirColunasExtras ||
              ![
                "RECCREATEDBY",
                "RECCREATEDON",
                "RECMODIFIEDBY",
                "RECMODIFIEDON",
              ].includes(coluna)),
        )
        .sort()
        .forEach((coluna, colIndex, array) => {
          selectClause += index === 0 && colIndex === 0 ? "" : "       "
          selectClause += `${tabela}.${coluna}`.padEnd(max_len, " ")
          selectClause += ` AS ${tabela}_${coluna}`
          if (
            index !== tabelasSelecionadas.length - 1 ||
            colIndex !== array.length - 1
          ) {
            selectClause += ","
          }
          if (descricoes) {
            let u = selectClause.length - selectClause.lastIndexOf(" AS ")
            selectClause += " ".repeat(Math.abs(max_len + 5 - u))
            selectClause += ` /* ${colunas[coluna]} */\n`
          } else {
            selectClause += "\n"
          }
        })
    })
    return selectClause !== "SELECT\n" ? selectClause : ""
  }

  function escreve_correspondencia_chaves(
    tabela_origem,
    tabela_destino,
    descricoes = true,
    pad = 0,
  ) {
    let relacoes_ = relacoes.filter(
      (rel) =>
        rel[0] === [tabela_origem, tabela_destino].sort()[0] &&
        rel[1] === [tabela_origem, tabela_destino].sort()[1],
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
    joinClause = `${" ".repeat(
      pad,
    )}/* Relações de chaves entre ${tabela_origem} e ${tabela_destino} */\n`
    if (relacoes_.length > 1) {
      joinClause += `${" ".repeat(pad)}/* Existem `
      joinClause += `${relacoes_.length} relações entre as tabelas `
      joinClause += `${tabela_origem} e ${tabela_destino} */\n`
      joinClause += `${" ".repeat(pad)}/* Provavelmente você deve `
      joinClause += `escolher apenas uma */\n`
    }
    relacoes_.forEach((ligacao, index) => {
      ;[chaves_origem, chaves_destino] = ligacao
      if (relacoes_.length > 1) {
        joinClause += `${" ".repeat(pad)}/* Alternativa ${index + 1} */\n`
      }
      if ([tabela_origem, tabela_destino].sort()[0] != tabela_origem) {
        ;[chaves_origem, chaves_destino] = [chaves_destino, chaves_origem]
      }
      chaves_origem = chaves_origem.split(",")
      chaves_destino = chaves_destino.split(",")

      chaves_origem.forEach((chave_origem, idx) => {
        joinClause += `${
          idx === 0 ? " ".repeat(pad) + "ON" : " ".repeat(pad + 3) + "AND"
        } `
        joinClause += `${tabela_origem}.${chave_origem} = `
        joinClause += `${tabela_destino}.${chaves_destino[idx]}`
        joinClause += descricoes
          ? ` /* ${tabelas[tabela_origem][chave_origem]} - ${
              tabelas[tabela_destino][chaves_destino[idx]]
            } */\n`
          : "\n"
      })
    })
    if (relacoes_.length > 1) {
      joinClause += " ".repeat(pad) + "/* Fim alternativas */\n"
    }
    return joinClause
  }

  function compoeJoin(tabelasSelecionadas, tipo = "LEFT", descricoes = true) {
    let joinClause = `FROM   ${tabelasSelecionadas[0]} (NOLOCK)`
    joinClause += descricoes
      ? ` /* ${tabelas[tabelasSelecionadas[0]]["#"]} */\n`
      : "\n"

    let visitadas = [tabelasSelecionadas[0]]
    let pad = `       ${tipo}JOIN `.length - 3

    tabelasSelecionadas.slice(1).forEach((tabela) => {
      visitadas.push(tabela)
      joinClause += `       ${tipo}JOIN ${tabela} (NOLOCK)`
      joinClause += descricoes ? ` /* ${tabelas[tabela]["#"]} */\n` : "\n"
      let antes = joinClause
      visitadas.forEach((visitada) => {
        joinClause += escreve_correspondencia_chaves(
          visitada,
          tabela,
          descricoes,
          pad,
        )
      })
      if (antes === joinClause) {
        joinClause += " ".repeat(pad) + "/* Não foi encontrada nenhuma relação "
        joinClause += "para juntar essa tabela com as selecionadas */\n"
      }
    })
    return joinClause !== "FROM undefined (NOLOCK)\n" ? joinClause : ""
  }

  // Função para atualizar a consulta SQL
  function atualizarConsultaSQL() {
    let elementoSQL = document.getElementById("sql-output")
    let tabelasSelecionadas = Array.from(selecoes)
    if (tabelasSelecionadas.length === 0) {
      clausulaSQL = ""
      elementoSQL.textContent = ""
      return
    }
    let descricoesSelect = checkboxDescSelect.checked
    let descricoesJoin = checkboxDescJoin.checked
    let clausulaSelect = compoeSelect(tabelasSelecionadas, descricoesSelect)
    let clausulaJoin = compoeJoin(
      tabelasSelecionadas,
      tipoJoinAtual,
      descricoesJoin,
    )
    clausulaSQL = clausulaSelect + clausulaJoin
    elementoSQL.textContent = clausulaSQL
    Prism.highlightElement(elementoSQL)
  }

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
})
