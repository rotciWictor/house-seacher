import { normalizeNeighborhood } from '../src/utils/normalize';

const tests = [
    'Copacabamna', // Copacabana
    'Nileropolis', // Nilópolis -> wait, normalizeNeighborhood looks at OFFICIAL_BAIRROS, which doesn't have cities, but let's test neighborhoods.
    'Tihuca', // Tijuca
    'Ancorajen', // Ancoragem -> wait, this is from the Colab notebook. We don't have Ancoragem, but let's test "Botaffogo"
    'Botaffogo',
    'Ipaanema',
    'Recreio dos Mandeirantes', // Recreio dos Bandeirantes
];

console.log('--- TESTE DE FUZZY MATCHING ---');
for (const t of tests) {
    const res = normalizeNeighborhood(t);
    console.log(`Original: "${t}" -> Normalizado: "${res}"`);
}
