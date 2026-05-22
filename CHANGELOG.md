# Changelog

Todas as mudanças relevantes do projeto House Searcher estão documentadas neste arquivo.

---

## [3.4.0] — 2026-05-22

### ✨ Adicionado
- **Fuzzy Matching de Bairros**: Instalação da biblioteca `fastest-levenshtein` (ultraleve) e implementação de um algoritmo de similaridade nos scrapers (`enrich.ts`) e no normalizador de frontend (`normalize.ts`). A plataforma agora é resistente a erros de digitação de corretores em anúncios (ex: "Copacabamna", "Tihuca") corrigindo-os automaticamente.
- **Pipeline de Limpeza Defensiva**: Adicionada a função `limpar_e_padronizar_texto` que destrói acentos ortográficos e lixo textual das strings originais antes da avaliação categórica.

## [3.3.1] — 2026-05-22

### 🐛 Corrigido
- **Colisão Geográfica do "Centro"**: Cidades da Baixada Fluminense (ex: Nilópolis, Duque de Caxias, Nova Iguaçu) e Leste Fluminense (ex: Niterói, São Gonçalo) que contivessem o bairro "Centro" estavam sendo indevidamente classificadas como o Centro do Rio de Janeiro (`Zona Central`). A taxonomia dos scrapers e do normalizador foi reordenada para priorizar a triagem por município.
- **Limpeza do Banco de Dados**: Criado e executado o script `fix_centro_bug.ts` para varrer o Supabase e retificar as classificações corrompidas de imóveis antigos.

## [3.3.0] — 2026-05-22

### ✨ Adicionado
- **Filtro Nativo de Kitnets**: Kitnets, Studios e Lofts agora possuem um botão de filtro exclusivo ("Kitnet") que mapeia propriedades cadastradas com "0 quartos", evitando que se percam no filtro genérico de 1 quarto.
- **Filtro Anti-Temporada (`isSeasonal`)**: Novo classificador inteligente que bloqueia aluguéis de curto prazo (Airbnb, Diária, Réveillon, Carnaval, etc.), protegendo o foco na moradia de longo prazo.

### 🎨 UI & UX (Refinamentos)
- **Restauração de Estilos "Pastel"**: Os botões de toggle (Dono Direto, Com Foto, Favoritos, Limpar) tiveram seus estilos elegantes e suaves restaurados, desfazendo a padronização bruta imposta pela componentização genérica anterior.
- **PropertyCard Mais Leve**: Substituídas as sombras e bordas duras ("boxy") dos cards e dos "slots" do Oráculo por fundos translúcidos (`slate-50/50`) e degradês de imagem mais suaves, conferindo um aspecto "Apple/Airbnb-like".

### 🐛 Corrigido
- **A Morte Silenciosa dos Scrapers**: Corrigido um erro crítico no GitHub Actions (`scraper.yml`) onde as dependências da pasta `scraper/` (como o `playwright-extra`) não eram instaladas, fazendo com que o robô falhasse repetidamente. O script agora roda `npm install` no diretório correto.
- **Build da Vercel Quebrado**: O processo de *build* do Next.js na Vercel estava quebrando ao tentar validar as tipagens TypeScript dentro da pasta do scraper (onde removemos a dependência do SQLite). Adicionado `"exclude": ["scraper"]` no `tsconfig.json` para blindar a Vercel.
- **Vazamento de Imóveis Comerciais**: Aprimorado o detector `isCommercial` para identificar "Salas" e "Conjuntos" vazios que o VivaReal marcava com 0 quartos, protegendo ao mesmo tempo Kitnets residenciais.
- **Discrepância no Totalizador**: O número "Total de Imóveis" no Hero Banner estava incluindo lixo comercial não-visível. Agora os dados são pré-filtrados assim que chegam do Supabase, garantindo que a UI mostre a quantidade exata.
- **Filtro de "3+ Quartos"**: Corrigido bug lógico onde o botão `3+` filtrava apenas imóveis com *exatamente* 3 quartos, ignorando imóveis maiores.

---

## [3.2.0] — 2026-05-22

### 🏗️ Arquitetura e UI (Fase 1: Oráculo de Viabilidade)
- **Design System Criado**: O frontend foi componentizado em "peças de Lego" (`Button`, `Badge`, `Input`) para garantir leveza e escalabilidade, substituindo o amontoado de classes Tailwind em arquivos únicos.
- **`FilterBar` Separada**: A barra de filtros foi isolada do `ClientPropertyBrowser` para um componente próprio, melhorando a manutenibilidade do código.
- **Card Preparado para o Oráculo**: O componente `PropertyCard` foi refatorado estruturalmente para exibir as futuras "Badges" do Oráculo (como CTM e Tempo de Deslocamento).
- **SEO & Hidratação de Rota (Planejamento)**: Decidido o modelo híbrido onde rotas dinâmicas captam buscas no Google (`/aluguel/[bairro]`), mas a navegação na plataforma usa estado global + Query Params para não restringir a busca do usuário.
- **Arquitetura Geográfica de Custo Zero**: Definido que o limite da API do OpenStreetMap será contornado por meio de uma tabela `geocache` nativa no próprio banco do Supabase, eliminando qualquer infraestrutura de proxy local (Datasette/SQLite).

