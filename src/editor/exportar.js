// Exportação do encarte: PNG, JPG ou PDF (tudo gerado localmente)
import { PDFDocument } from 'pdf-lib';

function dataUrlParaBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// camada: a camada Konva com o conteúdo (sem as alças de seleção)
// zoom: escala atual do editor; escala: multiplicador do tamanho final
export function capturar(camada, doc, zoom, escala, tipo = 'png', qualidade = 0.95) {
  return camada.toDataURL({
    x: 0, y: 0, width: doc.largura * zoom, height: doc.altura * zoom,
    pixelRatio: escala / zoom,
    mimeType: tipo === 'jpg' ? 'image/jpeg' : 'image/png',
    quality: qualidade
  });
}

export async function gerarArquivo(camada, doc, zoom, formato, escala) {
  if (formato === 'pdf') {
    const jpg = capturar(camada, doc, zoom, escala, 'jpg', 0.95);
    const pdf = await PDFDocument.create();
    const imagem = await pdf.embedJpg(dataUrlParaBytes(jpg));
    // 1 px do documento = 0,75 pt (96 dpi). A imagem vai em alta resolução dentro da página.
    const largura = doc.largura * 0.75, altura = doc.altura * 0.75;
    const pagina = pdf.addPage([largura, altura]);
    pagina.drawImage(imagem, { x: 0, y: 0, width: largura, height: altura });
    pdf.setTitle('Encarte');
    pdf.setCreator('Gerador de Encartes - Soundindoor');
    return await pdf.save();
  }
  return dataUrlParaBytes(capturar(camada, doc, zoom, escala, formato));
}

export function miniatura(camada, doc, zoom) {
  return capturar(camada, doc, zoom, 300 / doc.largura, 'jpg', 0.72);
}
