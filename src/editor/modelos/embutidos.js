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

// ---------- Grade genérica de cards ----------
function grade({ x0, y0, colunas, linhas, w, h, gapX, gapY, estilo, nome }) {
  const cards = [];
  for (let l = 0; l < linhas; l += 1) {
    for (let c = 0; c < colunas; c += 1) {
      cards.push(el('produto', {
        x: x0 + c * (w + gapX), y: y0 + l * (h + gapY), w, h,
        estilo: { ...ESTILO_CARD_PADRAO, ...estilo }, nome: `${nome} ${l * colunas + c + 1}`
      }));
    }
  }
  return cards;
}

// ---------- Modelo 3: Fim de semana da Carne (grade 4x4, etiqueta vermelha) ----------
function carneGrade() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'a4'), '#FFFFFF');
  const E = doc.elementos;
  const VERM = '#C8102E';

  // Cabeçalho: fundos de reserva (azulejo azul + mesa de madeira) e espaço para a foto
  E.push(el('retangulo', { x: 0, y: 0, w: 1240, h: 300, gradiente: { cor1: '#2B5BA8', cor2: '#6F94CF', angulo: 90 }, bloqueado: true, nome: 'Fundo azul do cabeçalho' }));
  E.push(el('retangulo', { x: 0, y: 300, w: 1240, h: 110, gradiente: { cor1: '#9C6A3C', cor2: '#6E4524', angulo: 90 }, bloqueado: true, nome: 'Mesa de madeira' }));
  E.push(el('imagem', { x: 0, y: 0, w: 1240, h: 410, ajuste: 'cover', bloqueado: true, nome: 'Foto do cabeçalho' }));
  E.push(el('elipse', { x: 845, y: -60, w: 440, h: 360, cor: '#FFFFFF', bordaCor: '#2B5BA8', bordaLargura: 10, bloqueado: true, nome: 'Moldura da foto redonda' }));
  E.push(el('imagem', { x: 870, y: -30, w: 390, h: 310, ajuste: 'cover', raio: 155, nome: 'Foto redonda (churrasco)' }));

  E.push(el('texto', { x: 320, y: 18, w: 600, texto: 'Fim de semana da', fonte: 'Kaushan Script', peso: '400', tamanho: 52, cor: VERM, alinhamento: 'center', contornoCor: '#FFFFFF', contornoLargura: 8 }));
  E.push(el('texto', { x: 280, y: 58, w: 680, texto: 'Carne', fonte: 'Kaushan Script', peso: '400', tamanho: 170, cor: '#FFFFFF', alinhamento: 'center', contornoCor: VERM, contornoLargura: 12, sombraCor: '#5A0A12', sombraY: 6, alturaLinha: 1 }));
  E.push(el('logo', { x: 470, y: 228, w: 300, h: 110 }));
  E.push(el('texto', {
    x: 420, y: 338, w: 420, texto: 'uhh Churrasco...', fonte: 'Kaushan Script', peso: '400', tamanho: 46, cor: VERM,
    alinhamento: 'center', fundo: '#FFFFFF', fundoRaio: 6, fundoPadding: 8, fundoSombra: true, rotacao: -2
  }));

  E.push(...grade({
    x0: 30, y0: 436, colunas: 4, linhas: 4, w: 280, h: 284, gapX: 20, gapY: 20, nome: 'carne',
    estilo: {
      variante: 'etiqueta', fonteNome: 'Alfa Slab One', tamanhoNome: 40, tamanhoDescricao: 18,
      corNome: VERM, corDescricao: '#7A0B19', corPrecoFundo: VERM, corPrecoTexto: '#FFE600',
      fontePreco: 'Anton', maiusculas: false
    }
  }));

  E.push(el('retangulo', { x: 0, y: 1674, w: 1240, h: 80, cor: '#1A1A1A', nome: 'Faixa da validade' }));
  E.push(el('texto', { x: 20, y: 1692, w: 1200, texto: 'PROMOÇÃO VÁLIDA PARA OS DIAS 17 E 18/08', fonte: 'Archivo Black', peso: '400', tamanho: 40, cor: '#FFFFFF', alinhamento: 'center' }));
  return doc;
}

