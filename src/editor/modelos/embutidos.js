// Modelos que já vêm com o app, recriados a partir dos exemplos de referência.
// Cada um é uma função que monta um documento novo (ids novos a cada uso).
import { criarElemento as el, novoDocumento, FORMATOS, ESTILO_CARD_PADRAO } from '../documento.js';

const AZUL = '#0D2C6B';
const AZUL_MEDIO = '#1446B8';
const AMARELO = '#FFD21F';
const VERMELHO = '#D7261E';
const BRANCO = '#FFFFFF';

const titulo = (props) => el('texto', {
  fonte: 'Montserrat', peso: '900', alinhamento: 'center', cor: BRANCO,
  contornoCor: AZUL, contornoLargura: 10, sombraCor: '#081C47', sombraY: 7, alturaLinha: 1, ...props
});

function linhaDeCards({ y, h, estilo, quantidade = 5, margem = 24, gap = 13, largura = 1080, nomeSecao }) {
  const w = Math.floor((largura - margem * 2 - gap * (quantidade - 1)) / quantidade);
  return Array.from({ length: quantidade }, (_, i) => el('produto', {
    x: margem + i * (w + gap), y, w, h,
    estilo: { ...ESTILO_CARD_PADRAO, ...estilo },
    nome: `${nomeSecao} ${i + 1}`
  }));
}

