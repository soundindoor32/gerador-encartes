import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { api, lerPreco, formatarPreco } from '../api.js';

const CAMPOS = [
  { id: 'nome', nome: 'Nome do produto', obrigatorio: true,
    apelidos: ['nome', 'descricao', 'produto', 'nome produto', 'descricao produto', 'desc', 'nome do produto'] },
  { id: 'preco', nome: 'Preço',
    apelidos: ['preco', 'valor', 'preco venda', 'preco de venda', 'pv', 'vlr venda', 'valor venda', 'venda'] },
  { id: 'ean', nome: 'EAN (código de barras)',
    apelidos: ['ean', 'gtin', 'codigo de barras', 'codigo barras', 'cod barras', 'codbarras', 'cod. barras', 'barras'] },
  { id: 'sku', nome: 'SKU / código interno',
    apelidos: ['sku', 'codigo', 'cod', 'codigo interno', 'cod interno', 'referencia', 'ref', 'id'] },
  { id: 'marca', nome: 'Marca', apelidos: ['marca', 'fabricante', 'fornecedor'] },
  { id: 'unidade', nome: 'Unidade', apelidos: ['unidade', 'un', 'und', 'unid', 'embalagem', 'medida'] },
  { id: 'categoria', nome: 'Categoria',
    apelidos: ['categoria', 'departamento', 'secao', 'grupo', 'setor', 'familia'] },
  { id: 'nome_curto', nome: 'Nome curto', apelidos: ['nome curto', 'descricao curta', 'nome reduzido', 'desc reduzida'] },
  { id: 'descricao', nome: 'Descrição detalhada',
    apelidos: ['descricao detalhada', 'detalhes', 'observacao', 'obs', 'informacoes'] }
];

const PREF_MAPEAMENTO = 'importacao:mapeamento';

