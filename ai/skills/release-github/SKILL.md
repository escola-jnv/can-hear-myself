---
name: release-github
description: Commit, versão, nome da release, release notes e publicação no GitHub do Can Hear Myself. Use quando pedirem "commit-local", "commitar", "fazer release", "subir para o GitHub", "gerar release notes" ou "publicar o exe".
---

# Release do Can Hear Myself (commit → versão → release notes → GitHub)

Adaptação das políticas do Proskë (`commit-policy`, `commit-policy-local`, `commit-policy-cloud`) para este projeto.
Diferenças principais: **não há Vercel nem Supabase**. O "deploy" aqui é: `git push` + **GitHub Release com o `can-hear-myself.exe` anexado**.

Repositório: `https://github.com/escola-jnv/can-hear-myself` (branch `main`).

Há dois modos. Descubra qual o usuário pediu:

| Pedido do usuário | Modo | Push? |
| --- | --- | --- |
| "commit-local", "commita", "salva no git" | **Local** (seções 1–6) | ❌ Não faz push |
| "release", "sobe pro GitHub", "publica", "gera o exe da versão" | **Release** (seções 1–9) | ✅ Push + GitHub Release |

---

## 1. Versão (SemVer `MAJOR.MINOR.PATCH`)

- **Padrão: PATCH** a cada commit local (`0.2.3` → `0.2.4`).
- **MINOR** ou **MAJOR** só se o usuário pedir **explicitamente** ("suba minor", "versão major").
- Enquanto a versão for `0.x`, o app é considerado beta: MINOR = nova área ou recurso grande; PATCH = correções e ajustes.

| Tipo | Quando | Exemplo |
| --- | --- | --- |
| PATCH | Correção de bug, ajuste de layout, melhoria pequena e compatível | `0.2.3` → `0.2.4` |
| MINOR | Nova área/recurso (ex.: novo driver de mesa, setlist, stems, painel novo) | `0.2.4` → `0.3.0` |
| MAJOR | Mudança que quebra configs/dados salvos, troca de arquitetura | `0.9.0` → `1.0.0` |

> Primeira versão estável para igrejas fora da CF = `1.0.0`.

---

## 2. Quarteto de versão (SSOT) — sempre sincronizado

Os 4 locais abaixo **precisam ter a mesma versão** antes de qualquer commit:

| # | Arquivo | O que muda | Exemplo |
| --- | --- | --- | --- |
| 1 | `package.json` | `"version"` | `"0.2.4"` |
| 2 | `server/version.js` | `APP_VERSION` | `module.exports = { APP_VERSION: '0.2.4', RELEASE_NAME: 'Retorno Limpo' };` |
| 3 | `docs/changelogs/index.json` | versão nova no **topo** do array | `["0.2.4", "0.2.3"]` |
| 4 | `docs/changelogs/0.2.4.json` | arquivo da versão | ver seção 5 |

**Se algum desses arquivos não existir ainda, crie-o** no primeiro uso da skill (e mostre a versão no console do servidor e no painel do técnico usando `server/version.js`).

Conferência rápida (deve imprimir a mesma versão 3 vezes):

```bash
node -p "require('./package.json').version"
node -p "require('./server/version.js').APP_VERSION"
node -p "require('./docs/changelogs/index.json')[0]"
```

---

## 3. Nome da release

Toda versão MINOR ou MAJOR ganha um **nome curto**; versões PATCH herdam o nome da MINOR atual.

- Formato do título: **`vX.Y.Z — Nome da Release`** (ex.: `v0.3.0 — Palco Afinado`).
- O nome vem do **destaque principal** da versão, em português, 2 a 3 palavras, com tema de música/palco.
  - Bons: `Retorno Limpo`, `Palco Afinado`, `Mesa Conectada`, `Setlist Viva`, `Um Toque Só`.
  - Ruins: `Refactor Hub`, `Fix EADDRINUSE`, `v2 final`, nomes técnicos de arquivo.
- Grave o nome em `server/version.js` (`RELEASE_NAME`) e no JSON da versão (`"name"`).

---

## 4. Commit local

### 4.1 Staging seletivo (regra de ouro anti-arquivo-órfão)

1. Rode `git status -s` e analise **cada linha**.
2. Arquivos `??` (não rastreados) que são **importados ou carregados** pelo app (`require(...)`, `<script src>`, `<link href>`, testes) **têm que entrar no commit**.
3. Lixo/temporário vai para o `.gitignore`, nunca para o commit (ex.: `build/gui_test.txt`, `build/node_gui.exe`, `*.log`, `data/`).
4. **Proibido `git add .`** — adicione os caminhos explicitamente:

```bash
git add server/index.js server/core/mix.js public/tecnico.html docs/changelogs/0.2.4.json docs/changelogs/index.json server/version.js package.json
```

5. Antes de fechar, confirme que nenhum `require`/`src`/`href` aponta para arquivo que ficou `??`:

```bash
git status -s | grep '^??'
```

