# POC-05A — Chrome Native Messaging Bridge

## Objetivo

Comprovar comunicação bidirecional entre uma extensão Google Chrome Manifest V3 e um processo Node.js local usando exclusivamente a API oficial Chrome Native Messaging.

Esta prova de conceito é isolada da aplicação planejada do Argonauta. Ela não acessa páginas web, Gemini Web, cookies, credenciais, tokens ou sessões e não abre portas de rede.

## Estado

- **Implementação:** concluída e validada.
- **Teste automatizado:** aprovado em 14/10/2026 com Node.js 24.16.0 (13/13 testes).
- **Teste manual Chrome → host → Chrome:** APROVADO em 14/10/2026. O popup no Google Chrome recebeu resposta PONG válida do processo Node.js com protocolo 1.0, versão do host 0.1.0 e identificador da extensão correspondente (`kmhnfligldbfbjmdmodckpmbnfmehfba`).
- **Gate G3:** não decidido. Esta POC comprova o canal entre a extensão Chrome e o processo Node.js local; não comprova acesso programático ou integração ao Gemini Web.

## Arquitetura

```text
Popup da extensão MV3
  │ chrome.runtime.sendNativeMessage
  │ { tipo: "PING", idRequisicao, versaoProtocolo }
  ▼
Google Chrome
  │ stdin/stdout, sem rede
  │ [tamanho uint32 nativo][JSON UTF-8]
  ▼
Native Messaging Host Node.js
  │ valida origem, framing, JSON e operação
  │ { tipo: "PONG", idRequisicao, versaoProtocolo, versaoHost }
  ▼
Popup exibe o resultado
```

### Componentes

- `extension/`: extensão Chrome Manifest V3 com popup e somente a permissão `nativeMessaging`.
- `native-host/src/protocolo.mjs`: serialização e desserialização incremental do protocolo binário.
- `native-host/src/mensagens.mjs`: validação estrita de origem e contrato PING/PONG.
- `native-host/src/host.mjs`: processo stdio iniciado pelo Chrome.
- `native-host/windows/`: manifesto, launcher e scripts manuais de Registro para Windows.
- `tests/`: testes unitários e de integração do processo.

## Contrato de mensagens

Requisição:

```json
{
  "tipo": "PING",
  "idRequisicao": "UUID gerado pelo popup",
  "versaoProtocolo": "1.0"
}
```

Resposta:

```json
{
  "tipo": "PONG",
  "idRequisicao": "mesmo UUID da requisição",
  "versaoProtocolo": "1.0",
  "versaoHost": "0.1.0"
}
```

Qualquer outro tipo de operação é rejeitado. O host limita cada mensagem a 1 MiB, escreve mensagens de diagnóstico somente em `stderr` e reserva `stdout` exclusivamente ao protocolo.

## Identidade e permissões

- **Nome do host:** `com.argonauta.poc05a`
- **ID fixo da extensão:** `kmhnfligldbfbjmdmodckpmbnfmehfba`
- **Origem autorizada:** `chrome-extension://kmhnfligldbfbjmdmodckpmbnfmehfba/`
- **Permissão Chrome:** somente `nativeMessaging`
- **Content scripts:** nenhum
- **Host permissions:** nenhuma

O campo `key` do manifesto fixa o ID durante o carregamento local. Depois de carregar a extensão, confirme visualmente que o Chrome mostra exatamente o ID acima antes de registrar o host.

## Pré-requisitos

- Windows com Google Chrome.
- Node.js 20 ou superior disponível no `PATH` do processo do Chrome.
- Antigravity IDE ou outro terminal local para executar os comandos. O VS Code não é necessário.

## Testes automatizados

Na raiz do repositório:

```powershell
npm --prefix experiments/chrome-native-bridge test
```

Os testes cobrem:

- tamanho em bytes e codificação UTF-8;
- desserialização com chunks fragmentados e mensagens concatenadas;
- JSON inválido, tamanho excessivo e mensagem incompleta;
- validação do contrato PING/PONG;
- rejeição de operações não permitidas e origens diferentes;
- resposta binária e encerramento do processo após EOF.
- identidade derivada da chave pública, origem exata e ausência de permissões excedentes.

### Resultado registrado

```text
Testes: 13
Aprovados: 13
Falhas: 0
Node.js: 24.16.0
```

Também foram aprovadas as verificações de sintaxe dos módulos JavaScript, dos scripts PowerShell e dos dois manifestos JSON. Depois da instalação manual autorizada, o teste Chrome → host → Chrome foi aprovado em 14/10/2026, conforme o estado registrado no início deste documento.

## Instalação manual no Windows

