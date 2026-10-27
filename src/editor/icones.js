// Ícones desenhados em uma grade 24x24. Cada parte é preenchida ou contornada.
export const ICONES = {
  carrinho: {
    nome: 'Carrinho',
    partes: [
      { d: 'M2 3 H5 L7.5 15 H19 L21.5 6.5 H6', contorno: true },
      { d: 'M7.5 15 L6.5 18 H19', contorno: true },
      { d: 'M9 20.5 m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0 Z M17.5 20.5 m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0 Z' }
    ]
  },
  casa: {
    nome: 'Casa',
    partes: [{ d: 'M3 11 L12 3 L21 11 V21 H3 Z', contorno: true }]
  },
  casaCoracao: {
    nome: 'Casa com coração',
    partes: [
      { d: 'M3 11 L12 3 L21 11 V21 H3 Z', contorno: true },
      { d: 'M12 18 C8 15 7 13 8.3 11.4 C9.3 10.2 11 10.5 12 11.8 C13 10.5 14.7 10.2 15.7 11.4 C17 13 16 15 12 18 Z' }
    ]
  },
  coracao: {
    nome: 'Coração',
    partes: [{ d: 'M12 21 C4 15 1.5 11 4 7 C6 4 10 4.5 12 7.5 C14 4.5 18 4 20 7 C22.5 11 20 15 12 21 Z' }]
  },
  estrela: {
    nome: 'Estrela',
    partes: [{ d: 'M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z' }]
  },
  brilho: {
    nome: 'Brilho',
    partes: [{ d: 'M12 1 C12.6 7.5 16.5 11.4 23 12 C16.5 12.6 12.6 16.5 12 23 C11.4 16.5 7.5 12.6 1 12 C7.5 11.4 11.4 7.5 12 1 Z' }]
  },
  escudo: {
    nome: 'Escudo com check',
    partes: [
      { d: 'M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z' },
      { d: 'M8 12 L11 15 L16.5 9', contorno: true, corInterna: true }
    ]
  },
  medalha: {
    nome: 'Medalha',
    partes: [
      { d: 'M8 13 L5 22 L9 20 L11 23 L12 15 Z M16 13 L19 22 L15 20 L13 23 L12 15 Z' },
      { d: 'M12 2 m-7 7 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z' },
      { d: 'M12 5.3 L13.1 7.8 L15.8 8 L13.8 9.8 L14.4 12.4 L12 11 L9.6 12.4 L10.2 9.8 L8.2 8 L10.9 7.8 Z', corInterna: true }
    ]
  },
  joinha: {
    nome: 'Joinha',
    partes: [
      { d: 'M2 10 H6 V21 H2 Z' },
      { d: 'M8 10 L12 3 C13.5 3 14.5 4 14 6 L13 9.5 H19.5 C21 9.5 22 11 21.5 12.5 L19.5 19.5 C19.2 20.4 18.4 21 17.5 21 H8 Z' }
    ]
  },
  sacola: {
    nome: 'Sacola',
    partes: [
      { d: 'M4.5 8 H19.5 L18.5 22 H5.5 Z' },
      { d: 'M8.5 8 V6 A3.5 3.5 0 0 1 15.5 6 V8', contorno: true },
      { d: 'M9 11.5 m-1 0 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z M15 11.5 m-1 0 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z', corInterna: true }
    ]
  },
  local: {
    nome: 'Localização',
    partes: [{ d: 'M12 22 C12 22 19.5 14.5 19.5 9.5 A7.5 7.5 0 0 0 4.5 9.5 C4.5 14.5 12 22 12 22 Z M12 12.5 A3 3 0 1 0 12 6.5 A3 3 0 1 0 12 12.5 Z', regraPar: true }]
  },
  relogio: {
    nome: 'Relógio',
    partes: [
      { d: 'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z' },
      { d: 'M12 6 V12 L16 14.5', contorno: true, corInterna: true }
    ]
  },
  etiqueta: {
    nome: 'Etiqueta',
    partes: [{ d: 'M3 3 H11 L21.5 13.5 L13.5 21.5 L3 11 Z M7.5 9 A1.5 1.5 0 1 0 7.5 6 A1.5 1.5 0 1 0 7.5 9 Z', regraPar: true }]
  },
  caminhao: {
    nome: 'Entrega',
    partes: [
      { d: 'M1 5 H14 V16 H1 Z M14 9 H18.5 L22 12.5 V16 H14 Z' },
      { d: 'M6 18 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 Z M17.5 18 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 Z' }
    ]
  },
  chef: {
    nome: 'Chapéu de chef',
    partes: [{ d: 'M6 14 C2.5 13.5 2 8 6 7.5 C6.5 4 11 2.5 13 5 C15.5 2.5 20 4.5 19 8 C22.5 9 21.5 14 18 14 V16 H6 Z M6 17.5 H18 V21 H6 Z' }]
  },
  tomada: {
    nome: 'Tomada',
    partes: [{ d: 'M8 2 V7 M16 2 V7', contorno: true }, { d: 'M5 7 H19 V11 C19 15 16 17.5 13 17.8 V22 H11 V17.8 C8 17.5 5 15 5 11 Z' }]
  },
  caixa: {
    nome: 'Caixa',
    partes: [{ d: 'M3 7 L12 3 L21 7 V17 L12 21 L3 17 Z' }, { d: 'M3 7 L12 11 L21 7 M12 11 V21', contorno: true, corInterna: true }]
  }
};
