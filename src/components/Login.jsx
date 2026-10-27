import React, { useState } from 'react';
import { api } from '../api.js';

export default function Login({ avisar }) {
  const [modo, setModo] = useState('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setMensagem(null);
    try {
      if (modo === 'entrar') {
        await api('conta:entrar', email.trim(), senha);
      } else {
        if (senha.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.');
        const r = await api('conta:criar', email.trim(), senha);
        if (r.precisaConfirmar) {
          setMensagem('Conta criada. Abra o e-mail de confirmação que enviamos e depois entre aqui.');
          setModo('entrar');
        }
      }
    } catch (err) {
      avisar(err.message, 'erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="boas-vindas">
      <form className="boas-vindas-caixa login" onSubmit={enviar}>
        <div className="etiqueta-marca">Encartes</div>
        <h1>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        <p>Seu catálogo e seus encartes ficam guardados na nuvem e aparecem em qualquer computador ou celular.</p>
        {mensagem && <p className="alerta">{mensagem}</p>}
        <label>E-mail
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>Senha
          <input type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} required value={senha} onChange={e => setSenha(e.target.value)} />
        </label>
        <button className="botao primario grande" disabled={enviando}>
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
        <button type="button" className="link" onClick={() => setModo(m => (m === 'entrar' ? 'criar' : 'entrar'))}>
          {modo === 'entrar' ? 'Primeira vez? Criar conta' : 'Já tenho conta. Entrar'}
        </button>
      </form>
    </main>
  );
}
