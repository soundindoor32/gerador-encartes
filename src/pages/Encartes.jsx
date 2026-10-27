import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';
import { MODELOS_EMBUTIDOS } from '../editor/modelos/embutidos.js';

function PreviaEmbutida({ modelo }) {
  if (modelo.branco) {
    const d = modelo.criar();
    return (
      <div className="previa-modelo branco" style={{ aspectRatio: `${d.largura} / ${d.altura}` }}>
        <span>{d.largura} × {d.altura}</span>
      </div>
    );
  }
  const quadrado = modelo.id === 'casa-quadrado';
  return (
    <div className={`previa-modelo desenho ${quadrado ? 'quadrado' : ''}`} style={{ aspectRatio: quadrado ? '1 / 1' : '2 / 3' }}>
      <div className="p-topo"><span className="p-logo" /><span className="p-titulo" /></div>
      {[0, 1, 2].map(l => (
        <div key={l} className="p-linha">
          {[0, 1, 2, 3, 4].map(c => <span key={c} className={quadrado ? 'p-card selo' : 'p-card faixa'} />)}
        </div>
      ))}
      <div className="p-rodape" />
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
              <PreviaEmbutida modelo={m} />
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
  const [excluindo, setExcluindo] = useState(null);

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
            <li key={e.id} className="encarte-cartao">
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
