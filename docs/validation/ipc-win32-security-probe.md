# Validação — prova de segurança do Named Pipe Win32

## Resultado

**Pré-requisito MSVC/Windows SDK:** `done`.

**Prova Win32 local:** `pending_validation` em 14/10/2026. Os testes automatizáveis M01–M14 e M19 passaram; M15–M17 continuam pendentes por falta de outra conta, outra sessão/logon e outra máquina reais.

**POC-05B Etapa 2:** permanece `blocked` até revisão arquitetural expressa, execução dos testes externos e implementação posterior do transporte definitivo. A Etapa 3 não foi iniciada.

O servidor criado diretamente por `node:net` da ADR-0002 continua `blocked`; esta prova não altera nem reinterpreta esse resultado.

## Escopo executado

- helper Win32 temporário em `tools/ipc-security-probe/`;
- criação direta por `CreateNamedPipeW` com descritor explícito;
- cliente Node.js independente usando somente `node:net` como cliente;
- inspeção da DACL e do handle antes da prontidão;
- testes negativos de acesso, framing, timeout, concorrência e encerramento;
- nenhum Chrome, Native Messaging, HMAC, Registro, TCP, HTTP, WebSocket ou dado de workspace.

## Arquitetura da prova

```text
cliente Node.js independente
        │ frame diagnóstico limitado
        ▼
Named Pipe efêmero criado pelo helper Win32
        │ DACL por SID de logon + bloqueio remoto
        ▼
CreateNamedPipeW / I/O overlapped / RAII
```

O frame de entrada usa um byte de comprimento seguido de até 64 bytes. O único payload aceito é `PING_GATE`. A resposta é `PONG_GATE`, seguida de uma confirmação interna de recebimento pelo cliente. Esse framing pertence somente à prova e não reutiliza contratos funcionais da POC-05A/POC-05B.

## Política de segurança observada

Forma sanitizada da DACL efetiva:

```text
O:<SID_TOKEN_OWNER>G:<SID_TOKEN_PRIMARY_GROUP>D:P(A;;0x0010019B;;;<SID_LOGON>)
```

Propriedades inspecionadas no handle real:

| Propriedade | Esperado | Observado |
|---|---|---|
| DACL | presente, não nula e protegida | `pass` |
| ACEs | uma ACE permitida, explícita e não herdada | `pass` |
| Principal da ACE | SID de logon copiado de `TokenGroups` | `pass` |
| Principais adicionais | nenhum | `pass` |
| Owner | igual ao `TokenOwner` do processo criador | `pass` |
| Group | igual ao `TokenPrimaryGroup` do processo criador | `pass` |
| Handle | não herdável | `pass` |
| Máscara | `0x0010019B` | `pass` |

Owner e group não são ACEs e não concedem, por si, os direitos de dados da DACL. Nenhum SID real foi registrado.

### Máscara mínima medida

A máscara `0x0010019B` contém:

- `FILE_READ_DATA` e `FILE_WRITE_DATA`;
- `FILE_READ_EA` e `FILE_WRITE_EA`;
- `FILE_READ_ATTRIBUTES` e `FILE_WRITE_ATTRIBUTES`;
- `SYNCHRONIZE`.

Cada direito foi removido individualmente em uma execução diagnóstica; em todos os casos o cliente Node foi rejeitado. A máscara não contém `FILE_CREATE_PIPE_INSTANCE`, `READ_CONTROL`, `WRITE_DAC`, `WRITE_OWNER`, `DELETE` nem controle total.

A máscara ampla `0x0012019F`, derivada de `FILE_GENERIC_READ | FILE_GENERIC_WRITE`, também permitiu a troca, mas foi corretamente classificada como `blocked`, pois inclui `READ_CONTROL` e `FILE_CREATE_PIPE_INSTANCE`. Ela não é usada pela política estrita.

## Ordem de autorização

1. O helper lê um frame não confiável em buffer fixo de até 64 bytes.
2. `ImpersonateNamedPipeClient` representa o contexto da última mensagem lida.
3. O token da thread é aberto com `TOKEN_QUERY`.
4. O SID de logon do cliente é extraído de `TokenGroups` e comparado ao SID autorizado.
5. `RevertToSelf` é executado antes de interpretar o payload como aceito.
6. A inspeção de bytes excedentes via `PeekNamedPipe` verifica dados já presentes no buffer do kernel.
7. Somente um cliente autorizado com payload exato `PING_GATE` recebe `PONG_GATE`.
8. Leitura do byte de confirmação `0x06` para fechamento determinístico e desconexão via `DisconnectNamedPipe`.

