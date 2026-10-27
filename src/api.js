// A mesma interface roda em dois modos:
// - desktop (Electron): window.api existe e os dados ficam na pasta local
// - online (navegador): os dados ficam no Supabase (src/nuvem/backend.js)
import { chamarNuvem, urlPublica } from './nuvem/backend.js';

export const modoDesktop = typeof window !== 'undefined' && Boolean(window.api);

// Lança Error com a mensagem amigável em caso de falha.
export async function api(canal, ...args) {
  const r = modoDesktop ? await window.api.chamar(canal, ...args) : await chamarNuvem(canal, ...args);
  if (!r.ok) throw new Error(r.erro);
  return r.dados;
}

// No desktop vira o caminho do arquivo no disco; online, o próprio arquivo é enviado
export const caminhoDoArquivo = file => (modoDesktop ? window.api.caminhoDoArquivo(file) : file);

export function urlImagem(relativo) {
  if (!relativo) return null;
  if (/^(data:|blob:|https?:|encarte:)/.test(relativo)) return relativo;
  return modoDesktop ? `encarte://dados/${relativo}` : urlPublica(relativo);
}

// Aceita 12.99, "12,99", "R$ 1.299,90", "1299.9"
export function lerPreco(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Math.round(valor * 100) / 100;
  let s = String(valor).replace(/R\$|\s/gi, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export function partesPreco(preco) {
  if (preco === null || preco === undefined) return null;
  const [inteiro, centavos] = Number(preco).toFixed(2).split('.');
  return { inteiro: Number(inteiro).toLocaleString('pt-BR'), centavos };
}

export const formatarPreco = preco =>
  preco === null || preco === undefined
    ? ''
    : Number(preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SEGMENTOS = [
  { valor: 'geral', nome: 'Geral' },
  { valor: 'supermercado', nome: 'Supermercado' },
  { valor: 'eletronicos', nome: 'Eletrônicos' },
  { valor: 'vestuario', nome: 'Vestuário' }
];

export const UNIDADES = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct', 'dz', 'par'];
