# Teste manual — Chrome Native Messaging

## Objetivo

Confirmar, após a reorganização dos diretórios, que a extensão Chrome Manifest V3 envia um `PING` ao Native Messaging Host local e recebe um `PONG` válido pelo protocolo `1.0`.

## Pré-requisitos

- Windows com Google Chrome.
- Node.js 20 ou superior disponível no `PATH` herdado pelo Chrome.
- Dependências do monorepo instaladas com `npm ci`.
- Extensão localizada em `tools/native-messaging-smoke/extension`.
- Identificador esperado da extensão: `kmhnfligldbfbjmdmodckpmbnfmehfba`.

## Cuidados de segurança

- Os scripts de instalação e desinstalação alteram somente a chave do host no usuário atual (`HKCU`) e exigem confirmação textual.
- Revise o caminho apresentado pelo script antes de confirmar.
- Não execute o teste com um identificador de extensão diferente do esperado.
- O teste não deve acessar páginas web, cookies, credenciais, tokens ou sessões.

## Preparação

1. Na raiz do repositório, execute os testes automatizados do componente:

   ```powershell
   npm --workspace @argonauta/native-messaging-smoke test
   ```

2. Abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor**.
4. Se uma cópia antiga estiver carregada a partir de `experiments/`, remova-a.
5. Selecione **Carregar sem compactação** e escolha `tools/native-messaging-smoke/extension`.
6. Confirme que o Chrome mostra exatamente o identificador `kmhnfligldbfbjmdmodckpmbnfmehfba`.
7. Na raiz do repositório, execute:

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/native-messaging-smoke/native-host/windows/install-host.ps1
   ```

8. Confira o manifesto e a chave exibidos. Digite `INSTALAR` somente se ambos estiverem corretos.
9. Reinicie o Chrome caso ele já estivesse aberto antes da atualização do registro ou do `PATH` do Node.js.

## Execução

1. Em `chrome://extensions`, selecione **Recarregar** na extensão Argonauta.
2. Abra o popup da extensão.
3. Selecione **Test Connection** uma única vez.
4. Aguarde a resposta do Native Messaging Host.
5. Confirme os seguintes valores:
   - tipo da resposta: `PONG`;
   - versão do protocolo: `1.0`;
   - versão do host: `0.1.0`;
   - identificador da resposta correspondente ao `PING` enviado;
   - ausência de erro no popup.

## Critérios de aceitação

| Critério | Resultado esperado |
|---|---|
| Extensão carregada pelo novo caminho | `pass` |
| Identificador exato da extensão | `pass` |
| Registro aponta para o manifesto em `tools/native-messaging-smoke` | `pass` |
| Popup envia o `PING` | `pass` |
| Host responde `PONG` com protocolo `1.0` | `pass` |
| Processo termina sem erro visível | `pass` |

O teste geral é `pass` somente quando todos os critérios forem aprovados. Falha de operação presente é `fail`; recurso indisponível no ambiente é `unsupported` e deve incluir a justificativa.

## Diagnóstico de falhas

- Confirme que o Chrome carregou a extensão pelo novo diretório.
- Confirme que o identificador da extensão não mudou.
- Confirme que `node --version` funciona em um novo terminal.
- Reexecute o instalador e revise o caminho absoluto mostrado antes de confirmar.
- Reinicie o Chrome para renovar o ambiente herdado pelo processo nativo.
- Inspecione erros da extensão em `chrome://extensions`, sem registrar informações pessoais.

## Limpeza opcional

Para remover somente o registro do host de teste:

```powershell
powershell -ExecutionPolicy Bypass -File tools/native-messaging-smoke/native-host/windows/uninstall-host.ps1
```

Revise a chave exibida e digite `DESINSTALAR` para confirmar. A remoção da extensão deve ser feita separadamente em `chrome://extensions`.

## Registro da execução

| Campo | Valor |
|---|---|
| Data | 14/10/2026 |
| Plataforma | Windows, sem identificadores do dispositivo |
| Commit testado | `ff438dd` |
| Resultado geral | `pass` |
| Extensão | Argonauta — POC-05A `0.1.0` |
| Identificador | `kmhnfligldbfbjmdmodckpmbnfmehfba` |
| Evidência | Popup exibiu **PONG recebido · protocolo 1.0 · host 0.1.0** após o registro manual do host no novo caminho. |

As versões completas do Chrome, Windows e Node.js não foram incluídas na evidência fornecida e, portanto, não são inferidas neste registro.