### 4.2 O que NUNCA vai para o Git

| Arquivo | Por quê |
| --- | --- |
| `*.exe` (raiz, `build/`, `desktop/src-tauri/binaries/`) | Binário de ~90 MB — vai **anexado na GitHub Release** |
| `server/embedded-assets.js` | Gerado pelo build |
| `build/.cache/` | Gerado pelo build |
| `config/app.config.json` | Mapeamento real da igreja (cada cliente tem o seu) |
| `data/` | Presets, logs e stems do cliente |

### 4.3 Case-sensitivity

O Windows ignora maiúsculas/minúsculas; o GitHub Actions e o Linux não. Todo `require('./x')` e `src="js/x.js"` tem que bater **exatamente** com o nome em `git ls-files`.

### 4.4 Lockfile

Mudou `dependencies`/`devDependencies`/`optionalDependencies` no `package.json`? Então `package-lock.json` entra **no mesmo commit** (`npm install` antes).

### 4.5 Mensagem de commit

Formato obrigatório:

```
vX.Y.Z [modulo] tipo: descricao clara da alteracao
```

Módulos deste projeto:

| Módulo | Escopo |
| --- | --- |
| `[servidor]` | `server/index.js`, `server/realtime`, `server/storage`, API HTTP |
| `[mix]` | `server/core/mix.js`, níveis, grupos, ajuste fino, presets |
| `[mesa]` | `server/drivers/*`, `server/discovery` (Ui24R, X32, X Air, mesa virtual) |
| `[musico]` | `public/index.html`, `public/js/*`, `public/css/*` (app do celular) |
| `[tecnico]` | `public/tecnico.html` (painel do técnico) |
| `[repertorio]` | `server/core/setlist.js` e telas de setlist |
| `[ajuda]` | pedidos de ajuda |
| `[build]` | `build/`, empacotamento do `.exe`, Tauri |
| `[docs]` | `docs/`, README, skills |
| `[infraestrutura]` | `.gitignore`, `package.json`, testes, CI |

Tipos: `feat`, `improvement`, `fix`, `refactor`, `style`, `docs`, `chore`, `perf`.

Exemplos:

```
v0.2.4 [servidor] fix: exe nao fecha mais quando a porta 3000 ja esta em uso
v0.3.0 [tecnico] feat: painel mostra IPs, pessoas conectadas e mapeamento de canais
v0.3.1 [musico] style: icones de instrumentos no app do celular
```

Um commit = **um objetivo**. Não misture `[musico]` com `[mesa]` sem relação.

### 4.6 Branches (quando for PR)

- `feature/nome-curto` · `fix/descricao-do-bug` · `refactor/modulo`
- Commits locais na `main` são permitidos; **push** só no modo Release.

---

## 5. Changelog da versão (`docs/changelogs/X.Y.Z.json`)

Linguagem **do usuário**, nunca de código.

- 🚫 Proibido: `tecnico.html`, `hub.js`, `EADDRINUSE`, `WebSocket`, `setGroupLevel`, `esbuild`.
- ✅ Use: `App do Músico`, `Painel do Técnico`, `Servidor`, `Mesa de Som`, `Mesa Virtual`, `Repertório`, `Pedido de Ajuda`, `Mapeamento de Canais`, `Instalador`.
- Cada item leva **público** e **categoria**:
  - Público: `[MÚSICO]`, `[TÉCNICO]` ou `[MÚSICO & TÉCNICO]`.
  - Categoria: `Nova Feature`, `Feature Melhora` ou `Correção de Bug`.

Modelo:

```json
{
  "version": "0.3.0",
  "name": "Palco Afinado",
  "date": "2026-11-17",
  "highlights": [
    "O Painel do Técnico abre sozinho e mostra quem está conectado"
  ],
  "items": [
    { "area": "Painel do Técnico", "audience": "[TÉCNICO]", "category": "Nova Feature",
      "text": "Mostra os endereços para os músicos se conectarem e quantas pessoas estão no retorno." },
    { "area": "Servidor", "audience": "[TÉCNICO]", "category": "Correção de Bug",
      "text": "O programa não fecha mais sozinho quando já existe outro servidor aberto." }
  ]
}
```

Escreva também o resumo do ciclo em **`ai/docs/releases/Release_CommitLocal.md`** (sobrescreva a cada commit; o histórico fica no Git e em `docs/changelogs/`).

---

## 6. Checklist pré-commit (obrigatório)

- [ ] Versão subiu por **PATCH** (ou MINOR/MAJOR se pedido explicitamente).
- [ ] Quarteto sincronizado (3 comandos da seção 2 imprimem a mesma versão).
- [ ] `git status -s` analisado; nenhum `??` necessário ficou de fora; lixo foi para o `.gitignore`.
- [ ] Imports e `src`/`href` conferidos (maiúsculas/minúsculas).
- [ ] `npm test` → **0 falhas**.
- [ ] Lockfile junto, se o `package.json` mudou.
- [ ] Changelog da versão preenchido em linguagem de usuário, com público e categoria.

