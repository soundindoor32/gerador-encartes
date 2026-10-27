import React, { useEffect } from 'react';

export default function Modal({ titulo, aoFechar, children, rodape, largo }) {
  useEffect(() => {
    const tecla = e => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aoFechar]);

  return (
    <div className="modal-fundo" onMouseDown={e => e.target === e.currentTarget && aoFechar()}>
      <div className={`modal ${largo ? 'largo' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <header>
          <h2>{titulo}</h2>
          <button className="fechar" onClick={aoFechar} aria-label="Fechar">×</button>
        </header>
        <div className="modal-corpo">{children}</div>
        {rodape && <footer>{rodape}</footer>}
      </div>
    </div>
  );
}
