import React, { useState } from 'react';
import Modal from './Modal.jsx';
import Miniatura from './Miniatura.jsx';
import { api, formatarPreco, lerPreco, UNIDADES } from '../api.js';

export default function ProdutoModal({ produto, lojas, categorias, aoFechar, aoSalvar, avisar }) {
  const novo = !produto?.id;
  const [dados, setDados] = useState(() => ({
    nome: '', nome_curto: '', marca: '', ean: '', sku: '', descricao: '',
    unidade: 'un', categoria_id: '', loja_id: '', ...produto,
    preco: produto?.preco != null ? formatarPreco(produto.preco) : ''
  }));
  const [salvando, setSalvando] = useState(false);

  const campo = nome => ({
    value: dados[nome] ?? '',
    onChange: e => setDados(d => ({ ...d, [nome]: e.target.value }))
  });

  async function salvar(e) {
    e?.preventDefault();
    const preco = lerPreco(dados.preco);
    if (Number.isNaN(preco)) return avisar('Preço inválido. Use o formato 12,99.', 'erro');
    setSalvando(true);
    try {
      const id = await api('produtos:salvar', {
        id: produto?.id,
        nome: dados.nome, nome_curto: dados.nome_curto, marca: dados.marca,
        ean: dados.ean, sku: dados.sku, descricao: dados.descricao, unidade: dados.unidade,
        preco,
        categoria_id: dados.categoria_id ? Number(dados.categoria_id) : null,
        loja_id: dados.loja_id ? Number(dados.loja_id) : null
      });
      avisar(novo ? 'Produto cadastrado.' : 'Produto salvo.');
      aoSalvar(id);
    } catch (err) {
      avisar(err.message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function trocarImagem(caminho) {
    try {
      const rel = await api('produtos:definirImagem', produto.id, caminho);
      if (rel) { setDados(d => ({ ...d, imagem: rel })); aoSalvar(produto.id, true); }
    } catch (err) { avisar(err.message, 'erro'); }
  }

  async function removerImagem() {
    try {
      await api('produtos:removerImagem', produto.id);
      setDados(d => ({ ...d, imagem: null }));
      aoSalvar(produto.id, true);
    } catch (err) { avisar(err.message, 'erro'); }
  }

  return (
    <Modal
      titulo={novo ? 'Novo produto' : 'Editar produto'}
      aoFechar={aoFechar}
      largo
      rodape={<>
        <button className="botao" onClick={aoFechar}>Cancelar</button>
        <button className="botao primario" onClick={salvar} disabled={salvando}>
          {novo ? 'Cadastrar produto' : 'Salvar produto'}
        </button>
      </>}
    >
      <form className="form-produto" onSubmit={salvar}>
        <div className="form-imagem">
          {novo ? (
            <div className="imagem-aviso">Cadastre o produto para adicionar a foto.</div>
          ) : (
            <>
              <Miniatura imagem={dados.imagem} tamanho={168} aoSoltarArquivo={trocarImagem} />
              <button type="button" className="botao pequeno" onClick={() => trocarImagem()}>
                {dados.imagem ? 'Trocar foto' : 'Escolher foto'}
              </button>
              {dados.imagem && (
                <button type="button" className="botao pequeno texto" onClick={removerImagem}>Remover foto</button>
              )}
            </>
          )}
        </div>

        <div className="form-grade">
          <label className="ocupa-2">Nome do produto
            <input autoFocus {...campo('nome')} placeholder="Ex.: Arroz Tipo 1 Camil 5kg" required />
          </label>
          <label className="ocupa-2">Nome curto (para cards pequenos)
            <input {...campo('nome_curto')} placeholder="Ex.: Arroz Camil 5kg" />
          </label>
          <label>Preço (R$)
            <input {...campo('preco')} inputMode="decimal" placeholder="0,00" className="entrada-preco" />
          </label>
          <label>Unidade
            <select {...campo('unidade')}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label>Marca
            <input {...campo('marca')} />
          </label>
          <label>Categoria
            <select {...campo('categoria_id')}>
              <option value="">Sem categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label>EAN (código de barras)
            <input {...campo('ean')} inputMode="numeric" />
          </label>
          <label>SKU / código interno
            <input {...campo('sku')} />
          </label>
          <label className="ocupa-2">Loja
            <select {...campo('loja_id')}>
              <option value="">Todas as lojas (catálogo geral)</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          <label className="ocupa-2">Descrição
            <textarea rows={3} {...campo('descricao')} />
          </label>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
