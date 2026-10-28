import React from 'react';
import { FONTES, NOMES_PESOS, pesosDa } from './fontes.js';
import { ICONES } from './icones.js';
import { NOMES_TIPOS } from './documento.js';
import { formatarPreco, lerPreco, UNIDADES } from '../api.js';

// ---------- Campos reutilizáveis ----------
function Cor({ rotulo, valor, aoMudar }) {
  return (
    <label className="campo-cor">
      <span>{rotulo}</span>
      <div>
        <input type="color" value={valor || '#000000'} onChange={e => aoMudar(e.target.value)} />
        <input
          className="hex" value={valor || ''} spellCheck={false}
          onChange={e => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && aoMudar(e.target.value)}
        />
      </div>
    </label>
  );
}

function Numero({ rotulo, valor, aoMudar, min, max, passo = 1, sufixo }) {
  return (
    <label className="campo-num">
      <span>{rotulo}</span>
      <div className="num-linha">
        <input
          type="number" value={Number.isFinite(valor) ? Math.round(valor * 100) / 100 : ''} min={min} max={max} step={passo}
          onChange={e => e.target.value !== '' && aoMudar(Number(e.target.value))}
        />
        {sufixo && <em>{sufixo}</em>}
      </div>
    </label>
  );
}

function Deslizante({ rotulo, valor, aoMudar, min, max, passo = 1, formatar = v => v }) {
  return (
    <label className="campo-desliza">
      <span>{rotulo} <em>{formatar(valor)}</em></span>
      <input type="range" min={min} max={max} step={passo} value={valor} onChange={e => aoMudar(Number(e.target.value))} />
    </label>
  );
}

function Opcoes({ rotulo, valor, aoMudar, opcoes }) {
  return (
    <label>
      <span>{rotulo}</span>
      <select value={valor} onChange={e => aoMudar(e.target.value)}>
        {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.nome}</option>)}
      </select>
    </label>
  );
}

function Grupo({ titulo, children }) {
  return (
    <section className="prop-grupo">
      {titulo && <h4>{titulo}</h4>}
      {children}
    </section>
  );
}

