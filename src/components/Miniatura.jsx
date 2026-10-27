import React, { useEffect, useState } from 'react';
import { urlImagem, caminhoDoArquivo } from '../api.js';

// Miniatura da imagem do produto; aceita arrastar um arquivo de imagem para trocar
export default function Miniatura({ imagem, aoSoltarArquivo, tamanho = 44 }) {
  const [sobre, setSobre] = useState(false);
  const [falhou, setFalhou] = useState(false);
  useEffect(() => setFalhou(false), [imagem]);

  function soltar(e) {
    e.preventDefault();
    setSobre(false);
    const arquivo = e.dataTransfer.files[0];
    if (arquivo && aoSoltarArquivo) aoSoltarArquivo(caminhoDoArquivo(arquivo));
  }

  return (
    <div
      className={`miniatura ${sobre ? 'sobre' : ''}`}
      style={{ width: tamanho, height: tamanho }}
      onDragOver={e => { e.preventDefault(); setSobre(true); }}
      onDragLeave={() => setSobre(false)}
      onDrop={soltar}
      title="Arraste uma imagem aqui para trocar"
    >
      {imagem && !falhou
        ? <img src={urlImagem(imagem)} alt="" onError={() => setFalhou(true)} />
        : <span className="sem-imagem">sem foto</span>}
    </div>
  );
}
