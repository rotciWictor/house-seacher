# 🕷️ Rotina de Manutenção e Especificidades dos Scrapers

Este documento mapeia o comportamento técnico de cada um dos scrapers do projeto, detalhando suas tecnologias, pontos fracos e o que precisa ser monitorado constantemente caso parem de funcionar.

---

## 1. OLX (`index.ts`)

- **Tecnologia:** Playwright + `puppeteer-extra-plugin-stealth` (Navegação Headless).
- **Como funciona:** Abre o navegador, acessa a página com filtro de até R$ 1.000,00 e itera alterando o parâmetro `&o=X` na URL.
- **Especificidades e Pontos Críticos:**
  - **Lazy Loading de Imagens:** A OLX atrasa o carregamento de imagens. Se a imagem extraída começar com `data:image`, o scraper é forçado a buscar o atributo `srcset` e quebrar a string para pegar a primeira URL real. Se o design da OLX mudar e removerem o `srcset`, a extração de imagens quebra.
  - **DOM Dinâmico:** Os anúncios estão encapsulados em tags `<section>`. O scraper procura pelo link `a[href*="/imoveis/"]` e retira o ID da URL usando regex (`-\d+(?:\?|$)`).
  - **Rotina de Checagem:** Se a OLX parar de retornar imóveis, verificar se a classe ou a tag `<section>` que encapsula os anúncios não foi substituída por `<div>` ou `<li>` em alguma atualização de layout deles.

## 2. ZAP Imóveis e VivaReal (`zap.ts`)

- **Tecnologia:** Playwright + Stealth (Altamente necessário devido à forte proteção antibot / DataDome).
- **Como funciona:** Um único script itera sobre as duas plataformas alterando a URL base. Usa paginação por `&pagina=X`.
- **Especificidades e Pontos Críticos:**
  - **Scrolling Obrigatório:** Diferente da OLX, os cards só são populados na DOM se houver rolagem de tela. O script injeta um loop no navegador: `window.scrollBy(0, 800)` cinco vezes para forçar o carregamento de todos os anúncios antes de ler a DOM.
  - **Traversia de DOM Complexa (Upward traversal):** Ele encontra o link do anúncio (`a[href*="/imovel/"]`) e sobe na árvore do DOM até 10 níveis (`parentElement`) procurando a tag `<li>` que guarda os metadados.
  - **Rotina de Checagem:** Se falhar, checar imediatamente se o ZAP/VivaReal ativou o **DataDome (Captcha)** bloqueando o Playwright. Checar também se a tag container mudou de `<li>` para `<article>`.

## 3. Chaves na Mão (`chavesnamao.ts`)

- **Tecnologia:** HTTP Puro (`fetch`) + `cheerio`.
- **Como funciona:** É o único scraper que **não levanta um navegador**. Ele faz requisições GET puras e varre o HTML estático. Isso o torna o mais rápido de todos, porém o mais frágil a bloqueios de IP.
- **Especificidades e Pontos Críticos:**
  - **Velocidade e Rate Limit:** Como é puro HTTP, ele raspa as 40 páginas em segundos. Para não tomar banimento de IP no GitHub Actions, há um `setTimeout(1500)` (1.5s de delay) fixo entre as páginas.
  - **Parsing Estático:** Busca por tags com a classe `[class*="title"]` e extrai preços usando expressões regulares simples direto do texto aglomerado.
  - **Rotina de Checagem:** Se retornar 403 Forbidden, significa que ativaram um Cloudflare ou bloqueio de User-Agent. Se isso acontecer, o script precisará ser reescrito para Playwright.

## 4. Mercado Livre (`mercadolivre.ts`)

- **Tecnologia:** Playwright + Stealth.
- **Como funciona:** O ML não usa parâmetros fixos na URL para paginação (`?page=2`). Em vez disso, o script localiza o botão "Seguinte" (`a.andes-pagination__link[title="Seguinte"]`), extrai a URL dele e navega recursivamente.
- **Especificidades e Pontos Críticos:**
  - **Identificadores (MLB):** Todo anúncio no ML tem o formato `MLB1234567`. O regex captura especificamente isso para o ID.
  - **Classes "Andes" e "Poly":** Todo o CSS do ML usa o design system deles (ex: `.ui-search-layout__item`, `.poly-component__title`, `.andes-money-amount__fraction`). 
  - **Rotina de Checagem:** O ML atualiza o nome dessas classes de design system anualmente. Se o scraper parar de retornar preço, checar se `.andes-money-amount__fraction` não virou `.andes-money-amount__cents` ou similar.

---

## ⚙️ Regra Geral de Manutenção (O Funil de Normalização)
Lembre-se que **nenhum scraper deve salvar no banco sem antes passar pela camada de normalização (`saveProperties.ts`)**. 

O fluxo vital é:
`Extratores Brutos (Scrapers)` ➔ `Filtros de Exclusão (isCommercial, isSeasonal)` ➔ `Limpeza Defensiva (limpar_e_padronizar_texto)` ➔ `Recuperação de Lixo (recoverNeighborhood)` ➔ `Supabase`.
