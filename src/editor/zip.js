// Gerador de ZIP mínimo (sem compressão: PNG/JPG já são comprimidos).
const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// arquivos: [{ nome: 'slide-1.png', bytes: Uint8Array }]
export function criarZip(arquivos) {
  const enc = new TextEncoder();
  const partes = [];
  const central = [];
  let deslocamento = 0;
  const agora = new Date();
  const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1);
  const data = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();

  for (const { nome, bytes } of arquivos) {
    const nomeB = enc.encode(nome);
    const crc = crc32(bytes);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint16(8, 0, true);
    local.setUint16(10, hora, true);
    local.setUint16(12, data, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, bytes.length, true);
    local.setUint32(22, bytes.length, true);
    local.setUint16(26, nomeB.length, true);
    local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), nomeB, bytes);

    const cab = new DataView(new ArrayBuffer(46));
    cab.setUint32(0, 0x02014b50, true);
    cab.setUint16(4, 20, true);
    cab.setUint16(6, 20, true);
    cab.setUint16(8, 0x0800, true);
    cab.setUint16(10, 0, true);
    cab.setUint16(12, hora, true);
    cab.setUint16(14, data, true);
    cab.setUint32(16, crc, true);
    cab.setUint32(20, bytes.length, true);
    cab.setUint32(24, bytes.length, true);
    cab.setUint16(28, nomeB.length, true);
    cab.setUint32(42, deslocamento, true);
    central.push(new Uint8Array(cab.buffer), nomeB);
    deslocamento += 30 + nomeB.length + bytes.length;
  }

  const tamanhoCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true);
  fim.setUint32(16, deslocamento, true);

  const todas = [...partes, ...central, new Uint8Array(fim.buffer)];
  const total = todas.reduce((s, p) => s + p.length, 0);
  const saida = new Uint8Array(total);
  let pos = 0;
  for (const p of todas) { saida.set(p, pos); pos += p.length; }
  return saida;
}
