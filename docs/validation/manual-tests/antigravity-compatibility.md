# Teste manual — compatibilidade com o Antigravity IDE

## Objetivo

Confirmar, após a reorganização dos diretórios e a alteração do entrypoint compilado, que a extensão de diagnóstico carrega no Antigravity IDE e que o comando **Argonauta: Check Compatibility** conclui todas as verificações públicas necessárias.

## Pré-requisitos

- Antigravity IDE instalado.
- Node.js 20 ou superior e npm.
- Dependências do monorepo instaladas com `npm ci`.
- Workspace `tools/compatibility-probe` compilado sem erros.

O VS Code não deve ser instalado nem usado nesta validação.

## Preparação

1. Na raiz do repositório, execute:

   ```powershell
   npm --workspace @argonauta/compatibility-probe run compilar
   npm --workspace @argonauta/compatibility-probe test
   ```

2. Confirme que ambos os comandos terminam com código de saída zero.
3. Abra `tools/compatibility-probe/` em uma janela do Antigravity IDE.
4. Pressione `F5`. Como **Executar probe no Antigravity** normalmente já é a configuração padrão, isso deve iniciar diretamente a extensão.
5. Se nenhuma execução começar ou outra configuração estiver selecionada, abra **Run and Debug**, escolha **Executar probe no Antigravity** e pressione `F5` novamente.
6. Confirme que uma nova janela do próprio Antigravity IDE é aberta como Extension Development Host.

## Execução

1. Na nova janela, abra a paleta de comandos.
2. Confirme que aparece somente **Argonauta: Check Compatibility**, sem o prefixo duplicado.
3. Execute o comando.
4. Confirme que o canal **Output → Argonauta — Diagnóstico de Compatibilidade** abre e registra `[CTRL-00-COMANDO] [INICIO]`.
5. Aguarde a finalização da notificação de progresso. O limite global é de 30 segundos.
6. Quando solicitado, selecione **Confirmar** na mensagem informativa em até 15 segundos.
7. Confirme que o canal registra `[CTRL-00-COMANDO] [PASS] Relatório final emitido.`.
8. Confirme que a limpeza termina com `SEC-80-LIMPEZA-ENCERRAMENTO`.
9. Confirme que o relatório não apresenta caminhos pessoais, conteúdo do workspace, usuário, PID, credenciais ou valores armazenados em `SecretStorage`.

## Verificações esperadas

O relatório deve classificar cada item como `pass`, `fail` ou `unsupported`:

| Capacidade | Resultado esperado |
|---|---|
| `vscode.commands.registerCommand` | `pass` |
| `showInformationMessage` | `pass` |
| `withProgress` | `pass` |
| `ExtensionContext.secrets` | `pass` |
| `globalStorageUri` | `pass` |
| Runtime Node.js local | `pass` |
| Importação de `node:net` | `pass` |
| Importação de `node:crypto` | `pass` |
| `extensionKind: ["ui"]` em host local | `pass` |

As versões efetivas da IDE, da API compatível com VS Code e do runtime Node.js devem aparecer, sem outros dados do ambiente.

## Critérios de aceitação

- A extensão carrega pelo novo caminho e pelo entrypoint `dist/src/extension.js`.
- O título do comando não aparece duplicado.
- A execução não fica indefinidamente pendente.
- As nove verificações terminam com estado explícito.
- O cenário esperado termina com 9 `pass`, 0 `fail` e 0 `unsupported`.
- O segredo temporário é removido inclusive depois de timeout ou cancelamento.
- Uma segunda execução simultânea é recusada de forma controlada.
- O relatório final permanece sanitizado.

## Diagnóstico de falhas

A última etapa com `INICIO` sem estado terminal identifica a chamada pendente. Preserve, quando aplicável, os seguintes identificadores:

| Identificador | Operação |
|---|---|
| `API-20-NODE-NET` | importação de `node:net` |
| `API-30-NODE-CRYPTO` | importação de `node:crypto` |
| `SEC-10-LIMPEZA-INICIAL` | limpeza de valor temporário anterior |
| `SEC-20-STORE` | `secrets.store` |
| `SEC-30-GET` | `secrets.get` |
| `SEC-40-LIMPEZA-FINAL` | `secrets.delete` |
| `API-80-WITH-PROGRESS` | conclusão de `withProgress` |
| `API-90-MENSAGEM-INFORMATIVA` | conclusão de `showInformationMessage` |

Não classifique timeout como sucesso. Use `fail` para uma API presente que falhe ou não conclua e `unsupported` somente quando a capacidade não estiver disponível.

## Registro da execução

| Campo | Valor |
|---|---|
| Data | 14/10/2026 |
| Antigravity IDE | API exposta `1.107.0` |
| Compatibilidade API declarada | `^1.85.0` |
| Node.js | `v22.21.1` |
| Interface | desktop, execução local e não remota |
| Commit testado | `ff438dd` |
| Resultado geral | `pass` |
| Resumo | 9 `pass`, 0 `fail`, 0 `unsupported` |
| Evidência | `CTRL-00-COMANDO` terminou em `PASS`; `API-80-WITH-PROGRESS` e `API-90-MENSAGEM-INFORMATIVA` concluíram; `SEC-80-LIMPEZA-ENCERRAMENTO` confirmou a ausência do valor temporário. |

O relatório confirmou separadamente `registerCommand`, `withProgress`, `showInformationMessage`, `ExtensionContext.secrets`, `globalStorageUri`, runtime Node.js local, importações de `node:net` e `node:crypto` e `extensionKind: ["ui"]`.