Falha de representação, identidade, excesso ou truncamento não produz resposta. Falha de `RevertToSelf` encerra o processo.

## Evidência por item M01–M19

| ID | Estado | Tipo de evidência | Resultado observado |
|---|---|---|---|
| M01 | `pass` | automação + revisão de fonte | descritor construído antes do único `CreateNamedPipeW`; nenhuma mutação tardia de ACL |
| M02 | `pass` | automação + revisão de fonte | exatamente um grupo `SE_GROUP_LOGON_ID`, copiado antes da liberação do buffer |
| M03 | `pass` | automação Win32 | DACL presente, não nula, protegida e owner/group conforme política |
| M04 | `pass` | automação Win32 | uma ACE para `<SID_LOGON>`; sem Everyone, Anonymous, Users, Authenticated Users, administradores ou SID permanente do usuário |
| M05 | `pass` | automação comparativa | máscara mínima `0x0010019B`; ampla `0x0012019F` bloqueada |
| M06 | `pass` | automação + revisão de fonte | handle não herdável; primeira instância e instância única comprovadas |
| M07 | `pass` | automação multiprocesso | cliente Node independente concluiu `PING_GATE`/`PONG_GATE`, inclusive com frame fragmentado |
| M08 | `pass` | automação local | `\\localhost\pipe` rejeitado sem PONG; cliente local continuou funcional |
| M09 | `pass` | automação multiprocesso | squatter iniciado primeiro fez o helper falhar fechado, sem prontidão |
| M10 | `pass` | automação multiprocesso | quatro criadores concorrentes foram rejeitados; somente o primeiro servidor atendeu |
| M11 | `pass` | automação | literal incorreto, sufixo, NUL, bytes arbitrários e truncamento foram rejeitados |
| M12 | `pass` | automação | vazio, 64 bytes inválidos, 65 bytes e lote concatenado foram rejeitados; buffer fixo |
| M13 | `pass` | automação | cliente silencioso e servidor sem cliente terminaram por timeout/cancelamento finitos |
| M14 | `pass` | automação multiprocesso | cliente e helper interrompidos encerraram sem PONG indevido ou pipe reutilizável |
| M15 | `PENDENTE — DÍVIDA TÉCNICA ACEITA PELO MANTENEDOR` | validação manual externa | Finalidade: comprovar negação de acesso a outro usuário local; Justificativa: indisponibilidade de laboratório multi-conta no host; Risco residual: não validação direta contra outros usuários no mesmo SO; Quitação: execução em laboratório multi-usuário antes do Marco 1 |
| M16 | `PENDENTE — DÍVIDA TÉCNICA ACEITA PELO MANTENEDOR` | validação manual externa | Finalidade: comprovar isolamento estrito ao LogonId do helper; Justificativa: ausência de sessões interativas/não-interativas secundárias no host; Risco residual: não verificação de processos paralelos em logon distinto do mesmo usuário; Quitação: execução em laboratório com LogonId distinto antes do Marco 1 |
| M17 | `PENDENTE — DÍVIDA TÉCNICA ACEITA PELO MANTENEDOR` | validação manual externa | Finalidade: comprovar bloqueio de conexões SMB remotas reais via rede; Justificativa: indisponibilidade de máquina de teste secundária e rede isolada; Risco residual: confiar unicamente no teste local de loopback SMB `\\localhost\pipe`; Quitação: execução em laboratório multi-máquina na mesma sub-rede antes do Marco 1 |
| M18 | `pass` | regressão | build/typecheck códigos `0`; 100 testes; fixtures íntegras; audit sem vulnerabilidades; gate antigo `blocked` código `2` |
| M19 | `pass` | automação repetida | dez ciclos concluídos; reconexão ao nome exato falhou após cada encerramento |

## Dívidas técnicas aceitas e revisão de I/O

### Homologação externa postergada (M15–M17)
O mantenedor decidiu adiar formalmente os testes M15, M16 e M17 devido à indisponibilidade do laboratório necessário neste momento (contas de teste secundárias, sessões de logon paralelas e máquinas remotas na rede). A aprovação dos testes locais (M01–M14, M18–M19) está formalmente separada da homologação externa. A POC-05B Etapa 2 permanece em `pending_validation` / `blocked`, não sendo considerada integralmente aprovada sem a quitação ou deliberação expressa sobre essas pendências.

