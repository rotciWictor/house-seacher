# AI Developer Context (AI_README)

## 🤖 Contexto para Agentes de IA
Se você é uma Inteligência Artificial lendo este repositório para continuar o desenvolvimento, preste muita atenção nas regras arquiteturais abaixo. Este projeto possui limitações e escolhas de design específicas feitas para manter a hospedagem 100% gratuita usando Vercel e GitHub Actions.

## 🎯 Objetivo do Projeto
Um agregador de imóveis para aluguel focado na cidade do Rio de Janeiro. O objetivo é varrer plataformas (atualmente OLX), extrair anúncios com aluguel de até R$ 1.000, 1 a 2 quartos, inferir a zona/bairro, e exibir em uma interface web mobile-first.

## 🏗️ Arquitetura e Fluxo de Dados (CRÍTICO)
1. **Frontend (Next.js)**: Fica no diretório raiz. Hospedado na Vercel.
2. **Banco de Dados (Static JSON)**: Não existe banco de dados SQL/NoSQL. Os dados ficam em `src/data/properties.json`. O Next.js lê esse JSON como banco de dados estático.
3. **Scraper (Playwright)**: Fica em `scraper/`. Roda de forma "headless" usando `playwright-extra` e `puppeteer-extra-plugin-stealth` para evitar bloqueios de bot.
4. **Pipeline (GitHub Actions)**: O arquivo `.github/workflows/scraper.yml` roda o scraper a cada 6 horas. O script altera o `properties.json` e faz um commit automático na branch `main`.
5. **Deploy (Vercel)**: O commit feito pelo GitHub Actions engatilha um novo build na Vercel, atualizando o site com as novas propriedades.

## ⚠️ Regras Restritas de Modificação (NÃO QUEBRE)

### 1. NUNCA USE BANCO DE DADOS RELACIONAIS (SQLite, etc)
O ambiente de build da Vercel para Next.js quebra com dependências C/C++ pesadas (como o `sqlite3` exigindo `GLIBC_2.38`). Já tentamos usar SQLite no passado e o deploy quebrou. **Mantenha o uso exclusivo de arquivos `.json`**.

### 2. NÃO FAÇA DOWNLOAD DAS IMAGENS
Nós hospedamos a base de dados no próprio GitHub. Se o scraper baixar os arquivos binários das fotos para a pasta do projeto, o repositório vai ultrapassar o limite de 1GB rapidamente e bloquear o deploy da Vercel.
**Solução atual**: O scraper extrai as URLs de alta resolução originais (`src` ou `srcset` da tag `<picture>`) e o Next.js exibe a imagem via link externo usando CSS (`object-fit: cover`) para lidar com o tamanho e marcas d'água naturais.

### 3. CUIDADO AO LER O DOM DA OLX
As fotos da OLX usam *lazy-load*. Uma tag `<img>` simples dentro do `<a>` não tem a foto real até o scroll acontecer. 
**Solução atual**: O scraper avalia a tag wrapper `<section>` inteira para capturar tanto o texto quanto o link da imagem dentro do node correspondente. Sempre faça dump de `.innerHTML` ao invés de confiar em seletores genéricos caso vá modificar o scraper.

### 4. PAGINAÇÃO E LIMITAÇÕES DE TEMPO
O script roda dentro do GitHub Actions (runner free). Ele é configurado para iterar em múltiplas páginas (`?pe=1000&o=2`, etc) com um limite `maxPages = 5` para não causar Timeout no CI/CD e não ser banido pela OLX. Se for expandir o scraper, não remova o timeout ou o limite de páginas.

## 💻 Estrutura Principal
- `src/app/page.tsx`: Interface principal, filtros e listagem. Utiliza TailwindCSS.
- `src/data/properties.json`: O "banco de dados".
- `scraper/index.ts`: Robô de coleta. Possui lógica para inferir a "Zona" do RJ baseada no texto do bairro.
- `.github/workflows/scraper.yml`: Cron job da infraestrutura.

## 🚀 Como testar localmente
1. **Frontend**: `npm run dev` na raiz.
2. **Scraper**: `cd scraper`, `npm install`, e `npx tsx index.ts`. (Verifique se as propriedades no `src/data/properties.json` aumentaram e se os links de imagem estão corretos).
