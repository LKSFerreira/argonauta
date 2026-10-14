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
| `.github/workflows/validation.yml` | Configuração revisada localmente; execução remota `pending_ci_execution` até commit e push autorizados. |

As fixtures permaneceram byte a byte idênticas:

| Fixture | SHA-256 |
|---|---|
| `ping-v1-windows-le.bin` | `414061fd7df7c40fa1686903b5a1781636042c75fd858383c45c39973b2328cd` |
| `pong-v1-windows-le.bin` | `4c9bbe64c0dc3fc163a9200dfbf45d9de65e20d121dafa9d4017087dc84af392` |

## Validação manual pendente

O Native Messaging Host registrado em `HKCU` usa um caminho absoluto. A migração não executou scripts de instalação e não alterou o Registro do Windows. Posteriormente, o mantenedor executou manualmente a desinstalação e a instalação no novo caminho, ambas concluídas com sucesso. A confirmação PING/PONG após essa troca permanece `pending_manual_validation`.

Para repetir a validação manual:

1. Carregue `tools/native-messaging-smoke/extension` como extensão não empacotada no Chrome.
2. Execute manualmente `tools/native-messaging-smoke/native-host/windows/install-host.ps1` e confirme a operação quando solicitado.
3. Abra o popup e selecione **Test Connection**.
4. Confirme a resposta PONG com protocolo `1.0`.
5. Se desejar remover o registro de teste, execute manualmente `uninstall-host.ps1`.

Para repetir o gate no Antigravity IDE:

1. Abra `tools/compatibility-probe/` no Antigravity IDE.
2. Execute `npm run compilar` pelo workspace.
3. Inicie **Executar probe no Antigravity** em **Run and Debug**.
4. Na nova janela, execute **Argonauta: Check Compatibility**.
5. Confirme o encerramento do progresso, as nove verificações e a limpeza do segredo temporário.

O roteiro detalhado e os identificadores de diagnóstico estão em `tools/compatibility-probe/README.md`. Como os arquivos de entrada e o campo `main` foram renomeados, essa repetição permanece `pending_manual_validation`.

O rollback do host está documentado em `docs/validation/POC-05A.md`. Ele exige desinstalação manual, retorno ao checkout anterior e instalação manual do manifesto antigo.

## Limites preservados

- Nenhuma implementação de Named Pipes, autenticação HMAC ou host da Etapa 2 foi adicionada.
- Nenhuma credencial, sessão, cookie ou conteúdo do Gemini Web foi acessado.
- Nenhum comando arbitrário recebido do navegador foi habilitado.
- Nenhum commit, push ou Pull Request foi criado.

## Estado do Git e próximos passos

- Branch: `refactor/monorepo-typescript`.
- Nenhum commit local foi criado e nenhum conteúdo foi publicado.
- Arquivos históricos foram preservados por renomeações detectáveis pelo Git.
- Artefatos ignorados que restaram sob o antigo `experiments/` foram removidos depois de confirmar que continham somente `dist`, `node_modules` e diretórios vazios.

Antes da Etapa 2:

1. executar o workflow em um commit/PR somente após autorização;
2. repetir o probe no Antigravity IDE;
3. repetir **Test Connection** no Chrome e confirmar PONG;
4. revisar o diff arquitetural independentemente;
5. obter aprovação explícita para qualquer implementação de IPC.
