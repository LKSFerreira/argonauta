# Probe de segurança IPC Win32

Prova diagnóstica isolada da POC-05B, Etapa 2. O executável cria um único Windows Named Pipe efêmero diretamente por `CreateNamedPipeW`, inspeciona a segurança do handle antes de anunciar prontidão e atende uma única troca `PING_GATE`/`PONG_GATE`.

Este diretório não contém transporte de produção, Native Messaging Host, integração Chrome, HMAC, servidor persistente nem fallback de rede.

## Controles aplicados

- SID de logon obtido de `TokenGroups` com `SE_GROUP_LOGON_ID` e copiado para memória própria;
- DACL protegida, presente e não nula, com uma única ACE para o SID de logon;
- máscara estrita `0x0010019B`, composta por leitura/escrita de dados, atributos, atributos estendidos e `SYNCHRONIZE`;
- ausência de `FILE_CREATE_PIPE_INSTANCE`, `READ_CONTROL`, `WRITE_DAC`, `WRITE_OWNER`, `DELETE` e controle total na ACE do cliente;
- `SECURITY_ATTRIBUTES.bInheritHandle = FALSE` no primeiro `CreateNamedPipeW`;
- `PIPE_REJECT_REMOTE_CLIENTS`, `FILE_FLAG_FIRST_PIPE_INSTANCE`, `FILE_FLAG_OVERLAPPED` e uma única instância;
- inspeção efetiva por `GetSecurityInfo`, `GetSecurityDescriptorDacl`, `GetSecurityDescriptorControl`, `GetAclInformation`, `GetAce` e `GetHandleInformation` antes do evento `PRONTO_DIAGNOSTICO`;
- leitura limitada antes de `ImpersonateNamedPipeClient`, comparação do SID de logon do cliente e `RevertToSelf` antes de qualquer resposta;
- I/O overlapped com timeout, `CancelIoEx` e coleta da conclusão antes de liberar `OVERLAPPED`;
- buffers fixos: um byte de comprimento e payload diagnóstico de até 64 bytes.

O frame de entrada é exclusivo desta prova:

```text
[comprimento uint8][payload]
```

O único payload aceito é `PING_GATE`. A resposta é o literal `PONG_GATE`; o cliente envia um byte de confirmação interno após recebê-la para permitir encerramento finito sem `FlushFileBuffers` bloqueante.

## Compilação e testes

Na raiz do repositório:

```powershell
npm run compilar --workspace @argonauta/ipc-security-probe
npm run typecheck --workspace @argonauta/ipc-security-probe
npm test --workspace @argonauta/ipc-security-probe
```

O script localiza o MSVC com `vswhere`, inicializa o ambiente x64 por `VsDevCmd.bat` e grava somente artefatos ignorados em `build/`. Nenhuma dependência npm adicional é instalada.

## Execução diagnóstica individual

Terminal 1:

```powershell
tools/ipc-security-probe/build/ipc-security-probe.exe --politica estrita --timeout-ms 1500
```

Copie o `caminhoPipe` efêmero do evento `PRONTO_DIAGNOSTICO` apenas para o teste em andamento. Terminal 2:

```powershell
node tools/ipc-security-probe/client/diagnostic-client.mjs "<caminhoPipe>" valido
```

Não persista o nome aleatório, SID, hostname ou caminho pessoal em evidências.

## Códigos de saída

| Código | Significado |
|---|---|
| `0` | Propriedades locais verificadas e troca diagnóstica concluída sob a máscara estrita. |
| `2` | Gate bloqueado de forma controlada, como squatting, política ampla ou timeout de medição. |
| `3` | Falha de execução ou cenário negativo encerrado sem resposta funcional. |

A política `compatibilidade-node` existe apenas para demonstrar que `FILE_GENERIC_WRITE` introduz `FILE_CREATE_PIPE_INSTANCE`; ela sempre termina como `blocked`, mesmo quando a troca técnica funciona. A política aprovada pelo probe é `estrita`.

## Limites da evidência

Os testes locais automatizam M01–M14 e M19. M15, M16 e M17 exigem, respectivamente, outra conta Windows, outra sessão/logon e outra máquina real previamente autorizadas. Enquanto esses três testes estiverem pendentes, a prova permanece `pending_validation` e a POC-05B Etapa 2 não está concluída.
