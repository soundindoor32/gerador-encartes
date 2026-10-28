import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { api, caminhoDoArquivo } from '../api.js';
import Modal from '../components/Modal.jsx';
import { Elemento, imagensCarregando } from './Elementos.jsx';
import PainelEsquerdo from './PainelEsquerdo.jsx';
import PainelPropriedades from './PainelPropriedades.jsx';
import { carregarFontes } from './fontes.js';
import { criarElemento, camposDoProduto, sincronizarCard, clonarElementos, esvaziarCards, cardsVazios, preencherDocumento, ESTILO_CARD_PADRAO } from './documento.js';
import { gerarArquivo, miniatura } from './exportar.js';

const LIMITE_HISTORICO = 120;
const proximoQuadro = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

function emCampoDeTexto(alvo) {
  const tag = alvo?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || alvo?.isContentEditable;
}

export default function Editor({ encarteId, aoSair, avisar }) {
  const [carregado, setCarregado] = useState(false);
  const [doc, setDoc] = useState(null);
  const [titulo, setTituloEstado] = useState('');
  const [lojaId, setLojaIdEstado] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [selecao, setSelecao] = useState([]);
  const [zoom, setZoom] = useState(0.5);
  const [zoomAuto, setZoomAuto] = useState(true);
  const [realce, setRealce] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [estadoSalvo, setEstadoSalvo] = useState('salvo');
  const [dialogo, setDialogo] = useState(null);
  const [, setVersaoHistorico] = useState(0);

  const docRef = useRef(null);
  const passado = useRef([]);
  const futuro = useRef([]);
  const ultimaChave = useRef({ chave: null, tempo: 0 });
  const areaRef = useRef(null);
  const stageRef = useRef(null);
  const camadaRef = useRef(null);
  const trRef = useRef(null);
  const areaTransferencia = useRef([]);
  const primeiraCarga = useRef(true);

  // ---------- Carregar ----------
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        await carregarFontes();
        const [enc, ls] = await Promise.all([api('encartes:obter', encarteId), api('lojas:listar')]);
        let documento = enc.documento;
        // Atualiza os cards com os dados atuais do catálogo (preço, nome, foto)
        const ids = [...new Set(documento.elementos.filter(e => e.tipo === 'produto' && e.produtoId).map(e => e.produtoId))];
        if (ids.length) {
          const produtos = await api('produtos:obterVarios', ids);
          const porId = new Map(produtos.map(p => [p.id, p]));
          documento = {
            ...documento,
            elementos: documento.elementos.map(e => (e.tipo === 'produto' && porId.has(e.produtoId) ? sincronizarCard(e, porId.get(e.produtoId)) : e))
          };
        }
        if (cancelado) return;
        docRef.current = documento;
        setDoc(documento);
        setTituloEstado(enc.titulo);
        setLojaIdEstado(enc.loja_id);
        setLojas(ls);
        setCarregado(true);
      } catch (e) {
        avisar(e.message, 'erro');
        aoSair();
      }
    })();
    return () => { cancelado = true; };
  }, [encarteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Histórico ----------
  const aplicar = useCallback((novo, chave = null) => {
    const agora = Date.now();
    const u = ultimaChave.current;
    const agrupa = chave && u.chave === chave && agora - u.tempo < 900;
    if (!agrupa) {
      passado.current.push(docRef.current);
      if (passado.current.length > LIMITE_HISTORICO) passado.current.shift();
      futuro.current = [];
    }
    ultimaChave.current = { chave, tempo: agora };
    docRef.current = novo;
    setDoc(novo);
    setEstadoSalvo('alterado');
    setVersaoHistorico(v => v + 1);
  }, []);

  const mudarDoc = useCallback((fn, chave) => aplicar(fn(docRef.current), chave), [aplicar]);

  const mudarElementos = useCallback((ids, fn, chave) => {
    const alvo = new Set(ids);
    mudarDoc(d => ({ ...d, elementos: d.elementos.map(e => (alvo.has(e.id) ? { ...e, ...fn(e) } : e)) }), chave);
  }, [mudarDoc]);

  const mudarElemento = useCallback((id, patch, chave) => mudarElementos([id], () => patch, chave), [mudarElementos]);

  const desfazer = useCallback(() => {
    if (!passado.current.length) return;
    futuro.current.push(docRef.current);
    const anterior = passado.current.pop();
    docRef.current = anterior;
    ultimaChave.current = { chave: null, tempo: 0 };
    setDoc(anterior);
    setEstadoSalvo('alterado');
    setVersaoHistorico(v => v + 1);
  }, []);

  const refazer = useCallback(() => {
    if (!futuro.current.length) return;
    passado.current.push(docRef.current);
    const proximo = futuro.current.pop();
    docRef.current = proximo;
    ultimaChave.current = { chave: null, tempo: 0 };
    setDoc(proximo);
    setEstadoSalvo('alterado');
    setVersaoHistorico(v => v + 1);
  }, []);

  const setTitulo = v => { setTituloEstado(v); setEstadoSalvo('alterado'); };
  const setLojaId = v => { setLojaIdEstado(v); setEstadoSalvo('alterado'); };

  // ---------- Salvar ----------
  const salvar = useCallback(async () => {
    if (!docRef.current) return;
    setEstadoSalvo('salvando');
    try {
      let mini = null;
      if (camadaRef.current) {
        try { mini = miniatura(camadaRef.current, docRef.current, stageRef.current.scaleX()); } catch { mini = null; }
      }
      await api('encartes:salvar', { id: encarteId, titulo, loja_id: lojaId, documento: docRef.current, miniatura: mini });
      setEstadoSalvo('salvo');
    } catch (e) {
      setEstadoSalvo('erro');
      avisar(`Não foi possível salvar: ${e.message}`, 'erro');
    }
  }, [encarteId, titulo, lojaId, avisar]);

  useEffect(() => {
    if (!carregado) return;
    if (primeiraCarga.current) { primeiraCarga.current = false; return; }
    if (estadoSalvo !== 'alterado') return;
    const t = setTimeout(salvar, 1200);
    return () => clearTimeout(t);
  }, [doc, titulo, lojaId, carregado, estadoSalvo, salvar]);

  async function sair() {
    if (estadoSalvo !== 'salvo') await salvar();
    aoSair();
  }

  // ---------- Zoom ----------
  useEffect(() => {
    if (!carregado || !areaRef.current) return;
    const ajustar = () => {
      if (!zoomAuto || !docRef.current) return;
      const r = areaRef.current.getBoundingClientRect();
      const z = Math.min((r.width - 64) / docRef.current.largura, (r.height - 64) / docRef.current.altura);
      setZoom(Math.max(0.1, Math.round(z * 1000) / 1000));
    };
    ajustar();
    const obs = new ResizeObserver(ajustar);
    obs.observe(areaRef.current);
    return () => obs.disconnect();
  }, [carregado, zoomAuto, doc?.largura, doc?.altura]);

  const mudarZoom = z => { setZoomAuto(false); setZoom(Math.min(3, Math.max(0.1, z))); };

  // ---------- Seleção e transformador ----------
  const loja = useMemo(() => lojas.find(l => l.id === lojaId) || null, [lojas, lojaId]);
  const selecionados = useMemo(() => (doc ? doc.elementos.filter(e => selecao.includes(e.id)) : []), [doc, selecao]);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nos = exportando ? [] : selecionados
      .filter(e => !e.bloqueado && !e.oculto)
      .map(e => stage.findOne(`#${e.id}`))
      .filter(Boolean);
    tr.nodes(nos);
    const unico = selecionados.length === 1 ? selecionados[0] : null;
    tr.keepRatio(unico ? unico.tipo === 'icone' : true);
    tr.enabledAnchors(unico?.tipo === 'linha'
      ? ['middle-left', 'middle-right']
      : ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']);
    tr.getLayer()?.batchDraw();
  }, [selecionados, exportando, doc]);

  const eventos = useMemo(() => ({
    selecionar(id, e) {
      e.cancelBubble = true;
      const adicionar = e.evt?.shiftKey || e.evt?.ctrlKey;
      setSelecao(s => {
        if (adicionar) return s.includes(id) ? s.filter(x => x !== id) : [...s, id];
        return s.includes(id) ? s : [id];
      });
    },
    duploClique() {
      setTimeout(() => document.getElementById('campo-principal')?.focus(), 30);
    },
    fimArrasto(e) {
      const stage = stageRef.current;
      const movidos = new Set([e.target.id(), ...(trRef.current?.nodes().map(n => n.id()) || [])]);
      const posicoes = {};
      movidos.forEach(id => {
        const no = stage.findOne(`#${id}`);
        if (no) posicoes[id] = { x: Math.round(no.x()), y: Math.round(no.y()) };
      });
      mudarDoc(d => ({ ...d, elementos: d.elementos.map(el => (posicoes[el.id] ? { ...el, ...posicoes[el.id] } : el)) }));
    },
    fimTransformacao(el, e) {
      const no = e.target;
      const sx = no.scaleX(), sy = no.scaleY();
      no.scaleX(1); no.scaleY(1);
      const patch = { x: Math.round(no.x()), y: Math.round(no.y()), rotacao: Math.round(no.rotation() * 10) / 10 };
      if (el.tipo === 'texto') {
        patch.w = Math.max(20, Math.round(el.w * sx));
        if (Math.abs(sy - 1) > 0.01) patch.tamanho = Math.max(6, Math.round(el.tamanho * sy * 10) / 10);
      } else if (el.tipo === 'linha') {
        patch.w = Math.max(10, Math.round(el.w * sx));
      } else {
        patch.w = Math.max(10, Math.round(el.w * sx));
        patch.h = Math.max(10, Math.round(el.h * sy));
      }
      mudarElemento(el.id, patch, 'transformar');
    }
  }), [mudarDoc, mudarElemento]);

  function cliqueNoPalco(e) {
    const alvo = e.target;
    if (alvo === alvo.getStage() || alvo.name() === 'fundo-pagina') setSelecao([]);
  }

  // ---------- Ações ----------
  const acoes = {
    mudarElemento,
    selecionarCamada(id, adicionar) {
      setSelecao(s => (adicionar ? (s.includes(id) ? s.filter(x => x !== id) : [...s, id]) : [id]));
    },
    inserir(tipo, props = {}) {
      const d = docRef.current;
      const base = criarElemento(tipo, props);
      if (tipo === 'produto') {
        const modelo = [...d.elementos].reverse().find(e => e.tipo === 'produto');
        if (modelo) Object.assign(base, { w: modelo.w, h: modelo.h, estilo: structuredClone(modelo.estilo) });
      }
      if (tipo === 'raios') Object.assign(base, { w: d.largura, h: Math.round(d.altura * 0.3) });
      const h = base.h || 60;
      base.x = Math.round((d.largura - base.w) / 2);
      base.y = Math.round((d.altura - h) / 2);
      const posicao = tipo === 'raios' ? 0 : d.elementos.length;
      const elementos = [...d.elementos];
      elementos.splice(posicao, 0, base);
      aplicar({ ...d, elementos });
      setSelecao([base.id]);
    },
    async inserirImagem(caminho, ponto) {
      try {
        const src = await api('imagens:paraEncarte', caminho || null);
        if (!src) return;
        const d = docRef.current;
        const el = criarElemento('imagem', { src, w: 360, h: 360 });
        el.x = Math.round(ponto ? ponto.x - 180 : (d.largura - 360) / 2);
        el.y = Math.round(ponto ? ponto.y - 180 : (d.altura - 360) / 2);
        aplicar({ ...d, elementos: [...d.elementos, el] });
        setSelecao([el.id]);
      } catch (e) { avisar(e.message, 'erro'); }
    },
    async trocarImagem(id, caminho) {
      try {
        const src = await api('imagens:paraEncarte', caminho || null);
        if (!src) return;
        const el = docRef.current.elementos.find(e => e.id === id);
        if (el.tipo === 'produto') {
          mudarElemento(id, {
            campos: { ...el.campos, imagem: src },
            editados: el.produtoId && !el.editados.includes('imagem') ? [...el.editados, 'imagem'] : el.editados
          });
        } else {
          mudarElemento(id, { src });
        }
      } catch (e) { avisar(e.message, 'erro'); }
    },
    adicionarProdutos(produtos) {
      const vazios = cardsVazios(docRef.current);
      if (!vazios.length) {
        avisar('Não há cards vazios. Insira um card (aba Inserir) ou esvazie algum.', 'atencao');
        return;
      }
      mudarDoc(dd => preencherDocumento(dd, produtos));
      const sobra = produtos.length - vazios.length;
      if (produtos.length > 1) {
        avisar(sobra > 0
          ? `${vazios.length} card(s) preenchido(s). ${sobra} produto(s) ficaram de fora por falta de espaço.`
          : `${produtos.length} card(s) preenchido(s).`, sobra > 0 ? 'atencao' : 'ok');
      }
    },
    restaurarCard(id) {
      const el = docRef.current.elementos.find(e => e.id === id);
      api('produtos:obterVarios', [el.produtoId]).then(([p]) => {
        if (!p) { avisar('Esse produto não existe mais no catálogo.', 'atencao'); return; }
        mudarElemento(id, { editados: [], campos: camposDoProduto(p) });
      }).catch(e => avisar(e.message, 'erro'));
    },
    esvaziarCard(id) {
      mudarElemento(id, { produtoId: null, editados: [], campos: { nome: '', descricao: '', preco: null, unidade: 'un', imagem: null } });
    },
    aplicarEstiloATodos(origemId, ids) {
      const d = docRef.current;
      const origem = d.elementos.find(e => e.id === origemId);
      const alvos = new Set(ids || d.elementos.filter(e => e.tipo === 'produto').map(e => e.id));
      mudarDoc(dd => ({ ...dd, elementos: dd.elementos.map(e => (alvos.has(e.id) && e.tipo === 'produto' ? { ...e, estilo: structuredClone(origem.estilo) } : e)) }));
      avisar(`Estilo aplicado em ${alvos.size} card(s).`);
    },
    duplicar() {
      const d = docRef.current;
      const copias = clonarElementos(d.elementos.filter(e => selecao.includes(e.id)));
      if (!copias.length) return;
      aplicar({ ...d, elementos: [...d.elementos, ...copias] });
      setSelecao(copias.map(c => c.id));
    },
    excluir() {
      if (!selecao.length) return;
      mudarDoc(d => ({ ...d, elementos: d.elementos.filter(e => !selecao.includes(e.id)) }));
      setSelecao([]);
    },
    ordem(direcao) {
      mudarDoc(d => {
        const escolhidos = d.elementos.filter(e => selecao.includes(e.id));
        const resto = d.elementos.filter(e => !selecao.includes(e.id));
        return { ...d, elementos: direcao === 'frente' ? [...resto, ...escolhidos] : [...escolhidos, ...resto] };
      });
    },
    alinhar(tipo) {
      const stage = stageRef.current;
      const camada = camadaRef.current;
      const caixas = selecao.map(id => {
        const no = stage.findOne(`#${id}`);
        return no ? { id, r: no.getClientRect({ relativeTo: camada }) } : null;
      }).filter(Boolean);
      if (!caixas.length) return;
      const ref = caixas.length === 1
        ? { x: 0, y: 0, width: docRef.current.largura, height: docRef.current.altura }
        : caixas.reduce((acc, { r }) => {
          const x1 = Math.min(acc.x, r.x), y1 = Math.min(acc.y, r.y);
          const x2 = Math.max(acc.x + acc.width, r.x + r.width), y2 = Math.max(acc.y + acc.height, r.y + r.height);
          return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        }, { ...caixas[0].r });
      const deslocamentos = {};
      caixas.forEach(({ id, r }) => {
        let dx = 0, dy = 0;
        if (tipo === 'esquerda') dx = ref.x - r.x;
        if (tipo === 'direita') dx = ref.x + ref.width - (r.x + r.width);
        if (tipo === 'centroH') dx = ref.x + ref.width / 2 - (r.x + r.width / 2);
        if (tipo === 'topo') dy = ref.y - r.y;
        if (tipo === 'base') dy = ref.y + ref.height - (r.y + r.height);
        if (tipo === 'meio') dy = ref.y + ref.height / 2 - (r.y + r.height / 2);
        deslocamentos[id] = { dx, dy };
      });
      mudarElementos(Object.keys(deslocamentos), e => ({ x: Math.round(e.x + deslocamentos[e.id].dx), y: Math.round(e.y + deslocamentos[e.id].dy) }));
    },
    distribuir(eixo) {
      const stage = stageRef.current;
      const camada = camadaRef.current;
      const caixas = selecao.map(id => ({ id, r: stage.findOne(`#${id}`)?.getClientRect({ relativeTo: camada }) })).filter(c => c.r);
      if (caixas.length < 3) return;
      const pos = eixo === 'h' ? 'x' : 'y', tam = eixo === 'h' ? 'width' : 'height';
      caixas.sort((a, b) => a.r[pos] - b.r[pos]);
      const inicio = caixas[0].r[pos];
      const fim = caixas.at(-1).r[pos] + caixas.at(-1).r[tam];
      const ocupado = caixas.reduce((s, c) => s + c.r[tam], 0);
      const espaco = (fim - inicio - ocupado) / (caixas.length - 1);
      let cursor = inicio;
      const desloc = {};
      caixas.forEach(c => { desloc[c.id] = cursor - c.r[pos]; cursor += c.r[tam] + espaco; });
      mudarElementos(Object.keys(desloc), e => ({ [pos]: Math.round(e[pos] + desloc[e.id]) }));
    },
    salvarComoModelo() { setDialogo({ tipo: 'modelo', nome: titulo }); },
    exportar() { setDialogo({ tipo: 'exportar', formato: 'png', escala: 2 }); }
  };

  // ---------- Teclado ----------
  useEffect(() => {
    function tecla(e) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); return; }
      if (emCampoDeTexto(e.target) || dialogo) return;
      const k = e.key.toLowerCase();
      if (ctrl && k === 'z' && !e.shiftKey) { e.preventDefault(); desfazer(); }
      else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); refazer(); }
      else if (ctrl && k === 'd') { e.preventDefault(); acoes.duplicar(); }
      else if (ctrl && k === 'c') { areaTransferencia.current = docRef.current.elementos.filter(el => selecao.includes(el.id)); }
      else if (ctrl && k === 'v' && areaTransferencia.current.length) {
        const copias = clonarElementos(areaTransferencia.current, 30);
        areaTransferencia.current = copias;
        aplicar({ ...docRef.current, elementos: [...docRef.current.elementos, ...copias] });
        setSelecao(copias.map(c => c.id));
      }
      else if (ctrl && k === 'a') { e.preventDefault(); setSelecao(docRef.current.elementos.filter(el => !el.bloqueado && !el.oculto).map(el => el.id)); }
      else if (k === 'delete' || k === 'backspace') { e.preventDefault(); acoes.excluir(); }
      else if (k === 'escape') setSelecao([]);
      else if (k.startsWith('arrow') && selecao.length) {
        e.preventDefault();
        const passo = e.shiftKey ? 10 : 1;
        const dx = k === 'arrowleft' ? -passo : k === 'arrowright' ? passo : 0;
        const dy = k === 'arrowup' ? -passo : k === 'arrowdown' ? passo : 0;
        mudarElementos(selecao, el => ({ x: el.x + dx, y: el.y + dy }), 'setas');
      }
    }
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  // ---------- Arrastar produtos e imagens para o encarte ----------
  function pontoNoDocumento(e) {
    const r = stageRef.current.container().getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
  }

  function cardNoPonto(p) {
    return [...docRef.current.elementos].reverse().find(el => el.tipo === 'produto' && !el.oculto
      && p.x >= el.x && p.x <= el.x + el.w && p.y >= el.y && p.y <= el.y + el.h);
  }

  // Espaço de imagem sob o ponto (inclusive travado), para soltar fotos de fundo
  function imagemNoPonto(p) {
    return [...docRef.current.elementos].reverse().find(el => el.tipo === 'imagem' && !el.oculto && !el.rotacao
      && p.x >= el.x && p.x <= el.x + el.w && p.y >= el.y && p.y <= el.y + el.h);
  }

  function aoArrastarSobre(e) {
    const tipos = [...e.dataTransfer.types];
    if (!tipos.includes('application/x-produto') && !tipos.includes('Files')) return;
    e.preventDefault();
    const p = pontoNoDocumento(e);
    const card = cardNoPonto(p);
    const alvo = card || (tipos.includes('Files') ? imagemNoPonto(p) : null);
    setRealce(alvo?.id || null);
  }

  async function aoSoltar(e) {
    e.preventDefault();
    setRealce(null);
    const p = pontoNoDocumento(e);
    const card = cardNoPonto(p);
    const dadosProduto = e.dataTransfer.getData('application/x-produto');
    if (dadosProduto) {
      const produto = JSON.parse(dadosProduto);
      if (card) {
        mudarElemento(card.id, { produtoId: produto.id, editados: [], campos: camposDoProduto(produto) });
        setSelecao([card.id]);
      } else {
        const d = docRef.current;
        const modelo = [...d.elementos].reverse().find(el => el.tipo === 'produto');
        const novo = criarElemento('produto', {
          produtoId: produto.id, campos: camposDoProduto(produto),
          ...(modelo ? { w: modelo.w, h: modelo.h, estilo: structuredClone(modelo.estilo) } : { estilo: { ...ESTILO_CARD_PADRAO } })
        });
        novo.x = Math.round(p.x - novo.w / 2);
        novo.y = Math.round(p.y - novo.h / 2);
        aplicar({ ...d, elementos: [...d.elementos, novo] });
        setSelecao([novo.id]);
      }
      return;
    }
    const arquivo = e.dataTransfer.files?.[0];
    if (arquivo && /^image\//.test(arquivo.type)) {
      const caminho = caminhoDoArquivo(arquivo);
      const espaco = card ? null : imagemNoPonto(p);
      if (card) await acoes.trocarImagem(card.id, caminho);
      else if (espaco) await acoes.trocarImagem(espaco.id, caminho);
      else await acoes.inserirImagem(caminho, p);
    }
  }

  // ---------- Exportar e salvar como modelo ----------
  async function exportarAgora({ formato, escala }) {
    setDialogo(null);
    setSelecao([]);
    setExportando(true);
    try {
      await carregarFontes();
      await proximoQuadro();
      await Promise.all(imagensCarregando());
      await proximoQuadro();
      const bytes = await gerarArquivo(camadaRef.current, docRef.current, stageRef.current.scaleX(), formato, escala);
      setExportando(false);
      const nome = (titulo || 'encarte').replace(/[\\/:*?"<>|]+/g, '-').trim();
      const caminho = await api('exportar:salvar', bytes, nome, formato);
      if (caminho) avisar(`Encarte exportado: ${caminho}`);
    } catch (e) {
      setExportando(false);
      avisar(`Falha ao exportar: ${e.message}`, 'erro');
    }
  }

  async function salvarModelo(nome) {
    try {
      let mini = null;
      try { mini = miniatura(camadaRef.current, docRef.current, stageRef.current.scaleX()); } catch { mini = null; }
      await api('modelos:salvar', { nome, documento: esvaziarCards(docRef.current), miniatura: mini });
      setDialogo(null);
      avisar(`Modelo "${nome}" salvo. Ele aparece ao criar um novo encarte.`);
    } catch (e) { avisar(e.message, 'erro'); }
  }

  if (!carregado || !doc) return <div className="editor-carregando">Abrindo encarte…</div>;

  const f = doc.fundo;
  const propsFundo = f.gradiente
    ? (() => {
      const rad = (f.gradiente.angulo * Math.PI) / 180;
      const meia = Math.hypot(doc.largura, doc.altura) / 2;
      const cx = doc.largura / 2, cy = doc.altura / 2;
      return {
        fillLinearGradientStartPoint: { x: cx - Math.cos(rad) * meia, y: cy - Math.sin(rad) * meia },
        fillLinearGradientEndPoint: { x: cx + Math.cos(rad) * meia, y: cy + Math.sin(rad) * meia },
        fillLinearGradientColorStops: [0, f.gradiente.cor1, 1, f.gradiente.cor2]
      };
    })()
    : { fill: f.cor };
  const vazios = doc.elementos.filter(e => e.tipo === 'produto' && !e.oculto && !e.campos.nome && !e.campos.imagem && e.campos.preco == null).length;
  const textoSalvo = { salvo: 'Tudo salvo', salvando: 'Salvando…', alterado: 'Alterações não salvas', erro: 'Erro ao salvar' }[estadoSalvo];

  return (
    <div className="editor">
      <header className="editor-topo">
        <button className="botao" onClick={sair}>Voltar aos encartes</button>
        <input className="editor-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} aria-label="Título do encarte" />
        <span className={`estado-salvo ${estadoSalvo}`}>{textoSalvo}</span>
        <div className="editor-ferramentas">
          <button className="botao pequeno" onClick={desfazer} disabled={!passado.current.length} title="Desfazer (Ctrl+Z)">Desfazer</button>
          <button className="botao pequeno" onClick={refazer} disabled={!futuro.current.length} title="Refazer (Ctrl+Y)">Refazer</button>
          <span className="separador" />
          <button className="botao pequeno" onClick={() => mudarZoom(zoom - 0.1)} aria-label="Diminuir zoom">−</button>
          <button className="botao pequeno zoom" onClick={() => setZoomAuto(true)} title="Ajustar à tela">{Math.round(zoom * 100)}%</button>
          <button className="botao pequeno" onClick={() => mudarZoom(zoom + 0.1)} aria-label="Aumentar zoom">+</button>
          <span className="separador" />
          <button className="botao pequeno" onClick={acoes.salvarComoModelo}>Salvar como modelo</button>
          <button className="botao primario" onClick={acoes.exportar}>Exportar</button>
        </div>
      </header>

      <div className="editor-corpo">
        <PainelEsquerdo doc={doc} selecao={selecao} acoes={acoes} avisar={avisar} />

        <div className="editor-area" ref={areaRef} onDragOver={aoArrastarSobre} onDragLeave={() => setRealce(null)} onDrop={aoSoltar}
          onMouseDown={e => { if (e.target === areaRef.current) setSelecao([]); }}>
          <div className="editor-folha" style={{ width: doc.largura * zoom, height: doc.altura * zoom }}>
            <Stage
              ref={stageRef}
              width={doc.largura * zoom}
              height={doc.altura * zoom}
              scaleX={zoom}
              scaleY={zoom}
              onMouseDown={cliqueNoPalco}
              onTap={cliqueNoPalco}
            >
              <Layer ref={camadaRef}>
                <Rect name="fundo-pagina" x={0} y={0} width={doc.largura} height={doc.altura} {...propsFundo} />
                {doc.elementos.map(el => (
                  <Elemento key={el.id} el={el} eventos={eventos} exportando={exportando} loja={loja} realcado={realce === el.id} />
                ))}
              </Layer>
              <Layer>
                <Transformer
                  ref={trRef}
                  rotationSnaps={[0, 90, 180, 270]}
                  rotationSnapTolerance={4}
                  anchorSize={9}
                  anchorCornerRadius={2}
                  borderStroke="#2F6FEB"
                  anchorStroke="#2F6FEB"
                  ignoreStroke
                  boundBoxFunc={(antigo, novo) => (Math.abs(novo.width) < 8 || Math.abs(novo.height) < 8 ? antigo : novo)}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        <aside className="painel-direito">
          <PainelPropriedades
            selecionados={selecionados} doc={doc} mudarElemento={mudarElemento} mudarDoc={mudarDoc} acoes={acoes}
            loja={loja} lojas={lojas} lojaId={lojaId} setLojaId={setLojaId} titulo={titulo} setTitulo={setTitulo}
          />
        </aside>
      </div>

      {dialogo?.tipo === 'exportar' && (
        <Modal
          titulo="Exportar encarte"
          aoFechar={() => setDialogo(null)}
          rodape={<>
            <button className="botao" onClick={() => setDialogo(null)}>Cancelar</button>
            <button className="botao primario" onClick={() => exportarAgora(dialogo)}>Exportar {dialogo.formato.toUpperCase()}</button>
          </>}
        >
          <div className="form-exportar">
            <label>
              <span>Formato</span>
              <select value={dialogo.formato} onChange={e => setDialogo(d => ({ ...d, formato: e.target.value }))}>
                <option value="png">PNG (melhor qualidade para WhatsApp e redes)</option>
                <option value="jpg">JPG (arquivo menor)</option>
                <option value="pdf">PDF (para gráfica ou impressão)</option>
              </select>
            </label>
            <label>
              <span>Resolução</span>
              <select value={dialogo.escala} onChange={e => setDialogo(d => ({ ...d, escala: Number(e.target.value) }))}>
                {[1, 2, 3].map(x => (
                  <option key={x} value={x}>
                    {x === 1 ? 'Normal' : x === 2 ? 'Alta' : 'Máxima'}: {doc.largura * x} × {doc.altura * x} px
                  </option>
                ))}
              </select>
            </label>
            {vazios > 0 && <p className="alerta">{vazios} card(s) vazio(s) não vão aparecer no arquivo exportado.</p>}
          </div>
        </Modal>
      )}

      {dialogo?.tipo === 'modelo' && (
        <Modal
          titulo="Salvar como modelo"
          aoFechar={() => setDialogo(null)}
          rodape={<>
            <button className="botao" onClick={() => setDialogo(null)}>Cancelar</button>
            <button className="botao primario" disabled={!dialogo.nome?.trim()} onClick={() => salvarModelo(dialogo.nome.trim())}>Salvar modelo</button>
          </>}
        >
          <div className="form-exportar">
            <label>
              <span>Nome do modelo</span>
              <input autoFocus value={dialogo.nome} onChange={e => setDialogo(d => ({ ...d, nome: e.target.value }))} />
            </label>
            <p className="ajuda">O modelo guarda o layout, as cores e os textos. Os cards ficam vazios, prontos para receber outros produtos.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
