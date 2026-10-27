// Mede a largura de um texto com a fonte real (usado para montar as etiquetas de preço)
const ctx = document.createElement('canvas').getContext('2d');

export function larguraTexto(texto, tamanho, familia, peso = '400') {
  ctx.font = `${peso} ${tamanho}px "${familia}"`;
  return ctx.measureText(String(texto)).width;
}

export function partesPreco(preco) {
  if (preco === null || preco === undefined || preco === '' || Number.isNaN(Number(preco))) return null;
  const [inteiro, centavos] = Number(preco).toFixed(2).split('.');
  return { inteiro: Number(inteiro).toLocaleString('pt-BR'), centavos };
}
