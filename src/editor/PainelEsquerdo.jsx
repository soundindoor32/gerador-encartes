import React, { useEffect, useState } from 'react';
import { api, urlImagem } from '../api.js';
import PrecoTag from '../components/PrecoTag.jsx';
import { ICONES } from './icones.js';
import { rotuloElemento } from './documento.js';

function AbaProdutos({ acoes, avisar }) {
  const [busca, setBusca] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);

  useEffect(() => { api('categorias:listar').then(setCategorias).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      api('produtos:listar', { busca, categoriaId })
        .then(r => setItens(r.itens))
        .catch(e => avisar(e.message, 'erro'));
    }, 200);
    return () => clearTimeout(t);
  }, [busca, categoriaId, avisar]);

  return (
    <div className="aba-produtos">
      <input type="search" placeholder="Buscar produto" value={busca} onChange={e => setBusca(e.target.value)} />
      <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
        <option value="">Todas as categorias</option>
        {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <p className="ajuda">Arraste para um card do encarte, ou use + para preencher o próximo card vazio.</p>
      <ul className="lista-produtos-editor">
        {itens.map(p => (
          <li
            key={p.id}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('application/x-produto', JSON.stringify(p));
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            <div className="mini">{p.imagem ? <img src={urlImagem(p.imagem)} alt="" /> : <span>sem foto</span>}</div>
            <div className="info">
              <strong>{p.nome}</strong>
              <PrecoTag preco={p.preco} unidade={p.unidade} />
            </div>
            <button className="mais" title="Colocar no próximo card vazio" onClick={() => acoes.adicionarProdutos([p])}>+</button>
          </li>
        ))}
      </ul>
      {itens.length > 1 && (
        <button className="botao" onClick={() => acoes.adicionarProdutos(itens)}>
          Preencher cards vazios com esta lista ({itens.length})
        </button>
      )}
      {itens.length === 0 && <p className="ajuda">Nenhum produto encontrado.</p>}
    </div>
  );
}

const INSERIR = [
  { rotulo: 'Título', tipo: 'texto', props: { texto: 'TÍTULO', tamanho: 90, peso: '900', cor: '#FFFFFF', contornoLargura: 10, contornoCor: '#0D2C6B', sombraY: 7, alinhamento: 'center', w: 600 } },
  { rotulo: 'Texto', tipo: 'texto', props: { texto: 'Seu texto aqui', tamanho: 32, peso: '700', w: 420 } },
  { rotulo: 'Faixa com texto', tipo: 'texto', props: { texto: 'NOVA SEÇÃO', tamanho: 24, peso: '900', cor: '#FFFFFF', fundo: '#0D2C6B', alinhamento: 'center', w: 260 } },
  { rotulo: 'Card de produto', tipo: 'produto', props: {} },
  { rotulo: 'Retângulo', tipo: 'retangulo', props: {} },
  { rotulo: 'Círculo', tipo: 'elipse', props: {} },
  { rotulo: 'Linha tracejada', tipo: 'linha', props: { cor: '#0D2C6B' } },
  { rotulo: 'Fundo com raios', tipo: 'raios', props: {} },
  { rotulo: 'Logo da loja', tipo: 'logo', props: {} },
  { rotulo: 'Imagem do computador', tipo: 'imagem', props: {}, especial: 'imagem' }
];

function AbaElementos({ acoes }) {
  return (
    <div className="aba-elementos">
      <div className="grade-inserir">
        {INSERIR.map(item => (
          <button key={item.rotulo} onClick={() => item.especial === 'imagem' ? acoes.inserirImagem() : acoes.inserir(item.tipo, item.props)}>
            {item.rotulo}
          </button>
        ))}
      </div>
      <h4>Ícones</h4>
      <div className="grade-icones">
        {Object.entries(ICONES).map(([chave, def]) => (
          <button key={chave} title={def.nome} onClick={() => acoes.inserir('icone', { icone: chave })}>
            <svg viewBox="0 0 24 24" width="26" height="26">
              {def.partes.map((p, i) => (
                <path key={i} d={p.d} fill={p.contorno ? 'none' : 'currentColor'} stroke={p.contorno ? 'currentColor' : 'none'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fillRule={p.regraPar ? 'evenodd' : 'nonzero'}
                  opacity={p.corInterna ? 0.45 : 1} />
              ))}
            </svg>
          </button>
        ))}
      </div>
      <p className="ajuda">Dica: arraste uma imagem do Explorer direto para o encarte. Se soltar sobre um card, ela vira a foto do card.</p>
    </div>
  );
}

function AbaCamadas({ doc, selecao, acoes }) {
  const lista = [...doc.elementos].reverse();
  return (
    <ul className="lista-camadas">
      {lista.map(el => (
        <li key={el.id} className={selecao.includes(el.id) ? 'ativo' : ''}>
          <button className="nome" onClick={e => acoes.selecionarCamada(el.id, e.shiftKey)}>
            <span className={el.oculto ? 'riscado' : ''}>{rotuloElemento(el)}</span>
          </button>
          <button className={`mini-botao ${el.oculto ? 'desligado' : ''}`} title={el.oculto ? 'Mostrar' : 'Esconder'}
            onClick={() => acoes.mudarElemento(el.id, { oculto: !el.oculto })}>
            {el.oculto ? 'mostrar' : 'ver'}
          </button>
          <button className={`mini-botao ${el.bloqueado ? 'travado' : ''}`} title={el.bloqueado ? 'Destravar' : 'Travar'}
            onClick={() => acoes.mudarElemento(el.id, { bloqueado: !el.bloqueado })}>
            {el.bloqueado ? 'travado' : 'livre'}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function PainelEsquerdo({ doc, selecao, acoes, avisar }) {
  const [aba, setAba] = useState('produtos');
  return (
    <aside className="painel-esquerdo">
      <div className="abas" role="tablist">
        {[['produtos', 'Produtos'], ['elementos', 'Inserir'], ['camadas', 'Camadas']].map(([id, nome]) => (
          <button key={id} role="tab" aria-selected={aba === id} className={aba === id ? 'ativo' : ''} onClick={() => setAba(id)}>{nome}</button>
        ))}
      </div>
      <div className="aba-corpo">
        {aba === 'produtos' && <AbaProdutos acoes={acoes} avisar={avisar} />}
        {aba === 'elementos' && <AbaElementos acoes={acoes} />}
        {aba === 'camadas' && <AbaCamadas doc={doc} selecao={selecao} acoes={acoes} />}
      </div>
    </aside>
  );
}