> [!CAUTION]
> Os scripts abaixo alteram o Registro do Windows em `HKCU`. Eles não foram executados automaticamente. Leia-os antes da execução e confirme a operação apenas se concordar com a chave e o caminho apresentados.

1. Abra `chrome://extensions` no Google Chrome.
2. Ative o modo de desenvolvedor.
3. Escolha **Carregar sem compactação** e selecione:

   ```text
   experiments/chrome-native-bridge/extension
   ```

4. Confirme que o ID exibido é `kmhnfligldbfbjmdmodckpmbnfmehfba`.
5. No terminal aberto na raiz do repositório, execute manualmente:

   ```powershell
   powershell -ExecutionPolicy Bypass -File experiments/chrome-native-bridge/native-host/windows/instalar-host.ps1
   ```

6. Revise a chave e o caminho mostrados pelo script. Digite `INSTALAR` somente para autorizar a criação da chave:

   ```text
   HKCU\Software\Google\Chrome\NativeMessagingHosts\com.argonauta.poc05a
   ```

7. Recarregue a extensão no Chrome. Se o Chrome já estava aberto antes da configuração do Node.js no `PATH`, reinicie-o.

## Teste manual

1. Abra o popup da extensão **Argonauta — POC-05A**.
2. Clique em **Test Connection**.
3. Confirme que o popup apresenta `PONG recebido`, protocolo `1.0` e host `0.1.0`.
4. Abra o console do popup e confirme que não há erros de Native Messaging.
5. Registre data, versões do Chrome e Node.js, sistema operacional e resultado observado sem incluir dados pessoais.

## Desinstalação manual no Windows

Execute manualmente:

```powershell
powershell -ExecutionPolicy Bypass -File experiments/chrome-native-bridge/native-host/windows/desinstalar-host.ps1
```

Revise a chave mostrada e digite `DESINSTALAR` para autorizar sua remoção. Depois, remova a extensão em `chrome://extensions`.

O script remove somente a chave de Registro da POC-05A e não apaga arquivos do repositório.

## Critérios de aceitação

- [x] Extensão Manifest V3 isolada com somente `nativeMessaging`.
- [x] `allowed_origins` contém uma única origem exata e sem curingas.
- [x] Host Node.js implementa JSON UTF-8 com prefixo uint32 na ordem nativa de bytes.
- [x] PING/PONG preserva o identificador e informa versões do protocolo e do host.
- [x] Não há content scripts, acesso a páginas web, servidor, porta de rede ou execução arbitrária.
- [x] Testes automatizados aprovados no ambiente local.
- [x] Instalação e desinstalação manuais validadas no Windows.
- [x] Clique em **Test Connection** retorna um PONG válido ao popup.

## Resultado da validação real (14/10/2026)

- **Resultado:** APROVADO (`PASS`).
- **Testes automatizados:** 13/13 aprovados.
- **Integração real Chrome ↔ Node.js:** Resposta `PONG` recebida no popup da extensão com protocolo versão `1.0` e host versão `0.1.0`.
- **Identidade da extensão:** Conferida e compatível com a chave fixada (`kmhnfligldbfbjmdmodckpmbnfmehfba`).
- **Comportamento observado:** O Chrome iniciou o processo Node.js nativo com sucesso, enviou o PING e processou o PONG sem erros no console ou no subsistema de Native Messaging.

## Próxima missão: POC-05B — Antigravity IDE ↔ Chrome

O próximo experimento visa demonstrar a comunicação de ponta a ponta:

```text
Argonauta (Antigravity IDE)
  │ Comando da extensão da IDE
  ▼
IPC local autenticado (transporte a definir)
  ▼
Argonauta Native Host (Node.js)
  │ Native Messaging
  ▼
Google Chrome (Extensão MV3)
  └─ Confirmação de recebimento
```

**Ponto de atenção arquitetural:** O processo iniciado por `chrome.runtime.sendNativeMessage()` possui ciclo de vida curto. Será necessário projetar o mecanismo de comunicação local entre esse processo e a extensão da IDE sem presumir conexões persistentes ainda não implementadas.

## Fontes oficiais

- [Chrome for Developers — Native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [Chrome for Developers — `chrome.runtime`](https://developer.chrome.com/docs/extensions/reference/api/runtime)
- [Chrome for Developers — Manifest `key`](https://developer.chrome.com/docs/extensions/reference/manifest/key)
- [GoogleChrome — exemplo oficial de Native Messaging](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/nativeMessaging)

## Limites da conclusão

Uma resposta PONG bem-sucedida comprova que a extensão consegue trocar mensagens com um host local autorizado via Native Messaging. Isso não concede acesso a abas, conteúdo, DOM, cookies ou sessões do Google e não valida automação ou comunicação com o Gemini Web.
