// Desenha um encarte fora da tela (sem abrir o editor) e devolve a imagem.
// Usado para gerar vários slides de TV e exportar em lote.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Rect } from 'react-konva';
import { Elemento, imagensCarregando } from './Elementos.jsx';
import { carregarFontes } from './fontes.js';
import { api } from '../api.js';
import { sincronizarCard } from './documento.js';

const quadro = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const semEventos = { selecionar() {}, duploClique() {}, fimArrasto() {}, fimTransformacao() {} };

function propsFundo(doc) {
  const f = doc.fundo;
  if (!f.gradiente) return { fill: f.cor };
  const rad = (f.gradiente.angulo * Math.PI) / 180;
  const meia = Math.hypot(doc.largura, doc.altura) / 2;
  const cx = doc.largura / 2, cy = doc.altura / 2;
  return {
    fillLinearGradientStartPoint: { x: cx - Math.cos(rad) * meia, y: cy - Math.sin(rad) * meia },
    fillLinearGradientEndPoint: { x: cx + Math.cos(rad) * meia, y: cy + Math.sin(rad) * meia },
    fillLinearGradientColorStops: [0, f.gradiente.cor1, 1, f.gradiente.cor2]
  };
}

// Atualiza preços/nomes/fotos dos cards com o catálogo atual
export async function sincronizarComCatalogo(doc) {
  const ids = [...new Set(doc.elementos.filter(e => e.tipo === 'produto' && e.produtoId).map(e => e.produtoId))];
  if (!ids.length) return doc;
  const produtos = await api('produtos:obterVarios', ids);
  const porId = new Map(produtos.map(p => [p.id, p]));
  return { ...doc, elementos: doc.elementos.map(e => (e.tipo === 'produto' && porId.has(e.produtoId) ? sincronizarCard(e, porId.get(e.produtoId)) : e)) };
}

// escala: 1 = tamanho do documento; tipo: 'png' | 'jpg'
export async function renderizarDocumento(doc, { loja = null, escala = 1, tipo = 'png', qualidade = 0.92 } = {}) {
  await carregarFontes();
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;';
  document.body.appendChild(div);
  const raiz = createRoot(div);
  let camada = null;
  try {
    raiz.render(
      <Stage width={doc.largura} height={doc.altura} listening={false}>
        <Layer ref={n => { camada = n; }} listening={false}>
          <Rect width={doc.largura} height={doc.altura} {...propsFundo(doc)} />
          {doc.elementos.map(el => <Elemento key={el.id} el={el} eventos={semEventos} exportando loja={loja} realcado={false} />)}
        </Layer>
      </Stage>
    );
    await quadro();
    await Promise.all(imagensCarregando());
    await quadro();
    await new Promise(r => setTimeout(r, 30));
    if (!camada) throw new Error('Não foi possível desenhar o encarte.');
    return camada.toDataURL({
      x: 0, y: 0, width: doc.largura, height: doc.altura, pixelRatio: escala,
      mimeType: tipo === 'jpg' ? 'image/jpeg' : 'image/png', quality: qualidade
    });
  } finally {
    raiz.unmount();
    div.remove();
  }
}

export function dataUrlParaBytes(dataUrl) {
  const bin = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
