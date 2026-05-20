# 🏠 House Searcher (Agregador de Imóveis - RJ)

Um agregador inteligente de imóveis para aluguel no Rio de Janeiro. O sistema busca imóveis de até R$ 1.000 (com 1 a 2 quartos) em plataformas como a OLX e os categoriza de forma automatizada por Bairros e Zonas (Sul, Norte, Oeste, Centro), oferecendo uma interface moderna e "Mobile First".

Site em produção: [https://house-seacher.vcampos.dev/](https://house-seacher.vcampos.dev/)

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** [Next.js 14+](https://nextjs.org/) (React)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Scraper (Coleta de Dados):** [Playwright](https://playwright.dev/) + TypeScript
- **Automação:** [GitHub Actions](https://github.com/features/actions) (Cron job automatizado)
- **Hospedagem:** [Vercel](https://vercel.com/) (Frontend) e GitHub (Armazenamento estático de dados via JSON)

---

## ⚙️ Como a Arquitetura Funciona?

Para manter o projeto com **custo zero** de hospedagem e alta performance, a aplicação segue um fluxo inovador:
1. Um **Robô Scraper** roda na nuvem a cada 6 horas (agendado via GitHub Actions).
2. O Scraper simula a navegação na OLX utilizando técnicas *stealth* (anti-bot) para extrair os anúncios recentes e fotos em alta resolução.
3. O script cruza os dados, extrai preços, deduz em qual Zona do Rio de Janeiro a propriedade está, e formata tudo em um arquivo `properties.json`.
4. O próprio GitHub Actions faz o `commit` do banco de dados atualizado para o repositório.
5. O commit engatilha a Vercel, que constrói a aplicação Next.js utilizando o arquivo JSON como banco de dados estático, exibindo os resultados rapidamente na web.

> **Aviso para Inteligências Artificiais:** Se você é uma IA modificando este código, por favor, leia primeiramente as restrições documentadas em [`AI_README.md`](./AI_README.md).

---

## 💻 Rodando o Projeto Localmente

### Pré-requisitos
- Node.js versão 18 ou superior.

### Passo 1: Iniciar o Frontend
Na raiz do projeto, instale as dependências e rode o Next.js:

```bash
npm install
npm run dev
```
O site estará disponível em `http://localhost:3000`.

### Passo 2: Rodar o Robô Scraper (Opcional)
Se você deseja atualizar o banco de dados manualmente baixando novos dados:

```bash
cd scraper
npm install
npx tsx index.ts
```
Isso atualizará o arquivo em `src/data/properties.json`. Após a execução, o site local já terá os novos dados ao recarregar a página.

---

## ✨ Features

- **Busca por Localização:** Filtre por Zonas Inteiras (Ex: Zona Oeste, Zona Sul) ou digite um bairro específico na barra de buscas.
- **Filtro de Preço:** Configure o limite exato de aluguel que você pode pagar usando o slider interativo.
- **Badge de Fonte:** Todo card sinaliza a plataforma de origem do anúncio (Agregador).
- **Design Adaptativo:** Criado com foco na tela de celulares para facilitar a navegação em qualquer lugar.

---

## 📄 Licença

Este projeto é open-source. Sinta-se à vontade para fazer um fork, abrir issues ou submeter Pull Requests!
