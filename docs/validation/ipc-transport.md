# Gate de validação — transporte IPC por Windows Named Pipes

## Resultado

**Estado:** `blocked` em 14/10/2026.

O transporte básico por `node:net` funciona, mas a configuração autorizada não permite aplicar e comprovar os controles de segurança exigidos. Por isso, a biblioteca `@argonauta/ipc`, o harness e o comando **Argonauta: Test Local IPC** não foram implementados.

## Objetivo avaliado

Validar um canal local, duplex e limitado entre processos Node.js independentes antes de expor qualquer mensagem funcional. O gate exigiu:

- criação e conexão por Windows Named Pipe;
- comunicação duplex;
- encerramento e exclusividade do nome;
- DACL efetiva restrita;
- bloqueio de clientes remotos;
- ausência de TCP, HTTP, WebSocket, Registro ou processo residente.

## Ambiente

| Item | Valor |
|---|---|
| Branch | `main` |
| Baseline | `62806b8` |
| Windows | `10.0.26300.0` x64 |
| Node.js | `v24.16.0` |
| libuv | `1.52.1` |
| npm | `11.13.0` |
| Baseline automatizada | 77 testes aprovados, 0 falhas |

Nenhum nome de usuário, SID real, caminho pessoal ou payload de projeto foi preservado na evidência.

## Arquitetura efetivamente testada

```text
processo Node.js cliente
        │ bytes duplex
        ▼
\\.\pipe\LOCAL\argonauta-ipc-gate-<aleatorio>
        ▲
        │ node:net
processo Node.js servidor temporário
```

O processo foi criado somente durante o gate e encerrado ao final. Nenhum serviço, registro ou interface TCP foi criado.

## Nome do pipe

O candidato `\\.\pipe\LOCAL\argonauta-ipc-gate-<aleatorio>` foi aceito pelo Node.js. Contudo, a documentação do Node.js descreve o namespace como plano. Assim, o segmento `LOCAL` no nome não constitui prova de isolamento por sessão, usuário ou rede.

O sufixo aleatório evita colisões acidentais e exposição de dados pessoais, mas não é tratado como autenticação ou autorização.

## Resultados do gate

| Verificação | Resultado | Evidência |
|---|---|---|
| Criação com `node:net` | `pass` | `server.listen({ path })` iniciou sem erro. |
| Processos independentes | `pass` | Cliente e inspeção executados em processos separados. |
| Comunicação duplex | `pass` | `PING_GATE` recebeu `PONG_GATE`. |
| Encerramento | `pass` | Sockets e servidor foram encerrados ao final. |
| Segunda instância | `pass` | O mesmo nome foi rejeitado com `EADDRINUSE`. |
| DACL inspecionável | `pass` | `System.IO.Pipes.PipesAclExtensions.GetAccessControl` retornou a SDDL efetiva. |
| DACL restrita | `fail` | `Everyone` e `Anonymous` possuem `FILE_GENERIC_READ`; SID de logon ausente. |
| Bloqueio remoto | `fail` | `\\localhost\pipe\...` conectou e concluiu a ida e volta. |
| Outro usuário/logon | `blocked` | Não executado: a DACL já viola o gate e não há ambiente secundário seguro aprovado. |
| Runtime do Antigravity | `pending_manual_validation` | Não se expôs servidor funcional porque o gate de segurança falhou antes do harness. |

## DACL efetiva

Forma sanitizada observada:

```text
O:<SID_IDENTIDADE>G:<SID_IDENTIDADE>D:(A;;FR;;;WD)(A;;FR;;;AN)(A;;FA;;;SY)(A;;FA;;;BA)(A;;FA;;;<SID_IDENTIDADE>)
```

Interpretação relevante:

- `WD`: `Everyone`, com leitura;
- `AN`: `Anonymous`, com leitura;
- `SY`: sistema local, com controle total;
- `BA`: administradores internos, com controle total;
- SID do usuário criador: controle total;
- nenhum SID de logon foi encontrado.

Essa DACL coincide com o comportamento padrão documentado pela Microsoft quando `CreateNamedPipe` recebe `lpSecurityAttributes = NULL`. Os valores `readableAll: false` e `writableAll: false` não equivalem a uma DACL exclusiva.

## Acesso remoto

O cliente usou o formato remoto `\\localhost\pipe\LOCAL\...`, que atravessa o namespace SMB de Named Pipes. A conexão foi aceita e a resposta retornou. Se `PIPE_REJECT_REMOTE_CLIENTS` estivesse aplicado, clientes remotos seriam automaticamente rejeitados.

