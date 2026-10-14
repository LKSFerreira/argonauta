# Teste manual — prova de segurança do Named Pipe Win32 (POC-05B, Etapa 2)

## Estado

**Estado atual:** `pending_validation` — M01–M14 e M18–M19 foram executados localmente por automação em 14/10/2026. M15–M17 exigem ambientes externos reais e continuam `PENDENTE`. A POC-05B Etapa 2 permanece `blocked` até revisão arquitetural e conclusão dos gates pendentes.

**Escopo:** helper diagnóstico Win32 criado diretamente por `CreateNamedPipeW`; cliente Node.js independente; testes negativos e evidências. Não inclui HMAC, Chrome, Native Messaging persistente, Gemini Web, `@argonauta/ipc` final ou Etapa 3.

## Pré-requisitos verificados antes de executar

- Toolchain MSVC/Windows SDK do roteiro `03_win32-toolchain-installation.md` em `done` pelos resultados do mantenedor.
- Fontes reais compiláveis da prova em `tools/ipc-security-probe/` e scripts de teste revisados.
- Antigravity IDE com workspace correto. Não pressupor compatibilidade com outros hosts.
- Permissão para execução diagnóstica **na sessão própria e sem privilégios administrativos desnecessários**.
- Cenários externos de outra conta, outra sessão e máquina remota só se houver ambientes legítimos/explicitamente autorizados; não criar usuários ou abrir firewall automaticamente.

## Preparação

1. Confirmar `git status --short --branch`, `git rev-parse HEAD`, versão do Windows, Node, npm, MSVC e Windows SDK. Registrar apenas versões e commit; ocultar paths pessoais, hostname e SIDs reais.
2. Revisar código e comando de compilação do helper. Compilar no **x64 Native Tools Command Prompt** com `/W4 /WX /sdl /GS /guard:cf`, opções de linker `/DYNAMICBASE /NXCOMPAT /guard:cf` e bibliotecas Win32 exatas. Não remover proteções para fazer o build passar.
3. Iniciar apenas o helper temporário. Ele deve recusar informar `READY` antes de verificar a própria DACL/handle. Nunca publicar payload de workspace ou qualquer segredo.
4. Anotar nome do executável, comando e flags observáveis (sem SID, PID completo, token, hostname ou nomes pessoais), código de saída e resultado terminal.
5. Rodar cada teste separadamente, encerrando processos da própria prova ao término. Em caso de falha crítica da DACL/remote: **parar e manter `blocked`**; não liberar o servidor para testes funcionais até corrigir o problema.

## Matriz de testes — preencher com evidência observada

Use `pass`, `fail` ou `unsupported` **somente** para testes realizados/concluídos. Até sua execução, use `PENDENTE`. Um teste `unsupported` **não** equivale a `pass`.

| ID | Teste | Resultado esperado | Estado | Evidência sanitizada |
|---|---|---|---|---|
| M01 | Criação segura desde o primeiro handle | Descritor explícito passado ao primeiro `CreateNamedPipeW`; nunca corrigir DACL depois | `pass` | Construção anterior à criação e ausência de `SetSecurityInfo`/`SetNamedSecurityInfo` verificadas |
| M02 | SID de logon da sessão | SID extraído de `TokenGroups` (`SE_GROUP_LOGON_ID`), não SID permanente do usuário | `pass` | Exatamente um SID de logon copiado; valor real não registrado |
| M03 | DACL efetiva via `GetSecurityInfo` | DACL presente, não nula, protegida; ACE(s) estritamente conforme política aprovada | `pass` | DACL protegida; owner=`<SID_TOKEN_OWNER>` e group=`<SID_TOKEN_PRIMARY_GROUP>` |
| M04 | Principais não autorizados | Sem ACE de acesso para `Everyone`, `Anonymous`, `Users`, `Authenticated Users`, administradores ou SID permanente do usuário | `pass` | Uma ACE permitida somente para `<SID_LOGON>` |
| M05 | Máscaras de acesso | Mínimo privilégio efetivo; avaliar `FILE_CREATE_PIPE_INSTANCE` e acesso genérico do cliente Node | `pass` | `0x0010019B`; cada direito removido individualmente rejeitou o cliente; máscara ampla bloqueada |
| M06 | Handle e primeira instância | Handle não herdável; `FILE_FLAG_FIRST_PIPE_INSTANCE`; único servidor | `pass` | Handle não herdável; criadores concorrentes falharam fechados |
| M07 | Cliente Node local independente | Processos separados, duplex `PING_GATE`/`PONG_GATE` exato | `pass` | Cliente `node:net` independente recebeu PONG, inclusive com frame fragmentado |
| M08 | Bloqueio `\\localhost\pipe` | Rejeição ou negação comprovada; nenhuma resposta `PONG_GATE` | `pass` | Caminho localhost rejeitado; cliente local permaneceu funcional |
| M09 | Squatting: processo adversário primeiro | Helper falha fechado e não conecta ao pipe pré-criado | `pass` | Helper retornou código `2` e não anunciou prontidão |
| M10 | Segunda instância e concorrência | Segunda instância não assume servidor ou atendimento | `pass` | Quatro criadores concorrentes rejeitados; somente o primeiro atendeu |
| M11 | Entrada inválida/truncada | Rejeição sem `PONG_GATE`, sem exposição de dados, sem travamento | `pass` | Literal incorreto, sufixo, NUL, bytes arbitrários e truncamento rejeitados |
| M12 | Tamanho e buffer | Máximo de 64 bytes; excesso recusado; sem crescimento sem limites | `pass` | Buffer fixo; vazio, 64 inválidos, 65 bytes e lote concatenado rejeitados |
| M13 | Cliente silencioso | Timeout finito, cancelamento e limpeza de handles/processos | `pass` | Cliente silencioso e servidor sem cliente encerrados por timeout finito |
| M14 | Cliente desconectado ou helper interrompido | Falha controlada, sem exceção não tratada ou recursos residuais | `pass` | Ambos os sentidos de interrupção testados; nenhum PONG indevido |
| M15 | Outra conta Windows | Rejeitar cliente de outro usuário real, com identidade comprovada e sem coletar credenciais | PENDENTE | — |
| M16 | Outra sessão/logon Windows | Rejeitar cliente de outro SID de logon real | PENDENTE | — |
| M17 | Outra máquina real | Bloquear conexão remota real; não substituir por teste `localhost` | PENDENTE | — |
| M18 | Regressões e gate histórico | Build, typecheck, testes, fixtures, auditoria, `git diff --check`; gate `node:net` permanece `blocked` código `2` | `pass` | Build/typecheck códigos `0`; 100 testes; fixtures íntegras; audit sem vulnerabilidades; gate antigo `blocked` código `2` |
| M19 | Encerramento repetido e resíduos | Repetições sem pipes, handles ou PIDs da prova restantes | `pass` | Dez ciclos; reconexão ao nome exato rejeitada após cada término |

