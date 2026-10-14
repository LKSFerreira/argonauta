# ADR-0002 — Gate de segurança do Windows Named Pipe com `node:net`

## Status

Bloqueado em 14/10/2026. A decisão para adotar uma implementação alternativa exige aprovação arquitetural específica.

## Contexto

A Etapa 2 precisa criar um canal duplex local entre processos independentes, sem TCP, HTTP ou WebSocket. O desenho escolheu Windows Named Pipes e exigiu dois controles verificáveis antes de expor mensagens funcionais:

1. DACL restrita ao usuário ou logon autorizado;
2. rejeição de clientes remotos.

O runtime avaliado foi Node.js `v24.16.0`, com libuv `1.52.1`, no Windows `10.0.26300.0` x64.

## Evidências

O `node:net` cria e conecta pipes pelo parâmetro `path`. As únicas opções públicas de permissão documentadas para `server.listen()` são `readableAll` e `writableAll`; seus valores `false` não configuram uma DACL explícita nem habilitam `PIPE_REJECT_REMOTE_CLIENTS`.

O teste temporário executado com ambas as opções em `false` produziu:

- comunicação local duplex: `pass`;
- segunda instância: rejeitada com `EADDRINUSE`;
- conexão por `\\localhost\pipe\...`: aceita e capaz de completar a ida e volta;
- DACL efetiva sanitizada: `O:<SID_IDENTIDADE>G:<SID_IDENTIDADE>D:(A;;FR;;;WD)(A;;FR;;;AN)(A;;FA;;;SY)(A;;FA;;;BA)(A;;FA;;;<SID_IDENTIDADE>)`;
- leitura concedida a `Everyone` (`WD`) e `Anonymous` (`AN`);
- ausência de ACE para o SID de logon.

A documentação da Microsoft confirma que `CreateNamedPipe` com `lpSecurityAttributes = NULL` usa a DACL padrão, que concede controle total ao sistema, administradores e proprietário criador, além de leitura a `Everyone` e à conta anônima. Ela também define `PIPE_REJECT_REMOTE_CLIENTS` como o controle que rejeita automaticamente clientes remotos e recomenda o SID de logon para isolar usuários e sessões.

## Decisão

Não implementar `@argonauta/ipc`, servidor persistente, harness do Antigravity ou mensagens funcionais sobre o pipe criado diretamente por `node:net`.

O nome `\\.\pipe\LOCAL\argonauta-poc05b-<idInstalacao>` funciona no runtime avaliado, mas `LOCAL` compõe apenas o nome no namespace plano observado pelo Node.js. Ele não substitui a DACL nem comprovou isolamento remoto.

## Alternativas avaliadas

### Manter `node:net` com `readableAll: false` e `writableAll: false`

Rejeitada. A DACL efetiva continua permissiva para leitura e o acesso por SMB local foi aceito.

### Nome aleatório

Rejeitada como controle de segurança. Reduz descoberta casual, mas não aplica autorização.

### Ajustar a DACL depois de `listen()`

Rejeitada para esta etapa. Introduz janela de corrida entre a criação e a correção da DACL, não expõe `PIPE_REJECT_REMOTE_CLIENTS` e dependeria de integração adicional ainda não aprovada.

### Helper baseado em API Win32

Tecnicamente viável por `CreateNamedPipeW`, `SECURITY_ATTRIBUTES`, SID de logon e `PIPE_REJECT_REMOTE_CLIENTS`. Exige código nativo, FFI ou addon Node-API e aprovação específica, inexistente nesta etapa.

### Sidecar gerenciado em .NET

`NamedPipeServerStreamAcl.Create` e `PipeOptions.CurrentUserOnly` oferecem APIs públicas para restringir o usuário. Ainda seria necessário validar a DACL, o SID de logon, o bloqueio remoto e a integração segura do handle com Node.js. A inclusão de um runtime e componente adicional altera a arquitetura e exige decisão explícita.

### TCP, HTTP ou WebSocket local

Não avaliada como fallback porque foi expressamente proibida.

## Consequências

- A Etapa 2 permanece `blocked` no gate de segurança.
- Nenhum endpoint funcional não autenticado foi disponibilizado.
- `packages/ipc` e `tools/ipc-transport-probe` não foram criados artificialmente.
- A Etapa 3 permanece bloqueada.
- A próxima decisão deve escolher e autorizar uma estratégia capaz de criar o pipe com descritor seguro desde o primeiro handle.

## Referências

- [Node.js — IPC e `server.listen()`](https://nodejs.org/docs/latest-v22.x/api/net.html#ipc-support)
- [Microsoft — `CreateNamedPipe`](https://learn.microsoft.com/windows/win32/api/winbase/nf-winbase-createnamedpipea)
- [Microsoft — segurança e direitos de acesso de Named Pipes](https://learn.microsoft.com/windows/win32/ipc/named-pipe-security-and-access-rights)
- [Microsoft — `GetSecurityInfo`](https://learn.microsoft.com/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo)
- [libuv 1.52.1 — implementação de pipes no Windows](https://github.com/libuv/libuv/blob/v1.52.1/src/win/pipe.c)
- [.NET — `NamedPipeServerStreamAcl.Create`](https://learn.microsoft.com/dotnet/api/system.io.pipes.namedpipeserverstreamacl.create)
- [.NET — `PipeOptions.CurrentUserOnly`](https://learn.microsoft.com/dotnet/api/system.io.pipes.pipeoptions)
