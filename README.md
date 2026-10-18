# Atlas Médico

Buscador pessoal de literatura médica no PubMed. A versão 2 substitui o antigo dashboard estático por uma aplicação responsiva com autenticação no servidor, estratégia de pesquisa visual, catálogo de revistas validado pela NLM, resumos sob demanda e exportação HTML interativa.

## Recursos

- termos em formato de tags com `AND`, `OR`, `NOT`, frase exata e campo PubMed;
- múltiplos autores e catálogo completo de revistas citadas no PubMed, com busca por nome, abreviação, ISSN ou organização conhecida;
- datas livres e atalhos de 30 dias, 6 meses, 1 ano e 5 anos;
- filtro de texto completo gratuito disponível agora;
- exclusão padrão de erratas, avisos de retratação e expressões de preocupação, com controle para reativá-los;
- paginação real e ordenação global no PubMed;
- ordenação local por qualquer coluna, densidade e colunas ajustáveis;
- resumo sob demanda e abertura de todos os resumos da página;
- buscas salvas no navegador;
- exportação `.html` independente, pesquisável, ordenável, ajustável e pronta para impressão;
- sessão `HttpOnly` com encerramento após duas horas sem atividade.

## Desenvolvimento

Requisitos: Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Para visualizar a interface sem configurar o servidor, abra `http://localhost:4173/?preview=1`. Esse modo existe apenas no desenvolvimento e usa resultados demonstrativos.

Para testar a aplicação completa localmente, instale a CLI da Vercel e use `vercel dev` com um arquivo `.env` baseado em `.env.example`.

## Configuração segura na Vercel

Crie um projeto Vercel importando este repositório e cadastre as variáveis abaixo em **Settings → Environment Variables**:

| Variável | Uso |
|---|---|
| `ADMIN_USERNAME` | nome do único usuário |
| `ADMIN_PASSWORD` | senha protegida pela Vercel; alternativa prática ao hash |
| `ADMIN_PASSWORD_HASH` | hash scrypt; nunca use a senha em texto puro |
| `SESSION_SECRET` | segredo aleatório com pelo menos 32 caracteres |
| `NCBI_API_KEY` | chave NCBI opcional, recomendada |
| `NCBI_TOOL` | identificador da aplicação, por exemplo `atlas-medico` |
| `NCBI_EMAIL` | e-mail técnico informado à NCBI |

Gere o hash da senha em um terminal local:

```bash
npm run auth:hash
```

O comando oculta a digitação e imprime somente o hash. Quando `ADMIN_PASSWORD_HASH` está presente, ele tem precedência sobre `ADMIN_PASSWORD`. A senha citada em conversas ou versões anteriores deve ser trocada periodicamente.

## Catálogo de revistas

`data/journal-seed.json` guarda nomes e aliases da curadoria histórica. O arquivo `src/data/journals.generated.ts` contém o catálogo completo `J_Entrez` da National Library of Medicine, atualizado diariamente e com todos os títulos citados no PubMed:

```bash
npm run catalog:build
```

Itens históricos que não puderem ser associados aparecem em `data/unmatched-journals.json`; isso não limita o catálogo oficial completo, apenas os aliases adicionais.

## Verificação

```bash
npm test
npm run build
```

## Arquitetura

- React + TypeScript + Vite no front-end;
- Vercel Functions em `/api` para autenticação e comunicação com a NCBI;
- sem Supabase: não há dados de múltiplos usuários nem necessidade de banco neste momento;
- nenhum segredo é enviado ao navegador ou versionado no Git.
