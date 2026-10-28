// Backend da versão online (GitHub Pages + Supabase).
// Implementa os MESMOS canais que o Electron (electron/main.js), para a interface
// funcionar igual nos dois modos. Os dados ficam no Postgres do Supabase e as
// imagens no Storage (bucket "imagens", pasta = id do usuário).
import { createClient } from '@supabase/supabase-js';

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const CHAVE_SUPABASE = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = 'imagens';
const LADO_MAXIMO_FOTO = 1600;

export const nuvemConfigurada = Boolean(URL_SUPABASE && CHAVE_SUPABASE);

let cliente = null;
export function supabase() {
  if (!nuvemConfigurada) throw new Error('A versão online não foi configurada (faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).');
  if (!cliente) cliente = createClient(URL_SUPABASE, CHAVE_SUPABASE, { auth: { persistSession: true, autoRefreshToken: true } });
  return cliente;
}

export function urlPublica(caminho) {
  if (!caminho) return null;
  const partes = caminho.split('/').map(encodeURIComponent).join('/');
  return `${URL_SUPABASE}/storage/v1/object/public/${BUCKET}/${partes}`;
}

// ---------- utilidades ----------
function ok({ data, error }) {
  if (error) throw new Error(traduzirErro(error));
  return data;
}

function traduzirErro(error) {
  const m = error.message || String(error);
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme o seu e-mail antes de entrar (veja a caixa de entrada).';
  if (/duplicate key.*categorias/i.test(m)) return 'Já existe uma categoria com esse nome.';
  if (/JWT|not authenticated|permission denied/i.test(m)) return 'Sua sessão expirou. Entre novamente.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com a internet.';
  return m;
}

const limpar = v => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

async function usuarioId() {
  const { data } = await supabase().auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Sua sessão expirou. Entre novamente.');
  return id;
}

// Busca todas as linhas, de 1000 em 1000 (limite padrão da API do Supabase)
async function buscarTudo(montarConsulta) {
  const tamanho = 1000;
  let inicio = 0;
  const todas = [];
  for (;;) {
    const parte = ok(await montarConsulta().range(inicio, inicio + tamanho - 1));
    todas.push(...parte);
    if (parte.length < tamanho) return todas;
    inicio += tamanho;
  }
}

