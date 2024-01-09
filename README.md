# Geração de Consultas SQL a partir de Tabelas e Relacionamentos do TOTVS RM

## Introdução

Bem-vindo ao projeto de geração de consultas SQL a partir de tabelas e relacionamentos do sistema TOTVS RM! Este script em Python foi desenvolvido para simplificar a criação de consultas complexas, oferecendo uma abordagem intuitiva e visual para compreender as intricadas relações entre as tabelas do TOTVS RM.

Ao contrário da abordagem convencional, onde muitas vezes criamos joins baseados em suposições, dicas e truques, este script utiliza as informações fornecidas pelos desenvolvedores do TOTVS RM. Ele automaticamente cria joins com base nas ligações declaradas entre as tabelas, proporcionando uma forma mais confiável e precisa de construir consultas SQL.

Continue explorando para entender como o script organiza as relações, visualiza graficamente as conexões entre tabelas, e oferece funcionalidades para otimizar a construção de consultas SQL em ambientes que utilizam o TOTVS RM.

## Visualização de Relacionamentos

Através da integração da biblioteca `networkx`, o script oferece uma poderosa ferramenta de visualização de relacionamentos entre tabelas do TOTVS RM. Ao transformar as relações em um grafo, proporciona uma representação gráfica clara e intuitiva das conexões, facilitando assim a compreensão das complexas relações entre entidades.

## Verificação de Conexões Faltantes

O script oferece a identificação de conexões ausentes entre as tabelas desejadas do TOTVS RM. Esta verificação não apenas destaca a existência de tabelas desconectadas, mas também fornece alternativas de caminhos para estabelecer as conexões necessárias. Essa abordagem simplifica a integração de tabelas, oferecendo opções para preencher lacunas nas relações e garantindo uma visão abrangente e coesa do sistema.

## Salvando Consultas SQL

Ao final, o script salva a consulta SQL gerada em um arquivo na pasta `consultas_geradas`.

## Executando no Google Colab

1. Faça o [download desse repositório](https://github.com/vitorgt/TOTVS-RM-SQL/zipball/master/) no seu computador.

2. Clique no botão: <a target="_blank" href="https://colab.research.google.com/github/vitorgt/TOTVS-RM-SQL/blob/main/notebook.ipynb"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>

3. Copie a pasta `dados` para o ambiente do Colab.

4. Ajuste as tabelas desejadas e execute todas as células.

## Executando localmente

1. Faça o [download desse repositório](https://github.com/vitorgt/TOTVS-RM-SQL/zipball/master/) no seu computador.

2. Atente-se aos pré-requisitos abaixo.

3. Ajuste as tabelas desejadas e execute todas as células.

### Bibliotecas necessárias

O script utiliza as seguintes bibliotecas Python:

- `networkx`: Para manipulação e visualização de grafos.
- `numpy`: Para operações numéricas e manipulação de arrays.
- `pandas`: Para manipulação de dados tabulares.
- `notebook`: É o motor de execução do script.

Se ainda não tiver as bibliotecas necessárias instaladas, você pode instalá-las a partir do arquivo `requirements.txt`.

#### Instalando as bibliotecas utilizando `pip`

```bash
pip install -r requirements.txt
```

#### Instalando as bibliotecas utilizando `conda`

```bash
conda install --file requirements.txt
```

### Dados

Antes de executar o script, é fundamental gerar as planilhas `GDIC.XLSX` e `GLINKSREL.XLSX` no seu sistema atual, utilizando as seguintes consultas SQL, para que o script gere consultas coerentes com a versão do seu sistema:

```sql
SELECT TABELA,
       COLUNA,
       DESCRICAO
FROM   GDIC (NOLOCK) /* Lista tabelas do sistema, seus campos e suas descrições */
```

```sql
SELECT MASTERTABLE,
       CHILDTABLE,
       MASTERFIELD,
       CHILDFIELD
FROM   GLINKSREL (NOLOCK) /* Lista relacionamentos entre as tabelas do sistema */
```

## Avisos

- Utilize o script com cautela e revise as consultas geradas, especialmente quando houver mais de uma alternativa de ligação entre tabelas.
- Nem sempre todas as ligações fazem sentido em todos os contextos.
- Avalie cuidadosamente as opções apresentadas para garantir que correspondam às necessidades específicas da sua seleção.

Sinta-se à vontade para explorar e adaptar o script de acordo com suas necessidades.
