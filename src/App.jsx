import React, { useCallback, useEffect, useState } from 'react';
import { api, modoDesktop } from './api.js';
import { nuvemConfigurada, aoMudarSessao } from './nuvem/backend.js';
import Login from './components/Login.jsx';
import Encartes from './pages/Encartes.jsx';
import Editor from './editor/Editor.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Importar from './pages/Importar.jsx';
import Lojas from './pages/Lojas.jsx';
import Categorias from './pages/Categorias.jsx';
import Ajustes from './pages/Ajustes.jsx';

const PAGINAS = [
  { id: 'encartes', nome: 'Encartes', componente: Encartes },
  { id: 'catalogo', nome: 'Catálogo', componente: Catalogo },
  { id: 'importar', nome: 'Importar planilha', componente: Importar },
  { id: 'lojas', nome: 'Lojas', componente: Lojas },
  { id: 'categorias', nome: 'Categorias', componente: Categorias },
  { id: 'ajustes', nome: modoDesktop ? 'Pasta e backup' : 'Conta e backup', componente: Ajustes }
];

export default function App() {
  const [config, setConfig] = useState(null);
  const [pagina, setPagina] = useState('encartes');
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState(null);

  const avisar = useCallback((texto, tipo = 'ok') => {
    setAviso({ texto, tipo, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.tipo === 'erro' ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    if (!modoDesktop && !nuvemConfigurada) return;
    const carregar = () => api('config:obter').then(setConfig).catch(e => avisar(e.message, 'erro'));
    carregar();
    return aoMudarSessao(carregar);
  }, [avisar]);

  if (!modoDesktop && !nuvemConfigurada) {
    return (
      <main className="boas-vindas">
        <div className="boas-vindas-caixa">
          <div className="etiqueta-marca">Encartes</div>
          <h1>Falta configurar o Supabase</h1>
          <p>Cadastre VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nos segredos do repositório no GitHub e publique de novo. O passo a passo está no LEIA-ME.</p>
        </div>
      </main>
    );
  }

  async function escolherPasta() {
    try { setConfig(await api('config:escolherPasta')); }
    catch (e) { avisar(e.message, 'erro'); }
  }

  if (!config) return null;

  if (config.modo === 'nuvem' && !config.logado) {
    return (
      <>
        <Login avisar={avisar} />
        {aviso && <div className={`aviso ${aviso.tipo}`}>{aviso.texto}</div>}
      </>
    );
  }

  if (!config.pastaDados) {
    return (
      <main className="boas-vindas">
        <div className="boas-vindas-caixa">
          <div className="etiqueta-marca">Encartes</div>
          <h1>Onde guardar seu trabalho?</h1>
          <p>
            Escolha uma pasta no seu computador. Nela ficam o banco de produtos, as imagens e os
            encartes exportados. Para fazer backup ou levar para outro PC, basta copiar essa pasta.
          </p>
          <p className="dica">Sugestão: <code>C:\Encartes</code> ou <code>D:\Encartes</code>. Evite pastas do OneDrive, que podem travar o banco durante a sincronização.</p>
          <button className="botao primario grande" onClick={escolherPasta}>Escolher pasta</button>
        </div>
        {aviso && <div className={`aviso ${aviso.tipo}`}>{aviso.texto}</div>}
      </main>
    );
  }

  const Atual = PAGINAS.find(p => p.id === pagina).componente;
  const elementoAviso = aviso && (
    <div key={aviso.id} className={`aviso ${aviso.tipo}`} role="status">{aviso.texto}</div>
  );

  if (editando) {
    return (
      <>
        <Editor encarteId={editando} avisar={avisar} aoSair={() => { setEditando(null); setPagina('encartes'); }} />
        {elementoAviso}
      </>
    );
  }

  return (
    <div className="estrutura">
      <nav className="lateral">
        <div className="lateral-marca">
          <div className="etiqueta-marca">Encartes</div>
          <span>Soundindoor</span>
        </div>
        <ul>
          {PAGINAS.map(p => (
            <li key={p.id}>
              <button
                className={p.id === pagina ? 'ativo' : ''}
                onClick={() => setPagina(p.id)}
                aria-current={p.id === pagina ? 'page' : undefined}
              >
                {p.nome}
              </button>
            </li>
          ))}
        </ul>
        <div className="lateral-rodape" title={config.pastaDados}>
          {config.pastaDados}
        </div>
      </nav>
      <main className="conteudo">
        <Atual
          key={config.pastaDados}
          avisar={avisar}
          irPara={setPagina}
          config={config}
          setConfig={setConfig}
          abrirEditor={setEditando}
        />
      </main>
      {elementoAviso}
    </div>
  );
}
