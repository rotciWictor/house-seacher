# AI Developer Context (AI_README)

## 🤖 Contexto para Agentes de IA
Se você é uma Inteligência Artificial lendo este repositório para continuar o desenvolvimento, preste muita atenção nas regras arquiteturais abaixo. Este projeto possui limitações e escolhas de design específicas feitas para manter a hospedagem 100% gratuita usando Vercel e GitHub Actions.

## 🎯 Objetivo do Projeto
Um agregador de imóveis para aluguel focado na cidade do Rio de Janeiro. O objetivo é varrer plataformas (atualmente OLX), extrair anúncios com aluguel de até R$ 1.000, 1 a 2 quartos, inferir a zona/bairro, e exibir em uma interface web mobile-first.

## 🏗️ Arquitetura e Fluxo de Dados (CRÍTICO)
1. **Frontend (Next.js)**: Fica no diretório raiz. Hospedado na Vercel.
2. **Banco de Dados (Supabase)**: Banco PostgreSQL acessado via `@supabase/supabase-js`.
3. **Scraper (Playwright/Cheerio)**: Fica em `scraper/`.
4. **Pipeline (GitHub Actions)**: Roda o scraper a cada 6 horas salvando dados no Supabase.
5. **Normalização**: O arquivo `src/utils/normalize.ts` faz Fuzzy Matching (`fastest-levenshtein`) e limpeza defensiva de strings corrompidas. Sempre passe strings de bairros pelo `limpar_e_padronizar_texto`.

## ⚠️ Regras Restritas de Modificação (NÃO QUEBRE)

### 1. ATUALIZE O CHANGELOG OBRIGATORIAMENTE
Sempre que finalizar uma funcionalidade, bugfix ou refatoração, adicione um registro no `CHANGELOG.md` e nos documentos técnicos dentro da pasta `docs/`. O desenvolvedor humano usa isso para acompanhar o que a IA fez de forma autônoma.

### 2. LICENÇA E OPEN SOURCE
O projeto está sob a Licença MIT. Todo o código escrito deve respeitar a premissa de código aberto e evitar APIs fechadas ou pagas que prejudiquem desenvolvedores que fizerem fork do projeto (arquitetura de Custo Zero).

### 3. BANCO DE DADOS (SUPABASE)
O projeto usa Supabase (PostgreSQL). Não usamos mais `properties.json` como banco estático. Os scrapers rodam de forma stateless no GitHub Actions e salvam no Supabase via cliente JS. Nunca limpe a base de dados sem perguntar ao humano.

### 3. NÃO FAÇA DOWNLOAD DAS IMAGENS
Nós hospedamos a base de dados no próprio GitHub. Se o scraper baixar os arquivos binários das fotos para a pasta do projeto, o repositório vai ultrapassar o limite de 1GB rapidamente e bloquear o deploy da Vercel.
**Solução atual**: O scraper extrai as URLs de alta resolução originais (`src` ou `srcset` da tag `<picture>`) e o Next.js exibe a imagem via link externo proxy `/api/img`.

### 4. CUIDADO AO LER O DOM DA OLX
As fotos da OLX usam *lazy-load*. Uma tag `<img>` simples dentro do `<a>` não tem a foto real até o scroll acontecer. 
**Solução atual**: O scraper avalia a tag wrapper `<section>` inteira para capturar tanto o texto quanto o link da imagem dentro do node correspondente. Sempre faça dump de `.innerHTML` ao invés de confiar em seletores genéricos caso vá modificar o scraper.

### 5. PAGINAÇÃO E LIMITAÇÕES DE TEMPO
O script roda dentro do GitHub Actions (runner free). Ele é configurado para iterar em múltiplas páginas (`?pe=1000&o=2`, etc) com um limite `maxPages = 5` para não causar Timeout no CI/CD e não ser banido pela OLX. Se for expandir o scraper, não remova o timeout ou o limite de páginas.

## 💻 Estrutura Principal
- `src/app/page.tsx`: Interface principal, filtros e listagem. Utiliza TailwindCSS.
- `src/data/properties.json`: O "banco de dados".
- `scraper/index.ts`: Robô de coleta. Possui lógica para inferir a "Zona" do RJ baseada no texto do bairro.
- `.github/workflows/scraper.yml`: Cron job da infraestrutura.

## 🚀 Como testar localmente
1. **Frontend**: `npm run dev` na raiz.
2. **Scraper**: `cd scraper`, `npm install`, e `npx tsx index.ts`. (Verifique se as propriedades no `src/data/properties.json` aumentaram e se os links de imagem estão corretos).