Se algum item falhar: **pare, corrija e repita**. Não comite "para corrigir depois".

---

## 7. Gatekeeper de release (antes do push)

Execute em ordem. Qualquer falha bloqueia a release.

1. **Auditoria Git** — `git status -s` limpo (só arquivos ignorados fora do Git).
2. **Lockfile** — `npm ci` roda sem erro.
3. **Testes** — `npm test` → exit code `0`.
4. **Rotas principais (anti-tela-branca)** — com o servidor rodando em mesa virtual (`npm start`), todas devem responder `200` e sem erro no console:

   ```bash
   for u in / /tecnico.html /api/config /api/status; do
     curl -s -o /dev/null -w "$u %{http_code}\n" http://localhost:3000$u
   done
   ```

   E manualmente: abrir `/` e `/tecnico.html` no navegador, entrar numa aux, mudar um grupo, pedir ajuda e ver o pedido chegar no painel.
5. **Build do executável** — `npm run build:exe` termina com "Executável gerado com sucesso".
6. **Teste do `.exe`** — dar dois cliques em `can-hear-myself.exe`:
   - o Painel do Técnico abre sozinho;
   - os IPs aparecem;
   - abrir uma **segunda** cópia mostra o aviso de porta em uso (não pode fechar sozinha).
7. **Quarteto de versão** sincronizado e `RELEASE_NAME` preenchido.

---

## 8. Publicação no GitHub

```bash
# 1. Commit de release (se ainda houver algo pendente)
git commit -m "v0.3.0 [build] chore: release v0.3.0 Palco Afinado"

# 2. Tag anotada com o nome da release
git tag -a v0.3.0 -m "v0.3.0 — Palco Afinado"

# 3. Push do código e da tag
git push origin main
git push origin v0.3.0

# 4. GitHub Release com o exe anexado
gh release create v0.3.0 can-hear-myself.exe \
  --title "v0.3.0 — Palco Afinado" \
  --notes-file ai/docs/releases/Release_CommitCloud.md
```

Sem o `gh` instalado: criar a release em `https://github.com/escola-jnv/can-hear-myself/releases/new`, escolher a tag, colar as notas e anexar o `.exe`.

### Modelo das release notes (`ai/docs/releases/Release_CommitCloud.md`)

```markdown
# v0.3.0 — Palco Afinado

O Painel do Técnico agora abre sozinho e mostra tudo o que está acontecendo no palco.

## ✨ Novidades
- **[TÉCNICO] Painel do Técnico:** mostra os endereços para os músicos e quantas pessoas estão conectadas.

## 🔧 Melhorias
- **[MÚSICO] App do Músico:** ícones dos instrumentos para achar o grupo mais rápido.

## 🐛 Correções
- **[TÉCNICO] Servidor:** o programa não fecha mais sozinho quando já existe outro aberto.

## 📥 Como instalar
1. Baixe o `can-hear-myself.exe` abaixo e coloque numa pasta (ex.: `C:\CanHearMyself`).
2. Dê dois cliques. Se o Windows avisar "editor desconhecido": **Mais informações → Executar assim mesmo**.
3. O Painel do Técnico abre sozinho. Os músicos acessam o endereço mostrado no painel, na mesma rede Wi-Fi da mesa.

## ⚠️ Atenção
- (Só se houver) mudanças que exigem refazer o mapeamento de canais ou que apagam presets.
```

Regras das notas: mesma linguagem do changelog (seção 5), começar pelo que o usuário ganha, sem nomes de arquivo, e sempre incluir "Como instalar".

---

## 9. Pós-publicação

1. Conferir em `https://github.com/escola-jnv/can-hear-myself/releases` que a release aparece com o `.exe` anexado e baixável.
2. Baixar o `.exe` da própria release e abrir uma vez (confirma que o arquivo publicado não está corrompido).
3. **Se algo falhou** (push rejeitado, release sem `.exe`, `.exe` quebrado):
   - 🛑 **não** subir a versão;
   - corrigir e comitar mantendo a mesma versão: `v0.3.0 [build] fix: <causa>`;
   - recriar a release (`gh release delete v0.3.0 --cleanup-tag` só com confirmação do usuário) e publicar de novo.
4. **Só depois da release OK**, abrir o próximo ciclo:
   - versão PATCH seguinte no quarteto (`0.3.0` → `0.3.1`), com `docs/changelogs/0.3.1.json` vazio (`items: []`);
   - commit: `v0.3.1 [infraestrutura] chore: incrementa versao para v0.3.1 apos release v0.3.0`.

---

## Resumo de uma linha

**Local:** versão PATCH → quarteto → changelog → `git status -s` → `npm test` → commit `vX.Y.Z [modulo] tipo: descricao`.
**Release:** gatekeeper (testes, rotas, build e teste do `.exe`) → tag `vX.Y.Z` → push → GitHub Release `vX.Y.Z — Nome` com o `.exe` → só então abre o próximo PATCH.
