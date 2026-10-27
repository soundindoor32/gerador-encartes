import React, { useEffect, useMemo, useState } from 'react';
import Konva from 'konva';
import { Group, Rect, Text, Ellipse, Circle, Shape, Line, Path, Image as KImage } from 'react-konva';
import { ICONES } from './icones.js';
import { larguraTexto, partesPreco } from './medidas.js';
import { urlImagem } from '../api.js';

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

function ElImagem({ el, exportando }) {
  const img = useImagem(el.src);
  if (!img) {
    if (exportando) return <Rect width={el.w} height={el.h} fill="transparent" />;
    return (
      <>
        <Rect width={el.w} height={el.h} fill="#E4E8EF" stroke="#9AA3B2" dash={[8, 6]} cornerRadius={el.raio} />
        <Text width={el.w} height={el.h} text={el.src ? 'Carregando…' : 'Imagem'} align="center" verticalAlign="middle" fill="#6B7487" fontSize={16} fontFamily="Montserrat" />
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
function PrecoEmLinha({ preco, unidade, x, y, largura, altura, cor, fonte, escalaBase = 1, mostrarRS = false, corRS }) {
  const partes = partesPreco(preco);
  if (!partes) {
    return <Text x={x} y={y} width={largura} height={altura} text="R$ --" align="center" verticalAlign="middle" fontFamily={fonte} fontStyle="800" fontSize={altura * 0.45} fill={cor} />;
  }
  let tInt = altura * 0.82 * escalaBase;
  let tCent = tInt * 0.5;
  let tUn = tInt * 0.3;
  let tRS = tInt * 0.32;
  const sufixoUn = unidade && unidade !== 'un' ? `/${unidade}` : '';
  const medir = () => {
    const wRS = mostrarRS ? larguraTexto('R$', tRS, fonte, '800') + tInt * 0.06 : 0;
    const wInt = larguraTexto(partes.inteiro, tInt, fonte, '900');
    const wCent = larguraTexto(`,${partes.centavos}`, tCent, fonte, '900');
    const wUn = sufixoUn ? larguraTexto(sufixoUn, tUn, fonte, '800') : 0;
    return { wRS, wInt, wCent, wUn, total: wRS + wInt + wCent + Math.max(0, wUn - wCent * 0.2) };
  };
  let m = medir();
  const limite = largura * 0.92;
  if (m.total > limite) {
    const f = limite / m.total;
    tInt *= f; tCent *= f; tUn *= f; tRS *= f;
    m = medir();
  }
  const inicio = x + (largura - m.total) / 2;
  const topoInt = y + (altura - tInt) / 2 + tInt * 0.04;
  return (
    <>
      {mostrarRS && (
        <Text x={inicio} y={topoInt + tInt * 0.12} text="R$" fontFamily={fonte} fontStyle="800" fontSize={tRS} fill={corRS || cor} lineHeight={1} />
      )}
      <Text x={inicio + m.wRS} y={topoInt} text={partes.inteiro} fontFamily={fonte} fontStyle="900" fontSize={tInt} fill={cor} lineHeight={1} />
      <Text x={inicio + m.wRS + m.wInt} y={topoInt + tInt * 0.07} text={`,${partes.centavos}`} fontFamily={fonte} fontStyle="900" fontSize={tCent} fill={cor} lineHeight={1} />
      {sufixoUn && (
        <Text x={inicio + m.wRS + m.wInt + m.wCent * 0.2} y={topoInt + tInt - tUn * 1.05} text={sufixoUn} fontFamily={fonte} fontStyle="800" fontSize={tUn} fill={cor} lineHeight={1} />
      )}
    </>
  );
}

function FotoCard({ src, x, y, w, h, exportando }) {
  const img = useImagem(src);
  if (!img) {
    if (exportando || !src) {
      return exportando ? null : (
        <>
          <Rect x={x} y={y} width={w} height={h} fill="#F1F3F7" cornerRadius={6} />
          <Text x={x} y={y} width={w} height={h} text="sem foto" align="center" verticalAlign="middle" fill="#9AA3B2" fontSize={12} fontFamily="Montserrat" />
        </>
      );
    }
    return null;
  }
  const pos = ajustarImagem(img, w, h, 'contain');
  return <KImage image={img} x={x + pos.x} y={y + pos.y} width={pos.width} height={pos.height} />;
}

export function CardProduto({ el, exportando, realcado }) {
  const { w, h, estilo: s, campos } = el;
  const vazio = !campos.nome && !campos.imagem && (campos.preco === null || campos.preco === undefined);
  const pad = Math.max(8, w * 0.05);

  if (vazio) {
    if (exportando) return <Rect width={w} height={h} fill="transparent" />;
    return (
      <>
        <Rect width={w} height={h} fill={realcado ? '#FFF7D1' : 'rgba(255,255,255,0.75)'} stroke={realcado ? '#D7261E' : '#8A93A3'} strokeWidth={realcado ? 3 : 1.5} dash={[8, 6]} cornerRadius={s.raio} />
        <Text width={w} height={h} padding={14} text={'Arraste um\nproduto aqui'} align="center" verticalAlign="middle" fontFamily="Montserrat" fontStyle="700" fontSize={Math.min(16, w / 11)} fill="#5D6677" />
      </>
    );
  }

  const nome = s.maiusculas ? (campos.nome || '').toUpperCase() : campos.nome || '';
  const selo = s.variante === 'selo';
  const rSelo = Math.min(w, h) * 0.21;
  const imgH = h * s.alturaImagem - pad;
  const imgW = selo ? w - pad * 2 - rSelo * 0.35 : w - pad * 2;

  const propsNome = {
    text: nome, width: w - pad * 2, fontFamily: s.fonteNome, fontStyle: '800', fontSize: s.tamanhoNome,
    align: 'center', lineHeight: 1.1, wrap: 'word', ellipsis: true, height: s.tamanhoNome * 1.1 * 2 + 1
  };
  const hNome = Math.min(alturaTexto({ ...propsNome, height: undefined }), propsNome.height);
  const yNome = pad + imgH + 6;
  const propsDesc = {
    text: campos.descricao || '', width: w - pad * 2, fontFamily: s.fonteNome, fontStyle: '400',
    fontSize: s.tamanhoDescricao, align: 'center', lineHeight: 1.2, wrap: 'word', ellipsis: true,
    height: s.tamanhoDescricao * 1.2 * 2 + 1
  };

  const hFaixa = Math.max(30, h * 0.155);
  const yFaixa = h - pad - hFaixa;
  const wCaixaRS = hFaixa * 0.72;

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
            text="R$" fontFamily={s.fontePreco} fontStyle="900" fontSize={rSelo * 0.3} fill={s.corPrecoTexto} lineHeight={1}
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
            fontFamily={s.fontePreco} fontStyle="800" fontSize={hFaixa * 0.3} fill="#FFFFFF" lineHeight={1}
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
  texto: ElTexto, retangulo: ElRetangulo, elipse: ElElipse, raios: ElRaios, linha: ElLinha,
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