// ---------- Modelo 4: Quarta Verde (duas colunas, preço em fita) ----------
function quartaVerde() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'a4'), '#F6F6F1');
  const E = doc.elementos;
  const VERDE = '#7DB548', VERDE_ESC = '#3F7A1F', CINZA = '#3A3A3A';

  // Formas verdes de fundo
  E.push(el('poligono', { x: 640, y: 0, w: 600, h: 520, pontos: [[0.12, 0], [1, 0], [1, 1], [0, 0.62]], cor: VERDE, bloqueado: true, nome: 'Forma verde do topo' }));
  E.push(el('imagem', { x: 700, y: 0, w: 540, h: 400, ajuste: 'cover', nome: 'Foto de destaque' }));
  E.push(el('poligono', { x: 0, y: 1380, w: 560, h: 374, pontos: [[0, 0], [1, 1], [0, 1]], cor: VERDE, opacidade: 0.9, bloqueado: true, nome: 'Forma verde inferior esquerda' }));
  E.push(el('poligono', { x: 760, y: 1500, w: 480, h: 254, pontos: [[1, 0], [1, 1], [0, 1]], cor: VERDE, opacidade: 0.9, bloqueado: true, nome: 'Forma verde inferior direita' }));
  E.push(el('poligono', { x: 0, y: 0, w: 90, h: 420, pontos: [[0, 0], [1, 0], [0, 1]], cor: '#D7261E', opacidade: 0.85, bloqueado: true, nome: 'Detalhe vermelho' }));

  E.push(el('texto', { x: 110, y: 26, w: 560, texto: 'Show de ofertas', fonte: 'Kaushan Script', peso: '400', tamanho: 58, cor: '#5A9A2A', alinhamento: 'center' }));
  E.push(el('texto', { x: 60, y: 92, w: 660, texto: 'Quarta', fonte: 'Anton', peso: '400', tamanho: 220, cor: CINZA, alinhamento: 'center', alturaLinha: 0.95 }));
  E.push(el('texto', { x: 60, y: 300, w: 660, texto: 'verde', fonte: 'Anton', peso: '400', tamanho: 220, cor: VERDE, alinhamento: 'center', alturaLinha: 0.95 }));
  E.push(el('logo', { x: 250, y: 520, w: 300, h: 120 }));
  E.push(el('texto', { x: 600, y: 552, w: 340, texto: 'OFERTAS VÁLIDAS\n16/01', fonte: 'Archivo Black', peso: '400', tamanho: 28, cor: '#222222', alinhamento: 'center', alturaLinha: 1.15 }));

  const estilo = {
    variante: 'fita', fonteNome: 'Oswald', tamanhoNome: 50, tamanhoDescricao: 26, corNome: VERDE_ESC,
    corDescricao: VERDE_ESC, corPrecoFundo: VERDE, corPrecoTexto: '#FFFFFF', fontePreco: 'Anton', maiusculas: true
  };
  for (let i = 0; i < 4; i += 1) {
    E.push(el('produto', { x: 0, y: 660 + i * 268, w: 600, h: 255, estilo: { ...ESTILO_CARD_PADRAO, ...estilo, lado: 'esquerda' }, nome: `coluna esquerda ${i + 1}` }));
    E.push(el('produto', { x: 640, y: 660 + i * 268, w: 600, h: 255, estilo: { ...ESTILO_CARD_PADRAO, ...estilo, lado: 'direita' }, nome: `coluna direita ${i + 1}` }));
  }
  return doc;
}