## Observações técnicas importantes

- A verificação da DACL deve preceder qualquer `READY` e qualquer processamento de `PING_GATE`.
- `ImpersonateNamedPipeClient` usa contexto da última mensagem lida. Se adotado, uma leitura restrita deve ocorrer primeiro, seguida pela representação, verificação da identidade e reversão correta por `RevertToSelf` **antes de responder**. Falhas de representação implicam rejeição.
- `FILE_GENERIC_WRITE` e `FILE_CREATE_PIPE_INSTANCE` compartilham direito no mapeamento de Named Pipes. Isso deve ser tratado como risco verificável, não como conclusão presumida de privilégio mínimo.
- `\\localhost\pipe` testa o caminho local de SMB, mas **não** é prova de que um cliente de outra máquina foi rejeitado.
- Testes de outra conta, sessão ou máquina exigem ambientes controlados e autorizados. Uma limitação de laboratório permanece pendente e impede afirmar que todos os gates passaram.
- Falha fechada é condição de sucesso **do teste negativo**, não uma aprovação automática da Etapa 2.

## Registro das execuções

| Campo | Valor |
|---|---|
| Data e fuso | 14/10/2026, America/Sao_Paulo |
| Responsável pela execução | Agente no ambiente local autorizado pelo mantenedor |
| Commit/branch testado | `ae88ce3`, `main`, com alterações locais desta prova ainda não publicadas |
| Windows e arquitetura | Windows `10.0.26300.0`, x64 |
| MSVC e SDK | MSVC `19.51.36260`, Windows SDK `10.0.26100.0` |
| Node.js e npm | Node `v24.16.0`, npm `11.13.0` |
| Identificação da prova/versão | `@argonauta/ipc-security-probe` `0.1.0` |
| Comandos de build (sem paths privados) | `npm run compilar/typecheck/test --workspace @argonauta/ipc-security-probe` |
| Saída do helper e código de saída | Política estrita: `pass`, código `0`; bloqueios controlados: código `2` |
| Cliente Node: resultado e código de saída | `PONG_GATE` exato, processo cliente código `0` |
| DACL sanitizada | `O:<SID_TOKEN_OWNER>G:<SID_TOKEN_PRIMARY_GROUP>D:P(A;;0x0010019B;;;<SID_LOGON>)` |
| Falhas ou limitações | M15–M17 pendentes por ausência de laboratórios reais autorizados |
| Registros de testes externos | PENDENTE |
| Resultado geral da prova | `pending_validation` |
| Revisão explícita do mantenedor | PENDENTE |

## Critério de encerramento

M15–M17 permanecem `PENDENTE` e impedem concluir a validação global. Qualquer falha técnica requer correção e nova execução dentro da POC-05B Etapa 2. Mesmo após os itens passarem, a prova diagnóstica não aprova automaticamente o pacote final `@argonauta/ipc` nem as demais partes da Etapa 2; a revisão expressa do mantenedor continua obrigatória.

## Referências

- [ADR-0002](../../architecture/decisions/0002-node-net-security-gate.md)
- [ADR-0003](../../architecture/decisions/0003-win32-named-pipe-security-probe.md)
- [Instalação do toolchain](03_win32-toolchain-installation.md)
- [Microsoft — Named Pipe Security](https://learn.microsoft.com/windows/win32/ipc/named-pipe-security-and-access-rights)
- [Microsoft — CreateNamedPipeW](https://learn.microsoft.com/windows/win32/api/namedpipeapi/nf-namedpipeapi-createnamedpipew)
- [Microsoft — ImpersonateNamedPipeClient](https://learn.microsoft.com/windows/win32/api/namedpipeapi/nf-namedpipeapi-impersonatenamedpipeclient)
- [Relatório da prova executável](../ipc-win32-security-probe.md)
