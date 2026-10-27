# Gerador de Encartes (Soundindoor)

O mesmo código gera duas versões:
- **Online** (GitHub Pages + Supabase): abre por link, com login, dados sincronizados
- **Desktop** (Electron): offline, dados numa pasta do PC

## Versão online: configuração (uma vez)

### 1. Supabase (banco e fotos)
1. Crie uma conta em supabase.com e um projeto novo (região São Paulo).
2. Em **SQL Editor**, cole todo o arquivo `supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings → API Keys**, copie a **Project URL** e a chave pública
   (**Publishable key** ou **anon public**). Essa chave pode ficar no site: as
   regras do banco garantem que cada usuário só vê os próprios dados.
4. Em **Authentication → URL Configuration**, coloque em **Site URL** o link do site:
   `https://SEU-USUARIO.github.io/gerador-encartes/`

### 2. GitHub (publicação)
No plano gratuito o GitHub Pages exige repositório público (o código fica
visível; seus dados não, eles ficam no Supabase).

```powershell
cd C:\Projetos\gerador-encartes
gh repo edit --visibility public --accept-visibility-change-consequences
gh secret set VITE_SUPABASE_URL --body "https://xxxxxxxx.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "cole-a-chave-publica-aqui"
gh api -X POST "repos/{owner}/{repo}/pages" -f build_type=workflow
git add .
git commit -m "Versão online"
git push
gh run watch
```

### 3. Primeiro acesso
1. Abra `https://SEU-USUARIO.github.io/gerador-encartes/` e clique em **Criar conta**.
2. Confirme pelo e-mail que o Supabase enviar e entre.
3. Para ninguém mais criar conta: no Supabase, **Authentication → Sign In / Providers**,
   desligue **Allow new users to sign up**.

Para atualizar o site depois: extraia o zip novo por cima, `git add .`,
`git commit`, `git push`. O GitHub publica sozinho em 1 a 2 minutos.

### Observações
- Plano gratuito do Supabase: projetos sem uso por cerca de uma semana são
  pausados; basta reativar no painel. O espaço de fotos gratuito é limitado
  (por isso o app reduz as fotos para no máximo 1600 px antes de enviar).
- Backup online: **Conta e backup → Baixar backup** gera um .json com os dados.
- O editor foi pensado para tela de computador; no celular dá para consultar
  e editar o catálogo.
- O instalador desktop agora só é gerado quando você pedir:
  `gh workflow run instalador.yml`

---

# Versão desktop — Fase 2

App desktop para Windows, 100% offline. Tudo fica numa pasta escolhida por você
(sugestão: `D:\Encartes`): banco SQLite, fotos dos produtos, fontes e exportações.

## Novo na fase 2: editor de encartes

- Tela **Encartes**: lista com miniaturas, abrir, duplicar, excluir
- **Novo encarte** a partir de um modelo: "Sua Casa" vertical (preço em faixa),
  "Sua Casa" quadrado (preço em selo) ou em branco (A4, post, story, 4:5, 2:3)
- **Editor** com tudo editável: textos (fonte, peso, tamanho, cor, contorno,
  sombra, faixa de fundo), retângulos e círculos (cor ou degradê), fundo de
  raios, linhas, 16 ícones, imagens do computador e logo da loja
- **Cards de produto** ligados ao catálogo: arraste um produto para um card, ou
  use "Preencher cards vazios". Ao reabrir o encarte, preço/nome/foto são
  atualizados do catálogo, exceto o que você editou à mão no card (marca "editado")
- Estilo do card: faixa ou selo, todas as cores, fontes, tamanhos, espaço da
  foto; "Aplicar este estilo em todos os cards"
- Arrastar imagem do Explorer para o encarte (ou para cima de um card)
- Seleção múltipla (Shift+clique), alinhar e distribuir, camadas (esconder,
  travar), trazer para frente/enviar para trás
- Atalhos: Ctrl+Z / Ctrl+Y, Ctrl+C / Ctrl+V, Ctrl+D (duplicar), Delete,
  setas (Shift+setas = 10 px), Ctrl+A, Ctrl+S, Esc
- Salvamento automático e **Salvar como modelo** (vira o seu banco de modelos)
- **Exportar** PNG, JPG ou PDF em até 3x a resolução (cards vazios não saem)

## Fase 1

- Escolha da pasta de dados na primeira abertura (pode trocar depois)
- Catálogo: busca, filtros (categoria, loja, sem foto), edição de preço com um
  clique na etiqueta, cadastro/edição completa, exclusão em lote
- Fotos: escolher, arrastar um arquivo sobre a miniatura, ou associar em lote
  (o nome do arquivo deve ser o EAN ou o SKU, ex.: `7896006711117.jpg`)
- Importação de planilha (.xlsx, .xls, .ods, .csv): reconhece as colunas
  automaticamente, deixa ajustar, mostra prévia com erros e lembra o
  mapeamento para a próxima vez. Atualiza pelo EAN/SKU, cria o que é novo e
  cria categorias que ainda não existem. CSV em Latin-1 com ";" (padrão de
  sistemas brasileiros) é lido corretamente.
- Lojas com logo, cor principal e cor de destaque
- Categorias por segmento (supermercado, eletrônicos, vestuário, geral)
- Backup completo em .zip (banco + imagens + fontes)

Para testar a importação, use o arquivo `exemplo-produtos.csv`.

## Atualizar a partir da versão anterior

Feche o app, extraia o zip novo por cima da pasta antiga e instale as novas dependências:

```powershell
Expand-Archive "$env:USERPROFILE\Downloads\gerador-encartes-fase2.zip" -DestinationPath C:\Projetos -Force
cd C:\Projetos\gerador-encartes
npm install
npm run dev
```

Seus produtos e lojas em `C:\Encartes` continuam lá. O banco é atualizado sozinho.

## Como rodar (PowerShell)

Requer Node.js 22 ou mais novo.

```powershell
cd D:\Projetos\gerador-encartes
npm install
npm run dev
```

`npm run dev` abre o app com recarregamento automático enquanto você edita o código.
A internet só é necessária no `npm install`. Depois disso, tudo roda offline.

## Gerar o instalador (.exe)

```powershell
npm run dist
```

O instalador sai na pasta `instalador\`. Instale e use normalmente, sem internet.

## Estrutura

```
electron/main.js        janela, pasta de dados, protocolo encarte://, IPC, backup
electron/preload.js     ponte segura entre a interface e o sistema
electron/db.js          banco SQLite e migrações (PRAGMA user_version)
electron/repositorio.js consultas: lojas, categorias, produtos, importação
src/                    interface React (páginas em src/pages)
src/editor/             editor de encartes (Konva), modelos, ícones, exportação
src/editor/modelos/     modelos prontos (embutidos.js)
```

## Evoluir o banco

Em `electron/db.js`, adicione um item NOVO no fim do array `MIGRACOES`
(nunca edite os anteriores). Na próxima abertura o app aplica sozinho.

## Próximas fases

1. Remoção de fundo das fotos (offline)
2. Preço "De/Por", "Leve 3 Pague 2", parcelado; validade das ofertas
3. Encartes com várias páginas
4. Guias de alinhamento ao arrastar
5. Fontes próprias (arquivos .ttf na pasta `fontes`)
