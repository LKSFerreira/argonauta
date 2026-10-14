# Argonauta — Gate de compatibilidade do Antigravity IDE

Extensão mínima da **POC-05B / Etapa 0**. Ela valida as APIs públicas necessárias para uma futura ponte local sem implementar Named Pipe, Native Messaging Host, acesso ao Chrome ou execução arbitrária de comandos.

## Escopo

O comando **`Argonauta: Check Compatibility`** verifica:

- registro e execução de comandos;
- `showInformationMessage` e `withProgress`;
- operações temporárias de gravação, leitura e remoção em `ExtensionContext.secrets`;
- disponibilidade de `globalStorageUri`, sem ler ou mostrar seu caminho;
- presença do runtime Node.js local;
- importação de `node:net` e `node:crypto`;
- versões expostas pela API pública da IDE e pelo runtime;
- execução desktop, local e não remota com `extensionKind: ["ui"]`.

Cada verificação retorna `pass`, `fail` ou `unsupported`. O relatório não coleta caminhos, usuário, PID, variáveis de ambiente, dados do workspace, credenciais ou sessões.

O canal **Argonauta — Diagnóstico de Compatibilidade** registra cada operação assíncrona com identificador, início e desfecho. Operações que não concluem são classificadas como `fail` após o timeout; APIs ausentes são classificadas como `unsupported`.

## Dependências e testes automatizados

No terminal integrado do Antigravity IDE, a partir deste diretório:

```powershell
npm install
npm test
```

O teste compila o TypeScript em modo estrito e valida:

- estados `pass`, `fail` e `unsupported`;
- timeout de uma Promise que nunca conclui;
- cancelamento explícito;
- limpeza imediata e tardia do valor temporário no `SecretStorage`;
- bloqueio de caminhos pessoais e de rede;
- resumo do relatório;
- declaração `extensionKind: ["ui"]`;
- contribuição exclusiva do comando autorizado.

## Teste manual no Antigravity IDE

O Antigravity instalado não expõe atualmente um comando `antigravity` no `PATH`. Use o próprio IDE para iniciar o Extension Development Host:

1. Abra `experiments/antigravity-extension-probe/` em uma janela do Antigravity IDE.
2. Execute `npm install` e `npm run compilar` no terminal integrado.
3. Abra **Run and Debug**.
4. Escolha **Executar probe no Antigravity**. A configuração usa apenas o depurador público `extensionHost` e abre uma nova janela do próprio Antigravity.
5. Na nova janela do Antigravity IDE, abra a paleta de comandos.
6. Execute **`Argonauta: Check Compatibility`**.
7. O canal **Output → Argonauta — Diagnóstico de Compatibilidade** deverá abrir imediatamente e começar com `[CTRL-00-COMANDO] [INICIO]`.
8. Confirme que a notificação de progresso termina. Ela pode ser cancelada pelo usuário e possui limite global de 30 segundos.
9. Depois que o progresso fechar, a mensagem **Argonauta: confirme o funcionamento da mensagem informativa.** deverá aparecer. Clique em **Confirmar** em até 15 segundos.
10. Confirme que o canal contém `[CTRL-00-COMANDO] [PASS] Relatório final emitido.` e termina com a confirmação `SEC-80-LIMPEZA-ENCERRAMENTO`.
11. Confirme que as nove verificações mostram `pass`. Registre como `unsupported` uma API ausente e como `fail` uma API presente cuja operação falhe ou exceda o timeout.
12. Confirme que o relatório contém apenas nome e versões do host, versão do Node.js, tipo de interface, estado local/remoto e resultados das capacidades.

### Como localizar uma falha

Os principais identificadores são:

| Identificador | Operação |
|---|---|
| `API-20-NODE-NET` | importação de `node:net` |
| `API-30-NODE-CRYPTO` | importação de `node:crypto` |
| `SEC-10-LIMPEZA-INICIAL` | remoção de eventual valor temporário anterior |
| `SEC-20-STORE` | `secrets.store` |
| `SEC-30-GET` | `secrets.get` |
| `SEC-40-LIMPEZA-FINAL` | `secrets.delete` |
| `API-80-WITH-PROGRESS` | `withProgress` completo |
| `API-90-MENSAGEM-INFORMATIVA` | `showInformationMessage`, executado após o progresso |

Se a execução não terminar, copie as últimas linhas do canal. A última etapa com `INICIO` sem `PASS`, `FAIL`, `TIMEOUT` ou `CANCELADO` identifica a chamada pendente.

Não use VS Code para esta validação. O resultado somente comprova compatibilidade após o comando ser executado no Antigravity IDE real.

## Resultado atual

| Verificação | Resultado | Evidência |
|---|---|---|
| Compilação TypeScript | `pass` | TypeScript 5.9.3 em modo estrito |
| Compilação isolada | `pass` | `npm run compilar` terminou com código zero após a correção |
| Testes automatizados | `pass` | 11/11 testes aprovados após a correção do travamento |
| Regressão da POC-05A | `pass` | 13/13 testes originais aprovados em 14/10/2026 |
| Carregamento no Antigravity IDE | `pass` | Confirmado manualmente pelo mantenedor em 14/10/2026 |
| Comando na paleta | `pass` | Confirmado manualmente; duplicação do título corrigida no manifesto |
| Comando e APIs após a correção | Pendente de nova validação manual | Repetir o roteiro e registrar o canal de diagnóstico |

Resultados manuais não são inferidos a partir dos testes automatizados.
