import React, { useEffect, useMemo, useState } from 'react';
import Konva from 'konva';
import { Group, Rect, Text, Ellipse, Circle, Shape, Line, Path, Image as KImage } from 'react-konva';
import { ICONES } from './icones.js';
import { larguraTexto, partesPreco } from './medidas.js';
import { urlImagem } from '../api.js';
import { pesoAte } from './fontes.js';

// ---------- Imagens da pasta de dados (com cache) ----------
const cache = new Map();
export const urlDe = src => urlImagem(src);

export function useImagem(src) {
  const url = urlDe(src);
  const [, forcar] = useState(0);
  useEffect(() => {
    if (!url || cache.has(url)) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    const registro = { img, pronta: false, erro: false };
    cache.set(url, registro);
    img.onload = () => { registro.pronta = true; forcar(n => n + 1); };
    img.onerror = () => { registro.erro = true; forcar(n => n + 1); };
    img.src = url;
  }, [url]);
  const r = url ? cache.get(url) : null;
  if (r && !r.pronta && !r.erro) {
    // outro componente já pediu esta imagem: espera ela carregar
    r.img.addEventListener('load', () => forcar(n => n + 1), { once: true });
  }
  return r?.pronta ? r.img : null;
}

export function imagensCarregando() {
  return [...cache.values()].filter(r => !r.pronta && !r.erro).map(r => new Promise(res => {
    r.img.addEventListener('load', res, { once: true });
    r.img.addEventListener('error', res, { once: true });
  }));
}

// Calcula posição/tamanho para "caber" (contain) ou "preencher" (cover)
function ajustarImagem(img, w, h, ajuste) {
  const ri = img.width / img.height;
  const ra = w / h;
  if (ajuste === 'cover') {
    let cw = img.width, ch = img.height, cx = 0, cy = 0;
    if (ri > ra) { cw = img.height * ra; cx = (img.width - cw) / 2; }
    else { ch = img.width / ra; cy = (img.height - ch) / 2; }
    return { x: 0, y: 0, width: w, height: h, crop: { x: cx, y: cy, width: cw, height: ch } };
  }
  let iw = w, ih = h;
  if (ri > ra) ih = w / ri; else iw = h * ri;
  return { x: (w - iw) / 2, y: (h - ih) / 2, width: iw, height: ih };
}

// Altura real de um texto (para empilhar nome, descrição...)
function alturaTexto(props) {
  const t = new Konva.Text(props);
  const h = t.height();
  t.destroy();
  return h;
}

function pontosGradiente(w, h, angulo, centrado) {
  const rad = (angulo * Math.PI) / 180;
  const meia = Math.sqrt(w * w + h * h) / 2;
  const dx = Math.cos(rad) * meia, dy = Math.sin(rad) * meia;
  const cx = centrado ? 0 : w / 2, cy = centrado ? 0 : h / 2;
  return { inicio: { x: cx - dx, y: cy - dy }, fim: { x: cx + dx, y: cy + dy } };
}

function propsPreenchimento(el, centrado = false) {
  if (el.gradiente) {
    const { inicio, fim } = pontosGradiente(el.w, el.h, el.gradiente.angulo ?? 90, centrado);
    return {
      fillLinearGradientStartPoint: inicio,
      fillLinearGradientEndPoint: fim,
      fillLinearGradientColorStops: [0, el.gradiente.cor1, 1, el.gradiente.cor2]
    };
  }
  return { fill: el.cor };
}

const propsSombra = ativo => ativo
  ? { shadowColor: '#0A1530', shadowBlur: 12, shadowOpacity: 0.28, shadowOffsetY: 4 }
  : {};

