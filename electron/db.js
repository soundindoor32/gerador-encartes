// Banco SQLite do Gerador de Encartes
// Migrações automáticas via PRAGMA user_version: cada item do array é uma versão.
// Para evoluir o banco, ADICIONE um item novo no fim — nunca edite os antigos.
const Database = require('better-sqlite3');

const MIGRACOES = [
  // v1 — estrutura inicial
  `
  CREATE TABLE lojas (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    cor_primaria TEXT DEFAULT '#D7261E',
    cor_destaque TEXT DEFAULT '#FFD21F',
    logo TEXT,
    criado_em TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE categorias (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE COLLATE NOCASE,
    segmento TEXT DEFAULT 'geral'
  );

  CREATE TABLE produtos (
    id INTEGER PRIMARY KEY,
    loja_id INTEGER REFERENCES lojas(id) ON DELETE SET NULL,
    sku TEXT,
    ean TEXT,
    nome TEXT NOT NULL,
    nome_curto TEXT,
    marca TEXT,
    descricao TEXT,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    unidade TEXT DEFAULT 'un',
    preco REAL,
    atributos TEXT DEFAULT '{}',
    imagem TEXT,
    imagem_recortada TEXT,
    ativo INTEGER DEFAULT 1,
    criado_em TEXT DEFAULT (datetime('now','localtime')),
    atualizado_em TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX idx_produtos_ean ON produtos(ean);
  CREATE INDEX idx_produtos_sku ON produtos(sku);
  CREATE INDEX idx_produtos_nome ON produtos(nome);

  -- Preparada para a próxima fase (ofertas com validade)
  CREATE TABLE ofertas (
    id INTEGER PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    tipo TEXT,
    regra TEXT DEFAULT '{}',
    validade_inicio TEXT,
    validade_fim TEXT
  );

  CREATE TABLE preferencias (
    chave TEXT PRIMARY KEY,
    valor TEXT
  );
  `,

  // v2 — encartes e modelos (banco de modelos do usuário)
  `
  CREATE TABLE encartes (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL,
    loja_id INTEGER REFERENCES lojas(id) ON DELETE SET NULL,
    documento TEXT NOT NULL,
    miniatura TEXT,
    criado_em TEXT DEFAULT (datetime('now','localtime')),
    atualizado_em TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE modelos (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    documento TEXT NOT NULL,
    miniatura TEXT,
    criado_em TEXT DEFAULT (datetime('now','localtime'))
  );
  `
];

function abrirBanco(caminho) {
  const db = new Database(caminho);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const versaoAtual = db.pragma('user_version', { simple: true });
  for (let v = versaoAtual; v < MIGRACOES.length; v++) {
    db.transaction(() => {
      db.exec(MIGRACOES[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
  return db;
}

module.exports = { abrirBanco };