// ---------- Modelo 1: vertical, preço em faixa ----------
function casaVertical() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'encarte'), '#F4F6FA');
  const E = doc.elementos;

  // Cabeçalho (fundos bloqueados para não atrapalhar a seleção)
  E.push(el('raios', { x: 0, y: 0, w: 1080, h: 440, cor1: '#0B3A94', cor2: '#1650C2', quantidade: 32, centroX: 0.55, centroY: 0.42, bloqueado: true, nome: 'Fundo do cabeçalho' }));
  E.push(el('elipse', { x: -210, y: -210, w: 650, h: 520, cor: AMARELO, bloqueado: true, nome: 'Onda amarela' }));
  E.push(el('elipse', { x: -215, y: -235, w: 620, h: 505, cor: BRANCO, bloqueado: true, nome: 'Fundo do logo' }));
  E.push(el('logo', { x: 45, y: 28, w: 260, h: 160 }));

  E.push(titulo({ x: 300, y: 46, w: 570, texto: 'SUA CASA', tamanho: 94, rotacao: -3 }));
  E.push(titulo({ x: 302, y: 146, w: 570, texto: 'MERECE O MELHOR:', tamanho: 47, contornoLargura: 8, sombraY: 5, rotacao: -3 }));
  E.push(titulo({ x: 305, y: 198, w: 570, texto: 'OFERTAS', tamanho: 104, cor: AMARELO, sombraY: 8, rotacao: -3 }));
  E.push(titulo({ x: 330, y: 306, w: 545, texto: 'IMPERDÍVEIS', tamanho: 70, cor: AMARELO, sombraY: 7, rotacao: -3 }));
  E.push(el('texto', {
    x: 412, y: 388, w: 360, texto: 'EM UTENSÍLIOS!', tamanho: 32, peso: '900', cor: BRANCO, alinhamento: 'center',
    fundo: AZUL, fundoRaio: 12, fundoPadding: 10, rotacao: -3, nome: 'Faixa do título'
  }));

  // Selo esquerdo
  E.push(el('retangulo', { x: 30, y: 300, w: 300, h: 104, cor: BRANCO, raio: 52, sombra: true, nome: 'Selo esquerdo' }));
  E.push(el('elipse', { x: 36, y: 306, w: 92, h: 92, cor: AZUL, bordaCor: AMARELO, bordaLargura: 4 }));
  E.push(el('icone', { x: 57, y: 326, w: 50, h: 50, icone: 'casaCoracao', cor: BRANCO, corInterna: BRANCO }));
  E.push(el('texto', { x: 138, y: 320, w: 185, texto: 'QUALIDADE\nQUE FACILITA\nO SEU DIA!', tamanho: 19, peso: '900', cor: AZUL, alturaLinha: 1.1 }));

  // Selo direito
  E.push(el('elipse', { x: 860, y: 236, w: 250, h: 250, cor: AMARELO, bordaCor: BRANCO, bordaLargura: 6, sombra: true, nome: 'Selo direito' }));
  E.push(el('icone', { x: 940, y: 256, w: 50, h: 50, icone: 'carrinho', cor: AZUL }));
  E.push(el('texto', { x: 872, y: 312, w: 200, texto: 'PRATICIDADE\nE ECONOMIA\nPARA O SEU\nLAR!', tamanho: 20, peso: '900', cor: AZUL, alinhamento: 'center', alturaLinha: 1.08 }));

  // Seções com 5 cards cada
  const estiloCard = { variante: 'faixa', tamanhoNome: 14, tamanhoDescricao: 11 };
  [['COZINHA', 436, 200], ['ORGANIZAÇÃO', 758, 240], ['PEQUENOS ELETRODOMÉSTICOS', 1080, 470]].forEach(([nome, y, w]) => {
    E.push(el('texto', {
      x: 24, y, w, texto: nome, tamanho: 22, peso: '900', cor: BRANCO, alinhamento: 'center',
      fundo: AZUL, fundoRaio: 8, fundoPadding: 8, nome: `Aba ${nome.toLowerCase()}`
    }));
    E.push(...linhaDeCards({ y: y + 42, h: 268, estilo: estiloCard, nomeSecao: nome.toLowerCase() }));
  });

  // Rodapé
  E.push(el('retangulo', { x: 0, y: 1404, w: 1080, h: 102, cor: AZUL, nome: 'Faixa do rodapé' }));
  E.push(el('icone', { x: 58, y: 1418, w: 72, h: 72, icone: 'carrinho', cor: AMARELO }));
  E.push(el('texto', { x: 150, y: 1416, w: 780, texto: 'APROVEITE AGORA MESMO!', tamanho: 36, peso: '900', cor: BRANCO, alinhamento: 'center' }));
  E.push(el('texto', { x: 140, y: 1462, w: 800, texto: 'TRANSFORME SUA CASA COM ECONOMIA E QUALIDADE!', tamanho: 25, peso: '900', cor: AMARELO, alinhamento: 'center' }));
  E.push(el('icone', { x: 950, y: 1418, w: 72, h: 72, icone: 'casaCoracao', cor: AMARELO, corInterna: AMARELO }));

  E.push(el('retangulo', { x: 0, y: 1506, w: 1080, h: 68, cor: BRANCO, nome: 'Faixa de vantagens' }));
  [['escudo', 'PRODUTOS DE QUALIDADE\nPARA DURAR MAIS', 50], ['medalha', 'AS MELHORES MARCAS\nEM UM SÓ LUGAR', 395], ['joinha', 'ATENDIMENTO\nQUE FAZ A DIFERENÇA', 735]].forEach(([icone, texto, x]) => {
    E.push(el('icone', { x, y: 1518, w: 44, h: 44, icone, cor: AZUL, corInterna: BRANCO }));
    E.push(el('texto', { x: x + 56, y: 1521, w: 270, texto, tamanho: 16, peso: '800', cor: AZUL, alturaLinha: 1.1 }));
  });

  E.push(el('retangulo', { x: 0, y: 1574, w: 1080, h: 46, cor: AZUL, nome: 'Faixa final' }));
  E.push(el('texto', {
    x: 10, y: 1590, w: 1060, tamanho: 14, peso: '800', cor: BRANCO, alinhamento: 'center',
    texto: 'VISITE-NOS HOJE E CONFIRA MAIS OFERTAS!    |    SUA LOJA COMPLETA PARA O LAR    |    COMPRE COM CONFORTO E SEGURANÇA!'
  }));
  return doc;
}