// ---------- Tipos simples ----------
function ElTexto({ el }) {
  const pad = el.fundo ? el.fundoPadding : 0;
  const props = {
    text: el.texto, width: Math.max(10, el.w - pad * 2), fontFamily: el.fonte, fontStyle: String(el.peso),
    fontSize: el.tamanho, fill: el.cor, align: el.alinhamento, lineHeight: el.alturaLinha,
    letterSpacing: el.espacamento, wrap: 'word'
  };
  const h = useMemo(() => alturaTexto(props), [JSON.stringify(props)]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {el.fundo
        ? <Rect width={el.w} height={h + pad * 2} fill={el.fundo} cornerRadius={el.fundoRaio} {...propsSombra(el.fundoSombra)} />
        : <Rect width={el.w} height={h} fill="transparent" />}
      <Text
        {...props}
        x={pad}
        y={pad}
        stroke={el.contornoLargura > 0 ? el.contornoCor : undefined}
        strokeWidth={el.contornoLargura}
        fillAfterStrokeEnabled
        lineJoin="round"
        shadowColor={el.sombraCor}
        shadowOffsetX={el.sombraX}
        shadowOffsetY={el.sombraY}
        shadowBlur={el.sombraDesfoque}
        shadowEnabled={!!(el.sombraX || el.sombraY || el.sombraDesfoque)}
        shadowOpacity={1}
      />
    </>
  );
}

function ElRetangulo({ el }) {
  return (
    <Rect
      width={el.w} height={el.h} cornerRadius={el.raio}
      {...propsPreenchimento(el)}
      stroke={el.bordaLargura > 0 ? el.bordaCor : undefined} strokeWidth={el.bordaLargura}
      {...propsSombra(el.sombra)}
    />
  );
}

function ElElipse({ el }) {
  return (
    <Ellipse
      x={el.w / 2} y={el.h / 2} radiusX={el.w / 2} radiusY={el.h / 2}
      {...propsPreenchimento(el, true)}
      stroke={el.bordaLargura > 0 ? el.bordaCor : undefined} strokeWidth={el.bordaLargura}
      {...propsSombra(el.sombra)}
    />
  );
}

function ElPoligono({ el }) {
  const pts = (el.pontos || []).flatMap(([px, py]) => [px * el.w, py * el.h]);
  return (
    <>
      <Rect width={el.w} height={el.h} fill="transparent" />
      <Line
        points={pts} closed {...propsPreenchimento(el)}
        stroke={el.bordaLargura > 0 ? el.bordaCor : undefined} strokeWidth={el.bordaLargura} lineJoin="round"
        {...propsSombra(el.sombra)}
      />
    </>
  );
}

