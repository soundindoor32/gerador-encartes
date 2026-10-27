import React, { useCallback, useEffect, useState } from 'react';
import { api, urlImagem } from '../api.js';
import Modal from '../components/Modal.jsx';

const VAZIA = { nome: '', cor_primaria: '#D7261E', cor_destaque: '#FFD21F', logo: null };

export default function Lojas({ avisar }) {
  const [lojas, setLojas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const carregar = useCallback(() => {
    api('lojas:listar').then(setLojas).catch(e => avisar(e.message, 'erro'));
  }, [avisar]);
  useEffect(carregar, [carregar]);

  async function salvar() {
    try {
      await api('lojas:salvar', editando);
      avisar(editando.id ? 'Loja salva.' : 'Loja cadastrada.');
      setEditando(null);
      carregar();
    } catch (e) { avisar(e.message, 'erro'); }
  }

  async function escolherLogo() {
    try {
      const rel = await api('lojas:escolherLogo');
      if (rel) setEditando(l => ({ ...l, logo: rel }));
    } catch (e) { avisar(e.message, 'erro'); }
  }

  async function excluir() {
    try {
      await api('lojas:excluir', excluindo.id);
      avisar('Loja excluída.');
      setExcluindo(null);
      carregar();
    } catch (e) { avisar(e.message, 'erro'); }
  }

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Lojas</h1>
          <p className="subtitulo">Cada loja tem seu logo e suas cores, aplicados automaticamente nos encartes dela.</p>
        </div>
        <div className="acoes">
          <button className="botao primario" onClick={() => setEditando({ ...VAZIA })}>Nova loja</button>
        </div>
      </header>

      {lojas.length === 0 ? (
        <div className="vazio">
          <h2>Nenhuma loja cadastrada</h2>
          <p>Se você faz encartes para mais de um cliente, cadastre cada loja aqui. Se for só uma, cadastre ela também para guardar logo e cores.</p>
          <button className="botao primario" onClick={() => setEditando({ ...VAZIA })}>Cadastrar loja</button>
        </div>
      ) : (
        <ul className="lista-lojas">
          {lojas.map(l => (
            <li key={l.id} className="loja-cartao">
              <div className="loja-faixa" style={{ background: l.cor_primaria }}>
                {l.logo
                  ? <img src={urlImagem(l.logo)} alt={`Logo ${l.nome}`} />
                  : <span className="loja-inicial" style={{ color: l.cor_destaque }}>{l.nome.slice(0, 1)}</span>}
                <span className="loja-amostra" style={{ background: l.cor_destaque }} />
              </div>
              <div className="loja-info">
                <h3>{l.nome}</h3>
                <p className="fraco">{l.total_produtos} produto(s) exclusivo(s)</p>
                <div className="acoes">
                  <button className="botao pequeno" onClick={() => setEditando({ ...l })}>Editar</button>
                  <button className="botao pequeno texto" onClick={() => setExcluindo(l)}>Excluir</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <Modal
          titulo={editando.id ? 'Editar loja' : 'Nova loja'}
          aoFechar={() => setEditando(null)}
          rodape={<>
            <button className="botao" onClick={() => setEditando(null)}>Cancelar</button>
            <button className="botao primario" onClick={salvar}>{editando.id ? 'Salvar loja' : 'Cadastrar loja'}</button>
          </>}
        >
          <div className="form-loja">
            <label>Nome da loja
              <input autoFocus value={editando.nome} onChange={e => setEditando(l => ({ ...l, nome: e.target.value }))} />
            </label>
            <div className="cores">
              <label>Cor principal
                <input type="color" value={editando.cor_primaria} onChange={e => setEditando(l => ({ ...l, cor_primaria: e.target.value }))} />
              </label>
              <label>Cor de destaque
                <input type="color" value={editando.cor_destaque} onChange={e => setEditando(l => ({ ...l, cor_destaque: e.target.value }))} />
              </label>
            </div>
            <div className="logo-campo">
              {editando.logo
                ? <img src={urlImagem(editando.logo)} alt="Logo" />
                : <span className="fraco">Sem logo</span>}
              <button type="button" className="botao pequeno" onClick={escolherLogo}>
                {editando.logo ? 'Trocar logo' : 'Escolher logo'}
              </button>
              {editando.logo && (
                <button type="button" className="botao pequeno texto" onClick={() => setEditando(l => ({ ...l, logo: null }))}>Remover</button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {excluindo && (
        <Modal
          titulo="Excluir loja"
          aoFechar={() => setExcluindo(null)}
          rodape={<>
            <button className="botao" onClick={() => setExcluindo(null)}>Cancelar</button>
            <button className="botao perigo" onClick={excluir}>Excluir loja</button>
          </>}
        >
          <p>A loja <strong>{excluindo.nome}</strong> será excluída. Os {excluindo.total_produtos} produto(s) dela continuam no catálogo, como catálogo geral.</p>
        </Modal>
      )}
    </section>
  );
}