O teste com `localhost` comprova que o flag não protege o pipe criado nesta configuração. Ele não substitui um teste entre duas máquinas, mas já é suficiente para reprovar o requisito de rejeição automática.

## API pública e limitação

`node:net` documenta:

- `path` para o endpoint IPC;
- `exclusive` para impedir compartilhamento pelo cluster;
- `signal` para encerramento;
- `readableAll` e `writableAll` apenas para ampliar acesso.

A API pública não recebe `SECURITY_ATTRIBUTES`, SDDL, SID de logon ou `PIPE_REJECT_REMOTE_CLIENTS`. A implementação libuv avaliada chama `CreateNamedPipeW` com descritor de segurança nulo e sem o flag de rejeição remota.

## Ferramenta de reprodução

Na raiz do repositório, em Windows:

```powershell
npm run verificar:ipc-security-gate
```

O comando:

1. cria um nome aleatório sem dados pessoais;
2. inicia um pipe temporário;
3. testa duplex local;
4. inspeciona a DACL por API pública do .NET;
5. tenta acesso por `\\localhost\pipe`;
6. testa uma segunda instância;
7. fecha todos os recursos;
8. retorna código `2` enquanto o gate estiver `blocked`.

O script não integra o fluxo global `npm run verificar`, pois seu resultado esperado nesta decisão arquitetural é bloqueante, não uma regressão aprovada.

Três execuções sequenciais produziram o mesmo estado `blocked`, código `2`, conexão local e remota aceitas e `EADDRINUSE` para a segunda instância. A inspeção posterior do namespace não encontrou pipes `argonauta-ipc-gate-*` residuais.

## Fronteiras de confiança e ameaças

O pipe não autenticado seria uma fronteira hostil. Mesmo sem HMAC nesta etapa, ele precisaria impedir leitura por outras identidades e acesso remoto antes de transportar mensagens de diagnóstico.

Como esses controles falharam, nenhuma mensagem do protocolo `1.0`, conteúdo do workspace, segredo, comando, integração Chrome ou operação funcional foi ligada ao endpoint.

## Limites, framing, backpressure e ciclo de vida

Esses itens permanecem especificados no desenho, mas não foram implementados porque dependem de um servidor aprovado pelo gate:

- framing incremental via `@argonauta/protocol`;
- 65.536 bytes por payload e 65.540 bytes por fragmento;
- 32 mensagens por chamada ao decodificador;
- limite de conexões e memória por conexão;
- fila de escrita e tratamento de `socket.write() === false`;
- timeout de conexão e inatividade;
- cancelamento, EOF e normalização de erros.

Não há resultado de teste para esses itens nesta execução.

## Alternativas que exigem decisão

1. autorizar um addon/helper Win32 mínimo que crie o primeiro handle com DACL explícita, SID de logon e `PIPE_REJECT_REMOTE_CLIENTS`;
2. avaliar um sidecar .NET mínimo com `NamedPipeServerStreamAcl.Create` e `PipeOptions.CurrentUserOnly`, seguido de testes efetivos de DACL, sessão e rede;
3. interromper a arquitetura de Named Pipes e revisar o requisito em nova ADR, sem adotar fallback silencioso.

Nenhuma alternativa foi implementada.

## Critérios da Etapa 2

| Critério | Estado |
|---|---|
| Named Pipe local funcional | `pass` |
| Comunicação duplex | `pass` |
| DACL compatível | `fail` |
| Bloqueio remoto | `fail` |
| Cliente não autorizado rejeitado | `blocked` |
| Biblioteca IPC | `blocked` |
| Harness no Antigravity | `blocked` |
| Etapa 3 | `blocked` |

## Referências

- [ADR-0002 — Gate de segurança do Windows Named Pipe](../architecture/decisions/0002-node-net-security-gate.md)
- [Node.js — IPC com `node:net`](https://nodejs.org/docs/latest-v22.x/api/net.html#ipc-support)
- [Microsoft — nomes de pipes](https://learn.microsoft.com/windows/win32/ipc/pipe-names)
- [Microsoft — `CreateNamedPipe`](https://learn.microsoft.com/windows/win32/api/winbase/nf-winbase-createnamedpipea)
- [Microsoft — segurança de Named Pipes](https://learn.microsoft.com/windows/win32/ipc/named-pipe-security-and-access-rights)
