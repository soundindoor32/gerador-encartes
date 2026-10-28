// Fontes embutidas no app (funcionam offline). Para adicionar outra família:
// 1) npm install @fontsource/nome  2) importe os pesos aqui  3) inclua em FONTES.
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/latin-800.css';
import '@fontsource/montserrat/latin-900.css';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource/anton/latin-400.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-700.css';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-800.css';
import '@fontsource/poppins/latin-900.css';
import '@fontsource/roboto-condensed/latin-400.css';
import '@fontsource/roboto-condensed/latin-700.css';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/alfa-slab-one/latin-400.css';
import '@fontsource/kaushan-script/latin-400.css';

export const FONTES = [
  { familia: 'Montserrat', pesos: ['400', '700', '800', '900'] },
  { familia: 'Archivo Black', pesos: ['400'] },
  { familia: 'Anton', pesos: ['400'] },
  { familia: 'Bebas Neue', pesos: ['400'] },
  { familia: 'Oswald', pesos: ['500', '700'] },
  { familia: 'Poppins', pesos: ['400', '600', '800', '900'] },
  { familia: 'Roboto Condensed', pesos: ['400', '700'] },
  { familia: 'Lilita One', pesos: ['400'] },
  { familia: 'Barlow Condensed', pesos: ['500', '700', '800'] },
  { familia: 'Alfa Slab One', pesos: ['400'] },
  { familia: 'Kaushan Script', pesos: ['400'] }
];

export const NOMES_PESOS = { '400': 'Normal', '500': 'Médio', '600': 'Seminegrito', '700': 'Negrito', '800': 'Extra negrito', '900': 'Black' };

export function pesosDa(familia) {
  return FONTES.find(f => f.familia === familia)?.pesos || ['400'];
}

// Maior peso disponível até o alvo (evita negrito "falso" em fontes de peso único)
export function pesoAte(familia, alvo) {
  const pesos = pesosDa(familia);
  const ate = pesos.filter(p => Number(p) <= Number(alvo));
  return ate.length ? ate[ate.length - 1] : pesos[0];
}

// O canvas só desenha com a fonte certa depois que ela foi carregada
let promessa = null;
export function carregarFontes() {
  if (!promessa) {
    const cargas = FONTES.flatMap(f => f.pesos.map(p => document.fonts.load(`${p} 40px "${f.familia}"`, 'ÁÇãé0R$')));
    promessa = Promise.all(cargas).catch(() => null);
  }
  return promessa;
}