function ElRaios({ el }) {
  return (
    <Shape
      width={el.w} height={el.h}
      sceneFunc={(context, shape) => {
        const c = context._context;
        const w = shape.width(), h = shape.height();
        const cx = w * el.centroX, cy = h * el.centroY;
        const raio = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 10;
        c.save();
        c.beginPath(); c.rect(0, 0, w, h); c.clip();
        c.fillStyle = el.cor1; c.fillRect(0, 0, w, h);
        c.fillStyle = el.cor2;
        const n = Math.max(4, Math.round(el.quantidade));
        const passo = (Math.PI * 2) / n;
        for (let i = 0; i < n; i += 1) {
          const a = i * passo;
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(cx, cy, raio, a, a + passo / 2);
          c.closePath();
          c.fill();
        }
        // brilho suave no centro
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
        g.addColorStop(0, 'rgba(255,255,255,0.22)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.restore();
      }}
      hitFunc={(context, shape) => {
        context.beginPath();
        context.rect(0, 0, shape.width(), shape.height());
        context.closePath();
        context.fillStrokeShape(shape);
      }}
    />
  );
}

function ElLinha({ el }) {
  return (
    <>
      <Rect width={el.w} height={Math.max(el.h, 12)} y={Math.min(0, el.h / 2 - 6)} fill="transparent" />
      <Line
        points={[0, el.h / 2, el.w, el.h / 2]} stroke={el.cor} strokeWidth={el.espessura}
        dash={el.tracejado ? [el.espessura * 3, el.espessura * 2.5] : undefined} lineCap="round"
      />
    </>
  );
}

export function ElIcone({ el }) {
  const def = ICONES[el.icone] || ICONES.estrela;
  const sx = el.w / 24, sy = el.h / 24;
  return (
    <>
      <Rect width={el.w} height={el.h} fill="transparent" />
      {def.partes.map((p, i) => {
        const cor = p.corInterna ? el.corInterna : el.cor;
        return (
          <Path
            key={i} data={p.d} scaleX={sx} scaleY={sy}
            fill={p.contorno ? undefined : cor}
            stroke={p.contorno ? cor : undefined}
            strokeWidth={p.contorno ? 2 : 0}
            lineCap="round" lineJoin="round"
            fillRule={p.regraPar ? 'evenodd' : 'nonzero'}
          />
        );
      })}
    </>
  );
}

function ElImagem({ el, exportando, realcado }) {
  const img = useImagem(el.src);
  if (!img) {
    if (exportando) return <Rect width={el.w} height={el.h} fill="transparent" />;
    return (
      <>
        <Rect width={el.w} height={el.h} fill={realcado ? '#FFF7D1' : '#E4E8EF'} opacity={0.9} stroke={realcado ? '#D7261E' : '#9AA3B2'} strokeWidth={realcado ? 4 : 1.5} dash={[8, 6]} cornerRadius={el.raio} />
        <Text width={el.w} height={el.h} padding={12} align="center" verticalAlign="middle" fill="#6B7487" fontSize={Math.min(22, Math.max(12, el.w / 18))} fontFamily="Montserrat" fontStyle="700"
          text={el.src ? 'Carregando…' : `${el.nome || 'Imagem'}\n(arraste uma foto do computador para cá)`} />
      </>
    );
  }
  const pos = ajustarImagem(img, el.w, el.h, el.ajuste);
  return (
    <Group
      clipFunc={el.raio > 0 ? ctx => {
        const r = Math.min(el.raio, el.w / 2, el.h / 2);
        ctx.beginPath();
        ctx.roundRect(0, 0, el.w, el.h, r);
        ctx.closePath();
      } : undefined}
    >
      <Rect width={el.w} height={el.h} fill="transparent" />
      <KImage image={img} {...pos} />
    </Group>
  );
}

function ElLogo({ el, loja, exportando }) {
  const img = useImagem(loja?.logo);
  if (img) {
    return (
      <>
        <Rect width={el.w} height={el.h} fill="transparent" />
        <KImage image={img} {...ajustarImagem(img, el.w, el.h, 'contain')} />
      </>
    );
  }
  return (
    <>
      <Rect width={el.w} height={el.h} fill="transparent" stroke={exportando ? undefined : '#9AA3B2'} dash={[8, 6]} />
      <Text
        width={el.w} height={el.h} align="center" verticalAlign="middle" padding={8}
        text={loja ? loja.nome.toUpperCase() : '[LOGO DA LOJA AQUI]'}
        fontFamily="Montserrat" fontStyle="800" fontSize={Math.min(26, el.w / 9)} fill={el.corTexto}
      />
    </>
  );
}

// ---------- Card de produto ----------
function PrecoEmLinha({ preco, unidade, x, y, largura, altura, cor, fonte, escalaBase = 1, mostrarRS = false, corRS, corUn, unidadeEmbaixo = false, alinhar = 'centro' }) {
  const partes = partesPreco(preco);
  const pesoNum = pesoAte(fonte, '900');
  const pesoAux = pesoAte(fonte, '800');
  if (!partes) {
    return <Text x={x} y={y} width={largura} height={altura} text="R$ --" align="center" verticalAlign="middle" fontFamily={fonte} fontStyle={pesoAux} fontSize={altura * 0.45} fill={cor} />;
  }
  let tInt = altura * 0.82 * escalaBase;
  let tCent = tInt * 0.5;
  let tUn = tInt * 0.3;
  let tRS = tInt * 0.32;
  const textoUn = unidade && unidade !== 'un' ? (unidadeEmbaixo ? unidade : `/${unidade}`) : '';
  const medir = () => {
    const wRS = mostrarRS ? larguraTexto('R$', tRS, fonte, pesoAux) + tInt * 0.06 : 0;
    const wInt = larguraTexto(partes.inteiro, tInt, fonte, pesoNum);
    const wCent = larguraTexto(`,${partes.centavos}`, tCent, fonte, pesoNum);
    const wUn = textoUn ? larguraTexto(textoUn, tUn, fonte, pesoAux) : 0;
    const extra = unidadeEmbaixo ? Math.max(0, wUn - wCent) : Math.max(0, wUn - wCent * 0.2);
    return { wRS, wInt, wCent, wUn, total: wRS + wInt + wCent + extra };
  };
  let m = medir();
  const limite = largura * 0.92;
  if (m.total > limite) {
    const f = limite / m.total;
    tInt *= f; tCent *= f; tUn *= f; tRS *= f;
    m = medir();
  }
  const inicio = alinhar === 'direita' ? x + largura - m.total - largura * 0.04
    : alinhar === 'esquerda' ? x + largura * 0.04 : x + (largura - m.total) / 2;
  const topoInt = y + (altura - tInt) / 2 + tInt * 0.04;
  const xCent = inicio + m.wRS + m.wInt;
  return (
    <>
      {mostrarRS && (
        <Text x={inicio} y={topoInt + tInt - tRS * 1.15} text="R$" fontFamily={fonte} fontStyle={pesoAux} fontSize={tRS} fill={corRS || cor} lineHeight={1} />
      )}
      <Text x={inicio + m.wRS} y={topoInt} text={partes.inteiro} fontFamily={fonte} fontStyle={pesoNum} fontSize={tInt} fill={cor} lineHeight={1} />
      <Text x={xCent} y={topoInt + tInt * 0.07} text={`,${partes.centavos}`} fontFamily={fonte} fontStyle={pesoNum} fontSize={tCent} fill={cor} lineHeight={1} />
      {textoUn && (unidadeEmbaixo ? (
        <Text x={xCent + tCent * 0.12} y={topoInt + tInt * 0.07 + tCent * 1.02} text={textoUn.toUpperCase()} fontFamily={fonte} fontStyle={pesoAux} fontSize={tUn} fill={corUn || cor} lineHeight={1} />
      ) : (
        <Text x={xCent + m.wCent * 0.2} y={topoInt + tInt - tUn * 1.05} text={textoUn} fontFamily={fonte} fontStyle={pesoAux} fontSize={tUn} fill={corUn || cor} lineHeight={1} />
      ))}
    </>
  );
}

function FotoCard({ src, x, y, w, h, exportando }) {
  const img = useImagem(src);
  if (!img) {
    if (exportando || !src) {
      return exportando ? null : (
        <>
          <Rect x={x} y={y} width={w} height={h} fill="#F1F3F7" opacity={0.85} cornerRadius={6} />
          <Text x={x} y={y} width={w} height={h} text="sem foto" align="center" verticalAlign="middle" fill="#9AA3B2" fontSize={12} fontFamily="Montserrat" />
        </>
      );
    }
    return null;
  }
  const pos = ajustarImagem(img, w, h, 'contain');
  return <KImage image={img} x={x + pos.x} y={y + pos.y} width={pos.width} height={pos.height} />;
}

// Texto de uma linha que diminui sozinho para caber na largura
function TextoAjustado({ texto, x, y, largura, tamanho, fonte, peso, cor, alinhamento = 'center', minimo = 0.55, contorno }) {
  let t = tamanho;
  const w = larguraTexto(texto, t, fonte, peso);
  if (w > largura) t = Math.max(tamanho * minimo, (tamanho * largura) / w);
  return (
    <Text
      x={x} y={y + (tamanho - t) / 2} width={largura} text={texto} fontFamily={fonte} fontStyle={peso}
      fontSize={t} fill={cor} align={alinhamento} lineHeight={1} wrap="none" ellipsis
      stroke={contorno?.cor} strokeWidth={contorno?.largura || 0} fillAfterStrokeEnabled lineJoin="round"
    />
  );
}

// Fita com recorte em "V" na ponta (cards estilo Quarta Verde)
function Fita({ x, y, w, h, cor, ladoPonta }) {
  const r = h * 0.28;
  const pts = ladoPonta === 'direita'
    ? [x, y, x + w, y, x + w - r, y + h / 2, x + w, y + h, x, y + h]
    : [x, y, x + w, y, x + w, y + h, x, y + h, x + r, y + h / 2];
  return <Line points={pts} closed fill={cor} />;
}

function CardVazio({ w, h, s, realcado }) {
  return (
    <>
      <Rect width={w} height={h} fill={realcado ? '#FFF7D1' : 'rgba(255,255,255,0.75)'} stroke={realcado ? '#D7261E' : '#8A93A3'} strokeWidth={realcado ? 3 : 1.5} dash={[8, 6]} cornerRadius={Math.min(s.raio, 16)} />
      <Text width={w} height={h} padding={14} text={'Arraste um\nproduto aqui'} align="center" verticalAlign="middle" fontFamily="Montserrat" fontStyle="700" fontSize={Math.min(16, w / 11)} fill="#5D6677" />
    </>
  );
}

// Estilo "etiqueta": nome em cima, foto, etiqueta de preço sobreposta (Fim de semana da Carne)
function CardEtiqueta({ el, exportando, realcado, nome }) {
  const { w, h, estilo: s, campos } = el;
  const pesoNome = pesoAte(s.fonteNome, '800');
  const yDesc = s.tamanhoNome * 1.02;
  const temDesc = s.mostrarDescricao && campos.descricao;
  const yFoto = yDesc + (temDesc ? s.tamanhoDescricao * 1.25 : 4);
  const hTag = h * 0.22, wTag = w * 0.56;
  const xTag = w - wTag - w * 0.04, yTag = h - hTag - 2;
  return (
    <>
      <Rect width={w} height={h} fill="transparent" stroke={realcado ? '#D7261E' : undefined} strokeWidth={3} cornerRadius={8} />
      <TextoAjustado texto={nome} x={0} y={0} largura={w} tamanho={s.tamanhoNome} fonte={s.fonteNome} peso={pesoNome} cor={s.corNome} />
      {temDesc && (
        <TextoAjustado texto={campos.descricao} x={0} y={yDesc} largura={w} tamanho={s.tamanhoDescricao} fonte={s.fonteNome} peso={pesoNome} cor={s.corDescricao} />
      )}
      <FotoCard src={campos.imagem} x={w * 0.02} y={yFoto} w={w * 0.96} h={h - yFoto - hTag * 0.35} exportando={exportando} />
      <Rect x={xTag} y={yTag} width={wTag} height={hTag} fill={s.corPrecoFundo} cornerRadius={8} stroke="#FFFFFF" strokeWidth={2}
        shadowColor="#000" shadowBlur={6} shadowOpacity={0.35} shadowOffsetY={2} />
      <PrecoEmLinha preco={campos.preco} unidade={campos.unidade} x={xTag} y={yTag} largura={wTag} altura={hTag}
        cor={s.corPrecoTexto} fonte={s.fontePreco} mostrarRS corRS="#FFFFFF" corUn="#FFFFFF" unidadeEmbaixo />
    </>
  );
}

// Estilo "fita": foto de um lado e preço numa fita do outro (Quarta Verde)
function CardFita({ el, exportando, realcado, nome }) {
  const { w, h, estilo: s, campos } = el;
  const fotoEsquerda = s.lado !== 'direita';
  const pesoNome = pesoAte(s.fonteNome, '800');
  const yFita = h * 0.42, hFita = h * 0.5;
  const wFita = w * 0.94;
  const xFita = fotoEsquerda ? 0 : w - wFita;
  const xFoto = fotoEsquerda ? 0 : w * 0.5;
  const xTexto = fotoEsquerda ? w * 0.4 : w * 0.02;
  const wTexto = w * 0.58;
  const xPreco = fotoEsquerda ? w * 0.42 : w * 0.12;
  const temDesc = s.mostrarDescricao && campos.descricao;
  const yNome = Math.max(0, yFita - s.tamanhoNome * 1.05 - (temDesc ? s.tamanhoDescricao * 1.05 : 0) - 6);
  return (
    <>
      <Rect width={w} height={h} fill="transparent" stroke={realcado ? '#D7261E' : undefined} strokeWidth={3} />
      <Fita x={xFita} y={yFita} w={wFita} h={hFita} cor={s.corPrecoFundo} ladoPonta={fotoEsquerda ? 'direita' : 'esquerda'} />
      <TextoAjustado texto={nome} x={xTexto} y={yNome} largura={wTexto} tamanho={s.tamanhoNome} fonte={s.fonteNome} peso={pesoNome}
        cor={s.corNome} alinhamento={fotoEsquerda ? 'left' : 'right'} />
      {temDesc && (
        <TextoAjustado texto={campos.descricao} x={xTexto} y={yNome + s.tamanhoNome * 1.02} largura={wTexto} tamanho={s.tamanhoDescricao}
          fonte={s.fonteNome} peso={pesoNome} cor={s.corDescricao} alinhamento="right" />
      )}
      <FotoCard src={campos.imagem} x={xFoto} y={0} w={w * 0.5} h={h} exportando={exportando} />
      <PrecoEmLinha preco={campos.preco} unidade={campos.unidade} x={xPreco} y={yFita} largura={w * 0.44} altura={hFita}
        cor={s.corPrecoTexto} fonte={s.fontePreco} mostrarRS unidadeEmbaixo alinhar={fotoEsquerda ? 'direita' : 'esquerda'} />
    </>
  );
}

// Estilo "caixa": foto numa caixa clara, nome e preço embaixo (Churrasco no fogo)
function CardCaixa({ el, exportando, realcado, nome }) {
  const { w, h, estilo: s, campos } = el;
  const hCaixa = h * s.alturaImagem + h * 0.12;
  const pesoNome = pesoAte(s.fonteNome, '800');
  const yBase = hCaixa + h * 0.03;
  const hBase = h - yBase;
  const larguraNome = w * 0.55;
  const maiorPalavra = Math.max(1, ...nome.split(/\s+/).map(p => larguraTexto(p, s.tamanhoNome, s.fonteNome, pesoNome)));
  const tamNome = Math.max(s.tamanhoNome * 0.5, Math.min(s.tamanhoNome, (s.tamanhoNome * larguraNome * 0.98) / maiorPalavra));
  const propsNome = {
    text: nome, width: larguraNome, fontFamily: s.fonteNome, fontStyle: pesoNome, fontSize: tamNome,
    lineHeight: 1.05, wrap: 'word', ellipsis: true, height: tamNome * 1.05 * 2 + 1
  };
  const hNome = Math.min(alturaTexto({ ...propsNome, height: undefined }), propsNome.height);
  return (
    <>
      <Rect width={w} height={h} fill="transparent" />
      <Rect width={w} height={hCaixa} fill={s.corFundo} cornerRadius={s.raio} stroke={realcado ? '#D7261E' : s.corBorda}
        strokeWidth={realcado ? 3 : 1} shadowColor="#000" shadowBlur={10} shadowOpacity={0.3} shadowOffsetY={3} />
      <FotoCard src={campos.imagem} x={w * 0.04} y={hCaixa * 0.05} w={w * 0.92} h={hCaixa * 0.9} exportando={exportando} />
      <Text {...propsNome} x={0} y={yBase + Math.max(0, (hBase - hNome) / 2)} fill={s.corNome}
        shadowColor="#000" shadowBlur={4} shadowOpacity={0.5} shadowOffsetY={1} />
      <PrecoEmLinha preco={campos.preco} unidade={campos.unidade} x={w * 0.55} y={yBase} largura={w * 0.45} altura={hBase}
        cor={s.corPrecoTexto} fonte={s.fontePreco} mostrarRS unidadeEmbaixo alinhar="direita" />
    </>
  );
}

// Estilo "horizontal": caixa com foto à esquerda, nome e preço à direita (TV)
function CardHorizontal({ el, exportando, realcado, nome }) {
  const { w, h, estilo: s, campos } = el;
  const pad = Math.max(10, h * 0.06);
  const pesoNome = pesoAte(s.fonteNome, '900');
  const xDir = w * 0.47;
  const wDir = w - xDir - pad;
  const hPreco = h * 0.36;
  const yPreco = h - pad - hPreco;
  const propsNome = {
    text: nome, width: wDir, fontFamily: s.fonteNome, fontStyle: pesoNome, fontSize: s.tamanhoNome,
    lineHeight: 1.05, wrap: 'word', ellipsis: true, height: s.tamanhoNome * 1.05 * 2 + 1
  };
  const maiorPalavra = Math.max(1, ...nome.split(/\s+/).map(p => larguraTexto(p, s.tamanhoNome, s.fonteNome, pesoNome)));
  if (maiorPalavra > wDir) {
    propsNome.fontSize = Math.max(s.tamanhoNome * 0.5, (s.tamanhoNome * wDir * 0.98) / maiorPalavra);
    propsNome.height = propsNome.fontSize * 1.05 * 2 + 1;
  }
  const hNome = Math.min(alturaTexto({ ...propsNome, height: undefined }), propsNome.height);
  const espacoDesc = yPreco - (pad + hNome) - 8;
  const propsDesc = {
    text: campos.descricao || '', width: wDir, fontFamily: s.fonteNome, fontStyle: pesoAte(s.fonteNome, '600'),
    fontSize: s.tamanhoDescricao, lineHeight: 1.15, wrap: 'word', ellipsis: true,
    height: Math.max(0, Math.min(s.tamanhoDescricao * 1.15 * 2 + 1, espacoDesc))
  };
  return (
    <>
      <Rect width={w} height={h} fill={s.corFundo} cornerRadius={s.raio} stroke={realcado ? '#D7261E' : s.corBorda}
        strokeWidth={realcado ? 3 : 1.5} shadowColor="#0A1530" shadowBlur={14} shadowOpacity={0.18} shadowOffsetY={4} />
      <FotoCard src={campos.imagem} x={pad} y={pad} w={w * 0.44} h={h - pad * 2} exportando={exportando} />
      <Text {...propsNome} x={xDir} y={pad} fill={s.corNome} />
      {s.mostrarDescricao && campos.descricao && propsDesc.height > s.tamanhoDescricao && (
        <Text {...propsDesc} x={xDir} y={pad + hNome + 6} fill={s.corDescricao} />
      )}
      <Rect x={xDir} y={yPreco} width={wDir} height={hPreco} fill={s.corPrecoFundo} cornerRadius={Math.min(16, s.raio)} />
      <PrecoEmLinha preco={campos.preco} unidade={campos.unidade} x={xDir} y={yPreco} largura={wDir} altura={hPreco}
        cor={s.corPrecoTexto} fonte={s.fontePreco} mostrarRS corRS={s.corDestaque} corUn={s.corDestaque} unidadeEmbaixo />
    </>
  );
}

export function CardProduto({ el, exportando, realcado }) {
  const { w, h, estilo: s, campos } = el;
  const vazio = !campos.nome && !campos.imagem && (campos.preco === null || campos.preco === undefined);
  if (vazio) {
    if (exportando) return <Rect width={w} height={h} fill="transparent" />;
    return <CardVazio w={w} h={h} s={s} realcado={realcado} />;
  }

  const nome = s.maiusculas ? (campos.nome || '').toUpperCase() : campos.nome || '';
  if (s.variante === 'etiqueta') return <CardEtiqueta el={el} exportando={exportando} realcado={realcado} nome={nome} />;
  if (s.variante === 'fita') return <CardFita el={el} exportando={exportando} realcado={realcado} nome={nome} />;
  if (s.variante === 'caixa') return <CardCaixa el={el} exportando={exportando} realcado={realcado} nome={nome} />;
  if (s.variante === 'horizontal') return <CardHorizontal el={el} exportando={exportando} realcado={realcado} nome={nome} />;

  const pad = Math.max(8, w * 0.05);
  const selo = s.variante === 'selo';
  const rSelo = Math.min(w, h) * 0.21;
  const imgH = h * s.alturaImagem - pad;
  const imgW = selo ? w - pad * 2 - rSelo * 0.35 : w - pad * 2;
  const pesoNome = pesoAte(s.fonteNome, '800');

  const propsNome = {
    text: nome, width: w - pad * 2, fontFamily: s.fonteNome, fontStyle: pesoNome, fontSize: s.tamanhoNome,
    align: 'center', lineHeight: 1.1, wrap: 'word', ellipsis: true, height: s.tamanhoNome * 1.1 * 2 + 1
  };
  const hNome = Math.min(alturaTexto({ ...propsNome, height: undefined }), propsNome.height);
  const yNome = pad + imgH + 6;
  const propsDesc = {
    text: campos.descricao || '', width: w - pad * 2, fontFamily: s.fonteNome, fontStyle: pesoAte(s.fonteNome, '400'),
    fontSize: s.tamanhoDescricao, align: 'center', lineHeight: 1.2, wrap: 'word', ellipsis: true,
    height: s.tamanhoDescricao * 1.2 * 2 + 1
  };

  const hFaixa = Math.max(30, h * 0.155);
  const yFaixa = h - pad - hFaixa;
  const wCaixaRS = hFaixa * 0.72;
  const pesoRS = pesoAte(s.fontePreco, '800');

  return (
    <>
      <Rect
        width={w} height={h} fill={s.corFundo} stroke={realcado ? '#D7261E' : s.corBorda}
        strokeWidth={realcado ? 3 : 1.2} cornerRadius={s.raio}
        shadowColor="#0A1530" shadowBlur={8} shadowOpacity={0.12} shadowOffsetY={2}
      />
      <FotoCard src={campos.imagem} x={pad} y={pad} w={imgW} h={imgH} exportando={exportando} />
      <Text {...propsNome} y={yNome} x={pad} fill={s.corNome} />
      {s.mostrarDescricao && campos.descricao && (
        <Text {...propsDesc} x={pad} y={yNome + hNome + 3} fill={s.corDescricao} />
      )}

      {selo ? (
        <>
          <Circle
            x={w - rSelo * 0.92} y={rSelo * 0.98} radius={rSelo} fill={s.corPrecoFundo}
            stroke="#FFFFFF" strokeWidth={3}
            shadowColor="#0A1530" shadowBlur={8} shadowOpacity={0.3} shadowOffsetY={2}
          />
          <Text
            x={w - rSelo * 0.92 - rSelo} y={rSelo * 0.98 - rSelo * 0.68} width={rSelo * 2} align="center"
            text="R$" fontFamily={s.fontePreco} fontStyle={pesoRS} fontSize={rSelo * 0.3} fill={s.corPrecoTexto} lineHeight={1}
          />
          <PrecoEmLinha
            preco={campos.preco} unidade={campos.unidade}
            x={w - rSelo * 0.92 - rSelo * 0.88} y={rSelo * 0.98 - rSelo * 0.42} largura={rSelo * 1.76} altura={rSelo * 0.92}
            cor={s.corPrecoTexto} fonte={s.fontePreco}
          />
        </>
      ) : (
        <>
          <Rect x={pad} y={yFaixa} width={wCaixaRS + 6} height={hFaixa} fill={s.corDestaque} cornerRadius={[6, 0, 0, 6]} />
          <Text
            x={pad} y={yFaixa + hFaixa * 0.16} width={wCaixaRS} align="center" text="R$"
            fontFamily={s.fontePreco} fontStyle={pesoRS} fontSize={hFaixa * 0.3} fill="#FFFFFF" lineHeight={1}
          />
          <Rect x={pad + wCaixaRS} y={yFaixa} width={w - pad * 2 - wCaixaRS} height={hFaixa} fill={s.corPrecoFundo} cornerRadius={[0, 6, 6, 0]} />
          <PrecoEmLinha
            preco={campos.preco} unidade={campos.unidade}
            x={pad + wCaixaRS} y={yFaixa} largura={w - pad * 2 - wCaixaRS} altura={hFaixa}
            cor={s.corPrecoTexto} fonte={s.fontePreco}
          />
        </>
      )}
    </>
  );
}

// ---------- Elemento genérico (posição, rotação, seleção, arrasto) ----------
const RENDERIZADORES = {
  texto: ElTexto, retangulo: ElRetangulo, elipse: ElElipse, poligono: ElPoligono, raios: ElRaios, linha: ElLinha,
  icone: ElIcone, imagem: ElImagem, logo: ElLogo, produto: CardProduto
};

export function Elemento({ el, eventos, exportando, loja, realcado }) {
  const Render = RENDERIZADORES[el.tipo];
  if (!Render || el.oculto) return null;
  return (
    <Group
      id={el.id}
      name="elemento"
      x={el.x}
      y={el.y}
      rotation={el.rotacao}
      opacity={el.opacidade}
      draggable={!el.bloqueado && !exportando}
      listening={!el.bloqueado && !exportando}
      onMouseDown={e => eventos.selecionar(el.id, e)}
      onTap={e => eventos.selecionar(el.id, e)}
      onDblClick={() => eventos.duploClique(el)}
      onDragEnd={eventos.fimArrasto}
      onTransformEnd={e => eventos.fimTransformacao(el, e)}
    >
      <Render el={el} exportando={exportando} loja={loja} realcado={realcado} />
    </Group>
  );
}
