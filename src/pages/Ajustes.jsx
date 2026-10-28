import React, { useState } from 'react';
import { api, modoDesktop } from '../api.js';

export default function Ajustes({ avisar, config, setConfig }) {
  async function trocarPasta() {
    try { setConfig(await api('config:escolherPasta')); }
    catch (e) { avisar(e.message, 'erro'); }
  }

  async function backup() {
    try {
      const caminho = await api('backup:criar');
      if (caminho) avisar(modoDesktop ? `Backup salvo em ${caminho}` : `Backup baixado: ${caminho}`);
    } catch (e) { avisar(e.message, 'erro'); }
  }

  async function sair() {
    try { await api('conta:sair'); }
    catch (e) { avisar(e.message, 'erro'); }
  }

  const [novaSenha, setNovaSenha] = useState('');
  async function trocarSenha(e) {
    e.preventDefault();
    try {
      await api('conta:senha', novaSenha);
      setNovaSenha('');
      avisar('Senha alterada.');
    } catch (err) { avisar(err.message, 'erro'); }
  }

  if (!modoDesktop) {
    return (
      <section className="pagina estreita">
        <header className="pagina-topo"><h1>Conta e backup</h1></header>
        <div className="painel">
          <h2>Conta</h2>
          <p>Conectado como <strong>{config.email}</strong>.</p>
          <p className="ajuda">O catálogo, as lojas, os modelos e os encartes são compartilhados com toda a equipe cadastrada.</p>
          <div className="acoes"><button className="botao" onClick={sair}>Sair da conta</button></div>
        </div>
        <form className="painel" onSubmit={trocarSenha}>
          <h2>Trocar senha</h2>
          <label>Nova senha (mínimo 8 caracteres)
            <input type="password" autoComplete="new-password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
          </label>
          <div className="acoes"><button className="botao" disabled={novaSenha.length < 8}>Salvar nova senha</button></div>
        </form>
        <div className="painel">
          <h2>Backup</h2>
          <p className="ajuda">Baixa um arquivo .json com produtos, lojas, categorias, encartes e modelos. As fotos continuam guardadas na nuvem.</p>
          <button className="botao primario" onClick={backup}>Baixar backup agora</button>
        </div>
      </section>
    );
  }

  return (
    <section className="pagina estreita">
      <header className="pagina-topo"><h1>Pasta e backup</h1></header>

      <div className="painel">
        <h2>Pasta de dados</h2>
        <p className="caminho">{config.pastaDados}</p>
        <p className="ajuda">
          Aqui ficam o banco (<code>banco.sqlite</code>), as fotos dos produtos, as fontes e os encartes exportados.
          Para usar um backup, descompacte o .zip numa pasta e escolha essa pasta aqui.
        </p>
        <div className="acoes">
          <button className="botao" onClick={() => api('config:abrirPasta')}>Abrir no Explorer</button>
          <button className="botao" onClick={trocarPasta}>Usar outra pasta</button>
        </div>
      </div>

      <div className="painel">
        <h2>Backup</h2>
        <p className="ajuda">Gera um arquivo .zip com o banco e todas as imagens. Guarde em outro disco ou num pendrive.</p>
        <button className="botao primario" onClick={backup}>Fazer backup agora</button>
      </div>
    </section>
  );
}
