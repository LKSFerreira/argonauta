# Validação da migração para monorepo TypeScript

## Escopo

A migração reorganiza o código já validado sem iniciar a Etapa 2 da POC-05B e sem alterar os contratos públicos do protocolo `1.0`.

| Origem | Destino | Responsabilidade |
|---|---|---|
| `experiments/poc-05b-contratos` | `packages/protocol` | Contratos e enquadramento reutilizáveis. |
| `experiments/antigravity-extension-probe` | `tools/compatibility-probe` | Gate de compatibilidade do Antigravity IDE. |
| `experiments/chrome-native-bridge` | `tools/native-messaging-smoke` | Teste de fumaça do Chrome Native Messaging. |
| `docs/experiments` | `docs/validation` e `docs/architecture` | Evidências e desenho técnico separados. |
| `PRD.md`, `ROADMAP.md` e `HISTORY.md` | Mantidos na raiz | Pontos de entrada operacionais e históricos do repositório. |

## Dependências e orquestração

A raiz usa npm workspaces somente como mecanismo nativo de organização. Nenhum framework adicional de monorepo, lint ou formatação foi introduzido.

O pacote `@argonauta/protocol` declara diretamente TypeScript e os tipos Node.js que consome. Isso remove a dependência implícita do `node_modules` pertencente ao probe de compatibilidade.

## Evidências automatizadas

Validação executada em 14 de outubro de 2026:

| Verificação | Resultado |
|---|---|
| `npm install` | Workspaces e lockfile sincronizados; 0 vulnerabilidades. |
| `npm run compilar` | Código de saída 0; TypeScript estrito aprovado em `protocol`, `compatibility-probe` e testes de integração. |
| `npm test` | 77 aprovados e 0 falhas: protocolo 46, integração 7, probe 11 e Native Messaging 13. |
| `npm audit --audit-level=high` | 0 vulnerabilidades. |
| `git diff --check` | Código de saída 0. |
| `.github/workflows/validation.yml` | `pass`: execução remota **Validação #1** concluída na `main`, commit `ff438dd`, em 14/10/2026, com duração de 50 segundos. |

O GitHub Actions emitiu um aviso não bloqueante informando que o runtime interno Node.js 20 das versões fixadas de `actions/checkout` e `actions/setup-node` foi executado em Node.js 24. O job permaneceu aprovado; o aviso deve ser acompanhado em futura atualização das actions.

As fixtures permaneceram byte a byte idênticas:

| Fixture | SHA-256 |
|---|---|
| `ping-v1-windows-le.bin` | `414061fd7df7c40fa1686903b5a1781636042c75fd858383c45c39973b2328cd` |
| `pong-v1-windows-le.bin` | `4c9bbe64c0dc3fc163a9200dfbf45d9de65e20d121dafa9d4017087dc84af392` |

## Validação manual após a migração

O Native Messaging Host registrado em `HKCU` usa um caminho absoluto. A migração não executou scripts de instalação e não alterou o Registro do Windows. Posteriormente, o mantenedor executou manualmente a desinstalação e a instalação no novo caminho, ambas concluídas com sucesso.

Em 14/10/2026, a repetição manual pelo novo caminho foi aprovada: a extensão `0.1.0`, com identificador `kmhnfligldbfbjmdmodckpmbnfmehfba`, exibiu **PONG recebido · protocolo 1.0 · host 0.1.0**. O roteiro e o registro sanitizado estão em [Chrome Native Messaging](manual-tests/01_chrome-native-messaging.md).

Os procedimentos reproduzíveis estão separados por aplicação:

- [Chrome Native Messaging](manual-tests/01_chrome-native-messaging.md);
- [compatibilidade com o Antigravity IDE](manual-tests/02_antigravity-compatibility.md).

As duas repetições após a migração estão aprovadas. No Antigravity IDE, o relatório terminou com 9 `pass`, 0 `fail` e 0 `unsupported`; o progresso e a mensagem informativa foram concluídos e a limpeza final confirmou a ausência do segredo temporário.

O rollback do host está documentado em `docs/validation/POC-05A.md`. Ele exige desinstalação manual, retorno ao checkout anterior e instalação manual do manifesto antigo.

## Limites preservados

- Nenhuma implementação de Named Pipes, autenticação HMAC ou host da Etapa 2 foi adicionada.
- Nenhuma credencial, sessão, cookie ou conteúdo do Gemini Web foi acessado.
- Nenhum comando arbitrário recebido do navegador foi habilitado.
- A migração foi integrada à `main` e publicada; nenhum Pull Request foi necessário no fluxo individual adotado pelo mantenedor.

## Estado do Git e próximos passos

- Branch integrada: `refactor/monorepo-typescript`.
- A `main` local e `origin/main` estão sincronizadas no commit `9a04ed3`.
- Arquivos históricos foram preservados por renomeações detectáveis pelo Git.
- Artefatos ignorados que restaram sob o antigo `experiments/` foram removidos depois de confirmar que continham somente `dist`, `node_modules` e diretórios vazios.

Antes da Etapa 2:

1. revisar e consolidar a documentação da migração;
2. obter aprovação explícita antes de qualquer implementação de IPC.
