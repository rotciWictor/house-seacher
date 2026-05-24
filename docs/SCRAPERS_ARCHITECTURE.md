# Arquitetura e Estratégia dos Scrapers (House Searcher)

Este documento detalha o motor de captura de dados do **House Searcher**. Aqui explicamos as técnicas utilizadas, por que foram escolhidas, os obstáculos enfrentados em cada plataforma, e as alternativas disponíveis no mercado de engenharia de dados.

---

## 1. A Técnica Atual: Arquitetura em Duas Fases (Two-Phase Scraping)

Atualmente, todos os nossos robôs operam em uma abordagem de "Duas Fases", rodando de forma 100% invisível utilizando `playwright` aliado ao plugin de camuflagem `puppeteer-extra-plugin-stealth`. 

### Fase 1: Discovery (Reconhecimento de Vitrine)
O robô entra na página de busca geral (ex: imóveis para alugar no RJ até R$ 1000). Em vez de tentar extrair dados ricos logo de cara, ele apenas rola a página para baixo simulando um humano (Auto-Scroll) e extrai os *Links* e *Preços Básicos*. Se o anúncio já existe no nosso Supabase ou se o preço está fora do escopo, ele é instantaneamente ignorado.
- **Vantagem**: Reduz o tráfego e evita que sejamos bloqueados logo na porta de entrada.

### Fase 2: Deep Scraping (Infiltração Profunda)
Com a lista de links INÉDITOS em mãos, o robô entra em cada anúncio individualmente. Em vez de depender do layout visual do site (que muda constantemente), o robô busca por **Metadados Ocultos** (como tags `<script type="application/ld+json">`) ou o conteúdo cru de texto do corpo do site. 
- **Objetivo**: Descobrir o texto original escrito pelo corretor para aplicar nossos poderosos filtros anti-fraude e anti-comercial (`isCommercial` e `isSeasonal`).

---

## 2. Visão Detalhada por Fonte (Portal)

### 🟧 ZAP Imóveis e VivaReal
Ambos pertencem à mesma empresa-mãe. Eles utilizam proteções brutais de segurança (Cloudflare Bot Management de nível Enterprise).
- **Técnica Usada**: Headless Chrome (Playwright) com injeção de Headers e evasão de impressões digitais (Stealth).
- **Por que?**: Uma requisição normal (fetch ou Axios) retorna instantaneamente um **Erro 403 (Acesso Negado)** ou um Desafio de Captcha impossível de resolver via servidor.

### 🟨 Mercado Livre
O Mercado Livre não utiliza proteção agressiva de IP, mas o HTML deles é renderizado dinamicamente pelo React (Componentes Poly).
- **Técnica Usada**: Playwright aguardando o carregamento da árvore de elementos (DOM) para extrair os seletores flexíveis.
- **Desafio**: O Mercado Livre mistura anúncios de Carros, Terrenos e Quartos de Motel na mesma busca. Dependemos fortemente dos nossos filtros de normalização de bairro e regex profundo para purificar o JSON-LD antes de salvar.

### 🟦 Chaves na Mão
Site mais simples e "old-school", não exige JavaScript pesado para carregar a vitrine.
- **Técnica Usada Híbrida**: Na Fase 1 (vitrine) ele aguenta chamadas rápidas e leves. Na Fase 2 (Deep Scrape), o servidor deles é frequentemente instável e demora até 15 segundos para responder. Usamos Playwright para forçar o limite de tempo (Timeout) e evitar estolar o backend.

---

## 3. Análise de Alternativas e Viabilidade

Será que não havia uma forma melhor, mais rápida ou mais "limpa" de fazer isso? Abaixo, as alternativas e por que elas (não) são recomendadas para este projeto:

### ❌ Alternativa 1: APIs Oficiais e Homologadas
Imobiliárias grandes pagam por "feeds" XML ou acesso a APIs oficiais para enviar/receber dados do ZAP/VivaReal. 
- **Viabilidade**: Nula.
- **Por que não usamos?**: Essas APIs são fechadas a 7 chaves. O acesso custa milhares de reais ou exige CNPJ de corretora com parceria vigente. Totalmente incompatível com a natureza Open Source e gratuita do *House Searcher*.

### ⚠️ Alternativa 2: Engenharia Reversa da API Privada (BFF/GraphQL)
É possível abrir a aba "Network" do navegador, descobrir qual URL o site original chama em segundo plano (ex: `https://api.vivareal.com.br/v1/listings`) e imitar essa chamada diretamente no nosso código de forma pura e ultrarrápida (sem abrir navegador virtual).
- **Viabilidade**: Baixa a médio prazo (Alto Custo de Manutenção).
- **Por que não usamos?**: Embora seja 100x mais rápido que o Playwright, o grupo OLX/ZAP e Mercado Livre alteram assinaturas criptográficas dinâmicas (Tokens JWT gerados no front-end por bibliotecas ofuscadas) em toda requisição. Imitar a API funciona por 3 dias, até eles trocarem o algorítmo e o robô quebrar, exigindo manutenção diária insustentável.

### ⚠️ Alternativa 3: Parsing Estático (Cheerio / Axios Puro)
Em vez de simular um navegador Chrome (`playwright`), faríamos apenas um download bruto do código HTML da página.
- **Viabilidade**: Baixa.
- **Por que não usamos?**: Sites modernos são SPAs (Single Page Applications). Se você baixar o HTML puro do ZAP, ele virá praticamente em branco com um aviso *"Ative o Javascript"*. Só funciona bem no Chaves na Mão, e de forma bem limitada.

### 💸 Alternativa 4: Serviços Pagos de Proxies Residenciais / API de Scraping
Serviços como *ScrapingBee* ou *BrightData* que quebram os captchas e geram IPs residenciais na nuvem por você.
- **Viabilidade**: Alta performance, mas Alto Custo Financeiro.
- **Por que não usamos?**: Nosso modelo atual roda de forma 100% gratuita nos "computadores alugados de graça" do GitHub Actions. Inserir proxies pagos destruiria o modelo de "Custo Zero" do projeto.

---

## 4. O Veredito / Recomendação

A técnica atual (**Playwright Stealth em Paralelo no GitHub Actions**) é a única arquitetura **Altamente Recomendada e Viável** para o propósito do House Searcher.

Ela é o "Sweet Spot" (Ponto de Equilíbrio) porque:
1. **É gratuita**: Rodamos nos runners da Microsoft sem custo.
2. **É invisível**: Engana as proteções do Cloudflare imitando perfeitamente o navegador real.
3. **Escala Horizontalmente**: O único defeito dessa técnica é que ela é **muito lenta** (leva ~20 minutos para visitar 30 páginas com centenas de imóveis). Nós contornamos isso elegantemente separando a carga em *5 máquinas paralelas diferentes* usando a `Matrix` no Github Actions.

Não há técnica melhor disponível hoje sem injetar recursos financeiros no projeto ou perder horas diárias mantendo APIs hackeadas.
