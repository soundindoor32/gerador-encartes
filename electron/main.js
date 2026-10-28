// Processo principal do Gerador de Encartes (Electron)
// Tudo roda localmente: banco SQLite e imagens ficam na pasta de dados escolhida.
const { app, BrowserWindow, ipcMain, dialog, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { abrirBanco } = require('./db');
const { criarRepositorio } = require('./repositorio');

const EXTENSOES_IMAGEM = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

let janela = null;
let db = null;
let repo = null;
let pastaDados = null;

// ---------- Configuração (guarda só o caminho da pasta de dados) ----------
const arquivoConfig = () => path.join(app.getPath('userData'), 'config.json');

function lerConfig() {
  try { return JSON.parse(fs.readFileSync(arquivoConfig(), 'utf8')); }
  catch { return {}; }
}
function gravarConfig(cfg) {
  fs.mkdirSync(path.dirname(arquivoConfig()), { recursive: true });
  fs.writeFileSync(arquivoConfig(), JSON.stringify(cfg, null, 2));
}

function abrirPastaDados(pasta) {
  for (const sub of ['imagens', 'imagens/lojas', 'imagens/encartes', 'fontes', 'exportados']) {
    fs.mkdirSync(path.join(pasta, sub), { recursive: true });
  }
  if (db) db.close();
  db = abrirBanco(path.join(pasta, 'banco.sqlite'));
  repo = criarRepositorio(db);
  pastaDados = pasta;
}

// ---------- Protocolo encarte:// para exibir imagens da pasta de dados ----------
protocol.registerSchemesAsPrivileged([
  { scheme: 'encarte', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);

function caminhoSeguro(relativo) {
  const completo = path.resolve(pastaDados, relativo);
  if (!completo.startsWith(path.resolve(pastaDados) + path.sep)) throw new Error('Caminho inválido');
  return completo;
}

// Copia uma imagem para dentro da pasta de dados e devolve o caminho relativo
function copiarImagem(origem, prefixo, subpasta = 'imagens') {
  const ext = path.extname(origem).toLowerCase();
  if (!EXTENSOES_IMAGEM.includes(ext)) throw new Error(`Formato não suportado: ${ext}`);
  const nome = `${prefixo}-${Date.now()}${ext}`;
  const relativo = path.posix.join(subpasta.replace(/\\/g, '/'), nome);
  fs.copyFileSync(origem, path.join(pastaDados, relativo));
  return relativo;
}

function apagarImagem(relativo) {
  if (!relativo) return;
  try { fs.unlinkSync(caminhoSeguro(relativo)); } catch { /* já não existe */ }
}

// ---------- Janela ----------
function criarJanela() {
  janela = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    title: 'Gerador de Encartes',
    backgroundColor: '#EEF0F3',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Links externos nunca abrem dentro do app
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (process.env.VITE_DEV_SERVER_URL) {
    janela.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    janela.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ---------- IPC ----------
// Envolve cada handler: erros viram { erro } em vez de exceções genéricas
function registrar(canal, fn) {
  ipcMain.handle(canal, async (_e, ...args) => {
    try { return { ok: true, dados: await fn(...args) }; }
    catch (e) { return { ok: false, erro: e.message }; }
  });
}

function exigirBanco() {
  if (!repo) throw new Error('Escolha a pasta de dados primeiro.');
  return repo;
}

function registrarHandlers() {
  // Pasta de dados
  registrar('config:obter', () => ({ pastaDados }));
  registrar('config:escolherPasta', async () => {
    const r = await dialog.showOpenDialog(janela, {
      title: 'Escolha onde guardar o catálogo e os encartes',
      properties: ['openDirectory', 'createDirectory']
    });
    if (r.canceled || !r.filePaths[0]) return { pastaDados };
    abrirPastaDados(r.filePaths[0]);
    gravarConfig({ ...lerConfig(), pastaDados: r.filePaths[0] });
    return { pastaDados };
  });
  registrar('config:abrirPasta', () => shell.openPath(pastaDados));

  // Lojas
  registrar('lojas:listar', () => exigirBanco().lojas.listar());
  registrar('lojas:salvar', loja => exigirBanco().lojas.salvar(loja));
  registrar('lojas:excluir', id => exigirBanco().lojas.excluir(id));
  registrar('lojas:escolherLogo', async () => {
    const r = await dialog.showOpenDialog(janela, {
      title: 'Logo da loja',
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile']
    });
    if (r.canceled || !r.filePaths[0]) return null;
    return copiarImagem(r.filePaths[0], 'logo', 'imagens/lojas');
  });

  // Categorias
  registrar('categorias:listar', () => exigirBanco().categorias.listar());
  registrar('categorias:salvar', c => exigirBanco().categorias.salvar(c));
  registrar('categorias:excluir', id => exigirBanco().categorias.excluir(id));

  // Produtos
  registrar('produtos:listar', filtro => exigirBanco().produtos.listar(filtro));
  registrar('produtos:salvar', p => exigirBanco().produtos.salvar(p));
  registrar('produtos:excluir', ids => {
    const r = exigirBanco();
    for (const id of ids) {
      const p = r.produtos.obter(id);
      if (p) { apagarImagem(p.imagem); apagarImagem(p.imagem_recortada); }
    }
    r.produtos.excluir(ids);
  });
  registrar('produtos:importar', (linhas, opcoes) => exigirBanco().produtos.importar(linhas, opcoes));

  // Imagem de um produto (por diálogo ou por arquivo arrastado)
  registrar('produtos:definirImagem', async (id, caminhoOrigem) => {
    const r = exigirBanco();
    let origem = caminhoOrigem;
    if (!origem) {
      const d = await dialog.showOpenDialog(janela, {
        title: 'Imagem do produto',
        filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
        properties: ['openFile']
      });
      if (d.canceled || !d.filePaths[0]) return null;
      origem = d.filePaths[0];
    }
    const anterior = r.produtos.obter(id);
    const relativo = copiarImagem(origem, `produto-${id}`);
    r.produtos.salvar({ id, imagem: relativo });
    if (anterior) apagarImagem(anterior.imagem);
    return relativo;
  });
  registrar('produtos:removerImagem', id => {
    const r = exigirBanco();
    const p = r.produtos.obter(id);
    if (p) apagarImagem(p.imagem);
    r.produtos.salvar({ id, imagem: null });
  });

  // Imagens em lote: o nome do arquivo (sem extensão) deve ser o EAN ou o SKU
  registrar('imagens:associarLote', async (substituir = false) => {
    const r = exigirBanco();
    const d = await dialog.showOpenDialog(janela, {
      title: 'Selecione as imagens (nome do arquivo = EAN ou SKU)',
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile', 'multiSelections']
    });
    if (d.canceled) return null;
    const res = { associadas: 0, jaTinham: 0, semProduto: [] };
    for (const arquivo of d.filePaths) {
      const codigo = path.basename(arquivo, path.extname(arquivo)).trim();
      const encontrados = r.produtos.buscarPorCodigo(codigo);
      if (encontrados.length === 0) { res.semProduto.push(path.basename(arquivo)); continue; }
      for (const p of encontrados) {
        if (p.imagem && !substituir) { res.jaTinham++; continue; }
        const relativo = copiarImagem(arquivo, `produto-${p.id}`);
        r.produtos.salvar({ id: p.id, imagem: relativo });
        apagarImagem(p.imagem);
        res.associadas++;
      }
    }
    return res;
  });

  registrar('produtos:obterVarios', ids => exigirBanco().produtos.obterVarios(ids));

  // Encartes e modelos
  registrar('encartes:listar', () => exigirBanco().encartes.listar());
  registrar('encartes:obter', id => exigirBanco().encartes.obter(id));
  registrar('encartes:salvar', e => exigirBanco().encartes.salvar(e));
  registrar('encartes:duplicar', id => exigirBanco().encartes.duplicar(id));
  registrar('encartes:excluir', id => exigirBanco().encartes.excluir(id));
  registrar('modelos:listar', () => exigirBanco().modelos.listar());
  registrar('modelos:obter', id => exigirBanco().modelos.obter(id));
  registrar('modelos:salvar', m => exigirBanco().modelos.salvar(m));
  registrar('modelos:excluir', id => exigirBanco().modelos.excluir(id));

  // Imagem livre dentro de um encarte (fundo, arte, selo...)
  registrar('imagens:paraEncarte', async caminhoOrigem => {
    exigirBanco();
    let origem = caminhoOrigem;
    if (!origem) {
      const d = await dialog.showOpenDialog(janela, {
        title: 'Inserir imagem no encarte',
        filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
        properties: ['openFile']
      });
      if (d.canceled || !d.filePaths[0]) return null;
      origem = d.filePaths[0];
    }
    return copiarImagem(origem, 'arte', 'imagens/encartes');
  });

  // Salva um arquivo exportado (PNG, JPG ou PDF) escolhendo o local
  registrar('exportar:salvar', async (bytes, nomeSugerido, extensao) => {
    exigirBanco();
    const nomes = { png: 'Imagem PNG', jpg: 'Imagem JPG', pdf: 'Documento PDF', zip: 'Arquivo ZIP' };
    const d = await dialog.showSaveDialog(janela, {
      title: 'Salvar encarte',
      defaultPath: path.join(pastaDados, 'exportados', `${nomeSugerido}.${extensao}`),
      filters: [{ name: nomes[extensao] || extensao, extensions: [extensao] }]
    });
    if (d.canceled || !d.filePath) return null;
    fs.writeFileSync(d.filePath, Buffer.from(bytes));
    return d.filePath;
  });
  registrar('exportar:mostrar', caminho => shell.showItemInFolder(caminho));

  // Preferências
  registrar('preferencias:obter', chave => exigirBanco().preferencias.obter(chave));
  registrar('preferencias:salvar', (chave, valor) => exigirBanco().preferencias.salvar(chave, valor));

  // Backup completo em .zip
  registrar('backup:criar', async () => {
    exigirBanco();
    const agora = new Date();
    const carimbo = agora.toISOString().slice(0, 16).replace('T', '_').replace(':', 'h');
    const d = await dialog.showSaveDialog(janela, {
      title: 'Salvar backup',
      defaultPath: `backup-encartes_${carimbo}.zip`,
      filters: [{ name: 'Arquivo zip', extensions: ['zip'] }]
    });
    if (d.canceled || !d.filePath) return null;

    // Cópia consistente do banco, mesmo com o app aberto
    const tempBanco = path.join(app.getPath('temp'), `banco-backup-${Date.now()}.sqlite`);
    await db.backup(tempBanco);
    const zip = new AdmZip();
    zip.addLocalFile(tempBanco, '', 'banco.sqlite');
    for (const sub of ['imagens', 'fontes']) {
      const p = path.join(pastaDados, sub);
      if (fs.existsSync(p)) zip.addLocalFolder(p, sub);
    }
    zip.writeZip(d.filePath);
    fs.unlinkSync(tempBanco);
    return d.filePath;
  });
}

// ---------- Inicialização ----------
app.whenReady().then(() => {
  protocol.handle('encarte', req => {
    if (!pastaDados) return new Response('sem pasta', { status: 404 });
    try {
      const url = new URL(req.url);
      const relativo = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const arquivo = caminhoSeguro(relativo);
      const tipos = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
      // CORS liberado para o canvas do editor poder exportar as imagens
      return new Response(fs.readFileSync(arquivo), {
        headers: {
          'content-type': tipos[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
          'access-control-allow-origin': '*',
          'cache-control': 'no-cache'
        }
      });
    } catch {
      return new Response('não encontrado', { status: 404 });
    }
  });

  const cfg = lerConfig();
  if (cfg.pastaDados && fs.existsSync(cfg.pastaDados)) {
    try { abrirPastaDados(cfg.pastaDados); }
    catch (e) { console.error('Falha ao abrir a pasta de dados:', e); }
  }

  registrarHandlers();
  criarJanela();
});

app.on('window-all-closed', () => {
  if (db) db.close();
  app.quit();
});
