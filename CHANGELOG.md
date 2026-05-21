# Changelog

Todas as mudanças relevantes do projeto House Searcher estão documentadas neste arquivo.

---

## [3.0.0] — 2026-05-20

### 🚀 Marco: 1.168 imóveis de 4 fontes

### ✨ Adicionado
- **Scraper Mercado Livre** (`mercadolivre.ts`): Criado robô usando Playwright após constatar bloqueio irrevogável na API Oficial.
- **Banco de Dados Supabase**: Instalado `@supabase/supabase-js` e gerado schema SQL para iniciar migração do `properties.json` para PostgreSQL.
- **Paginação 10 páginas em todos os scrapers**: OLX (+236), ZAP (+172), VivaReal (+230). Total saltou de 529 para **1.168 imóveis**.
- **Scraper Chaves na Mão** (`chavesnamao.ts`): Nova fonte usando `cheerio` (HTTP puro, sem browser). Leve e rápido, mas poucos imóveis abaixo de R$ 1.000 neste portal.
- **Google Search Console verificado**: Arquivo `googled24240b989fe27bd.html` adicionado ao `/public`. Sitemap submetido.
- **OG Image para redes sociais**: Imagem de compartilhamento `og-image.png` para Facebook/Twitter/WhatsApp.
- **PWA Manifest** (`manifest.json`): Site instalável como app no celular.
- **robots.txt**: Configurado com referência ao sitemap.
- **Sitemap dinâmico** (`sitemap.ts`): Gerado automaticamente pelo Next.js.
- **SEO nuclear**: Structured Data (JSON-LD) com FAQPage e WebSite/SearchAction, canonical URL, theme-color, apple-touch-icon.
- **Mascote em pose de ação**: Casinha-detetive correndo com lupa (substitui versão estática).

### 📋 Roadmap v3.0 (Oráculo de Viabilidade Urbana)
- Migração para **Supabase** (PostgreSQL gratuito) para suportar dados geoespaciais.
- **Geocodificação** via Nominatim/OpenStreetMap com cache no banco.
- **Score de Risco** criminal por imóvel (ISP Dados + Fogo Cruzado API).
- **Score de Caminhabilidade**: Padarias, mercados, metrô, farmácias via Overpass API.
- **Score de Tranquilidade**: Bares, boates, indústrias e vias expressas mapeados.
- **Custo Total de Moradia** (CTM): Aluguel + condomínio + transporte integrado.
- **Motor Anti-Fraude**: Detecção de preço/m² anômalo e fotos clonadas.
- **Alertas via WhatsApp** (Cloud API grátis, 1.000 msgs/mês).
- **Mercado Livre API**: Consumo oficial via OAuth (pendente criação do App pelo usuário).

### 🐛 Corrigido
- Enrichment reclassificou 89 imóveis adicionais, restando apenas **1** como "Geral".

---



### ✨ Adicionado
- **Paginação ZAP/VivaReal**: Scrapers agora navegam 5 páginas cada (+120 ZAP, +110 VivaReal). Total: **529 imóveis**.
- **Mascote**: Casinha-detetive com lupa em pose de ação, na hero section com animação bounce.
- **Footer**: Branding, badges das 3 fontes, botão "Enviar sugestão" (abre GitHub Issue), link pro GitHub, copyright.
- **GitHub Actions atualizado**: Workflow agora roda OLX + ZAP + VivaReal + enrich.ts automaticamente a cada 6h.

### 🔧 Alterado
- **Barra de filtros redesenhada**: 2 linhas (zonas em cima, filtros embaixo), `flex-wrap` no mobile, toggle buttons em vez de checkboxes, emojis (📍🛏️📷💰), ordenação empurrada pra direita no desktop.
- **Badges sólidos**: Todos os badges (preço, fonte, zona, dono, tempo) agora com fundo 100% opaco — legíveis em qualquer foto.
- **Pill "Geral" removida**: Zona "Geral" não aparece mais nos filtros. Enrichment agora classifica 100% dos imóveis.
- **Enrichment v2**: Checagem de slugs na URL (mangaratiba, ibicui, etc.), correção de bairros bugados ("Ontem", timestamps), fallback forçado pra Oeste quando RJ sem zona.

### 🐛 Corrigido
- Path do `git add` no workflow (era `web/src/data/` → agora `src/data/`).
- ImovelWeb tentado mas descartado (anti-bot agressivo, timeout em todas as páginas).

---

## [2.1.0] — 2026-05-20

### ✨ Adicionado
- **Scraper ZAP Imóveis**: Novo scraper que extrai listagens do ZAP via DOM parsing (+30 imóveis).
- **Scraper VivaReal**: Mesmo engine do ZAP, adaptado para VivaReal (+30 imóveis).
- **Script de enriquecimento** (`enrich.ts`): Pós-processamento que reclassifica imóveis "Geral" usando URL hints (zona-oeste, zona-norte), detecção de cidade e base de +200 bairros. Reduziu "Geral" de 50%+ para menos de 1%.
- **Filtro de preço travado**: Máximo fixado em R$ 1.000 (min R$ 100, step R$ 50).

### 🔧 Alterado
- Hero section mais compacta (padding reduzido).
- Texto atualizado de "Baratos" para "Aluguel em conta no Rio de Janeiro".
- Total de imóveis: **299** (239 OLX + 30 ZAP + 30 VivaReal).

---

## [2.0.0] — 2026-05-20

