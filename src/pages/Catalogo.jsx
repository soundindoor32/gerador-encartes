import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatarPreco, lerPreco } from '../api.js';
import ProdutoModal from '../components/ProdutoModal.jsx';
import PrecoTag from '../components/PrecoTag.jsx';
import Miniatura from '../components/Miniatura.jsx';
import Modal from '../components/Modal.jsx';

function PrecoCelula({ produto, aoSalvar, avisar }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');

  function abrir() {
    setValor(produto.preco != null ? formatarPreco(produto.preco) : '');
    setEditando(true);
  }

  async function confirmar() {
    const preco = lerPreco(valor);
    if (Number.isNaN(preco)) { avisar('Preço inválido. Use o formato 12,99.', 'erro'); return; }
    setEditando(false);
    if (preco === produto.preco) return;
    try {
      await api('produtos:salvar', { id: produto.id, preco });
      aoSalvar();
    } catch (e) { avisar(e.message, 'erro'); }
  }

  if (editando) {
    return (
      <input
        className="entrada-preco inline"
        autoFocus
        value={valor}
        onChange={e => setValor(e.target.value)}
        onBlur={confirmar}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setEditando(false);
        }}
        aria-label={`Preço de ${produto.nome}`}
      />
    );
  }
  return (
    <button className="preco-botao" onClick={abrir} title="Clique para editar o preço">
      <PrecoTag preco={produto.preco} unidade={produto.unidade} />
    </button>
  );
}

