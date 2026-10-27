import React from 'react';
import { partesPreco } from '../api.js';

// Preço no estilo de encarte: R$ grande com centavos sobrescritos
export default function PrecoTag({ preco, unidade }) {
  const p = partesPreco(preco);
  if (!p) return <span className="preco-vazio">sem preço</span>;
  return (
    <span className="preco-tag">
      <span className="moeda">R$</span>
      <span className="inteiro">{p.inteiro}</span>
      <span className="centavos">,{p.centavos}</span>
      {unidade && unidade !== 'un' && <span className="unidade">/{unidade}</span>}
    </span>
  );
}
