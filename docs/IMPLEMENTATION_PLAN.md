# Plano de Implementação Tático

Este documento centraliza o plano técnico da arquitetura atual do House Searcher.

## 1. Concluído Recente (v3.4.0)
- **Fuzzy Matching e Limpeza Defensiva**: Integração do `fastest-levenshtein` e criação do pipeline `limpar_e_padronizar_texto` para correção ortográfica automática dos bairros.
- **Segunda Vista no Lixo**: Criação do `recoverNeighborhood` para resgatar anúncios em que o bairro estava corrompido, extraindo a informação de geolocalização através de varredura no Título e Descrição.
- **Oficialização Open Source**: Adicionada Licença MIT.

## 2. Próximo Passo: Arquitetura de Geocodificação (Geocache)

## 2. Preparação para o "Oráculo de Viabilidade" (Integrações Futuras)
O Design System será construído focado em leveza (PWA) e escalabilidade de estado para comportar os futuros vetores de dados:
- **CTM (Custo Total de Moradia):** Integração com SPPO/BRT (DATA.RIO).
- **Índice de Segurança e Risco:** Integração com **Fogo Cruzado API** (histórico de tiroteios) e CISP (ISP Dados).
- **Vitalidade Urbana e Poluição Sonora:** Integração com Canal 1746 (degradação/enchentes) e APIs de mobilidade (Waze, OSM) para mapear bares, boates e caminhabilidade.
- **Educação e Infra Social:** Integração IDEB/INEP.

## 3. Arquitetura de Geocodificação (Custo 0 Reais)
# Motor de Geocodificação de Custo Zero (Geocache)

Implementar uma infraestrutura de cache geográfico no Supabase para viabilizar cálculos analíticos (Segurança, Caminhabilidade, Custo de Transporte) sem estourar limites de requisição ou gastar com APIs pagas.

> [!IMPORTANT]
> **Automação Documental Ativada (Cognitive Hook)**: Esta e todas as futuras implementações terão seu fechamento atrelado à atualização simultânea e autônoma do `CHANGELOG.md` e do `implementation_plan.md`.

## User Review Required

> [!WARNING]
> O OpenStreetMap (Nominatim) exige um cabeçalho `User-Agent` válido e restringe o uso a 1 requisição por segundo. O design prevê um delay (`sleep`) no scraper ao consultar endereços em massa. Está de acordo com essa limitação proposital de velocidade durante o scraping?

## Open Questions

- Como deseja que lidemos com os imóveis que já estão no banco e não têm lat/lng? Quer que façamos um script (run once) de backfill ou o próprio frontend/backend vai preenchendo aos poucos quando o usuário visualizar? *(Recomendado: O Scraper faz isso gradualmente nas próximas execuções).*

## Proposed Changes

---

### Banco de Dados (Supabase)

#### [NEW] `scripts/migrations/01_geocache.sql`
- Script SQL para criar a tabela `geocache`.
- Colunas:
  - `address` (TEXT, PRIMARY KEY): O endereço formatado (ex: "Rua X, Bairro Y, Rio de Janeiro, RJ").
  - `lat` (FLOAT): Latitude.
  - `lng` (FLOAT): Longitude.
  - `found` (BOOLEAN): Para evitar re-tentar endereços que o Nominatim comprovadamente não encontrou.
  - `created_at` (TIMESTAMPTZ).

### Lógica de Extração e Integração (Scraper & Utils)

#### [NEW] `src/utils/geocoding.ts`
- Função genérica `geocodeAddress(address: string)` que:
  1. Consulta a tabela `geocache` via Supabase.
  2. Se encontrado (cache hit), retorna instantaneamente.
  3. Se não encontrado (cache miss), chama a API do Nominatim com um pequeno delay.
  4. Salva o resultado no `geocache` e retorna as coordenadas.

#### [MODIFY] `scraper/enrich.ts` ou Scrapers Individuais
- Integrar a chamada de geocodificação no processo de scraping ou enriquecimento, associando a `lat`/`lng` ao `Property` final no Supabase (se precisarmos das coordenadas no card).

## Verification Plan

### Automated Tests
- Executar um script de teste localmente (`npx tsx scripts/test_geo.ts`) que busca "Copacabana, Rio de Janeiro", garantindo que a primeira vez leva ~1s e a segunda vez bate no cache em ~50ms.

### Manual Verification
- Checar no painel do Supabase se a tabela `geocache` foi criada corretamente e está armazenando os endereços pesquisados.

## 4. Componentização (Design System)
Refatorar `src/app/page.tsx` para usar:
- `src/components/ui/Button.tsx`, `Badge.tsx`, `Input.tsx` (Primitives).
- `src/components/PropertyCard.tsx`, `Hero.tsx`, `FilterBar.tsx` (Features).

## 5. Integração Contínua de Regras (AI_README)
- Adicionada regra estrita obrigando a atualização do `CHANGELOG.md`.