// ---------- Modelo 5: Churrasco no fogo (caixas brancas, fundo vermelho) ----------
function churrascoFogo() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'a4'), '#222222');
  const E = doc.elementos;
  const VERM = '#B3121B';

  E.push(el('retangulo', { x: 0, y: 0, w: 1240, h: 1180, gradiente: { cor1: '#D9201A', cor2: '#F7941D', angulo: 90 }, bloqueado: true, nome: 'Fundo vermelho' }));
  E.push(el('imagem', { x: 0, y: 0, w: 1240, h: 1180, ajuste: 'cover', bloqueado: true, nome: 'Foto de fundo (fogo)' }));
  E.push(el('retangulo', { x: 0, y: 1180, w: 1240, h: 470, gradiente: { cor1: '#2A2A2A', cor2: '#141414', angulo: 90 }, bloqueado: true, nome: 'Fundo escuro' }));

  E.push(el('elipse', { x: 400, y: -190, w: 440, h: 400, cor: '#FFFFFF', sombra: true, bloqueado: true, nome: 'Fundo do logo' }));
  E.push(el('logo', { x: 450, y: 18, w: 340, h: 160 }));
  E.push(el('texto', {
    x: 380, y: 214, w: 480, texto: 'uhh Churrasco...', fonte: 'Kaushan Script', peso: '400', tamanho: 54, cor: VERM,
    alinhamento: 'center', fundo: '#FFFFFF', fundoRaio: 6, fundoPadding: 10, fundoSombra: true, rotacao: -2
  }));
  const tituloFogo = { fonte: 'Alfa Slab One', peso: '400', cor: '#FFFFFF', sombraCor: '#5A0A0A', sombraY: 5, sombraDesfoque: 4, alturaLinha: 1.05 };
  E.push(el('texto', { ...tituloFogo, x: 26, y: 40, w: 380, texto: 'FIM DE\nSEMANA DA', tamanho: 54 }));
  E.push(el('texto', { ...tituloFogo, x: 830, y: 50, w: 390, texto: 'CARNE', tamanho: 84, alinhamento: 'right' }));

  const estilo = {
    variante: 'caixa', fonteNome: 'Alfa Slab One', tamanhoNome: 30, corNome: '#FFFFFF', corFundo: '#FFFFFF',
    corBorda: '#FFFFFF', raio: 14, corPrecoTexto: '#FFFFFF', fontePreco: 'Anton', alturaImagem: 0.56, maiusculas: true
  };
  E.push(...grade({ x0: 30, y0: 330, colunas: 4, linhas: 2, w: 280, h: 300, gapX: 20, gapY: 22, estilo, nome: 'carne' }));
  E.push(el('produto', { x: 320, y: 1000, w: 600, h: 330, estilo: { ...ESTILO_CARD_PADRAO, ...estilo, tamanhoNome: 40 }, nome: 'destaque' }));
  E.push(...grade({ x0: 30, y0: 1350, colunas: 3, linhas: 1, w: 380, h: 280, gapX: 25, gapY: 0, estilo, nome: 'mercearia' }));

  E.push(el('retangulo', { x: 0, y: 1650, w: 1240, h: 104, gradiente: { cor1: '#E2231A', cor2: '#9E0F0F', angulo: 0 }, nome: 'Rodapé' }));
  E.push(el('texto', { x: 30, y: 1662, w: 720, texto: 'PROMOÇÃO VÁLIDA: 18/11', fonte: 'Alfa Slab One', peso: '400', tamanho: 46, cor: '#FFFFFF' }));
  E.push(el('texto', { x: 30, y: 1716, w: 720, texto: 'Curta nossa página no Facebook', fonte: 'Montserrat', peso: '700', tamanho: 22, cor: '#FFFFFF' }));
  E.push(el('linha', { x: 770, y: 1666, w: 72, h: 12, cor: '#FFFFFF', espessura: 3, tracejado: false, rotacao: 90 }));
  E.push(el('texto', { x: 800, y: 1672, w: 420, texto: 'CONTATO: (00) 0000-0000\nWHATSAPP: (00) 00000-0000', fonte: 'Montserrat', peso: '800', tamanho: 24, cor: '#FFFFFF', alturaLinha: 1.25 }));
  return doc;
}

// ================= Modelos para TV =================
const estiloHorizontal = (extra = {}) => ({
  ...ESTILO_CARD_PADRAO, variante: 'horizontal', fonteNome: 'Montserrat', fontePreco: 'Montserrat',
  tamanhoNome: 38, tamanhoDescricao: 22, raio: 22, corNome: AZUL, corDescricao: '#3A4255',
  corPrecoFundo: AMARELO, corPrecoTexto: VERMELHO, corDestaque: AZUL, corBorda: '#E3E8F2', ...extra
});

