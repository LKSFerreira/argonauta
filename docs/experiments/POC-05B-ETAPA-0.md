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
| Antigravity instalado | Produto 2.5.5; base/API 1.107.0 | `pass` para inspeção da instalação e, posteriormente, para a validação manual final |
| Dependências do probe | TypeScript 5.9.3, `@types/vscode` 1.107.0 e `@types/node` 20.19.43 | `pass` |
| Compilação estrita | `npm test` executou `tsc -p tsconfig.json` | `pass` |
| Compilação isolada após o diagnóstico | `npm run compilar` terminou com código de saída zero | `pass` |
| Testes do probe | 11 aprovados, 0 falhas | `pass` |
| Auditoria npm | 5 pacotes auditados, 0 vulnerabilidades conhecidas | `pass` |
| Regressão da POC-05A | 13 aprovados, 0 falhas | `pass` |

Os testes automatizados cobrem timeout de Promise pendente, cancelamento, limpeza imediata e tardia do `SecretStorage`, bloqueio de caminhos pessoais e de rede, resumo do relatório, `extensionKind` e a contribuição exclusiva do comando autorizado.

## Diagnóstico do travamento observado

O Antigravity carregou a extensão e iniciou o comando, mas a notificação **Validando APIs públicas…** permaneceu aberta e o relatório não foi produzido.

Na implementação anterior, `showInformationMessage` era executado e aguardado dentro do callback de `withProgress`. A API retorna uma Promise que somente conclui quando a mensagem é selecionada ou dispensada. Como o callback do progresso só termina quando todas as Promises internas terminam, a espera da mensagem podia manter o próprio progresso aberto indefinidamente.

A ordem anterior era:

1. iniciar `withProgress`;
2. aguardar `showInformationMessage` dentro do progresso;
3. somente depois testar `ExtensionContext.secrets`;
4. emitir o relatório apenas após o encerramento do progresso.

Portanto, enquanto a mensagem permanecia pendente, `secrets.store`, `secrets.get` e `secrets.delete` ainda não eram chamados. A execução anterior não possuía logs por etapa, então não é correto apresentar um log runtime retroativo. A causa foi identificada pelo encadeamento real dos `await`, pelo contrato público da API e pelo estado visível informado pelo mantenedor.

### Correção

- `showInformationMessage` passou a executar somente depois que `withProgress` termina;
- a mensagem possui ação **Confirmar** e timeout de 15 segundos;
- o progresso é cancelável e possui limite global de 30 segundos;
- cada operação assíncrona possui timeout de 5 segundos e diagnóstico antes/depois;
- timeout e exceção são `fail`; API ausente é `unsupported`;
- uma segunda execução concorrente é rejeitada;
- cancelamento é propagado por `AbortController`;
- o callback do progresso encerra listeners em `finally`;
- `SecretStorage` usa uma única chave temporária conhecida, com limpeza inicial, final, no encerramento e após conclusão tardia de `store`;
- o título do manifesto foi alterado para `Check Compatibility`, mantendo a categoria `Argonauta`, para a paleta exibir apenas **Argonauta: Check Compatibility**.

`Promise.race` ou um timeout equivalente não cancela a Promise original. Por isso, se `secrets.store` exceder o limite, a extensão tenta a remoção imediatamente e agenda outra remoção quando a Promise original finalmente concluir. A chave fixa também é verificada no início da próxima execução e durante a desativação.

## Validação manual final

O mantenedor executou o fluxo completo após a correção diretamente no Antigravity IDE e aprovou a Etapa 0 com **9 verificações `pass`, 0 `fail` e 0 `unsupported`**. Essa evidência foi fornecida como resultado final da validação manual; este repositório não contém um log runtime bruto dessa execução e, por isso, nenhum log retroativo é reproduzido aqui.

Após executar **`Argonauta: Check Compatibility`**, registrar cada capacidade exclusivamente como:

- `pass`: API disponível e operação concluída;
- `fail`: API disponível, mas a operação falhou;
- `unsupported`: API pública ausente no host.

Os critérios usados para aprovar a Etapa 0 foram:

1. a extensão carrega em uma nova janela do próprio Antigravity;
2. o comando aparece na paleta e executa;
3. a notificação de progresso encerra antes da mensagem informativa;
4. todas as capacidades obrigatórias são registradas como `pass`;
5. o relatório mostra execução desktop, local e não remota;
6. o relatório não contém caminhos ou identificadores sensíveis.

Nenhuma capacidade obrigatória foi classificada como `fail` ou `unsupported`.

## Estado

**Testes automatizados:** `pass`.

**Carregamento e registro do comando no Antigravity:** `pass`.

**Fluxo completo após a correção:** `pass` — 9 verificações aprovadas, 0 falhas e 0 capacidades sem suporte.

**Decisão sobre a Etapa 1:** autorizada explicitamente pelo responsável pelo projeto após a aprovação manual da Etapa 0.
