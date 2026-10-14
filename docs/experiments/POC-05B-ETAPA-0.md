# POC-05B — Etapa 0: Gate de compatibilidade do Antigravity IDE

## Objetivo

Validar que uma extensão TypeScript mínima pode usar, dentro do Antigravity IDE, somente as APIs públicas compatíveis com VS Code necessárias às próximas etapas da ponte local.

Esta etapa não implementa Named Pipe, Native Messaging Host, comunicação com Chrome, alteração do Registro, acesso a páginas web ou execução arbitrária de comandos.

## Implementação

A extensão isolada está em `experiments/antigravity-extension-probe/` e registra somente o comando **`Argonauta: Check Compatibility`**.

O comando produz resultados `pass`, `fail` ou `unsupported` para:

- `vscode.commands.registerCommand`;
- `vscode.window.showInformationMessage`;
- `vscode.window.withProgress`;
- `ExtensionContext.secrets`, incluindo gravação, leitura e remoção de valor temporário;
- `ExtensionContext.globalStorageUri`, sem revelar o caminho;
- runtime Node.js local;
- importação de `node:net` e `node:crypto`;
- `extensionKind: ["ui"]` em Extension Host desktop, local e não remoto.

O relatório registra apenas o nome público da IDE, a versão do editor/API exposta por `vscode.version`, a faixa de API declarada no manifesto, a versão do runtime Node.js, o tipo de interface e o estado local/remoto. Não coleta caminhos, usuário, PID, variáveis de ambiente, identificadores de máquina ou conteúdo do workspace.

## Evidências automatizadas

Ambiente de compilação observado em 14/10/2026:

| Item | Evidência | Resultado |
|---|---|---|
| Antigravity instalado | Produto 2.5.5; base/API 1.107.0 | `pass` para inspeção da instalação; runtime da extensão ainda requer teste manual |
| Dependências do probe | TypeScript 5.9.3, `@types/vscode` 1.107.0 e `@types/node` 20.19.43 | `pass` |
| Compilação estrita | `npm test` executou `tsc -p tsconfig.json` | `pass` |
| Testes do probe | 7 aprovados, 0 falhas | `pass` |
| Auditoria npm | 5 pacotes auditados, 0 vulnerabilidades conhecidas | `pass` |
| Regressão da POC-05A | 13 aprovados, 0 falhas | `pass` |

Os testes automatizados cobrem estados do relatório, minimização de erros, bloqueio de caminhos pessoais e de rede, resumo, `extensionKind` e a contribuição exclusiva do comando autorizado.

## Validação manual pendente

A validação manual não foi inferida a partir da instalação ou dos testes de unidade. Ela deverá ser executada no Antigravity IDE conforme o roteiro do `README.md` do experimento.

Após executar **`Argonauta: Check Compatibility`**, registrar cada capacidade exclusivamente como:

- `pass`: API disponível e operação concluída;
- `fail`: API disponível, mas a operação falhou;
- `unsupported`: API pública ausente no host.

Critérios para aprovar a Etapa 0:

1. a extensão carrega em uma nova janela do próprio Antigravity;
2. o comando aparece na paleta e executa;
3. a notificação de progresso e as mensagens informativas funcionam;
4. todas as capacidades obrigatórias são registradas como `pass`;
5. o relatório mostra execução desktop, local e não remota;
6. o relatório não contém caminhos ou identificadores sensíveis.

Qualquer `fail` ou `unsupported` em uma capacidade obrigatória bloqueia o avanço para a Etapa 1 até análise explícita.

## Estado

**Testes automatizados:** `pass`.

**Validação no Extension Host do Antigravity:** pendente de execução manual.

**Decisão sobre a Etapa 1:** bloqueada até a validação manual e nova aprovação do responsável pelo projeto.
