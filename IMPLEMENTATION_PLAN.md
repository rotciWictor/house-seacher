# Plano de Implementação: Refatoração 3 Estrelas (Design System & SEO Max)

Este documento centraliza o plano técnico da arquitetura de SEO e Design System.

## 1. O Problema da Hidratação vs Flexibilidade Total
**Cenário:** O usuário NÃO pode ser restringido por "Zona". Ele tem que poder comparar imóveis em Cascadura (Norte), Campo Grande (Oeste) e Jacarepaguá (Sudoeste) na mesma tela, com flexibilidade total.

**Solução: Rotas de Entrada (SEO) vs Estado Global (Query Params):**
- **A Experiência do Usuário (UX Livre):** A tela principal do aplicativo viverá na raiz (`/`). Qualquer filtro selecionado apenas "hidrata" a URL com Query Params (ex: `/?bairros=cascadura,campo-grande,jacarepagua`).
- **As Portas para o Google (SEO Michelin):** Criamos rotas *somente para indexação*, como `/aluguel/cascadura` ou `/aluguel/zona-sul`.
- **A Mágica da Transição:** Se alguém buscar no Google "Aluguel Cascadura", cai na nossa rota SEO. Se adicionar "Campo Grande" no filtro, o React intercepta a ação e atualiza a URL para `/?bairros=cascadura,campo-grande` sem piscar a tela.

## 2. Preparação para o "Oráculo de Viabilidade" (Integrações Futuras)
O Design System será construído focado em leveza (PWA) e escalabilidade de estado para comportar os futuros vetores de dados:
- **CTM (Custo Total de Moradia):** Integração com SPPO/BRT (DATA.RIO).
- **Índice de Segurança e Risco:** Integração com **Fogo Cruzado API** (histórico de tiroteios) e CISP (ISP Dados).
- **Vitalidade Urbana e Poluição Sonora:** Integração com Canal 1746 (degradação/enchentes) e APIs de mobilidade (Waze, OSM) para mapear bares, boates e caminhabilidade.
- **Educação e Infra Social:** Integração IDEB/INEP.

## 3. Arquitetura de Geocodificação (Custo 0 Reais)
Para contornar o limite de 1 requisição/segundo do OpenStreetMap (Nominatim) **SEM usar servidores locais (Datasette/SQLite)**, utilizaremos a infraestrutura Cloud gratuita que já possuímos:
- **Cache de Geocodificação no Supabase:** Criaremos uma tabela `geocache` no Supabase (PostgreSQL gratuito). Quando o scraper rodar no GitHub Actions (também grátis), ele consulta o Supabase primeiro. Se o endereço não existir, ele bate no OSM respeitando o limite, e salva no Supabase. Custo 100% zero, sem infraestrutura local para manter.

## 4. Componentização (Design System)
Refatorar `src/app/page.tsx` para usar:
- `src/components/ui/Button.tsx`, `Badge.tsx`, `Input.tsx` (Primitives).
- `src/components/PropertyCard.tsx`, `Hero.tsx`, `FilterBar.tsx` (Features).

## 5. Integração Contínua de Regras (AI_README)
- Adicionada regra estrita obrigando a atualização do `CHANGELOG.md`.