// ---------- Modelo 2: quadrado, preço em selo ----------
function casaQuadrado() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'post'), AZUL_MEDIO);
  const E = doc.elementos;

  E.push(el('raios', { x: 0, y: 0, w: 1080, h: 1080, cor1: '#0B3A94', cor2: '#1347B4', quantidade: 36, centroX: 0.62, centroY: 0.08, bloqueado: true, nome: 'Fundo' }));
  E.push(el('elipse', { x: -160, y: -170, w: 480, h: 390, cor: AMARELO, bloqueado: true, nome: 'Onda amarela' }));
  E.push(el('elipse', { x: -170, y: -185, w: 465, h: 380, cor: BRANCO, bloqueado: true, nome: 'Fundo do logo' }));
  E.push(el('logo', { x: 28, y: 14, w: 220, h: 160 }));

  E.push(titulo({ x: 320, y: 16, w: 740, texto: 'SUA CASA', tamanho: 94, contornoLargura: 9, sombraY: 6, rotacao: -2 }));
  E.push(titulo({ x: 320, y: 112, w: 740, texto: 'MERECE O MELHOR!', tamanho: 64, cor: AMARELO, contornoLargura: 9, sombraY: 6, rotacao: -2 }));
  E.push(el('texto', {
    x: 400, y: 178, w: 580, texto: 'OFERTAS IMPERDÍVEIS EM UTENSÍLIOS!', tamanho: 25, peso: '900', cor: BRANCO,
    alinhamento: 'center', fundo: VERMELHO, fundoRaio: 8, fundoPadding: 9, rotacao: -2, nome: 'Faixa do título'
  }));

  const estiloCard = {
    variante: 'selo', alturaImagem: 0.55, tamanhoNome: 13, tamanhoDescricao: 10,
    corPrecoTexto: VERMELHO, raio: 12, corBorda: '#E3E8F2'
  };
  // O texto da aba fica alinhado à direita para sobrar espaço para o ícone à esquerda
  [['COZINHA', 'chef', 222, 170], ['ELETRODOMÉSTICOS', 'tomada', 486, 296], ['ORGANIZAÇÃO', 'caixa', 750, 232]].forEach(([nome, icone, y, w]) => {
    E.push(el('texto', {
      x: 24, y, w, texto: nome, tamanho: 21, peso: '900', cor: BRANCO, alinhamento: 'right',
      fundo: '#092563', fundoRaio: 10, fundoPadding: 7, nome: `Aba ${nome.toLowerCase()}`
    }));
    E.push(el('icone', { x: 36, y: y + 7, w: 22, h: 22, icone, cor: BRANCO, corInterna: '#092563' }));
    E.push(el('linha', { x: 24 + w + 12, y: y + 12, w: 1056 - (24 + w + 12), h: 12, cor: BRANCO, espessura: 2, tracejado: true, opacidade: 0.55 }));
    E.push(...linhaDeCards({ y: y + 38, h: 214, estilo: estiloCard, nomeSecao: nome.toLowerCase() }));
  });

  // Rodapé
  E.push(el('retangulo', { x: 0, y: 1006, w: 580, h: 74, cor: AMARELO, nome: 'Rodapé amarelo' }));
  E.push(el('retangulo', { x: 560, y: 1006, w: 520, h: 74, cor: '#092563', nome: 'Rodapé azul' }));
  E.push(el('elipse', { x: 18, y: 1014, w: 58, h: 58, cor: AZUL }));
  E.push(el('icone', { x: 31, y: 1027, w: 32, h: 32, icone: 'carrinho', cor: BRANCO }));
  E.push(el('texto', { x: 90, y: 1013, w: 470, texto: 'TRANSFORME SEU LAR', tamanho: 23, peso: '900', cor: AZUL }));
  E.push(el('texto', { x: 90, y: 1041, w: 480, texto: 'COM QUALIDADE E ECONOMIA!', tamanho: 27, peso: '900', cor: VERMELHO }));
  E.push(el('elipse', { x: 582, y: 1014, w: 58, h: 58, cor: AMARELO }));
  E.push(el('icone', { x: 596, y: 1027, w: 30, h: 30, icone: 'sacola', cor: AZUL, corInterna: AMARELO }));
  E.push(el('texto', { x: 654, y: 1011, w: 410, texto: 'APROVEITE AGORA!', tamanho: 28, peso: '900', cor: BRANCO }));
  E.push(el('texto', { x: 654, y: 1043, w: 410, texto: 'OFERTAS POR TEMPO LIMITADO.', tamanho: 14, peso: '700', cor: BRANCO }));
  E.push(el('texto', { x: 654, y: 1060, w: 410, texto: 'CORRA E GARANTA OS SEUS FAVORITOS!', tamanho: 13, peso: '800', cor: AMARELO }));
  return doc;
}

export const MODELOS_EMBUTIDOS = [
  { id: 'casa-vertical', nome: 'Sua Casa, vertical com preço em faixa', criar: casaVertical },
  { id: 'casa-quadrado', nome: 'Sua Casa, quadrado com preço em selo', criar: casaQuadrado },
  ...FORMATOS.map(f => ({ id: `branco-${f.id}`, nome: `Em branco: ${f.nome}`, criar: () => novoDocumento(f), branco: true }))
];