function Fonte({ familia, peso, aoMudarFamilia, aoMudarPeso }) {
  const pesos = pesosDa(familia);
  return (
    <div className="duas-colunas">
      <label>
        <span>Fonte</span>
        <select value={familia} onChange={e => aoMudarFamilia(e.target.value)} style={{ fontFamily: familia }}>
          {FONTES.map(f => <option key={f.familia} value={f.familia} style={{ fontFamily: f.familia }}>{f.familia}</option>)}
        </select>
      </label>
      {aoMudarPeso && (
        <label>
          <span>Peso</span>
          <select value={pesos.includes(String(peso)) ? String(peso) : pesos[pesos.length - 1]} onChange={e => aoMudarPeso(e.target.value)}>
            {pesos.map(p => <option key={p} value={p}>{NOMES_PESOS[p]}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

// Preenchimento: cor sólida ou degradê
function Preenchimento({ el, mudar }) {
  return (
    <>
      <label className="check">
        <input type="checkbox" checked={!!el.gradiente}
          onChange={e => mudar({ gradiente: e.target.checked ? { cor1: el.cor, cor2: '#FFFFFF', angulo: 90 } : null })} />
        Degradê
      </label>
      {el.gradiente ? (
        <>
          <div className="duas-colunas">
            <Cor rotulo="Cor inicial" valor={el.gradiente.cor1} aoMudar={v => mudar({ gradiente: { ...el.gradiente, cor1: v } }, 'grad1')} />
            <Cor rotulo="Cor final" valor={el.gradiente.cor2} aoMudar={v => mudar({ gradiente: { ...el.gradiente, cor2: v } }, 'grad2')} />
          </div>
          <Deslizante rotulo="Direção" valor={el.gradiente.angulo} min={0} max={360} formatar={v => `${v}°`}
            aoMudar={v => mudar({ gradiente: { ...el.gradiente, angulo: v } }, 'gradang')} />
        </>
      ) : (
        <Cor rotulo="Cor" valor={el.cor} aoMudar={v => mudar({ cor: v }, 'cor')} />
      )}
    </>
  );
}

// ---------- Painéis por tipo ----------
function PropsTexto({ el, mudar }) {
  return (
    <>
      <Grupo>
        <label>
          <span>Texto</span>
          <textarea id="campo-principal" rows={3} value={el.texto} onChange={e => mudar({ texto: e.target.value }, 'texto')} />
        </label>
        <Fonte familia={el.fonte} peso={el.peso}
          aoMudarFamilia={v => mudar({ fonte: v, peso: pesosDa(v).includes(String(el.peso)) ? el.peso : pesosDa(v).at(-1) })}
          aoMudarPeso={v => mudar({ peso: v })} />
        <div className="duas-colunas">
          <Numero rotulo="Tamanho" valor={el.tamanho} min={6} max={400} aoMudar={v => mudar({ tamanho: v }, 'tam')} />
          <Cor rotulo="Cor" valor={el.cor} aoMudar={v => mudar({ cor: v }, 'cor')} />
        </div>
        <div className="botoes-alinhar">
          {[['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']].map(([v, n]) => (
            <button key={v} className={el.alinhamento === v ? 'ativo' : ''} onClick={() => mudar({ alinhamento: v })}>{n}</button>
          ))}
        </div>
        <Deslizante rotulo="Altura da linha" valor={el.alturaLinha} min={0.7} max={2} passo={0.05} formatar={v => v.toFixed(2)} aoMudar={v => mudar({ alturaLinha: v }, 'al')} />
        <Deslizante rotulo="Espaço entre letras" valor={el.espacamento} min={-5} max={30} passo={0.5} aoMudar={v => mudar({ espacamento: v }, 'esp')} />
      </Grupo>
      <Grupo titulo="Contorno">
        <div className="duas-colunas">
          <Numero rotulo="Espessura" valor={el.contornoLargura} min={0} max={40} aoMudar={v => mudar({ contornoLargura: v }, 'cl')} />
          <Cor rotulo="Cor" valor={el.contornoCor} aoMudar={v => mudar({ contornoCor: v }, 'cc')} />
        </div>
      </Grupo>
      <Grupo titulo="Sombra">
        <div className="tres-colunas">
          <Numero rotulo="Horizontal" valor={el.sombraX} min={-40} max={40} aoMudar={v => mudar({ sombraX: v }, 'sx')} />
          <Numero rotulo="Vertical" valor={el.sombraY} min={-40} max={40} aoMudar={v => mudar({ sombraY: v }, 'sy')} />
          <Numero rotulo="Desfoque" valor={el.sombraDesfoque} min={0} max={60} aoMudar={v => mudar({ sombraDesfoque: v }, 'sd')} />
        </div>
        <Cor rotulo="Cor da sombra" valor={el.sombraCor} aoMudar={v => mudar({ sombraCor: v }, 'sc')} />
      </Grupo>
      <Grupo titulo="Fundo do texto">
        <label className="check">
          <input type="checkbox" checked={!!el.fundo} onChange={e => mudar({ fundo: e.target.checked ? '#0D2C6B' : null })} />
          Texto dentro de uma faixa
        </label>
        {el.fundo && (
          <>
            <Cor rotulo="Cor da faixa" valor={el.fundo} aoMudar={v => mudar({ fundo: v }, 'fundo')} />
            <div className="duas-colunas">
              <Numero rotulo="Cantos" valor={el.fundoRaio} min={0} max={100} aoMudar={v => mudar({ fundoRaio: v }, 'fr')} />
              <Numero rotulo="Margem interna" valor={el.fundoPadding} min={0} max={80} aoMudar={v => mudar({ fundoPadding: v }, 'fp')} />
            </div>
          </>
        )}
      </Grupo>
    </>
  );
}

function PropsForma({ el, mudar }) {
  return (
    <Grupo>
      <Preenchimento el={el} mudar={mudar} />
      {el.tipo === 'retangulo' && <Numero rotulo="Cantos arredondados" valor={el.raio} min={0} max={500} aoMudar={v => mudar({ raio: v }, 'raio')} />}
      <div className="duas-colunas">
        <Numero rotulo="Borda" valor={el.bordaLargura} min={0} max={40} aoMudar={v => mudar({ bordaLargura: v }, 'bl')} />
        <Cor rotulo="Cor da borda" valor={el.bordaCor} aoMudar={v => mudar({ bordaCor: v }, 'bc')} />
      </div>
      <label className="check">
        <input type="checkbox" checked={!!el.sombra} onChange={e => mudar({ sombra: e.target.checked })} />
        Sombra suave
      </label>
    </Grupo>
  );
}

function PropsRaios({ el, mudar }) {
  return (
    <Grupo>
      <div className="duas-colunas">
        <Cor rotulo="Cor de fundo" valor={el.cor1} aoMudar={v => mudar({ cor1: v }, 'c1')} />
        <Cor rotulo="Cor dos raios" valor={el.cor2} aoMudar={v => mudar({ cor2: v }, 'c2')} />
      </div>
      <Deslizante rotulo="Quantidade de raios" valor={el.quantidade} min={6} max={80} aoMudar={v => mudar({ quantidade: v }, 'q')} />
      <Deslizante rotulo="Centro horizontal" valor={el.centroX} min={0} max={1} passo={0.01} formatar={v => `${Math.round(v * 100)}%`} aoMudar={v => mudar({ centroX: v }, 'cx')} />
      <Deslizante rotulo="Centro vertical" valor={el.centroY} min={0} max={1} passo={0.01} formatar={v => `${Math.round(v * 100)}%`} aoMudar={v => mudar({ centroY: v }, 'cy')} />
    </Grupo>
  );
}

function PropsLinha({ el, mudar }) {
  return (
    <Grupo>
      <div className="duas-colunas">
        <Cor rotulo="Cor" valor={el.cor} aoMudar={v => mudar({ cor: v }, 'cor')} />
        <Numero rotulo="Espessura" valor={el.espessura} min={1} max={30} aoMudar={v => mudar({ espessura: v }, 'esp')} />
      </div>
      <label className="check">
        <input type="checkbox" checked={el.tracejado} onChange={e => mudar({ tracejado: e.target.checked })} />
        Tracejada
      </label>
    </Grupo>
  );
}

function PropsIcone({ el, mudar }) {
  return (
    <Grupo>
      <div className="grade-icones pequena">
        {Object.entries(ICONES).map(([chave, def]) => (
          <button key={chave} title={def.nome} className={el.icone === chave ? 'ativo' : ''} onClick={() => mudar({ icone: chave })}>
            <svg viewBox="0 0 24 24" width="22" height="22">
              {def.partes.map((p, i) => (
                <path key={i} d={p.d} fill={p.contorno ? 'none' : 'currentColor'} stroke={p.contorno ? 'currentColor' : 'none'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fillRule={p.regraPar ? 'evenodd' : 'nonzero'}
                  opacity={p.corInterna ? 0.45 : 1} />
              ))}
            </svg>
          </button>
        ))}
      </div>
      <div className="duas-colunas">
        <Cor rotulo="Cor" valor={el.cor} aoMudar={v => mudar({ cor: v }, 'cor')} />
        <Cor rotulo="Cor dos detalhes" valor={el.corInterna} aoMudar={v => mudar({ corInterna: v }, 'ci')} />
      </div>
    </Grupo>
  );
}

function PropsImagem({ el, mudar, acoes }) {
  return (
    <Grupo>
      <p className="ajuda">Dica: arraste uma foto do computador direto para cima deste espaço.</p>
      <div className="acoes">
        <button className="botao" onClick={() => acoes.trocarImagem(el.id)}>{el.src ? 'Trocar imagem' : 'Escolher imagem'}</button>
        {el.src && <button className="botao texto" onClick={() => mudar({ src: null })}>Remover imagem</button>}
      </div>
      <Opcoes rotulo="Ajuste" valor={el.ajuste} aoMudar={v => mudar({ ajuste: v })}
        opcoes={[{ valor: 'contain', nome: 'Mostrar inteira' }, { valor: 'cover', nome: 'Preencher (corta as sobras)' }]} />
      <Numero rotulo="Cantos arredondados" valor={el.raio} min={0} max={500} aoMudar={v => mudar({ raio: v }, 'raio')} />
    </Grupo>
  );
}

function PropsLogo({ el, mudar, loja }) {
  return (
    <Grupo>
      <p className="ajuda">
        {loja?.logo
          ? `Mostra o logo da loja ${loja.nome}. Para trocar, edite a loja.`
          : loja ? `A loja ${loja.nome} ainda não tem logo. Cadastre em Lojas.` : 'Escolha a loja do encarte (clique fora de tudo) para aparecer o logo dela.'}
      </p>
      {!loja?.logo && <Cor rotulo="Cor do texto provisório" valor={el.corTexto} aoMudar={v => mudar({ corTexto: v }, 'ct')} />}
    </Grupo>
  );
}

function PropsProduto({ el, mudar, acoes }) {
  const c = el.campos, s = el.estilo;
  const editado = campo => el.editados.includes(campo);
  const mudarCampo = (campo, valor, chave) => mudar({
    campos: { ...c, [campo]: valor },
    editados: el.produtoId && !editado(campo) ? [...el.editados, campo] : el.editados
  }, chave);
  const mudarEstilo = (patch, chave) => mudar({ estilo: { ...s, ...patch } }, chave);
  const marca = campo => editado(campo) && <em className="editado" title="Editado só neste encarte">editado</em>;

  return (
    <>
      <Grupo titulo="Conteúdo do card">
        {!el.produtoId && !c.nome && <p className="ajuda">Arraste um produto da aba Produtos para este card, ou preencha à mão.</p>}
        <label>
          <span>Nome {marca('nome')}</span>
          <textarea id="campo-principal" rows={2} value={c.nome} onChange={e => mudarCampo('nome', e.target.value, 'nome')} />
        </label>
        <label>
          <span>Descrição {marca('descricao')}</span>
          <textarea rows={2} value={c.descricao} placeholder="Ex.: Revestimento antiaderente" onChange={e => mudarCampo('descricao', e.target.value, 'desc')} />
        </label>
        <div className="duas-colunas">
          <label>
            <span>Preço {marca('preco')}</span>
            <input
              className="entrada-preco" defaultValue={c.preco != null ? formatarPreco(c.preco) : ''} key={`${el.id}-${c.preco}`}
              onBlur={e => {
                const v = lerPreco(e.target.value);
                if (!Number.isNaN(v) && v !== c.preco) mudarCampo('preco', v);
              }}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            />
          </label>
          <label>
            <span>Unidade</span>
            <select value={c.unidade || 'un'} onChange={e => mudarCampo('unidade', e.target.value)}>
              {UNIDADES.map(u => <option key={u}>{u}</option>)}
            </select>
          </label>
        </div>
        <div className="acoes">
          <button className="botao pequeno" onClick={() => acoes.trocarImagem(el.id)}>Trocar foto neste card</button>
          {el.produtoId && el.editados.length > 0 && (
            <button className="botao pequeno" onClick={() => acoes.restaurarCard(el.id)}>Voltar ao catálogo</button>
          )}
          {(c.nome || el.produtoId) && (
            <button className="botao pequeno texto" onClick={() => acoes.esvaziarCard(el.id)}>Esvaziar card</button>
          )}
        </div>
        {el.produtoId && <p className="ajuda">Ligado ao catálogo: mudanças de preço no catálogo aparecem aqui, exceto nos campos marcados como editados.</p>}
      </Grupo>

      <Grupo titulo="Estilo do card">
        <Opcoes rotulo="Modelo do card" valor={s.variante} aoMudar={v => mudarEstilo({ variante: v })}
          opcoes={[
            { valor: 'faixa', nome: 'Caixa com faixa de preço embaixo' },
            { valor: 'selo', nome: 'Caixa com selo redondo no canto' },
            { valor: 'etiqueta', nome: 'Sem caixa, etiqueta de preço sobre a foto' },
            { valor: 'fita', nome: 'Foto ao lado, preço numa fita' },
            { valor: 'caixa', nome: 'Foto em caixa, nome e preço embaixo' },
            { valor: 'horizontal', nome: 'Caixa horizontal: foto ao lado, preço grande (TV)' }
          ]} />
        {s.variante === 'etiqueta' && (
          <>
            <Opcoes rotulo="Formato do preço" valor={s.formaPreco || 'retangulo'} aoMudar={v => mudarEstilo({ formaPreco: v })}
              opcoes={[
                { valor: 'retangulo', nome: 'Etiqueta retangular' },
                { valor: 'estrela', nome: 'Estrela (explosão)' },
                { valor: 'circulo', nome: 'Círculo' },
                { valor: 'fita', nome: 'Fita com recorte' },
                { valor: 'barra', nome: 'Barra larga embaixo' }
              ]} />
            <label className="check">
              <input type="checkbox" checked={!!s.caixa} onChange={e => mudarEstilo({ caixa: e.target.checked })} />
              Caixa de fundo atrás do produto
            </label>
            <label className="check">
              <input type="checkbox" checked={!!s.faixaNome} onChange={e => mudarEstilo({ faixaNome: e.target.checked })} />
              Nome dentro de uma plaquinha
            </label>
            {(s.formaPreco === 'circulo') && (
              <label className="check">
                <input type="checkbox" checked={!!s.nomeNoSelo} onChange={e => mudarEstilo({ nomeNoSelo: e.target.checked })} />
                Nome embaixo do círculo
              </label>
            )}
            {(s.faixaNome || s.nomeNoSelo) && <Cor rotulo="Cor da plaquinha" valor={s.corFaixaNome || '#FFFFFF'} aoMudar={v => mudarEstilo({ corFaixaNome: v }, 'cfn')} />}
            <Cor rotulo="Cor do R$ e da unidade" valor={s.corRS || '#FFFFFF'} aoMudar={v => mudarEstilo({ corRS: v }, 'crs')} />
            {(s.formaPreco === 'estrela' || s.formaPreco === 'circulo') && (
              <Deslizante rotulo="Tamanho do selo" valor={s.tamanhoSelo || 0.22} min={0.12} max={0.4} passo={0.01}
                formatar={v => `${Math.round(v * 100)}%`} aoMudar={v => mudarEstilo({ tamanhoSelo: v }, 'ts')} />
            )}
          </>
        )}
        {s.variante === 'fita' && (
          <Opcoes rotulo="Lado da foto" valor={s.lado || 'esquerda'} aoMudar={v => mudarEstilo({ lado: v })}
            opcoes={[{ valor: 'esquerda', nome: 'Foto à esquerda' }, { valor: 'direita', nome: 'Foto à direita' }]} />
        )}
        <div className="duas-colunas">
          <Cor rotulo="Fundo do card" valor={s.corFundo} aoMudar={v => mudarEstilo({ corFundo: v }, 'cf')} />
          <Cor rotulo="Borda" valor={s.corBorda} aoMudar={v => mudarEstilo({ corBorda: v }, 'cb')} />
          <Cor rotulo="Nome" valor={s.corNome} aoMudar={v => mudarEstilo({ corNome: v }, 'cn')} />
          <Cor rotulo="Descrição" valor={s.corDescricao} aoMudar={v => mudarEstilo({ corDescricao: v }, 'cd')} />
          {s.variante !== 'caixa' && (
            <Cor rotulo={s.variante === 'fita' ? 'Cor da fita' : s.variante === 'etiqueta' ? 'Cor da etiqueta' : 'Fundo do preço'} valor={s.corPrecoFundo} aoMudar={v => mudarEstilo({ corPrecoFundo: v }, 'cpf')} />
          )}
          <Cor rotulo="Número do preço" valor={s.corPrecoTexto} aoMudar={v => mudarEstilo({ corPrecoTexto: v }, 'cpt')} />
          {(s.variante === 'faixa' || s.variante === 'horizontal') && (
            <Cor rotulo={s.variante === 'horizontal' ? 'Cor do R$ e da unidade' : 'Caixa do R$'} valor={s.corDestaque} aoMudar={v => mudarEstilo({ corDestaque: v }, 'cde')} />
          )}
        </div>
        <Fonte familia={s.fonteNome} aoMudarFamilia={v => mudarEstilo({ fonteNome: v })} />
        <label>
          <span>Fonte do preço</span>
          <select value={s.fontePreco} onChange={e => mudarEstilo({ fontePreco: e.target.value })}>
            {FONTES.map(f => <option key={f.familia} value={f.familia}>{f.familia}</option>)}
          </select>
        </label>
        <div className="duas-colunas">
          <Numero rotulo="Tamanho do nome" valor={s.tamanhoNome} min={6} max={60} aoMudar={v => mudarEstilo({ tamanhoNome: v }, 'tn')} />
          <Numero rotulo="Tamanho da descrição" valor={s.tamanhoDescricao} min={6} max={40} aoMudar={v => mudarEstilo({ tamanhoDescricao: v }, 'td')} />
        </div>
        <Deslizante rotulo="Espaço da foto" valor={s.alturaImagem} min={0.3} max={0.7} passo={0.01} formatar={v => `${Math.round(v * 100)}%`} aoMudar={v => mudarEstilo({ alturaImagem: v }, 'ai')} />
        <Numero rotulo="Cantos arredondados" valor={s.raio} min={0} max={60} aoMudar={v => mudarEstilo({ raio: v }, 'raio')} />
        <label className="check">
          <input type="checkbox" checked={s.maiusculas} onChange={e => mudarEstilo({ maiusculas: e.target.checked })} />
          Nome em letras maiúsculas
        </label>
        <label className="check">
          <input type="checkbox" checked={s.mostrarDescricao} onChange={e => mudarEstilo({ mostrarDescricao: e.target.checked })} />
          Mostrar descrição
        </label>
        <button className="botao" onClick={() => acoes.aplicarEstiloATodos(el.id)}>Aplicar este estilo em todos os cards</button>
      </Grupo>
    </>
  );
}

// ---------- Painel principal ----------
export default function PainelPropriedades({ selecionados, doc, mudarElemento, mudarDoc, acoes, loja, lojas, lojaId, setLojaId, titulo, setTitulo }) {
  if (selecionados.length === 0) {
    const f = doc.fundo;
    return (
      <div className="painel-props">
        <h3>Encarte</h3>
        <Grupo>
          <label>
            <span>Título</span>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} />
          </label>
          <label>
            <span>Loja (logo do encarte)</span>
            <select value={lojaId || ''} onChange={e => setLojaId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Nenhuma</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          <p className="ajuda">Tamanho: {doc.largura} × {doc.altura} px</p>
        </Grupo>
        <Grupo titulo="Fundo da página">
          <Preenchimento
            el={{ cor: f.cor, gradiente: f.gradiente, w: doc.largura, h: doc.altura }}
            mudar={(patch, chave) => mudarDoc(d => ({ ...d, fundo: { ...d.fundo, ...patch } }), chave)}
          />
        </Grupo>
        <Grupo>
          <p className="ajuda">Clique num elemento para editar. Segure Shift para selecionar vários. Elementos travados (fundos) podem ser escolhidos na aba Camadas.</p>
        </Grupo>
      </div>
    );
  }

  if (selecionados.length > 1) {
    const cards = selecionados.filter(e => e.tipo === 'produto');
    return (
      <div className="painel-props">
        <h3>{selecionados.length} elementos</h3>
        <Grupo titulo="Alinhar entre si">
          <div className="grade-acoes">
            <button onClick={() => acoes.alinhar('esquerda')}>Esquerda</button>
            <button onClick={() => acoes.alinhar('centroH')}>Centro</button>
            <button onClick={() => acoes.alinhar('direita')}>Direita</button>
            <button onClick={() => acoes.alinhar('topo')}>Topo</button>
            <button onClick={() => acoes.alinhar('meio')}>Meio</button>
            <button onClick={() => acoes.alinhar('base')}>Base</button>
          </div>
        </Grupo>
        {selecionados.length > 2 && (
          <Grupo titulo="Distribuir espaço igual">
            <div className="grade-acoes duas">
              <button onClick={() => acoes.distribuir('h')}>Na horizontal</button>
              <button onClick={() => acoes.distribuir('v')}>Na vertical</button>
            </div>
          </Grupo>
        )}
        {cards.length > 1 && (
          <Grupo titulo="Cards">
            <button className="botao" onClick={() => acoes.aplicarEstiloATodos(cards[0].id, cards.map(c => c.id))}>
              Copiar o estilo do primeiro para os outros
            </button>
          </Grupo>
        )}
        <Grupo>
          <div className="acoes">
            <button className="botao" onClick={acoes.duplicar}>Duplicar</button>
            <button className="botao perigo" onClick={acoes.excluir}>Excluir</button>
          </div>
        </Grupo>
      </div>
    );
  }

  const el = selecionados[0];
  const mudar = (patch, chave) => mudarElemento(el.id, patch, chave ? `${el.id}-${chave}` : null);
  const corpo = {
    texto: <PropsTexto el={el} mudar={mudar} />,
    retangulo: <PropsForma el={el} mudar={mudar} />,
    elipse: <PropsForma el={el} mudar={mudar} />,
    poligono: <PropsForma el={el} mudar={mudar} />,
    raios: <PropsRaios el={el} mudar={mudar} />,
    linha: <PropsLinha el={el} mudar={mudar} />,
    icone: <PropsIcone el={el} mudar={mudar} />,
    imagem: <PropsImagem el={el} mudar={mudar} acoes={acoes} />,
    logo: <PropsLogo el={el} mudar={mudar} loja={loja} />,
    produto: <PropsProduto el={el} mudar={mudar} acoes={acoes} />
  }[el.tipo];

  return (
    <div className="painel-props">
      <h3>{NOMES_TIPOS[el.tipo]}</h3>
      {corpo}
      <Grupo titulo="Posição e tamanho">
        <div className="duas-colunas">
          <Numero rotulo="X" valor={el.x} aoMudar={v => mudar({ x: v }, 'x')} />
          <Numero rotulo="Y" valor={el.y} aoMudar={v => mudar({ y: v }, 'y')} />
          <Numero rotulo="Largura" valor={el.w} min={5} aoMudar={v => mudar({ w: v, ...(el.tipo === 'icone' ? { h: v } : {}) }, 'w')} />
          {!['texto', 'linha', 'icone'].includes(el.tipo) && (
            <Numero rotulo="Altura" valor={el.h} min={5} aoMudar={v => mudar({ h: v }, 'h')} />
          )}
        </div>
        <Deslizante rotulo="Rotação" valor={Math.round(el.rotacao)} min={-180} max={180} formatar={v => `${v}°`} aoMudar={v => mudar({ rotacao: v }, 'rot')} />
        <Deslizante rotulo="Opacidade" valor={el.opacidade} min={0.05} max={1} passo={0.05} formatar={v => `${Math.round(v * 100)}%`} aoMudar={v => mudar({ opacidade: v }, 'op')} />
        <label className="check">
          <input type="checkbox" checked={el.bloqueado} onChange={e => mudar({ bloqueado: e.target.checked })} />
          Travar (não move com o mouse)
        </label>
      </Grupo>
      <Grupo>
        <div className="acoes">
          <button className="botao pequeno" onClick={acoes.duplicar}>Duplicar</button>
          <button className="botao pequeno" onClick={() => acoes.ordem('frente')}>Trazer para frente</button>
          <button className="botao pequeno" onClick={() => acoes.ordem('tras')}>Enviar para trás</button>
          <button className="botao pequeno perigo" onClick={acoes.excluir}>Excluir</button>
        </div>
      </Grupo>
    </div>
  );
}