### Revisão técnica sobre segundos frames atrasados e CancelIoEx
A inspeção com `PeekNamedPipe` detecta dados já presentes no buffer do kernel no momento da chamada, mas não oferece sincronização temporal caso o cliente transmita um segundo frame com atraso assíncrono após a primeira inspeção. Não foi incorporada automaticamente janela de leitura arbitrária (ex.: 35 ms) ao código nativo nesta prova para evitar introduzir latência fixa em todas as conexões e para permitir uma revisão minuciosa sobre potenciais condições de corrida entre o cancelamento de I/O via `CancelIoEx` e conclusões normais de I/O (`ERROR_OPERATION_ABORTED` vs `ERROR_SUCCESS`). Essa revisão permanece registrada como requisito de refinamento obrigatório para a implementação do `@argonauta/ipc`.

## Execução manual local, automação e revisão documental

### Execução manual local

O pré-requisito de toolchain T01–T11 foi executado anteriormente pelo mantenedor e está registrado em `manual-tests/03_win32-toolchain-installation.md`. Nesta rodada não houve nova interação manual com conta secundária, sessão secundária ou máquina remota.

### Automação executada

```powershell
npm run compilar --workspace @argonauta/ipc-security-probe
npm run typecheck --workspace @argonauta/ipc-security-probe
npm test --workspace @argonauta/ipc-security-probe
```

Resultado específico do probe: 23 testes aprovados, 0 falhas. O build usa C++20, `/W4`, `/WX`, `/sdl`, `/GS`, `/guard:cf`, `/O2`, `/MT`, `/DYNAMICBASE`, `/NXCOMPAT` e `/HIGHENTROPYVA`.

Regressão completa observada:

| Comando | Resultado |
|---|---|
| `npm run compilar` | `pass`, código `0` |
| `npm run typecheck` | `pass`, código `0` |
| `npm test` | `pass`, 100 testes e 0 falhas |
| `npm run verificar:fixtures` | `pass`, fixtures PING/PONG preservadas |
| `npm audit --audit-level=high` | `pass`, 0 vulnerabilidades |
| `npm run verificar:ipc-security-gate` | preservação `pass`: estado `blocked`, código esperado `2` |
| inspeção após os testes | 0 processos e 0 pipes da prova residuais |

### Revisão documental

A implementação foi conferida contra a documentação oficial da Microsoft para `CreateNamedPipeW`, segurança de Named Pipes, `GetSecurityInfo`, `GetTokenInformation`, `ImpersonateNamedPipeClient`, `ConnectNamedPipe` e `CancelIoEx`. A correção principal em relação ao desenho inicial foi mover a representação para depois da leitura limitada, pois a API representa o contexto da última mensagem lida.

## Códigos de saída

| Código | Semântica |
|---|---|
| `0` | política estrita inspecionada e troca local autorizada concluída |
| `2` | gate bloqueado de forma controlada |
| `3` | falha de execução ou cenário negativo encerrado sem resposta funcional |

## Pendências e riscos residuais

- M15–M17 exigem laboratórios reais e autorizados; não foram simulados.
- `\\localhost\pipe` comprova o bloqueio desse caminho local SMB, mas não substitui conexão de outra máquina.
- A prova permite somente uma troca diagnóstica; não implementa backpressure ou transporte persistente de produção.
- A adoção de um sidecar nativo traz custos de build por arquitetura, assinatura, distribuição, atualização e revisão de segurança de memória.
- O SID de logon restringe conta/sessão, mas não protege contra processo malicioso já executando no mesmo logon. Autenticação HMAC permanece fora do escopo e depende de Etapa 3 autorizada.

## Conclusão

O helper demonstrou localmente que é possível criar o pipe com segurança desde o primeiro handle, DACL por SID de logon, máscara sem `FILE_CREATE_PIPE_INSTANCE` e rejeição do caminho `localhost`. A prova permanece `pending_validation` por M15–M17, e a POC-05B Etapa 2 permanece `blocked` até decisão arquitetural e validações externas.

Nenhuma ADR foi alterada para `accepted`. O próximo passo requer revisão explícita do mantenedor; não há autorização para implementar o transporte definitivo nem iniciar a Etapa 3.

## Referências oficiais

- [Microsoft — CreateNamedPipeW](https://learn.microsoft.com/pt-br/windows/win32/api/namedpipeapi/nf-namedpipeapi-createnamedpipew)
- [Microsoft — segurança e direitos de Named Pipes](https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights)
- [Microsoft — GetSecurityInfo](https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo)
- [Microsoft — GetTokenInformation](https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-gettokeninformation)
- [Microsoft — TOKEN_GROUPS e SE_GROUP_LOGON_ID](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-token_groups)
- [Microsoft — ImpersonateNamedPipeClient](https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-impersonatenamedpipeclient)
- [Microsoft — ConnectNamedPipe](https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-connectnamedpipe)
- [Microsoft — CancelIoEx](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelioex)
