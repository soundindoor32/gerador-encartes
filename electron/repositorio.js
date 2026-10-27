// Todas as consultas ao banco ficam aqui. O main.js só repassa as chamadas.
const CAMPOS_PRODUTO = [
  'loja_id', 'sku', 'ean', 'nome', 'nome_curto', 'marca', 'descricao',
  'categoria_id', 'unidade', 'preco', 'atributos', 'imagem', 'imagem_recortada', 'ativo'
];

function limparTexto(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function criarRepositorio(db) {
  // ---------- Lojas ----------
  const lojas = {
    listar() {
      return db.prepare(`
        SELECT l.*, (SELECT COUNT(*) FROM produtos p WHERE p.loja_id = l.id) AS total_produtos
        FROM lojas l ORDER BY l.nome COLLATE NOCASE`).all();
    },
    salvar(l) {
      const dados = {
        nome: limparTexto(l.nome),
        cor_primaria: l.cor_primaria || '#D7261E',
        cor_destaque: l.cor_destaque || '#FFD21F',
        logo: l.logo ?? null
      };
      if (!dados.nome) throw new Error('Informe o nome da loja.');
      if (l.id) {
        db.prepare(`UPDATE lojas SET nome=@nome, cor_primaria=@cor_primaria,
          cor_destaque=@cor_destaque, logo=@logo WHERE id=@id`).run({ ...dados, id: l.id });
        return l.id;
      }
      return db.prepare(`INSERT INTO lojas (nome, cor_primaria, cor_destaque, logo)
        VALUES (@nome, @cor_primaria, @cor_destaque, @logo)`).run(dados).lastInsertRowid;
    },
    excluir(id) {
      db.prepare('DELETE FROM lojas WHERE id = ?').run(id);
    }
  };

  // ---------- Categorias ----------
  const categorias = {
    listar() {
      return db.prepare(`
        SELECT c.*, (SELECT COUNT(*) FROM produtos p WHERE p.categoria_id = c.id) AS total_produtos
        FROM categorias c ORDER BY c.nome COLLATE NOCASE`).all();
    },
    salvar(c) {
      const nome = limparTexto(c.nome);
      if (!nome) throw new Error('Informe o nome da categoria.');
      const existente = db.prepare('SELECT id FROM categorias WHERE nome = ?').get(nome);
      if (existente && existente.id !== c.id) throw new Error(`Já existe a categoria "${nome}".`);
      if (c.id) {
        db.prepare('UPDATE categorias SET nome=?, segmento=? WHERE id=?')
          .run(nome, c.segmento || 'geral', c.id);
        return c.id;
      }
      return db.prepare('INSERT INTO categorias (nome, segmento) VALUES (?, ?)')
        .run(nome, c.segmento || 'geral').lastInsertRowid;
    },
    excluir(id) {
      db.prepare('DELETE FROM categorias WHERE id = ?').run(id);
    },
    obterOuCriar(nome) {
      nome = limparTexto(nome);
      if (!nome) return null;
      const existente = db.prepare('SELECT id FROM categorias WHERE nome = ?').get(nome);
      if (existente) return existente.id;
      return db.prepare('INSERT INTO categorias (nome) VALUES (?)').run(nome).lastInsertRowid;
    }
  };

  // ---------- Produtos ----------
  const produtos = {
    listar(filtro = {}) {
      const where = ['1=1'];
      const p = {};
      if (filtro.busca) {
        where.push(`(p.nome LIKE @busca OR p.marca LIKE @busca OR p.ean LIKE @busca
                     OR p.sku LIKE @busca OR p.nome_curto LIKE @busca)`);
        p.busca = `%${filtro.busca.trim()}%`;
      }
      if (filtro.categoriaId === 'sem') where.push('p.categoria_id IS NULL');
      else if (filtro.categoriaId) { where.push('p.categoria_id = @cat'); p.cat = Number(filtro.categoriaId); }
      if (filtro.lojaId === 'todas-lojas') where.push('p.loja_id IS NULL');
      else if (filtro.lojaId) { where.push('p.loja_id = @loja'); p.loja = Number(filtro.lojaId); }
      if (filtro.semImagem) where.push('p.imagem IS NULL');

      const sql = `
        SELECT p.*, c.nome AS categoria_nome, l.nome AS loja_nome
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN lojas l ON l.id = p.loja_id
        WHERE ${where.join(' AND ')}
        ORDER BY p.nome COLLATE NOCASE
        LIMIT 3000`;
      const itens = db.prepare(sql).all(p);
      const total = db.prepare('SELECT COUNT(*) AS n FROM produtos').get().n;
      return { itens, total };
    },

    obter(id) {
      return db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
    },

    salvar(prod) {
      const dados = {};
      for (const campo of CAMPOS_PRODUTO) {
        if (campo in prod) dados[campo] = prod[campo];
      }
      for (const campo of ['sku', 'ean', 'nome', 'nome_curto', 'marca', 'descricao', 'unidade']) {
        if (campo in dados) dados[campo] = limparTexto(dados[campo]);
      }
      if ('preco' in dados) {
        dados.preco = dados.preco === '' || dados.preco === null ? null : Number(dados.preco);
        if (dados.preco !== null && Number.isNaN(dados.preco)) throw new Error('Preço inválido.');
      }
      if ('atributos' in dados && typeof dados.atributos !== 'string') {
        dados.atributos = JSON.stringify(dados.atributos || {});
      }

      if (prod.id) {
        const sets = Object.keys(dados).map(c => `${c}=@${c}`);
        if (sets.length === 0) return prod.id;
        db.prepare(`UPDATE produtos SET ${sets.join(', ')},
          atualizado_em = datetime('now','localtime') WHERE id=@id`).run({ ...dados, id: prod.id });
        return prod.id;
      }
      if (!dados.nome) throw new Error('Informe o nome do produto.');
      const colunas = Object.keys(dados);
      return db.prepare(`INSERT INTO produtos (${colunas.join(', ')})
        VALUES (${colunas.map(c => '@' + c).join(', ')})`).run(dados).lastInsertRowid;
    },

    excluir(ids) {
      const stmt = db.prepare('DELETE FROM produtos WHERE id = ?');
      db.transaction(() => ids.forEach(id => stmt.run(id)))();
    },

    obterVarios(ids) {
      if (!ids || ids.length === 0) return [];
      const marcadores = ids.map(() => '?').join(',');
      return db.prepare(`SELECT * FROM produtos WHERE id IN (${marcadores})`).all(...ids);
    },

    buscarPorCodigo(codigo) {
      return db.prepare('SELECT * FROM produtos WHERE ean = ? OR sku = ?').all(codigo, codigo);
    },

    // Importação em lote: cria ou atualiza pelo EAN (ou SKU, se não houver EAN)
    importar(linhas, opcoes = {}) {
      const lojaId = opcoes.lojaId ? Number(opcoes.lojaId) : null;
      const atualizar = opcoes.atualizarExistentes !== false;
      const resultado = { criados: 0, atualizados: 0, ignorados: 0, erros: [] };

      const porEan = db.prepare('SELECT id FROM produtos WHERE ean = ? AND loja_id IS ?');
      const porSku = db.prepare('SELECT id FROM produtos WHERE sku = ? AND loja_id IS ?');

      db.transaction(() => {
        linhas.forEach((linha, i) => {
          try {
            const ean = limparTexto(linha.ean);
            const sku = limparTexto(linha.sku);
            let existente = null;
            if (ean) existente = porEan.get(ean, lojaId);
            if (!existente && sku) existente = porSku.get(sku, lojaId);

            const dados = { loja_id: lojaId };
            for (const campo of ['nome', 'nome_curto', 'marca', 'descricao', 'unidade', 'preco']) {
              if (linha[campo] !== undefined && linha[campo] !== null && linha[campo] !== '') {
                dados[campo] = linha[campo];
              }
            }
            if (ean) dados.ean = ean;
            if (sku) dados.sku = sku;
            if (linha.categoria) dados.categoria_id = categorias.obterOuCriar(linha.categoria);

            if (existente) {
              if (!atualizar) { resultado.ignorados++; return; }
              produtos.salvar({ ...dados, id: existente.id });
              resultado.atualizados++;
            } else {
              if (!dados.nome) throw new Error('sem nome');
              produtos.salvar(dados);
              resultado.criados++;
            }
          } catch (e) {
            resultado.erros.push({ linha: linha._linha ?? i + 2, motivo: e.message });
          }
        });
      })();
      return resultado;
    }
  };

  // ---------- Preferências (ex.: mapeamento de colunas salvo) ----------
  const preferencias = {
    obter(chave) {
      const r = db.prepare('SELECT valor FROM preferencias WHERE chave = ?').get(chave);
      return r ? JSON.parse(r.valor) : null;
    },
    salvar(chave, valor) {
      db.prepare(`INSERT INTO preferencias (chave, valor) VALUES (?, ?)
        ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`).run(chave, JSON.stringify(valor));
    }
  };

  // ---------- Encartes ----------
  const encartes = {
    listar() {
      return db.prepare(`
        SELECT e.id, e.titulo, e.loja_id, e.miniatura, e.criado_em, e.atualizado_em, l.nome AS loja_nome
        FROM encartes e LEFT JOIN lojas l ON l.id = e.loja_id
        ORDER BY e.atualizado_em DESC`).all();
    },
    obter(id) {
      const e = db.prepare('SELECT * FROM encartes WHERE id = ?').get(id);
      if (!e) throw new Error('Encarte não encontrado.');
      return { ...e, documento: JSON.parse(e.documento) };
    },
    salvar(e) {
      const dados = {
        titulo: limparTexto(e.titulo) || 'Encarte sem título',
        loja_id: e.loja_id ? Number(e.loja_id) : null,
        documento: JSON.stringify(e.documento),
        miniatura: e.miniatura ?? null
      };
      if (e.id) {
        db.prepare(`UPDATE encartes SET titulo=@titulo, loja_id=@loja_id, documento=@documento,
          miniatura=COALESCE(@miniatura, miniatura), atualizado_em=datetime('now','localtime')
          WHERE id=@id`).run({ ...dados, id: e.id });
        return e.id;
      }
      return db.prepare(`INSERT INTO encartes (titulo, loja_id, documento, miniatura)
        VALUES (@titulo, @loja_id, @documento, @miniatura)`).run(dados).lastInsertRowid;
    },
    duplicar(id) {
      const e = db.prepare('SELECT * FROM encartes WHERE id = ?').get(id);
      if (!e) throw new Error('Encarte não encontrado.');
      return db.prepare(`INSERT INTO encartes (titulo, loja_id, documento, miniatura)
        VALUES (?, ?, ?, ?)`).run(`${e.titulo} (cópia)`, e.loja_id, e.documento, e.miniatura).lastInsertRowid;
    },
    excluir(id) {
      db.prepare('DELETE FROM encartes WHERE id = ?').run(id);
    }
  };

  // ---------- Modelos criados pelo usuário ----------
  const modelos = {
    listar() {
      return db.prepare('SELECT id, nome, miniatura, criado_em FROM modelos ORDER BY criado_em DESC').all();
    },
    obter(id) {
      const m = db.prepare('SELECT * FROM modelos WHERE id = ?').get(id);
      if (!m) throw new Error('Modelo não encontrado.');
      return { ...m, documento: JSON.parse(m.documento) };
    },
    salvar(m) {
      const nome = limparTexto(m.nome);
      if (!nome) throw new Error('Informe o nome do modelo.');
      return db.prepare('INSERT INTO modelos (nome, documento, miniatura) VALUES (?, ?, ?)')
        .run(nome, JSON.stringify(m.documento), m.miniatura ?? null).lastInsertRowid;
    },
    excluir(id) {
      db.prepare('DELETE FROM modelos WHERE id = ?').run(id);
    }
  };

  return { lojas, categorias, produtos, preferencias, encartes, modelos };
}

module.exports = { criarRepositorio };
