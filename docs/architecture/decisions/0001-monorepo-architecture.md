# ADR-0001 — Arquitetura do monorepo TypeScript

## Status

Aceita em 14 de outubro de 2026.

## Contexto

Os experimentos iniciais estavam agrupados por POC, embora parte do código já representasse contratos reutilizáveis. A estrutura também permitia que o pacote de contratos utilizasse o TypeScript e os tipos Node.js instalados dentro do probe de compatibilidade.

O Native Messaging Host registrado no Windows referencia um manifesto por caminho absoluto. Mover a ferramenta invalida esse registro até que o mantenedor reinstale manualmente o host no novo caminho.

## Problema

Era necessário separar aplicações futuras, bibliotecas reutilizáveis, ferramentas de diagnóstico, testes entre componentes e documentação sem promover protótipos a produtos nem alterar os contratos binários aprovados.

## Alternativas avaliadas

1. Manter tudo em `experiments/`: menor diff imediato, mas preservaria nomes temporários e dependências frágeis.
2. Mover todos os protótipos para `apps/`: estrutura visualmente simples, porém comunicaria uma maturidade de produto inexistente.
3. Adotar Nx, Turborepo ou Lerna: forneceria orquestração adicional, mas aumentaria a superfície de dependências sem necessidade atual.
4. Usar npm workspaces e separar `packages/`, `tools/` e `tests/`: atende aos limites reais com ferramentas nativas.

## Decisão

O Argonauta adota um monorepo TypeScript baseado em npm workspaces.

- `apps/` será criado somente quando existirem aplicações distribuíveis aprovadas.
- `packages/` conterá bibliotecas reutilizáveis e independentes.
- `tools/` conterá probes e ferramentas de validação que não são produtos.
- `tests/integration/` conterá cenários que atravessam mais de um workspace.
- `docs/` separará arquitetura, desenvolvimento, produto, segurança e evidências.
- `scripts/` conterá verificações compartilhadas; scripts específicos permanecem próximos do componente.

Diretórios, módulos e arquivos técnicos usam inglês e kebab-case. Textos narrativos, mensagens ao usuário e conceitos de domínio permanecem em pt-BR, salvo contratos externos.

## Justificativa

npm workspaces elimina o acoplamento entre instalações locais, preserva o npm já adotado e permite execução global ou isolada. A separação entre `packages` e `tools` evita que código de domínio dependa de Chrome, Windows ou Antigravity IDE.

## Consequências

- Os contratos da POC-05B passam a compor `@argonauta/protocol`.
- O teste de compatibilidade POC-05A ↔ protocolo passa a `tests/integration` e usa imports por pacote.
- Probes continuam em `tools/` e não são apresentados como aplicações finais.
- Configurações TypeScript comuns são centralizadas em `tsconfig.base.json`.
- A linha de base de 77 testes deve permanecer aprovada.
- O Registro do Windows nunca é alterado automaticamente.

## Riscos

- Instalações antigas do Native Messaging deixam de funcionar depois da remoção do caminho anterior.
- Imports ou documentação podem manter referências à estrutura legada.
- A orquestração simples por npm poderá precisar evoluir quando houver aplicações distribuíveis, sem justificar antecipadamente um framework adicional.

Os controles são reinstalação manual documentada, verificação de referências, CI em Windows, hashes congelados e regressão integral.