const normalizar = s => String(s ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

function sugerirMapeamento(cabecalhos, salvo) {
  const mapa = {};
  const usados = new Set();
  // 1º: o mapeamento salvo da última importação, se as colunas ainda existirem
  for (const campo of CAMPOS) {
    const col = salvo?.[campo.id];
    if (col && cabecalhos.includes(col) && !usados.has(col)) { mapa[campo.id] = col; usados.add(col); }
  }
  // 2º: adivinhar pelo nome da coluna
  for (const campo of CAMPOS) {
    if (mapa[campo.id]) continue;
    const col = cabecalhos.find(c => !usados.has(c) && campo.apelidos.includes(normalizar(c)));
    if (col) { mapa[campo.id] = col; usados.add(col); }
  }
  return mapa;
}

async function lerArquivo(file) {
  const buffer = await file.arrayBuffer();
  if (/\.csv$|\.txt$/i.test(file.name)) {
    // CSV de sistemas brasileiros costuma vir em Windows-1252 e com ";"
    let texto;
    try { texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
    catch { texto = new TextDecoder('windows-1252').decode(buffer); }
    const primeira = texto.split(/\r?\n/)[0] || '';
    const sep = (primeira.match(/;/g) || []).length > (primeira.match(/,/g) || []).length ? ';' : ',';
    return XLSX.read(texto, { type: 'string', FS: sep, raw: true });
  }
  return XLSX.read(buffer, { type: 'array' });
}

function extrairTabela(planilha) {
  const linhas = XLSX.utils.sheet_to_json(planilha, { header: 1, raw: true, defval: '', blankrows: false });
  const idxCab = linhas.findIndex(l => l.filter(c => String(c).trim() !== '').length >= 2);
  if (idxCab < 0) return { cabecalhos: [], dados: [] };
  const vistos = {};
  const cabecalhos = linhas[idxCab].map((c, i) => {
    let nome = String(c).trim() || `Coluna ${i + 1}`;
    if (vistos[nome]) nome = `${nome} (${++vistos[nome]})`; else vistos[nome] = 1;
    return nome;
  });
  const dados = linhas.slice(idxCab + 1).map((l, i) => ({ celulas: l, linha: idxCab + i + 2 }));
  return { cabecalhos, dados };
}

export default function Importar({ avisar, irPara }) {
  const [arquivo, setArquivo] = useState(null);
  const [livro, setLivro] = useState(null);
  const [aba, setAba] = useState('');
  const [mapa, setMapa] = useState({});
  const [lojas, setLojas] = useState([]);
  const [lojaId, setLojaId] = useState('');
  const [atualizar, setAtualizar] = useState(true);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [arrastando, setArrastando] = useState(false);

  useEffect(() => { api('lojas:listar').then(setLojas).catch(() => {}); }, []);

  const tabela = useMemo(
    () => (livro && aba ? extrairTabela(livro.Sheets[aba]) : { cabecalhos: [], dados: [] }),
    [livro, aba]
  );

  useEffect(() => {
    if (!tabela.cabecalhos.length) return;
    api('preferencias:obter', PREF_MAPEAMENTO)
      .catch(() => null)
      .then(salvo => setMapa(sugerirMapeamento(tabela.cabecalhos, salvo)));
  }, [tabela]);

  // Converte as linhas da planilha para o formato do banco, validando cada uma
  const linhas = useMemo(() => {
    const idx = Object.fromEntries(Object.entries(mapa).map(([campo, col]) => [campo, tabela.cabecalhos.indexOf(col)]));
    return tabela.dados.map(({ celulas, linha }) => {
      const item = { _linha: linha };
      for (const campo of CAMPOS) {
        const i = idx[campo.id];
        if (i === undefined || i < 0) continue;
        let v = celulas[i];
        if (campo.id === 'preco') v = lerPreco(v);
        else v = String(v ?? '').trim();
        item[campo.id] = v;
      }
      const problemas = [];
      if (!item.nome) problemas.push('sem nome');
      if (Number.isNaN(item.preco)) problemas.push('preço inválido');
      item._problemas = problemas;
      return item;
    }).filter(item => CAMPOS.some(c => item[c.id] !== undefined && item[c.id] !== '' && item[c.id] !== null));
  }, [tabela, mapa]);

  const validas = linhas.filter(l => l._problemas.length === 0);
  const invalidas = linhas.length - validas.length;

  async function escolherArquivo(file) {
    if (!file) return;
    setResultado(null);
    try {
      const wb = await lerArquivo(file);
      setArquivo(file.name);
      setLivro(wb);
      setAba(wb.SheetNames[0]);
    } catch (e) {
      avisar(`Não foi possível ler "${file.name}". Confira se é .xlsx, .xls ou .csv.`, 'erro');
    }
  }

  async function importar() {
    setImportando(true);
    try {
      await api('preferencias:salvar', PREF_MAPEAMENTO, mapa);
      const envio = validas.map(({ _problemas, ...resto }) => resto);
      const r = await api('produtos:importar', envio, { lojaId: lojaId || null, atualizarExistentes: atualizar });
      setResultado(r);
      avisar(`Importação concluída: ${r.criados} novo(s), ${r.atualizados} atualizado(s).`);
    } catch (e) {
      avisar(e.message, 'erro');
    } finally {
      setImportando(false);
    }
  }

  function recomecar() {
    setArquivo(null); setLivro(null); setAba(''); setMapa({}); setResultado(null);
  }

  // ---------- Resultado ----------
  if (resultado) {
    return (
      <section className="pagina">
        <header className="pagina-topo"><h1>Importação concluída</h1></header>
        <div className="resultado-importacao">
          <div><strong>{resultado.criados}</strong> produto(s) novo(s)</div>
          <div><strong>{resultado.atualizados}</strong> atualizado(s)</div>
          {resultado.ignorados > 0 && <div><strong>{resultado.ignorados}</strong> já existiam e foram mantidos</div>}
          {invalidas > 0 && <div><strong>{invalidas}</strong> linha(s) com problema não enviadas</div>}
        </div>
        {resultado.erros.length > 0 && (
          <div className="lista-erros">
            <h3>Linhas recusadas pelo banco</h3>
            <ul>{resultado.erros.slice(0, 50).map(e => <li key={e.linha}>Linha {e.linha}: {e.motivo}</li>)}</ul>
          </div>
        )}
        <div className="acoes">
          <button className="botao primario" onClick={() => irPara('catalogo')}>Ver catálogo</button>
          <button className="botao" onClick={recomecar}>Importar outra planilha</button>
        </div>
      </section>
    );
  }

  // ---------- Escolha do arquivo ----------
  if (!livro) {
    return (
      <section className="pagina">
        <header className="pagina-topo">
          <div>
            <h1>Importar planilha</h1>
            <p className="subtitulo">Produtos que já existem (mesmo EAN ou SKU) são atualizados, os outros são criados.</p>
          </div>
        </header>
        <label
          className={`zona-arquivo ${arrastando ? 'sobre' : ''}`}
          onDragOver={e => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={e => { e.preventDefault(); setArrastando(false); escolherArquivo(e.dataTransfer.files[0]); }}
        >
          <input type="file" accept=".xlsx,.xls,.csv,.txt,.ods" hidden onChange={e => escolherArquivo(e.target.files[0])} />
          <strong>Arraste a planilha aqui</strong>
          <span>ou clique para escolher. Aceita Excel (.xlsx, .xls), LibreOffice (.ods) e CSV.</span>
        </label>
      </section>
    );
  }

  // ---------- Mapeamento e prévia ----------
  const colunasPrevia = CAMPOS.filter(c => mapa[c.id]);

  return (
    <section className="pagina">
      <header className="pagina-topo">
        <div>
          <h1>Importar planilha</h1>
          <p className="subtitulo">{arquivo}, {linhas.length} linha(s) com dados</p>
        </div>
        <div className="acoes">
          <button className="botao" onClick={recomecar}>Trocar arquivo</button>
          <button className="botao primario" onClick={importar} disabled={importando || validas.length === 0 || !mapa.nome}>
            {importando ? 'Importando…' : `Importar ${validas.length} produto(s)`}
          </button>
        </div>
      </header>

      <div className="importar-grade">
        <div className="painel">
          <h2>Colunas da planilha</h2>
          <p className="ajuda">Diga qual coluna corresponde a cada informação. Esse mapeamento fica salvo para a próxima vez.</p>
          {livro.SheetNames.length > 1 && (
            <label>Aba da planilha
              <select value={aba} onChange={e => setAba(e.target.value)}>
                {livro.SheetNames.map(n => <option key={n}>{n}</option>)}
              </select>
            </label>
          )}
          {CAMPOS.map(campo => (
            <label key={campo.id}>
              {campo.nome}{campo.obrigatorio && <span className="obrigatorio"> (obrigatório)</span>}
              <select
                value={mapa[campo.id] || ''}
                onChange={e => setMapa(m => ({ ...m, [campo.id]: e.target.value || undefined }))}
              >
                <option value="">Não importar</option>
                {tabela.cabecalhos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          ))}
          <hr />
          <label>Importar para a loja
            <select value={lojaId} onChange={e => setLojaId(e.target.value)}>
              <option value="">Catálogo geral (todas as lojas)</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={atualizar} onChange={e => setAtualizar(e.target.checked)} />
            Atualizar produtos que já existem
          </label>
        </div>

        <div className="painel previa">
          <h2>Prévia</h2>
          {!mapa.nome && <p className="alerta">Escolha a coluna do nome do produto para continuar.</p>}
          {invalidas > 0 && (
            <p className="alerta">{invalidas} linha(s) com problema serão ignoradas (destacadas abaixo).</p>
          )}
          <div className="tabela-caixa">
            <table className="tabela compacta">
              <thead>
                <tr>
                  <th>Linha</th>
                  {colunasPrevia.map(c => <th key={c.id}>{c.nome}</th>)}
                </tr>
              </thead>
              <tbody>
                {linhas.slice(0, 40).map(l => (
                  <tr key={l._linha} className={l._problemas.length ? 'com-erro' : ''}>
                    <td className="fraco">
                      {l._linha}
                      {l._problemas.length > 0 && <div className="motivo">{l._problemas.join(', ')}</div>}
                    </td>
                    {colunasPrevia.map(c => (
                      <td key={c.id} className={c.id === 'preco' ? 'sem-quebra' : undefined}>
                        {c.id === 'preco'
                          ? (l.preco == null ? '' : Number.isNaN(l.preco) ? '?' : `R$ ${formatarPreco(l.preco)}`)
                          : l[c.id]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {linhas.length > 40 && <p className="ajuda">Mostrando 40 de {linhas.length} linhas.</p>}
        </div>
      </div>
    </section>
  );
}