export default function Catalogo({ avisar, irPara }) {
  const [filtro, setFiltro] = useState({ busca: '', categoriaId: '', lojaId: '', semImagem: false });
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState({ itens: [], total: 0 });
  const [lojas, setLojas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [editando, setEditando] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [carregado, setCarregado] = useState(false);

  // Espera o usuário parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setFiltro(f => ({ ...f, busca })), 250);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(async () => {
    try {
      setResultado(await api('produtos:listar', filtro));
      setCarregado(true);
    } catch (e) { avisar(e.message, 'erro'); }
  }, [filtro, avisar]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    Promise.all([api('lojas:listar'), api('categorias:listar')])
      .then(([l, c]) => { setLojas(l); setCategorias(c); })
      .catch(e => avisar(e.message, 'erro'));
  }, [avisar, editando]);

  const itens = resultado.itens;
  const todosMarcados = itens.length > 0 && itens.every(p => selecionados.has(p.id));
  const semFoto = useMemo(() => itens.filter(p => !p.imagem).length, [itens]);

  function alternar(id) {
    setSelecionados(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function alternarTodos() {
    setSelecionados(todosMarcados ? new Set() : new Set(itens.map(p => p.id)));
  }

  async function excluirSelecionados() {
    try {
      await api('produtos:excluir', [...selecionados]);
      avisar(`${selecionados.size} produto(s) excluído(s).`);
      setSelecionados(new Set());
      setConfirmarExclusao(false);
      carregar();
    } catch (e) { avisar(e.message, 'erro'); }
  }

  async function associarLote() {
    try {
      const r = await api('imagens:associarLote', false);
      if (!r) return;
      let msg = `${r.associadas} foto(s) associada(s).`;
      if (r.jaTinham) msg += ` ${r.jaTinham} produto(s) já tinham foto e foram mantidos.`;
      if (r.semProduto.length) msg += ` ${r.semProduto.length} arquivo(s) sem produto com esse EAN/SKU.`;
      avisar(msg, r.semProduto.length ? 'atencao' : 'ok');
      carregar();
    } catch (e) { avisar(e.message, 'erro'); }
  }

  async function soltarImagem(id, caminho) {
    try {
      await api('produtos:definirImagem', id, caminho);
      carregar();
    } catch (e) { avisar(e.message, 'erro'); }
  }

  const vazioTotal = carregado && resultado.total === 0;

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Catálogo</h1>
          <p className="subtitulo">
            {resultado.total} produto(s) cadastrado(s)
            {semFoto > 0 && !vazioTotal && <>. <button className="link" onClick={() => setFiltro(f => ({ ...f, semImagem: true }))}>{semFoto} sem foto nesta lista</button></>}
          </p>
        </div>
        <div className="acoes">
          <button className="botao" onClick={associarLote}>Associar fotos em lote</button>
          <button className="botao primario" onClick={() => setEditando({})}>Novo produto</button>
        </div>
      </header>

      {vazioTotal ? (
        <div className="vazio">
          <h2>Seu catálogo está vazio</h2>
          <p>Importe uma planilha do sistema da loja ou cadastre os produtos um a um.</p>
          <div className="acoes">
            <button className="botao primario" onClick={() => irPara('importar')}>Importar planilha</button>
            <button className="botao" onClick={() => setEditando({})}>Cadastrar produto</button>
          </div>
        </div>
      ) : (
        <>
          <div className="filtros">
            <input
              type="search"
              className="busca"
              placeholder="Buscar por nome, marca, EAN ou SKU"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <select value={filtro.categoriaId} onChange={e => setFiltro(f => ({ ...f, categoriaId: e.target.value }))}>
              <option value="">Todas as categorias</option>
              <option value="sem">Sem categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select value={filtro.lojaId} onChange={e => setFiltro(f => ({ ...f, lojaId: e.target.value }))}>
              <option value="">Todas as lojas</option>
              <option value="todas-lojas">Catálogo geral</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <label className="check">
              <input
                type="checkbox"
                checked={filtro.semImagem}
                onChange={e => setFiltro(f => ({ ...f, semImagem: e.target.checked }))}
              />
              Só sem foto
            </label>
          </div>

          {selecionados.size > 0 && (
            <div className="barra-selecao">
              <span>{selecionados.size} selecionado(s)</span>
              <button className="botao pequeno" onClick={() => setSelecionados(new Set())}>Limpar seleção</button>
              <button className="botao pequeno perigo" onClick={() => setConfirmarExclusao(true)}>Excluir selecionados</button>
            </div>
          )}

          <div className="tabela-caixa">
            <table className="tabela">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} aria-label="Selecionar todos" />
                  </th>
                  <th className="col-foto">Foto</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Loja</th>
                  <th>EAN / SKU</th>
                  <th className="col-preco">Preço</th>
                  <th className="col-acoes"></th>
                </tr>
              </thead>
              <tbody>
                {itens.map(p => (
                  <tr key={p.id} className={selecionados.has(p.id) ? 'marcada' : ''}>
                    <td className="col-check">
                      <input type="checkbox" checked={selecionados.has(p.id)} onChange={() => alternar(p.id)} aria-label={`Selecionar ${p.nome}`} />
                    </td>
                    <td className="col-foto">
                      <Miniatura imagem={p.imagem} aoSoltarArquivo={c => soltarImagem(p.id, c)} />
                    </td>
                    <td>
                      <div className="nome-produto">{p.nome}</div>
                      {p.marca && <div className="marca">{p.marca}</div>}
                    </td>
                    <td>{p.categoria_nome || <span className="fraco">—</span>}</td>
                    <td>{p.loja_nome || <span className="fraco">Geral</span>}</td>
                    <td className="codigos">
                      {p.ean && <div>{p.ean}</div>}
                      {p.sku && <div className="fraco">{p.sku}</div>}
                    </td>
                    <td className="col-preco">
                      <PrecoCelula produto={p} aoSalvar={carregar} avisar={avisar} />
                    </td>
                    <td className="col-acoes">
                      <button className="botao pequeno" onClick={() => setEditando(p)}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {itens.length === 0 && (
              <div className="vazio pequeno">Nenhum produto encontrado com esses filtros.</div>
            )}
          </div>
        </>
      )}

      {editando && (
        <ProdutoModal
          produto={editando}
          lojas={lojas}
          categorias={categorias}
          avisar={avisar}
          aoFechar={() => setEditando(null)}
          aoSalvar={(id, manterAberto) => {
            carregar();
            if (!manterAberto) setEditando(null);
          }}
        />
      )}

      {confirmarExclusao && (
        <Modal
          titulo="Excluir produtos"
          aoFechar={() => setConfirmarExclusao(false)}
          rodape={<>
            <button className="botao" onClick={() => setConfirmarExclusao(false)}>Cancelar</button>
            <button className="botao perigo" onClick={excluirSelecionados}>Excluir {selecionados.size} produto(s)</button>
          </>}
        >
          <p>Os produtos e suas fotos serão apagados do catálogo. Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
    </section>
  );
}