// TV deitada com 6 ofertas
function tvSeisOfertas() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'tv'), '#EEF2F8');
  const E = doc.elementos;
  E.push(el('raios', { x: 0, y: 0, w: 1920, h: 200, cor1: '#0B3A94', cor2: '#1650C2', quantidade: 40, centroX: 0.5, centroY: 0.5, bloqueado: true, nome: 'Fundo do topo' }));
  E.push(el('retangulo', { x: 0, y: 0, w: 380, h: 200, cor: BRANCO, raio: 0, bloqueado: true, nome: 'Fundo do logo' }));
  E.push(el('poligono', { x: 380, y: 0, w: 80, h: 200, pontos: [[0, 0], [1, 0], [0, 1]], cor: BRANCO, bloqueado: true, nome: 'Ponta do fundo do logo' }));
  E.push(el('logo', { x: 30, y: 20, w: 330, h: 160 }));
  E.push(titulo({ x: 470, y: 50, w: 1100, texto: 'OFERTAS DO DIA', tamanho: 92, cor: AMARELO, contornoLargura: 11, sombraY: 7 }));
  E.push(el('elipse', { x: 1590, y: 14, w: 300, h: 172, cor: AMARELO, bordaCor: BRANCO, bordaLargura: 6, sombra: true, nome: 'Selo de validade' }));
  E.push(el('texto', { x: 1600, y: 58, w: 280, texto: 'VÁLIDO ATÉ\n00/00', tamanho: 34, peso: '900', cor: AZUL, alinhamento: 'center', alturaLinha: 1.05 }));
  for (let l = 0; l < 2; l += 1) {
    for (let c = 0; c < 3; c += 1) {
      E.push(el('produto', { x: 40 + c * 623, y: 224 + l * 392, w: 593, h: 372, estilo: estiloHorizontal(), nome: `oferta ${l * 3 + c + 1}` }));
    }
  }
  E.push(el('retangulo', { x: 0, y: 1012, w: 1920, h: 68, cor: AZUL, nome: 'Rodapé' }));
  E.push(el('texto', { x: 40, y: 1027, w: 1840, texto: 'OFERTAS VÁLIDAS ENQUANTO DURAREM OS ESTOQUES', tamanho: 32, peso: '800', cor: BRANCO, alinhamento: 'center' }));
  return doc;
}

// TV deitada com um produto em destaque
function tvOfertaDoDia() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'tv'), '#C8102E');
  const E = doc.elementos;
  E.push(el('raios', { x: 0, y: 0, w: 1920, h: 1080, cor1: '#B00D22', cor2: '#D7261E', quantidade: 44, centroX: 0.5, centroY: 0.55, bloqueado: true, nome: 'Fundo' }));
  E.push(el('logo', { x: 40, y: 24, w: 300, h: 150, corTexto: BRANCO }));
  E.push(titulo({ x: 360, y: 34, w: 1200, texto: 'OFERTA DO DIA', tamanho: 130, cor: AMARELO, contornoCor: '#5A0A12', contornoLargura: 12, sombraCor: '#3A0008', sombraY: 9 }));
  E.push(el('produto', {
    x: 140, y: 220, w: 1640, h: 760, nome: 'produto em destaque',
    estilo: estiloHorizontal({ tamanhoNome: 88, tamanhoDescricao: 42, raio: 36, corPrecoTexto: VERMELHO })
  }));
  E.push(el('texto', { x: 40, y: 1012, w: 1840, texto: 'Oferta válida somente hoje ou enquanto durarem os estoques', tamanho: 30, peso: '700', cor: BRANCO, alinhamento: 'center' }));
  return doc;
}

