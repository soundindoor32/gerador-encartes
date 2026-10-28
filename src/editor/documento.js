// Estrutura do documento do encarte.
// Um encarte é um JSON: tamanho, fundo e uma lista de elementos (do fundo para a frente).
// Tudo que aparece no encarte é um elemento editável.

export const VERSAO_DOCUMENTO = 1;

export const FORMATOS = [
  { id: 'encarte', nome: 'Encarte vertical (2:3)', largura: 1080, altura: 1620 },
  { id: 'a4', nome: 'Folha A4', largura: 1240, altura: 1754 },
  { id: 'post', nome: 'Post quadrado (Instagram)', largura: 1080, altura: 1080 },
  { id: 'retrato', nome: 'Post retrato (4:5)', largura: 1080, altura: 1350 },
  { id: 'story', nome: 'Story / Status (9:16)', largura: 1080, altura: 1920 }
];

let contador = 0;
export const novoId = () => `e${Date.now().toString(36)}${(contador++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const ESTILO_CARD_PADRAO = {
  variante: 'faixa',          // 'faixa' | 'selo' | 'etiqueta' | 'fita' | 'caixa'
  lado: 'esquerda',           // card 'fita': lado da foto
  corFundo: '#FFFFFF',
  corBorda: '#D8DEE9',
  raio: 14,
  corNome: '#0D2C6B',
  corDescricao: '#1E2533',
  corPrecoFundo: '#FFD21F',
  corPrecoTexto: '#0D2C6B',
  corDestaque: '#0D2C6B',     // caixa do "R$" (faixa) ou borda do selo
  fonteNome: 'Montserrat',
  fontePreco: 'Montserrat',
  tamanhoNome: 15,
  tamanhoDescricao: 11,
  maiusculas: true,
  mostrarDescricao: true,
  alturaImagem: 0.5           // fração da altura do card ocupada pela foto
};

const BASE = { rotacao: 0, opacidade: 1, bloqueado: false, oculto: false };

export function criarElemento(tipo, props = {}) {
  const padrao = {
    texto: {
      w: 400, texto: 'Texto', fonte: 'Montserrat', peso: '800', tamanho: 48, cor: '#0D2C6B',
      alinhamento: 'left', alturaLinha: 1.05, espacamento: 0,
      contornoCor: '#0D2C6B', contornoLargura: 0,
      sombraCor: '#0A1F4D', sombraX: 0, sombraY: 0, sombraDesfoque: 0,
      fundo: null, fundoRaio: 8, fundoPadding: 10
    },
    retangulo: {
      w: 300, h: 200, cor: '#0D2C6B', gradiente: null, raio: 0, bordaCor: '#FFFFFF', bordaLargura: 0, sombra: false
    },
    elipse: { w: 200, h: 200, cor: '#FFD21F', gradiente: null, bordaCor: '#FFFFFF', bordaLargura: 0, sombra: false },
    // pontos normalizados (0 a 1) dentro da largura/altura do elemento
    poligono: { w: 400, h: 200, pontos: [[0, 0.25], [1, 0], [1, 0.75], [0, 1]], cor: '#7DB548', gradiente: null, bordaCor: '#FFFFFF', bordaLargura: 0, sombra: false },
    raios: { w: 600, h: 400, cor1: '#0D3A9A', cor2: '#1650C2', quantidade: 28, centroX: 0.5, centroY: 0.45 },
    linha: { w: 400, h: 4, cor: '#FFFFFF', espessura: 2, tracejado: true },
    icone: { w: 64, h: 64, icone: 'carrinho', cor: '#0D2C6B', corInterna: '#FFFFFF' },
    imagem: { w: 300, h: 300, src: null, ajuste: 'contain', raio: 0 },
    logo: { w: 220, h: 140, corTexto: '#0D2C6B' },
    produto: {
      w: 196, h: 270, produtoId: null,
      campos: { nome: '', descricao: '', preco: null, unidade: 'un', imagem: null },
      editados: [],
      estilo: { ...ESTILO_CARD_PADRAO }
    }
  }[tipo];
  if (!padrao) throw new Error(`Tipo de elemento desconhecido: ${tipo}`);
  return { id: novoId(), tipo, x: 0, y: 0, ...BASE, ...structuredClone(padrao), ...props };
}

export function novoDocumento(formato = FORMATOS[0], fundo = '#F4F6FA') {
  return {
    versao: VERSAO_DOCUMENTO,
    largura: formato.largura,
    altura: formato.altura,
    fundo: { cor: fundo, gradiente: null },
    elementos: []
  };
}

// Converte um produto do catálogo nos campos de um card
export function camposDoProduto(p) {
  return {
    nome: p.nome_curto || p.nome || '',
    descricao: p.descricao || '',
    preco: p.preco ?? null,
    unidade: p.unidade || 'un',
    imagem: p.imagem_recortada || p.imagem || null
  };
}

// Atualiza os campos vinculados ao catálogo, preservando o que foi editado à mão
export function sincronizarCard(el, produto) {
  const novos = camposDoProduto(produto);
  const campos = { ...el.campos };
  for (const chave of Object.keys(novos)) {
    if (!el.editados.includes(chave)) campos[chave] = novos[chave];
  }
  return { ...el, campos };
}

// Para salvar como modelo: esvazia os cards (viram espaços para produtos)
export function esvaziarCards(doc) {
  return {
    ...doc,
    elementos: doc.elementos.map(el => el.tipo === 'produto'
      ? { ...el, produtoId: null, editados: [], campos: { nome: '', descricao: '', preco: null, unidade: 'un', imagem: null } }
      : el)
  };
}

// Cria cópias novas de elementos (ids novos), deslocadas
export function clonarElementos(lista, deslocamento = 20) {
  return lista.map(el => ({ ...structuredClone(el), id: novoId(), x: el.x + deslocamento, y: el.y + deslocamento }));
}

export const NOMES_TIPOS = {
  texto: 'Texto', retangulo: 'Retângulo', elipse: 'Círculo', poligono: 'Forma', raios: 'Raios', linha: 'Linha',
  icone: 'Ícone', imagem: 'Imagem', logo: 'Logo da loja', produto: 'Card de produto'
};

export function rotuloElemento(el) {
  if (el.nome) return el.nome;
  if (el.tipo === 'texto') return el.texto.replace(/\s+/g, ' ').slice(0, 28) || 'Texto';
  if (el.tipo === 'produto') return el.campos.nome ? el.campos.nome.slice(0, 28) : 'Card vazio';
  return NOMES_TIPOS[el.tipo];
}