## [3.1.0] — 2026-05-21

### 🚀 Novidades e Correções

### ✨ Adicionado
- **Nova Zona Sudoeste (AP4)**: Bairros como Barra da Tijuca, Recreio, Jacarepaguá, Anil, Camorim, etc., foram separados da Zona Oeste e agrupados como "Zona Sudoeste" para facilitar a busca.
- **Filtro de Favoritos**: Funcionalidade ativada e corrigida no UI. Agora é possível filtrar para visualizar apenas os imóveis favoritados localmente (`localStorage`).
- **Aviso de Cookies (LGPD)**: Adicionado um banner flutuante informando o uso de cookies/localStorage para salvar favoritos e filtros.
- **Fechamento Automático de Menus**: Os menus suspensos de "Sites" e "Bairros" agora fecham magicamente ao clicar em qualquer lugar fora deles (Click Outside Handler adicionado).
- **Hard Reset Integrado**: Migração total e limpa para o Supabase. O cache antigo local foi apagado para forçar a busca 100% fresca de imóveis.
- **Expansão Chaves na Mão**: Limite de busca ampliado de 15 para 40 páginas para resgatar o máximo de imóveis residenciais.

### 🐛 Corrigido
- **Filtro Anti-Carros no Mercado Livre**: O scraper estava puxando anúncios patrocinados de carros e óleo de motor porque o ML exibe de tudo. Foi criada uma trava de domínio forçando apenas URLs `imovel.mercadolivre.com.br`.
- **Anúncios Fantasmas e Vercel Build**: Removidos permanentemente do Supabase (com permissão `SERVICE_ROLE`) 41 anúncios fantasmas (carros do ML e lixos do ZAP) que continuavam aparecendo mesmo após os filtros de extração serem corrigidos. Também foram deletados scripts de debug que estavam quebrando o *Build* de produção na Vercel.
- **Lixo nos Bairros (Ruas do ML)**: O filtro de lixo não estava pegando alguns "bairros" porque o Mercado Livre estava enviando o nome da *Rua* em vez do bairro. Corrigido para passar a string completa ao classificador, eliminando falsos bairros como "Almirante Tamandaré 50".
- **Paginação Presa nos Filtros**: Corrigido um bug onde clicar no "Favoritos" ou em outro filtro em uma página avançada resultava em uma tela vazia (porque ele tentava exibir a página 3 de um resultado de 1 página).
- **Filtro de Lixo nos Bairros**: Nomes de bairros bizarros vindos do Mercado Livre e Chaves na Mão ("aciSala/Conjunto para alugar", "15 de mai", etc.) foram extirpados. Criamos um filtro em `normalize.ts` que ignora strings > 25 chars, e palavras como "LTDA", "Imóveis", "alugar", renomeando-os para "Desconhecido" (que é oculto na UI).

### 🏗️ Arquitetura e Engenharia
- **Expurgo de 7 Dias (Auto-Clean)**: Implementado rotina de expurgo no Supabase (`pg_cron`) para deletar anúncios mais velhos que 7 dias. Com isso, os scrapers recadastram anúncios que ainda estiverem online como "novos", garantindo um frescor máximo na listagem e matando anúncios zumbis.
- **Scrapers Stateless**: Removida a dependência do arquivo local `properties.json`. Os scrapers agora buscam a lista de IDs existentes diretamente do Supabase em tempo real, permitindo uma dedicação perfeita (onConflict) sem necessidade de cache local ou de commit no repositório.
- **Node.js 22 no GitHub Actions**: Atualizamos a versão do Node.js nos runners de 20 para 22 para habilitar suporte nativo a WebSockets, exigência crítica da nova biblioteca do Supabase que quebrava silenciosamente a extração.
- **Retry Automático nos Scrapers (GitHub Actions)**: Se ocorrer um erro de rede temporário (ex: `ENOTFOUND` com Supabase), o scraper tenta novamente até 3 vezes antes de falhar, evitando que o fluxo quebre atoa.
- **Alertas de Falha Crítica**: Adicionada uma etapa (`gh issue create`) no GitHub Actions para gerar uma Issue alertando o dono do repositório em caso de falha persistente nos scrapers.
- **Sync ML e Chaves na Mão**: Foi corrigido o bug onde ML e Chaves na Mão exibiam "0 imóveis" por causa da mudança drástica no HTML do ML (agora usando classes `.poly-component`). O scraper foi 100% reescrito.

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
