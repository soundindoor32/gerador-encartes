import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';
import { Stage, Layer, Rect } from 'react-konva';
import { MODELOS_EMBUTIDOS } from '../editor/modelos/embutidos.js';
import { Elemento } from '../editor/Elementos.jsx';
import { carregarFontes } from '../editor/fontes.js';
import { cardsVazios, preencherDocumento } from '../editor/documento.js';
import { renderizarDocumento, sincronizarComCatalogo, dataUrlParaBytes } from '../editor/renderizar.jsx';
import { criarZip } from '../editor/zip.js';
import PrecoTag from '../components/PrecoTag.jsx';

const nomeDeArquivo = t => (t || 'encarte').replace(/[\\/:*?"<>|]+/g, '-').trim();

// Exporta vários encartes num único ZIP (TV em resolução nativa, impressos em 2x)
async function exportarEmLote(ids, avisar, aoProgresso) {
  const lojas = await api('lojas:listar');
  const arquivos = [];
  for (let i = 0; i < ids.length; i += 1) {
    aoProgresso?.(i + 1, ids.length);
    const e = await api('encartes:obter', ids[i]);
    const doc = await sincronizarComCatalogo(e.documento);
    const escala = doc.largura >= 1900 || doc.altura >= 1900 ? 1 : 2;
    const url = await renderizarDocumento(doc, { loja: lojas.find(l => l.id === e.loja_id) || null, escala });
    arquivos.push({ nome: `${String(i + 1).padStart(2, '0')} - ${nomeDeArquivo(e.titulo)}.png`, bytes: dataUrlParaBytes(url) });
  }
  const zip = criarZip(arquivos);
  const caminho = await api('exportar:salvar', zip, `encartes-${new Date().toISOString().slice(0, 10)}`, 'zip');
  if (caminho) avisar(`${arquivos.length} imagem(ns) exportada(s): ${caminho}`);
}

function SlidesTV({ aoFechar, aoConcluir, avisar }) {
  const tv = MODELOS_EMBUTIDOS.filter(m => m.tv);
  const outros = MODELOS_EMBUTIDOS.filter(m => !m.tv && !m.branco);
  const [titulo, setTitulo] = useState('Ofertas');
  const [lojaId, setLojaId] = useState('');
  const [lojas, setLojas] = useState([]);
  const [meus, setMeus] = useState([]);
  const [modelo, setModelo] = useState({ tipo: 'embutido', id: tv[0].id });
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [marcados, setMarcados] = useState(new Set());
  const [espacos, setEspacos] = useState(0);
  const [progresso, setProgresso] = useState(null);
  const [criados, setCriados] = useState(null);

  useEffect(() => {
    api('lojas:listar').then(setLojas).catch(() => {});
    api('categorias:listar').then(setCategorias).catch(() => {});
    api('modelos:listar').then(setMeus).catch(() => {});
  }, []);

  useEffect(() => {
    api('produtos:listar', { categoriaId }).then(r => {
      setProdutos(r.itens);
      setMarcados(new Set(r.itens.map(p => p.id)));
    }).catch(e => avisar(e.message, 'erro'));
  }, [categoriaId, avisar]);

  async function docDoModelo() {
    if (modelo.tipo === 'embutido') return MODELOS_EMBUTIDOS.find(m => m.id === modelo.id).criar();
    return (await api('modelos:obter', modelo.id)).documento;
  }

  useEffect(() => {
    let vivo = true;
    docDoModelo().then(d => vivo && setEspacos(cardsVazios(d).length)).catch(() => setEspacos(0));
    return () => { vivo = false; };
  }, [modelo]); // eslint-disable-line react-hooks/exhaustive-deps

  const escolhidos = produtos.filter(p => marcados.has(p.id));
  const totalSlides = espacos ? Math.ceil(escolhidos.length / espacos) : 0;

  async function gerar() {
    try {
      const loja = lojas.find(l => l.id === Number(lojaId)) || null;
      const ids = [];
      for (let i = 0; i < totalSlides; i += 1) {
        setProgresso(`Criando tela ${i + 1} de ${totalSlides}…`);
        const base = await docDoModelo();
        const doc = preencherDocumento(base, escolhidos.slice(i * espacos, (i + 1) * espacos));
        const mini = await renderizarDocumento(doc, { loja, escala: 300 / doc.largura, tipo: 'jpg', qualidade: 0.72 });
        ids.push(await api('encartes:salvar', {
          titulo: totalSlides > 1 ? `${titulo.trim() || 'Ofertas'} ${i + 1}/${totalSlides}` : (titulo.trim() || 'Ofertas'),
          loja_id: loja?.id ?? null, documento: doc, miniatura: mini
        }));
      }
      setProgresso(null);
      setCriados(ids);
      aoConcluir();
    } catch (e) {
      setProgresso(null);
      avisar(e.message, 'erro');
    }
  }

  async function exportarCriados() {
    try {
      await exportarEmLote(criados, avisar, (i, n) => setProgresso(`Exportando ${i} de ${n}…`));
    } catch (e) { avisar(e.message, 'erro'); }
    setProgresso(null);
  }

  if (criados) {
    return (
      <Modal titulo="Slides criados" aoFechar={aoFechar}
        rodape={<>
          <button className="botao" onClick={aoFechar}>Fechar</button>
          <button className="botao primario" onClick={exportarCriados} disabled={!!progresso}>{progresso || `Baixar as ${criados.length} telas (ZIP)`}</button>
        </>}>
        <p>{criados.length} tela(s) criada(s). Elas aparecem na lista de encartes, onde você pode abrir e ajustar cada uma.</p>
        <p className="ajuda">As telas de TV saem em 1920 × 1080 (ou 1080 × 1920 em pé), o tamanho exato da TV Full HD.</p>
      </Modal>
    );
  }

  return (
    <Modal
      titulo="Slides para TV"
      aoFechar={aoFechar}
      largo
      rodape={<>
        <button className="botao" onClick={aoFechar}>Cancelar</button>
        <button className="botao primario" onClick={gerar} disabled={!!progresso || !totalSlides}>
          {progresso || (totalSlides ? `Criar ${totalSlides} tela(s)` : 'Escolha os produtos')}
        </button>
      </>}
    >
      <div className="form-grade">
        <label>Nome das telas
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Açougue da semana" />
        </label>
        <label>Loja (logo)
          <select value={lojaId} onChange={e => setLojaId(e.target.value)}>
            <option value="">Nenhuma</option>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </label>
        <label className="ocupa-2">Modelo
          <select
            value={`${modelo.tipo}:${modelo.id}`}
            onChange={e => { const [tipo, id] = e.target.value.split(':'); setModelo({ tipo, id: tipo === 'meu' ? Number(id) : id }); }}
          >
            <optgroup label="Para TV">{tv.map(m => <option key={m.id} value={`embutido:${m.id}`}>{m.nome}</option>)}</optgroup>
            {meus.length > 0 && <optgroup label="Meus modelos">{meus.map(m => <option key={m.id} value={`meu:${m.id}`}>{m.nome}</option>)}</optgroup>}
            <optgroup label="Impressos">{outros.map(m => <option key={m.id} value={`embutido:${m.id}`}>{m.nome}</option>)}</optgroup>
          </select>
        </label>
      </div>

      <div className="slides-produtos">
        <div className="slides-topo">
          <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button className="botao pequeno" onClick={() => setMarcados(new Set(produtos.map(p => p.id)))}>Marcar todos</button>
          <button className="botao pequeno" onClick={() => setMarcados(new Set())}>Desmarcar</button>
          <span className="resumo-slides">
            {escolhidos.length} produto(s), {espacos} por tela: <strong>{totalSlides} tela(s)</strong>
          </span>
        </div>
        <ul className="lista-slides">
          {produtos.map(p => (
            <li key={p.id}>
              <label className="check">
                <input type="checkbox" checked={marcados.has(p.id)}
                  onChange={() => setMarcados(m => { const n = new Set(m); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })} />
                <span className="nome">{p.nome}</span>
                <PrecoTag preco={p.preco} unidade={p.unidade} />
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

// Miniatura real do modelo, desenhada com o mesmo motor do editor
const docsDosModelos = new Map();
function PreviaEmbutida({ modelo, fontesProntas }) {
  if (!docsDosModelos.has(modelo.id)) docsDosModelos.set(modelo.id, modelo.criar());
  const d = docsDosModelos.get(modelo.id);
  if (modelo.branco) {
    return (
      <div className="previa-modelo branco" style={{ aspectRatio: `${d.largura} / ${d.altura}` }}>
        <span>{d.largura} × {d.altura}</span>
      </div>
    );
  }
  const largura = 128;
  const escala = largura / d.largura;
  const semEventos = { selecionar() {}, duploClique() {}, fimArrasto() {}, fimTransformacao() {} };
  return (
    <div className="previa-real" style={{ width: largura, height: d.altura * escala }}>
      {fontesProntas && (
        <Stage width={largura} height={d.altura * escala} scaleX={escala} scaleY={escala} listening={false}>
          <Layer listening={false}>
            <Rect width={d.largura} height={d.altura} fill={d.fundo.cor} />
            {d.elementos.map(el => <Elemento key={el.id} el={el} eventos={semEventos} exportando={false} loja={null} realcado={false} />)}
          </Layer>
        </Stage>
      )}
    </div>
  );
}

function NovoEncarte({ aoFechar, aoCriar, avisar }) {
  const [titulo, setTitulo] = useState('');
  const [lojaId, setLojaId] = useState('');
  const [lojas, setLojas] = useState([]);
  const [meusModelos, setMeusModelos] = useState([]);
  const [escolhido, setEscolhido] = useState({ tipo: 'embutido', id: MODELOS_EMBUTIDOS[0].id });
  const [criando, setCriando] = useState(false);
  const [fontesProntas, setFontesProntas] = useState(false);
  useEffect(() => { carregarFontes().then(() => setFontesProntas(true)); }, []);

  const carregarModelos = useCallback(() => {
    api('modelos:listar').then(setMeusModelos).catch(() => {});
  }, []);

  useEffect(() => {
    api('lojas:listar').then(setLojas).catch(() => {});
    carregarModelos();
  }, [carregarModelos]);

  async function criar() {
    setCriando(true);
    try {
      const documento = escolhido.tipo === 'embutido'
        ? MODELOS_EMBUTIDOS.find(m => m.id === escolhido.id).criar()
        : (await api('modelos:obter', escolhido.id)).documento;
      const id = await api('encartes:salvar', {
        titulo: titulo.trim() || 'Novo encarte',
        loja_id: lojaId ? Number(lojaId) : null,
        documento
      });
      aoCriar(id);
    } catch (e) {
      avisar(e.message, 'erro');
      setCriando(false);
    }
  }

  async function excluirModelo(m) {
    try {
      await api('modelos:excluir', m.id);
      if (escolhido.tipo === 'meu' && escolhido.id === m.id) setEscolhido({ tipo: 'embutido', id: MODELOS_EMBUTIDOS[0].id });
      carregarModelos();
      avisar(`Modelo "${m.nome}" excluído.`);
    } catch (e) { avisar(e.message, 'erro'); }
  }

  return (
    <Modal
      titulo="Novo encarte"
      aoFechar={aoFechar}
      largo
      rodape={<>
        <button className="botao" onClick={aoFechar}>Cancelar</button>
        <button className="botao primario" onClick={criar} disabled={criando}>Criar encarte</button>
      </>}
    >
      <div className="form-grade">
        <label>Título
          <input autoFocus value={titulo} placeholder="Ex.: Ofertas da semana" onChange={e => setTitulo(e.target.value)} />
        </label>
        <label>Loja
          <select value={lojaId} onChange={e => setLojaId(e.target.value)}>
            <option value="">Nenhuma</option>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </label>
      </div>

      {meusModelos.length > 0 && (
        <>
          <h3 className="titulo-modelos">Meus modelos</h3>
          <ul className="grade-modelos">
            {meusModelos.map(m => (
              <li key={m.id}>
                <button
                  className={`modelo-opcao ${escolhido.tipo === 'meu' && escolhido.id === m.id ? 'ativo' : ''}`}
                  onClick={() => setEscolhido({ tipo: 'meu', id: m.id })}
                >
                  {m.miniatura ? <img src={m.miniatura} alt="" /> : <div className="previa-modelo branco" />}
                  <span>{m.nome}</span>
                </button>
                <button className="link-excluir" onClick={() => excluirModelo(m)}>Excluir modelo</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="titulo-modelos">Modelos prontos</h3>
      <ul className="grade-modelos">
        {MODELOS_EMBUTIDOS.map(m => (
          <li key={m.id}>
            <button
              className={`modelo-opcao ${escolhido.tipo === 'embutido' && escolhido.id === m.id ? 'ativo' : ''}`}
              onClick={() => setEscolhido({ tipo: 'embutido', id: m.id })}
            >
              <PreviaEmbutida modelo={m} fontesProntas={fontesProntas} />
              <span>{m.nome}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default function Encartes({ avisar, abrirEditor }) {
  const [encartes, setEncartes] = useState(null);
  const [novo, setNovo] = useState(false);
  const [slides, setSlides] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [marcados, setMarcados] = useState(new Set());
  const [exportando, setExportando] = useState(null);

  async function exportarMarcados() {
    try {
      await exportarEmLote([...marcados], avisar, (i, n) => setExportando(`Exportando ${i} de ${n}…`));
    } catch (e) { avisar(e.message, 'erro'); }
    setExportando(null);
  }

  const carregar = useCallback(() => {
    api('encartes:listar').then(setEncartes).catch(e => avisar(e.message, 'erro'));
  }, [avisar]);
  useEffect(carregar, [carregar]);

  async function duplicar(e) {
    try {
      await api('encartes:duplicar', e.id);
      avisar('Encarte duplicado.');
      carregar();
    } catch (err) { avisar(err.message, 'erro'); }
  }

  async function excluir() {
    try {
      await api('encartes:excluir', excluindo.id);
      setMarcados(m => { const n = new Set(m); n.delete(excluindo.id); return n; });
      avisar('Encarte excluído.');
      setExcluindo(null);
      carregar();
    } catch (err) { avisar(err.message, 'erro'); }
  }

  if (!encartes) return null;

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Encartes</h1>
          <p className="subtitulo">Os preços são atualizados do catálogo sempre que você abre um encarte.</p>
        </div>
        <div className="acoes">
          {marcados.size > 0 && (
            <button className="botao" onClick={exportarMarcados} disabled={!!exportando}>
              {exportando || `Exportar ${marcados.size} selecionado(s) (ZIP)`}
            </button>
          )}
          <button className="botao" onClick={() => setSlides(true)}>Slides para TV</button>
          <button className="botao primario" onClick={() => setNovo(true)}>Novo encarte</button>
        </div>
      </header>

      {encartes.length === 0 ? (
        <div className="vazio">
          <h2>Nenhum encarte ainda</h2>
          <p>Escolha um modelo pronto, arraste os produtos do catálogo e exporte em PNG, JPG ou PDF.</p>
          <button className="botao primario" onClick={() => setNovo(true)}>Criar primeiro encarte</button>
        </div>
      ) : (
        <ul className="grade-encartes">
          {encartes.map(e => (
            <li key={e.id} className={`encarte-cartao ${marcados.has(e.id) ? 'marcado' : ''}`}>
              <label className="marcar-encarte" title="Selecionar para exportar">
                <input type="checkbox" checked={marcados.has(e.id)}
                  onChange={() => setMarcados(m => { const n = new Set(m); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n; })} />
              </label>
              <button className="encarte-abrir" onClick={() => abrirEditor(e.id)} aria-label={`Abrir ${e.titulo}`}>
                {e.miniatura ? <img src={e.miniatura} alt="" /> : <div className="sem-miniatura">sem prévia</div>}
              </button>
              <div className="encarte-info">
                <h3>{e.titulo}</h3>
                <p className="fraco">{e.loja_nome || 'Sem loja'}. Editado em {new Date(e.atualizado_em.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <div className="acoes">
                  <button className="botao pequeno" onClick={() => abrirEditor(e.id)}>Abrir</button>
                  <button className="botao pequeno" onClick={() => duplicar(e)}>Duplicar</button>
                  <button className="botao pequeno texto" onClick={() => setExcluindo(e)}>Excluir</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {slides && <SlidesTV avisar={avisar} aoFechar={() => setSlides(false)} aoConcluir={carregar} />}
      {novo && <NovoEncarte avisar={avisar} aoFechar={() => setNovo(false)} aoCriar={id => { setNovo(false); abrirEditor(id); }} />}

      {excluindo && (
        <Modal
          titulo="Excluir encarte"
          aoFechar={() => setExcluindo(null)}
          rodape={<>
            <button className="botao" onClick={() => setExcluindo(null)}>Cancelar</button>
            <button className="botao perigo" onClick={excluir}>Excluir encarte</button>
          </>}
        >
          <p>O encarte <strong>{excluindo.titulo}</strong> será excluído. Os produtos do catálogo não são afetados.</p>
        </Modal>
      )}
    </section>
  );
}