### ✨ Adicionado
- **Hero Section**: Banner de marca com gradiente animado, contadores de estatísticas (imóveis, bairros, regiões, preço médio), barra de busca integrada e indicador de atualização em tempo real.
- **Busca por texto**: Campo de busca livre que filtra por título, bairro ou qualquer palavra na descrição do anúncio.
- **Filtro de quartos**: Toggle para filtrar por 1, 2 ou 3+ quartos.
- **Filtro "Direto c/ Dono"**: Checkbox para mostrar somente imóveis sem intermediação.
- **Filtro "Com foto"**: Checkbox para esconder anúncios sem imagem.
- **Ordenação por área**: Nova opção de ordenar por "Maior Área (m²)".
- **Painel de filtros avançados**: Botão "Filtros" que expande/recolhe painel com todos os filtros extras.
- **Dados extras nos cards**: Área (m²), banheiros, valor do condomínio separado, badge "Direto c/ Dono", tempo relativo ("2h atrás").
- **Novas zonas no scraper**: Niterói, São Gonçalo, Baixada Fluminense, Maricá, Serrana, Costa Verde — classificação por nome da cidade antes de tentar por bairro.
- **+100 bairros mapeados**: Zona Norte (+28), Zona Oeste (+13), Centro (+3) e dezenas de bairros da região metropolitana.
- **Extração avançada de dados**: O scraper agora extrai m², banheiros, condomínio, quartos (via regex) e flag de proprietário direto.
- **Limpeza automática**: Imóveis com mais de 3 dias do OLX são removidos automaticamente para manter a base fresca.
- **Changelog**: Este arquivo.

### 🐛 Corrigido
- **50%+ dos imóveis estavam como "Zona Geral"**: Completamente resolvido com classificação por cidade + mapeamento expandido de bairros.
- **Timestamps como bairro**: Corrigido bug onde "14:55" ou "08:08" apareciam como nome de bairro (erro de parsing do texto da OLX).
- **Colisão "Freguesia"**: Freguesia da Ilha do Governador (Norte) não é mais confundida com Freguesia de Jacarepaguá (Oeste).
- **Colisão "Engenho"**: Engenho em Itaguaí não é mais classificado como Zona Norte.
- **Colisão "Centro"**: Centro de Niterói, Nilópolis e Belford Roxo não são mais confundidos com Centro do RJ.

### 🔧 Alterado
- Cards redesenhados com layout mais compacto e informativo.
- Filtros de zona agora mostram dinamicamente apenas as zonas que existem nos dados.
- Bairros no dropdown filtram automaticamente com base na zona selecionada.

---

## [1.2.0] — 2026-05-20

### ✨ Adicionado
- **Badge de fonte OLX**: Cada card agora mostra um selo roxo indicando a plataforma de origem do anúncio (visão de agregador).
- **README.md**: Documentação completa para humanos com instruções de setup, features e arquitetura.
- **AI_README.md**: Documentação técnica para agentes de IA com restrições arquiteturais e regras de modificação.
- **Ordenação por preço**: Dropdown para ordenar por "Mais Recentes", "Menor Preço" ou "Maior Preço".

---

## [1.1.0] — 2026-05-20

### ✨ Adicionado
- **Proxy de imagens**: API route `/api/img` que busca fotos da OLX pelo servidor (bypass do bloqueio de hotlink), com cache de 7 dias na CDN da Vercel.
- **Paginação no scraper**: Robô agora navega por até 5 páginas da OLX, coletando ~250 imóveis por execução.
- **Extração de imagens corrigida**: Scraper agora busca imagens dentro de `<section>` ao invés de `<a>`, capturando fotos que antes não apareciam.
- **SEO completo**: Meta tags (title, description, keywords), Open Graph, Twitter Cards, robots directives e favicon customizado.
- **Favicon**: Ícone personalizado com tema de casa + lupa.

### 🐛 Corrigido
- Imagens não apareciam no site (OLX bloqueia hotlink via `Referer` header).
- Caminho do `properties.json` incorreto no scraper (apontava para `../web/src/` ao invés de `src/`).
- Erro de sintaxe no scraper ao adicionar paginação (bloco `for` mal fechado).

---

## [1.0.0] — 2026-05-20

### ✨ Adicionado
- **Primeira versão funcional** do agregador de imóveis.
- **Scraper OLX**: Robô headless usando `playwright-extra` + `puppeteer-extra-plugin-stealth` para coletar anúncios de aluguel no RJ até R$ 1.000.
- **Interface Mobile-First**: Layout responsivo com TailwindCSS, cards de imóveis com foto, preço e bairro.
- **Filtros básicos**: Zona (Oeste, Norte, Sul, Centro), Bairro (dropdown), Preço Máximo (input).
- **Classificação de zonas**: Inferência automática da zona do RJ baseada em listas de bairros conhecidos.
- **GitHub Actions**: Workflow `.github/workflows/scraper.yml` para rodar o scraper a cada 6 horas automaticamente.
- **Deploy Vercel**: Site publicado em `house-seacher.vcampos.dev` com build automático a cada push.
- **Arquitetura JSON estática**: Banco de dados via `properties.json` commitado no repo — sem SQL, sem custos de banco.

### 🏗️ Decisões Arquiteturais
- **SQLite removido**: Tentativa inicial com SQLite falhou no build da Vercel (dependência GLIBC_2.38 não disponível). Migrado para JSON estático.
- **Monorepo simplificado**: Pasta `web/` movida para a raiz do projeto para compatibilidade com o build padrão da Vercel.
- **Sem download de imagens**: Fotos servidas via URL original da OLX para não estourar o limite de 1GB do GitHub.
