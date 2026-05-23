import { isCommercial } from './src/utils/normalize';

const titles = [
    "Loja / Salão / Ponto Comercial com 1 Quarto para venda ou aluguel, 18m² - Recreio Dos Bandeirantes",
    "Terreno / Lote Comercial para alugar, 100m² - Taquara"
];

for (const t of titles) {
    console.log(`"${t}" => Comercial?`, isCommercial(t, ""));
}