// TV deitada para um setor (hortifrúti, açougue...) com 4 ofertas em fita
function tvSetor() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'tv'), '#F6F6F1');
  const E = doc.elementos;
  const VERDE = '#7DB548', VERDE_ESC = '#3F7A1F';
  E.push(el('poligono', { x: 0, y: 0, w: 1920, h: 210, pontos: [[0, 0], [1, 0], [1, 0.7], [0, 1]], cor: VERDE, bloqueado: true, nome: 'Faixa verde do topo' }));
  E.push(el('poligono', { x: 1500, y: 860, w: 420, h: 220, pontos: [[1, 0], [1, 1], [0, 1]], cor: VERDE, opacidade: 0.85, bloqueado: true, nome: 'Canto verde' }));
  E.push(el('texto', { x: 40, y: 10, w: 560, texto: 'Show de ofertas', fonte: 'Kaushan Script', peso: '400', tamanho: 56, cor: BRANCO }));
  E.push(el('texto', { x: 40, y: 64, w: 1100, texto: 'HORTIFRÚTI', fonte: 'Anton', peso: '400', tamanho: 120, cor: BRANCO, alturaLinha: 1, sombraCor: VERDE_ESC, sombraY: 5 }));
  E.push(el('logo', { x: 1560, y: 18, w: 320, h: 130, corTexto: BRANCO }));
  const estilo = {
    ...ESTILO_CARD_PADRAO, variante: 'fita', fonteNome: 'Oswald', tamanhoNome: 64, tamanhoDescricao: 30,
    corNome: VERDE_ESC, corDescricao: VERDE_ESC, corPrecoFundo: VERDE, corPrecoTexto: BRANCO, fontePreco: 'Anton', maiusculas: true
  };
  for (let l = 0; l < 2; l += 1) {
    E.push(el('produto', { x: 30, y: 240 + l * 400, w: 900, h: 380, estilo: { ...estilo, lado: 'esquerda' }, nome: `setor ${l * 2 + 1}` }));
    E.push(el('produto', { x: 990, y: 240 + l * 400, w: 900, h: 380, estilo: { ...estilo, lado: 'direita' }, nome: `setor ${l * 2 + 2}` }));
  }
  return doc;
}

// TV em pé com 4 ofertas
function tvVerticalQuatro() {
  const doc = novoDocumento(FORMATOS.find(f => f.id === 'tv-vertical'), '#EEF2F8');
  const E = doc.elementos;
  E.push(el('raios', { x: 0, y: 0, w: 1080, h: 340, cor1: '#0B3A94', cor2: '#1650C2', quantidade: 32, centroX: 0.5, centroY: 0.2, bloqueado: true, nome: 'Fundo do topo' }));
  E.push(el('elipse', { x: 340, y: -140, w: 400, h: 300, cor: BRANCO, bloqueado: true, nome: 'Fundo do logo' }));
  E.push(el('logo', { x: 400, y: 10, w: 280, h: 130 }));
  E.push(titulo({ x: 40, y: 170, w: 1000, texto: 'OFERTAS', tamanho: 140, cor: AMARELO, contornoLargura: 12, sombraY: 8 }));
  for (let i = 0; i < 4; i += 1) {
    E.push(el('produto', { x: 40, y: 370 + i * 375, w: 1000, h: 355, estilo: estiloHorizontal({ tamanhoNome: 46, tamanhoDescricao: 26 }), nome: `oferta ${i + 1}` }));
  }
  E.push(el('retangulo', { x: 0, y: 1872, w: 1080, h: 48, cor: AZUL, nome: 'Rodapé' }));
  E.push(el('texto', { x: 20, y: 1882, w: 1040, texto: 'OFERTAS VÁLIDAS ENQUANTO DURAREM OS ESTOQUES', tamanho: 26, peso: '800', cor: BRANCO, alinhamento: 'center' }));
  return doc;
}

export const MODELOS_EMBUTIDOS = [
  { id: 'casa-vertical', nome: 'Sua Casa, vertical com preço em faixa', criar: casaVertical },
  { id: 'casa-quadrado', nome: 'Sua Casa, quadrado com preço em selo', criar: casaQuadrado },
  { id: 'tv-seis', nome: 'TV deitada: 6 ofertas', criar: tvSeisOfertas, tv: true },
  { id: 'tv-destaque', nome: 'TV deitada: oferta do dia', criar: tvOfertaDoDia, tv: true },
  { id: 'tv-setor', nome: 'TV deitada: setor com 4 ofertas', criar: tvSetor, tv: true },
  { id: 'tv-vertical', nome: 'TV em pé: 4 ofertas', criar: tvVerticalQuatro, tv: true },
  { id: 'carne-grade', nome: 'Fim de semana da Carne, grade 4 × 4', criar: carneGrade },
  { id: 'quarta-verde', nome: 'Quarta Verde, duas colunas com fita', criar: quartaVerde },
  { id: 'churrasco-fogo', nome: 'Churrasco no fogo, caixas brancas', criar: churrascoFogo },
  ...FORMATOS.map(f => ({ id: `branco-${f.id}`, nome: `Em branco: ${f.nome}`, criar: () => novoDocumento(f), branco: true }))
];