function escolherArquivos({ multiplos = false } = {}) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.multiple = multiplos;
    input.style.display = 'none';
    input.addEventListener('change', () => { resolve([...input.files]); input.remove(); }, { once: true });
    input.addEventListener('cancel', () => { resolve([]); input.remove(); }, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

// Reduz fotos grandes antes de enviar (economiza espaço e deixa tudo mais rápido)
async function prepararImagem(arquivo) {
  if (!/^image\/(png|jpeg|webp)$/.test(arquivo.type)) throw new Error('Use imagens PNG, JPG ou WEBP.');
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(bitmap.width, bitmap.height));
  if (escala === 1 && arquivo.size < 1.5 * 1024 * 1024) {
    bitmap.close();
    return { blob: arquivo, ext: arquivo.type === 'image/jpeg' ? 'jpg' : arquivo.type.split('/')[1], tipo: arquivo.type };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const tipo = arquivo.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'; // PNG/WEBP mantêm transparência
  const blob = await new Promise(r => canvas.toBlob(r, tipo, 0.9));
  return { blob, ext: tipo === 'image/jpeg' ? 'jpg' : 'png', tipo };
}

async function enviarImagem(arquivo, pasta, prefixo) {
  const uid = await usuarioId();
  const { blob, ext, tipo } = await prepararImagem(arquivo);
  const caminho = `${uid}/${pasta}/${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  ok(await supabase().storage.from(BUCKET).upload(caminho, blob, { contentType: tipo, cacheControl: '31536000', upsert: false }));
  return caminho;
}

async function apagarImagens(caminhos) {
  const lista = caminhos.filter(Boolean);
  if (!lista.length) return;
  await supabase().storage.from(BUCKET).remove(lista); // falha ao apagar não deve travar o app
}

function baixar(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const contagem = rel => (Array.isArray(rel) ? rel[0]?.count ?? 0 : 0);
const agora = () => new Date().toISOString();

// ---------- Lojas ----------
const lojas = {
  async listar() {
    const linhas = ok(await supabase().from('lojas').select('*, produtos(count)').order('nome'));
    return linhas.map(({ produtos, ...l }) => ({ ...l, total_produtos: contagem(produtos) }));
  },
  async salvar(l) {
    const dados = { nome: limpar(l.nome), cor_primaria: l.cor_primaria || '#D7261E', cor_destaque: l.cor_destaque || '#FFD21F', logo: l.logo ?? null };
    if (!dados.nome) throw new Error('Informe o nome da loja.');
    if (l.id) { ok(await supabase().from('lojas').update(dados).eq('id', l.id)); return l.id; }
    return ok(await supabase().from('lojas').insert(dados).select('id').single()).id;
  },
  async excluir(id) { ok(await supabase().from('lojas').delete().eq('id', id)); }
};

// ---------- Categorias ----------
const categorias = {
  async listar() {
    const linhas = ok(await supabase().from('categorias').select('*, produtos(count)').order('nome'));
    return linhas.map(({ produtos, ...c }) => ({ ...c, total_produtos: contagem(produtos) }));
  },
  async salvar(c) {
    const nome = limpar(c.nome);
    if (!nome) throw new Error('Informe o nome da categoria.');
    const dados = { nome, segmento: c.segmento || 'geral' };
    if (c.id) { ok(await supabase().from('categorias').update(dados).eq('id', c.id)); return c.id; }
    return ok(await supabase().from('categorias').insert(dados).select('id').single()).id;
  },
  async excluir(id) { ok(await supabase().from('categorias').delete().eq('id', id)); }
};

// ---------- Produtos ----------
const CAMPOS_PRODUTO = ['loja_id', 'sku', 'ean', 'nome', 'nome_curto', 'marca', 'descricao', 'categoria_id', 'unidade', 'preco', 'imagem', 'imagem_recortada', 'ativo'];

function normalizarProduto(prod) {
  const dados = {};
  for (const c of CAMPOS_PRODUTO) if (c in prod) dados[c] = prod[c];
  for (const c of ['sku', 'ean', 'nome', 'nome_curto', 'marca', 'descricao', 'unidade']) if (c in dados) dados[c] = limpar(dados[c]);
  if ('preco' in dados) {
    dados.preco = dados.preco === '' || dados.preco === null ? null : Number(dados.preco);
    if (dados.preco !== null && Number.isNaN(dados.preco)) throw new Error('Preço inválido.');
  }
  return dados;
}

const achatar = p => {
  const { categorias: c, lojas: l, ...resto } = p;
  return { ...resto, preco: resto.preco === null ? null : Number(resto.preco), categoria_nome: c?.nome ?? null, loja_nome: l?.nome ?? null };
};

const produtos = {
  async listar(filtro = {}) {
    const montar = () => {
      let q = supabase().from('produtos').select('*, categorias(nome), lojas(nome)').order('nome');
      if (filtro.busca) {
        const b = filtro.busca.trim().replace(/[,()*%\\]/g, ' ');
        q = q.or(['nome', 'marca', 'ean', 'sku', 'nome_curto'].map(c => `${c}.ilike.*${b}*`).join(','));
      }
      if (filtro.categoriaId === 'sem') q = q.is('categoria_id', null);
      else if (filtro.categoriaId) q = q.eq('categoria_id', Number(filtro.categoriaId));
      if (filtro.lojaId === 'todas-lojas') q = q.is('loja_id', null);
      else if (filtro.lojaId) q = q.eq('loja_id', Number(filtro.lojaId));
      if (filtro.semImagem) q = q.is('imagem', null);
      return q;
    };
    const itens = (await buscarTudo(montar)).slice(0, 3000).map(achatar);
    const { count } = await supabase().from('produtos').select('id', { count: 'exact', head: true });
    return { itens, total: count ?? itens.length };
  },
  async obter(id) {
    return ok(await supabase().from('produtos').select('*').eq('id', id).maybeSingle());
  },
  async obterVarios(ids) {
    if (!ids?.length) return [];
    return ok(await supabase().from('produtos').select('*').in('id', ids)).map(p => ({ ...p, preco: p.preco === null ? null : Number(p.preco) }));
  },
  async salvar(prod) {
    const dados = normalizarProduto(prod);
    if (prod.id) {
      if (!Object.keys(dados).length) return prod.id;
      ok(await supabase().from('produtos').update({ ...dados, atualizado_em: agora() }).eq('id', prod.id));
      return prod.id;
    }
    if (!dados.nome) throw new Error('Informe o nome do produto.');
    return ok(await supabase().from('produtos').insert(dados).select('id').single()).id;
  },
  async excluir(ids) {
    const linhas = ok(await supabase().from('produtos').select('imagem, imagem_recortada').in('id', ids));
    ok(await supabase().from('produtos').delete().in('id', ids));
    await apagarImagens(linhas.flatMap(l => [l.imagem, l.imagem_recortada]));
  },

  // Cria ou atualiza pelo EAN (ou SKU), em lotes, como no app desktop
  async importar(linhas, opcoes = {}) {
    const lojaId = opcoes.lojaId ? Number(opcoes.lojaId) : null;
    const atualizar = opcoes.atualizarExistentes !== false;
    const resultado = { criados: 0, atualizados: 0, ignorados: 0, erros: [] };

    const existentes = await buscarTudo(() => {
      const q = supabase().from('produtos').select('*').order('id');
      return lojaId ? q.eq('loja_id', lojaId) : q.is('loja_id', null);
    });
    const porEan = new Map(), porSku = new Map();
    existentes.forEach(p => { if (p.ean) porEan.set(p.ean, p); if (p.sku) porSku.set(p.sku, p); });

    // Categorias que ainda não existem são criadas antes
    const cats = ok(await supabase().from('categorias').select('id, nome'));
    const catPorNome = new Map(cats.map(c => [c.nome.toLowerCase(), c.id]));
    const novasCats = [...new Set(linhas.map(l => limpar(l.categoria)).filter(n => n && !catPorNome.has(n.toLowerCase())).map(n => n))];
    const unicas = [...new Map(novasCats.map(n => [n.toLowerCase(), n])).values()];
    if (unicas.length) {
      const criadas = ok(await supabase().from('categorias').insert(unicas.map(nome => ({ nome }))).select('id, nome'));
      criadas.forEach(c => catPorNome.set(c.nome.toLowerCase(), c.id));
    }

    const novos = [];
    const alterados = new Map();
    linhas.forEach((linha, i) => {
      try {
        const ean = limpar(linha.ean), sku = limpar(linha.sku);
        let alvo = (ean && porEan.get(ean)) || (sku && porSku.get(sku)) || null;
        const dados = { loja_id: lojaId };
        for (const campo of ['nome', 'nome_curto', 'marca', 'descricao', 'unidade', 'preco']) {
          if (linha[campo] !== undefined && linha[campo] !== null && linha[campo] !== '') dados[campo] = linha[campo];
        }
        if (ean) dados.ean = ean;
        if (sku) dados.sku = sku;
        const cat = limpar(linha.categoria);
        if (cat) dados.categoria_id = catPorNome.get(cat.toLowerCase()) ?? null;
        const normal = normalizarProduto(dados);

        if (alvo) {
          if (!atualizar) { resultado.ignorados++; return; }
          Object.assign(alvo, normal, { atualizado_em: agora() });
          if (alvo.id) alterados.set(alvo.id, alvo); // produto que já estava no banco
          if (!alvo.__novo) resultado.atualizados++;
          return;
        }
        if (!normal.nome) throw new Error('sem nome');
        const novo = { ...normal, __novo: true };
        novos.push(novo);
        if (ean) porEan.set(ean, novo);
        if (sku) porSku.set(sku, novo);
        resultado.criados++;
      } catch (e) {
        resultado.erros.push({ linha: linha._linha ?? i + 2, motivo: e.message });
      }
    });

    const lote = 500;
    const inserir = novos.map(({ __novo, ...p }) => p);
    for (let i = 0; i < inserir.length; i += lote) {
      ok(await supabase().from('produtos').insert(inserir.slice(i, i + lote)));
    }
    const atualizarLista = [...alterados.values()].map(({ categorias: _c, lojas: _l, ...p }) => p);
    for (let i = 0; i < atualizarLista.length; i += lote) {
      ok(await supabase().from('produtos').upsert(atualizarLista.slice(i, i + lote), { onConflict: 'id' }));
    }
    return resultado;
  }
};

// ---------- Encartes e modelos ----------
const encartes = {
  async listar() {
    const linhas = ok(await supabase().from('encartes').select('id, titulo, loja_id, miniatura, criado_em, atualizado_em, lojas(nome)').order('atualizado_em', { ascending: false }));
    return linhas.map(({ lojas: l, ...e }) => ({ ...e, loja_nome: l?.nome ?? null }));
  },
  async obter(id) {
    const e = ok(await supabase().from('encartes').select('*').eq('id', id).maybeSingle());
    if (!e) throw new Error('Encarte não encontrado.');
    return e;
  },
  async salvar(e) {
    const dados = { titulo: limpar(e.titulo) || 'Encarte sem título', loja_id: e.loja_id ? Number(e.loja_id) : null, documento: e.documento };
    if (e.miniatura) dados.miniatura = e.miniatura;
    if (e.id) { ok(await supabase().from('encartes').update({ ...dados, atualizado_em: agora() }).eq('id', e.id)); return e.id; }
    return ok(await supabase().from('encartes').insert(dados).select('id').single()).id;
  },
  async duplicar(id) {
    const e = await encartes.obter(id);
    return ok(await supabase().from('encartes').insert({ titulo: `${e.titulo} (cópia)`, loja_id: e.loja_id, documento: e.documento, miniatura: e.miniatura }).select('id').single()).id;
  },
  async excluir(id) { ok(await supabase().from('encartes').delete().eq('id', id)); }
};

const modelos = {
  async listar() { return ok(await supabase().from('modelos').select('id, nome, miniatura, criado_em').order('criado_em', { ascending: false })); },
  async obter(id) {
    const m = ok(await supabase().from('modelos').select('*').eq('id', id).maybeSingle());
    if (!m) throw new Error('Modelo não encontrado.');
    return m;
  },
  async salvar(m) {
    const nome = limpar(m.nome);
    if (!nome) throw new Error('Informe o nome do modelo.');
    return ok(await supabase().from('modelos').insert({ nome, documento: m.documento, miniatura: m.miniatura ?? null }).select('id').single()).id;
  },
  async excluir(id) { ok(await supabase().from('modelos').delete().eq('id', id)); }
};

// ---------- Mapa de canais (mesmos nomes do Electron) ----------
const canais = {
  async 'config:obter'() {
    const { data } = await supabase().auth.getSession();
    const email = data.session?.user?.email || null;
    return { modo: 'nuvem', logado: Boolean(data.session), email, pastaDados: email };
  },

  'lojas:listar': () => lojas.listar(),
  'lojas:salvar': l => lojas.salvar(l),
  'lojas:excluir': id => lojas.excluir(id),
  async 'lojas:escolherLogo'() {
    const [arquivo] = await escolherArquivos();
    return arquivo ? enviarImagem(arquivo, 'lojas', 'logo') : null;
  },

  'categorias:listar': () => categorias.listar(),
  'categorias:salvar': c => categorias.salvar(c),
  'categorias:excluir': id => categorias.excluir(id),

  'produtos:listar': f => produtos.listar(f),
  'produtos:salvar': p => produtos.salvar(p),
  'produtos:excluir': ids => produtos.excluir(ids),
  'produtos:importar': (linhas, opcoes) => produtos.importar(linhas, opcoes),
  'produtos:obterVarios': ids => produtos.obterVarios(ids),
  async 'produtos:definirImagem'(id, arquivoSolto) {
    const arquivo = arquivoSolto || (await escolherArquivos())[0];
    if (!arquivo) return null;
    const anterior = await produtos.obter(id);
    const caminho = await enviarImagem(arquivo, 'produtos', `produto-${id}`);
    await produtos.salvar({ id, imagem: caminho });
    if (anterior?.imagem) await apagarImagens([anterior.imagem]);
    return caminho;
  },
  async 'produtos:removerImagem'(id) {
    const p = await produtos.obter(id);
    await produtos.salvar({ id, imagem: null });
    if (p?.imagem) await apagarImagens([p.imagem]);
  },

  // Nome do arquivo (sem extensão) = EAN ou SKU do produto
  async 'imagens:associarLote'(substituir = false) {
    const arquivos = await escolherArquivos({ multiplos: true });
    if (!arquivos.length) return null;
    const codigoDe = a => a.name.replace(/\.[^.]+$/, '').trim();
    const codigos = [...new Set(arquivos.map(codigoDe))];
    const [porEan, porSku] = await Promise.all([
      supabase().from('produtos').select('id, ean, sku, imagem').in('ean', codigos),
      supabase().from('produtos').select('id, ean, sku, imagem').in('sku', codigos)
    ]);
    const encontrados = [...ok(porEan), ...ok(porSku)];
    const res = { associadas: 0, jaTinham: 0, semProduto: [] };
    for (const arquivo of arquivos) {
      const codigo = codigoDe(arquivo);
      const alvos = [...new Map(encontrados.filter(p => p.ean === codigo || p.sku === codigo).map(p => [p.id, p])).values()];
      if (!alvos.length) { res.semProduto.push(arquivo.name); continue; }
      for (const p of alvos) {
        if (p.imagem && !substituir) { res.jaTinham++; continue; }
        const caminho = await enviarImagem(arquivo, 'produtos', `produto-${p.id}`);
        await produtos.salvar({ id: p.id, imagem: caminho });
        if (p.imagem) await apagarImagens([p.imagem]);
        res.associadas++;
      }
    }
    return res;
  },
  async 'imagens:paraEncarte'(arquivoSolto) {
    const arquivo = arquivoSolto || (await escolherArquivos())[0];
    return arquivo ? enviarImagem(arquivo, 'encartes', 'arte') : null;
  },

  'encartes:listar': () => encartes.listar(),
  'encartes:obter': id => encartes.obter(id),
  'encartes:salvar': e => encartes.salvar(e),
  'encartes:duplicar': id => encartes.duplicar(id),
  'encartes:excluir': id => encartes.excluir(id),
  'modelos:listar': () => modelos.listar(),
  'modelos:obter': id => modelos.obter(id),
  'modelos:salvar': m => modelos.salvar(m),
  'modelos:excluir': id => modelos.excluir(id),

  async 'preferencias:obter'(chave) {
    const r = ok(await supabase().from('preferencias').select('valor').eq('chave', chave).maybeSingle());
    return r ? r.valor : null;
  },
  async 'preferencias:salvar'(chave, valor) {
    ok(await supabase().from('preferencias').upsert({ chave, valor }, { onConflict: 'user_id,chave' }));
  },

  // No navegador, "salvar" é baixar o arquivo
  async 'exportar:salvar'(bytes, nome, extensao) {
    const tipos = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf', zip: 'application/zip' };
    const arquivo = `${nome}.${extensao}`;
    baixar(new Blob([bytes], { type: tipos[extensao] }), arquivo);
    return arquivo;
  },
  'exportar:mostrar': () => null,

  // Backup: baixa todos os dados em JSON (as fotos continuam guardadas no Supabase)
  async 'backup:criar'() {
    const tabelas = ['lojas', 'categorias', 'produtos', 'encartes', 'modelos', 'preferencias'];
    const dados = { app: 'gerador-encartes', versao: 1, gerado_em: agora() };
    for (const t of tabelas) dados[t] = await buscarTudo(() => supabase().from(t).select('*'));
    const nome = `backup-encartes_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', 'h')}.json`;
    baixar(new Blob([JSON.stringify(dados)], { type: 'application/json' }), nome);
    return nome;
  },

  async 'conta:entrar'(email, senha) {
    ok(await supabase().auth.signInWithPassword({ email, password: senha }));
  },
  async 'conta:criar'(email, senha) {
    const r = ok(await supabase().auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.href.split('#')[0] } }));
    return { precisaConfirmar: !r.session };
  },
  async 'conta:sair'() { await supabase().auth.signOut(); },
  async 'conta:senha'(nova) {
    if (!nova || nova.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.');
    ok(await supabase().auth.updateUser({ password: nova }));
  }
};

export async function chamarNuvem(canal, ...args) {
  const fn = canais[canal];
  if (!fn) return { ok: false, erro: `Função indisponível na versão online: ${canal}` };
  try { return { ok: true, dados: await fn(...args) }; }
  catch (e) { return { ok: false, erro: e.message || String(e) }; }
}

export function aoMudarSessao(callback) {
  if (!nuvemConfigurada) return () => {};
  const { data } = supabase().auth.onAuthStateChange(() => callback());
  return () => data.subscription.unsubscribe();
}
