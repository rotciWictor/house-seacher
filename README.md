# 🏠 House Searcher — Oráculo de Viabilidade Urbana (RJ)

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://house-seacher.vcampos.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Database](https://img.shields.io/badge/Database-Supabase-green?logo=supabase)](https://supabase.com/)
[![Scraper](https://img.shields.io/badge/Scraper-Playwright-2EAD33?logo=playwright)](https://playwright.dev/)

Um **agregador inteligente de imóveis para aluguel de baixa renda no Rio de Janeiro** (até R$ 1.000). O sistema varre automaticamente 4 plataformas a cada 6 horas, classifica por zona/bairro, e oferece uma interface moderna mobile-first.

**Mais que um classificado**: estamos construindo um motor de inteligência urbana que cruza dados de segurança pública, transporte, comércio local e infraestrutura para ajudar quem mais precisa a tomar decisões informadas.

🌐 **Site em produção**: [https://house-seacher.vcampos.dev/](https://house-seacher.vcampos.dev/)

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | [Next.js 16](https://nextjs.org/) (React 19) |
| **Estilização** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Scraping** | [Playwright](https://playwright.dev/) + stealth + [Cheerio](https://cheerio.js.org/) |
| **Automação** | [GitHub Actions](https://github.com/features/actions) (cron a cada 6h) |
| **Hospedagem** | [Vercel](https://vercel.com/) (frontend) + GitHub (dados estáticos via JSON) |
| **SEO** | JSON-LD (Schema.org), OG Tags, Sitemap dinâmico, PWA Manifest |

---

## ⚙️ Arquitetura (Custo Zero)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   OLX (10p) │    │  ZAP (10p)  │    │VivaReal(10p)│    │ Chaves(10p) │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       └──────────┬───────┴──────────┬───────┘                  │
                  ▼                  ▼                           ▼
          ┌───────────────────────────────────────────────────────┐
          │              Enrichment Engine (enrich.ts)            │
          │   Classifica zonas, corrige bairros, limpa dados      │
          └───────────────────────┬───────────────────────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │   properties.json (1168) │
                    │   Commitado no GitHub    │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Vercel (Next.js SSG)   │
                    │   CDN global + cache     │
                    └─────────────────────────┘
```

1. **GitHub Actions** roda os scrapers a cada 6h (ou manualmente)
2. Os scrapers simulam navegação real com técnicas anti-bot (stealth)
3. O `enrich.ts` classifica zonas do RJ usando base de +200 bairros
4. O JSON é commitado → Vercel faz deploy automático → site atualizado

---

## 📊 Fontes de Dados

| Fonte | Método | Páginas | Status |
|-------|--------|---------|--------|
| **OLX** | Playwright + stealth | 10 | ✅ Ativo |
| **ZAP Imóveis** | Playwright + stealth | 10 | ✅ Ativo |
| **VivaReal** | Playwright + stealth | 10 | ✅ Ativo |
| **Chaves na Mão** | Cheerio (HTTP puro) | 10 | ✅ Ativo |
| **Mercado Livre** | Playwright + stealth | 5 | ✅ Ativo |
| **Telegram** | Pyrogram/Telethon | — | 🔜 Planejado |

---

## ✨ Features Atuais

- 🔍 **Busca por texto** — filtra por título, bairro ou descrição
- 📍 **Filtro por zona** — Oeste, Norte, Sul, Centro, Niterói, São Gonçalo, Baixada
- 🏘️ **Filtro por bairro** — dropdown dinâmico baseado na zona selecionada
- 💰 **Filtro de preço** — slider com range R$ 100 – R$ 1.000
- 🛏️ **Filtro de quartos** — 1, 2, 3+ quartos
- 👤 **Direto c/ Dono** — mostra só anúncios sem corretor
- 📷 **Com foto** — esconde anúncios sem imagem
- 📱 **Design mobile-first** — otimizado para celulares
- 🏷️ **Badges inteligentes** — fonte, zona, preço, tempo relativo
- 🛡️ **Fuzzy Matching & Limpeza Defensiva** — corrige erros de digitação de corretores e classifica os bairros com precisão via `fastest-levenshtein`
- 📈 **SEO completo** — Schema.org, OG Tags, sitemap, PWA

---

## 🗺️ Roadmap v3.0 — Oráculo de Viabilidade Urbana

O objetivo final é que cada imóvel tenha um **dossiê completo** antes do locatário sair de casa:

| Feature | Fonte de Dados | Status |
|---------|---------------|--------|
| 🗺️ Mapa interativo com marcadores | Leaflet + OpenStreetMap | 🔜 |
| 📍 Geocodificação automática | Nominatim (cache Supabase) | 🔜 |
| 🛡️ Score de Risco Criminal | ISP Dados RJ + Fogo Cruzado API | 🔜 |
| 🚶 Score de Caminhabilidade | Overpass API (mercados, metrô, farmácias) | 🔜 |
| 🔇 Score de Tranquilidade | Overpass API (bares, boates, vias expressas) | 🔜 |
| 💸 Custo Total de Moradia (CTM) | Data.Rio (GTFS/SPPO) | 🔜 |
| 🚨 Alerta de Golpe | Desvio padrão preço/m² + image hashing | 🔜 |
| 📱 Alertas via WhatsApp | WhatsApp Cloud API (grátis) | 🔜 |
| 🏫 Qualidade escolar próxima | INEP/QEdu (índice IDEB) | 🔜 |
| 🚰 Degradação urbana | Data.Rio (chamados 1746) | 🔜 |

---

## 💻 Rodando Localmente

### Pré-requisitos
- Node.js 18+
- Playwright instalado (`npx playwright install chromium`)

### Frontend
```bash
npm install
npm run dev
```
O site estará em `http://localhost:3000`.

### Scrapers (atualizar dados)
```bash
# OLX (10 páginas, ~5 min)
npx tsx scraper/index.ts

# ZAP + VivaReal (10 páginas cada, ~5 min)
npx tsx scraper/zap.ts

# Chaves na Mão (10 páginas, ~15 seg)
npx tsx scraper/chavesnamao.ts

# Reclassificar zonas
npx tsx scraper/enrich.ts
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais informações.
Fork, issues e PRs são extremamente bem-vindos!

> **Para IAs e Contribuidores**: Leia a documentação técnica na pasta `docs/`.
> Comece pelo [`docs/AI_README.md`](./docs/AI_README.md) e [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) antes de modificar o código.
