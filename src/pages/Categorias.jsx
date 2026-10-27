import React, { useCallback, useEffect, useState } from 'react';
import { api, SEGMENTOS } from '../api.js';

export default function Categorias({ avisar }) {
  const [categorias, setCategorias] = useState([]);
  const [nova, setNova] = useState({ nome: '', segmento: 'geral' });
  const [editandoId, setEditandoId] = useState(null);
  const [rascunho, setRascunho] = useState({});

  const carregar = useCallback(() => {
    api('categorias:listar').then(setCategorias).catch(e => avisar(e.message, 'erro'));
  }, [avisar]);
  useEffect(carregar, [carregar]);

  async function adicionar(e) {
    e.preventDefault();
    try {
      await api('categorias:salvar', nova);
      setNova({ nome: '', segmento: nova.segmento });
      carregar();
    } catch (err) { avisar(err.message, 'erro'); }
  }

  async function salvarEdicao() {
    try {
      await api('categorias:salvar', rascunho);
      setEditandoId(null);
      carregar();
    } catch (err) { avisar(err.message, 'erro'); }
  }

  async function excluir(c) {
    try {
      await api('categorias:excluir', c.id);
      avisar(`Categoria "${c.nome}" excluída. ${c.total_produtos} produto(s) ficaram sem categoria.`);
      carregar();
    } catch (err) { avisar(err.message, 'erro'); }
  }

  const nomeSegmento = v => SEGMENTOS.find(s => s.valor === v)?.nome || v;

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Categorias</h1>
          <p className="subtitulo">Categorias novas também são criadas automaticamente ao importar planilhas.</p>
        </div>
      </header>

      <form className="linha-nova" onSubmit={adicionar}>
        <input placeholder="Nome da nova categoria" value={nova.nome} onChange={e => setNova(n => ({ ...n, nome: e.target.value }))} />
        <select value={nova.segmento} onChange={e => setNova(n => ({ ...n, segmento: e.target.value }))}>
          {SEGMENTOS.map(s => <option key={s.valor} value={s.valor}>{s.nome}</option>)}
        </select>
        <button className="botao primario" disabled={!nova.nome.trim()}>Adicionar categoria</button>
      </form>

      <div className="tabela-caixa">
        <table className="tabela">
          <thead>
            <tr><th>Categoria</th><th>Segmento</th><th>Produtos</th><th className="col-acoes"></th></tr>
          </thead>
          <tbody>
            {categorias.map(c => editandoId === c.id ? (
              <tr key={c.id} className="marcada">
                <td><input autoFocus value={rascunho.nome} onChange={e => setRascunho(r => ({ ...r, nome: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') setEditandoId(null); }} /></td>
                <td>
                  <select value={rascunho.segmento} onChange={e => setRascunho(r => ({ ...r, segmento: e.target.value }))}>
                    {SEGMENTOS.map(s => <option key={s.valor} value={s.valor}>{s.nome}</option>)}
                  </select>
                </td>
                <td>{c.total_produtos}</td>
                <td className="col-acoes">
                  <button className="botao pequeno primario" onClick={salvarEdicao}>Salvar</button>
                  <button className="botao pequeno texto" onClick={() => setEditandoId(null)}>Cancelar</button>
                </td>
              </tr>
            ) : (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{nomeSegmento(c.segmento)}</td>
                <td>{c.total_produtos}</td>
                <td className="col-acoes">
                  <button className="botao pequeno" onClick={() => { setEditandoId(c.id); setRascunho({ ...c }); }}>Renomear</button>
                  <button className="botao pequeno texto" onClick={() => excluir(c)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categorias.length === 0 && <div className="vazio pequeno">Nenhuma categoria ainda. Adicione acima ou importe uma planilha.</div>}
      </div>
    </section>
  );
}
