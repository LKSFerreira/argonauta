# ADR-0003 — Helper Win32 para o gate de segurança do Named Pipe

## Status

Proposta com prova local em `pending_validation` em 14/10/2026. A limitação ambiental registrada originalmente foi removida, mas a adoção arquitetural continua sem aprovação.

Esta ADR não substitui nem altera a reprovação registrada na ADR-0002. O servidor criado diretamente por `node:net` continua `blocked`. A decisão de adotar e distribuir um helper nativo ainda depende de aprovação arquitetural e de uma prova executável.

## Contexto

A ADR-0002 comprovou que a API pública de servidor de `node:net` não permite fornecer `SECURITY_ATTRIBUTES` nem habilitar `PIPE_REJECT_REMOTE_CLIENTS`. No ambiente testado, o pipe recebeu uma DACL padrão com leitura para `Everyone` e `Anonymous`, não continha o SID de logon e aceitou o caminho `\\localhost\pipe\...`.

A investigação atual foi autorizada somente para avaliar um helper diagnóstico Win32 mínimo. Ela não autoriza `@argonauta/ipc`, Native Messaging Host da POC-05B, integração com Chrome, autenticação HMAC ou Etapa 3.

## Resultado da investigação ambiental

O ambiente não possui toolchain C/C++ Win32 compilável:

- `cl.exe`, `msbuild.exe`, `vswhere.exe`, `rc.exe`, CMake, Ninja, LLVM/Clang e MinGW/GCC não foram encontrados;
- Visual Studio, Build Tools e Windows SDK não foram encontrados no `PATH`, Registro ou diretórios padrão;
- o `link.exe` visível pertence ao Git for Windows e não é o linker do MSVC;
- nenhum componente foi instalado, conforme a restrição da tarefa.

Existe .NET Framework 4.8 com um compilador C# legado. Isso não equivale a um toolchain C++/Win32 e não foi usado como substituição silenciosa. Um sidecar gerenciado ou uma implementação por P/Invoke constitui decisão arquitetural separada.

Na investigação original, sem compilador e SDK, não foi possível construir ou executar o helper. Consequentemente, naquela execução não foi possível comprovar:

- criação segura desde o primeiro handle;
- DACL efetiva restrita ao SID de logon;
- aplicação real de `PIPE_REJECT_REMOTE_CLIENTS`;
- rejeição de `\\localhost\pipe\...` pelo helper;
- comportamento de squatting, concorrência e encerramento do helper.

A condição de parada daquela investigação foi atingida. Nenhum código ou diretório vazio foi criado naquele momento em `tools/ipc-security-probe/`.

## Adendo da prova executável — 14/10/2026

Após a instalação e validação manual do MSVC/Windows SDK pelo mantenedor, foi autorizada e executada uma prova isolada em `tools/ipc-security-probe/`. O histórico de reprovação do servidor `node:net` da ADR-0002 permanece inalterado.

A prova confirmou localmente:

- criação protegida no primeiro `CreateNamedPipeW`, sem mutação posterior da DACL;
- DACL presente, não nula e protegida, com uma única ACE explícita para o SID de logon;
- política de owner e group: owner igual ao `TokenOwner` do processo criador e group igual ao `TokenPrimaryGroup`; essas identidades não são ACEs de acesso;
- handle não herdável, instância única, `FILE_FLAG_FIRST_PIPE_INSTANCE`, `FILE_FLAG_OVERLAPPED` e `PIPE_REJECT_REMOTE_CLIENTS`;
- rejeição do caminho `\\localhost\pipe`, squatting e instâncias concorrentes;
- troca local com cliente Node.js independente somente após leitura limitada, representação, comparação do SID de logon e `RevertToSelf`;
- timeouts e cancelamento de operações overlapped com coleta da conclusão.

A medição de acesso corrigiu a hipótese de que o cliente Node exigiria toda a `FILE_GENERIC_WRITE`. A máscara ampla `0x0012019F` contém `READ_CONTROL` e o bit compartilhado por `FILE_APPEND_DATA`/`FILE_CREATE_PIPE_INSTANCE`, portanto foi mantida como `blocked`. O cliente `node:net` concluiu o fluxo com a máscara específica `0x0010019B`:

```text
FILE_READ_DATA | FILE_WRITE_DATA |
FILE_READ_EA | FILE_WRITE_EA |
FILE_READ_ATTRIBUTES | FILE_WRITE_ATTRIBUTES |
SYNCHRONIZE
```

Testes removeram individualmente cada direito dessa máscara e observaram rejeição do cliente. Assim, ela é a máscara mínima comprovada para o runtime testado e não inclui `FILE_CREATE_PIPE_INSTANCE`, `READ_CONTROL`, `WRITE_DAC`, `WRITE_OWNER`, `DELETE` ou controle total.

M01–M14 e M19 foram automatizados localmente. M15, M16 e M17 continuam pendentes por exigirem outra conta, outra sessão/logon e outra máquina reais. A prova não altera esta ADR para `accepted`, não conclui a Etapa 2 e não autoriza Etapa 3.

## Arquitetura candidata

Se um toolchain aprovado estiver disponível, a prova deve ser implementada como um executável Win32 pequeno e isolado, proprietário do handle do pipe.

### Identidade autorizada

O helper deve:

1. abrir o token do próprio processo com `TOKEN_QUERY`;
2. obter `TokenGroups` com `GetTokenInformation`;
3. localizar exatamente o grupo marcado com `SE_GROUP_LOGON_ID`;
4. copiar esse SID antes de liberar o buffer do token;
5. usar o SID de logon, e não `TokenUser`, nome de usuário ou nome aleatório do pipe, como principal autorizado.

O SID real não deve aparecer em logs, relatórios ou artefatos. Evidências persistidas devem substituí-lo por `<SID_LOGON>`.

### DACL na criação

Antes de chamar `CreateNamedPipeW`, o helper deve montar um descritor de segurança protegido com uma única ACE de permissão para o SID de logon. A ACE deve conceder apenas os direitos necessários para o cliente duplex usado por `node:net`, sem `WRITE_DAC`, `WRITE_OWNER`, `DELETE` ou controle total.

Não devem existir ACEs para `Everyone`, `Anonymous`, `Authenticated Users`, `BUILTIN\\Users`, administradores ou para o SID permanente do usuário. O descritor deve ser fornecido em `SECURITY_ATTRIBUTES.lpSecurityDescriptor`, com `bInheritHandle = FALSE`, na primeira chamada de criação. Ajustar a DACL depois da criação permanece proibido.

O acesso duplex de cliente do libuv solicita leitura e escrita genéricas. No mapeamento de direitos de Named Pipe, escrita genérica também inclui `FILE_CREATE_PIPE_INSTANCE`. Esse efeito deve ser registrado como risco e mitigado por primeira instância obrigatória, instância única, nome efêmero e falha fechada; ele não deve ser omitido do relatório.

### Flags obrigatórios

A chamada candidata é equivalente a:

```text
CreateNamedPipeW(
  nomeTemporario,
  PIPE_ACCESS_DUPLEX | FILE_FLAG_FIRST_PIPE_INSTANCE | FILE_FLAG_OVERLAPPED,
  PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT | PIPE_REJECT_REMOTE_CLIENTS,
  1,
  4096,
  4096,
  3000,
  &securityAttributes
)
```

O nome deve ser efêmero, sem dados pessoais. Aleatoriedade e o segmento `LOCAL` reduzem colisões acidentais, mas não são controles de acesso.

### Inspeção antes de aceitar clientes

Logo após `CreateNamedPipeW` e antes de sinalizar prontidão, o próprio helper deve:

- consultar o descritor efetivo com `GetSecurityInfo` e `SE_KERNEL_OBJECT`;
- confirmar DACL presente, não nula, protegida e não herdada;
- enumerar todas as ACEs com `GetAclInformation` e `GetAce`;
- exigir uma única ACE permitida para o SID de logon e máscara compatível com o mínimo definido;
- confirmar a ausência de principals adicionais e de ACEs desconhecidas;
- confirmar com `GetHandleInformation` que o handle não é herdável;
- fechar o handle e retornar `blocked` diante de qualquer divergência.

Após a conexão, o helper lê somente um frame diagnóstico limitado a 64 bytes e ainda não autorizado. Em seguida, `ImpersonateNamedPipeClient` representa o contexto da última mensagem lida; o helper abre o token da thread, extrai o SID de logon do cliente, compara-o ao SID autorizado e executa `RevertToSelf` em todos os caminhos. Somente depois dessa sequência o payload pode ser aceito e uma resposta pode ser enviada.

### Ciclo de vida e protocolo diagnóstico

`ConnectNamedPipe`, `ReadFile` e `WriteFile` devem usar I/O overlapped, eventos próprios, timeout e `CancelIoEx`. Handles devem ser encapsulados com RAII. O helper aceita um frame diagnóstico exclusivo, com comprimento de um byte e payload máximo de 64 bytes, exatamente `PING_GATE`, e responde somente `PONG_GATE`. Uma confirmação interna de um byte após o recebimento do PONG permite encerramento finito sem `FlushFileBuffers` bloqueante. Entrada diferente, truncada, excessiva, lote adicional, segundo cliente ou timeout encerra a conexão sem conteúdo funcional.

`PONG_GATE` é uma constante diagnóstica, não um contrato funcional nem um segredo. Nenhuma mensagem do protocolo `1.0`, dado do workspace, Chrome, Registro ou autenticação HMAC pertence a esta prova.

## Integração futura possível

Caso a prova seja aprovada, a opção de menor acoplamento é um sidecar nativo iniciado pelo Native Messaging Host Node.js:

```text
Chrome <-> stdout/stdin reservado do Native Messaging Host Node.js
                         |
                         +-> stdio privado do helper Win32 <-> Named Pipe seguro <-> IDE
```

O processo Node.js deve criar pipes privados para o subprocesso, nunca usar `inherit`, manter o próprio `stdout` exclusivo para o Chrome e encerrar somente o PID filho que iniciou. Dados e controle do sidecar precisam de framing único; logs sanitizados ficam em `stderr`. Essa integração é apenas uma estratégia documentada e não foi implementada.

## Alternativas avaliadas

### Helper Win32 nativo

Vantagens:

- controle direto de `SECURITY_ATTRIBUTES`, SID de logon, `PIPE_REJECT_REMOTE_CLIENTS` e primeiro handle;
- binário pequeno, sem runtime gerenciado na execução;
- inspeção do mesmo handle por API Win32 pública.

Custos:

- exige MSVC Build Tools e Windows SDK para build;
- artefatos por arquitetura, cadeia de assinatura e possível impacto de SmartScreen;
- maior custo de revisão de memória, I/O overlapped, cancelamento e RAII;
- manutenção específica de Windows para um projeto open source.

### Sidecar .NET

Vantagens:

- memória gerenciada e fluxo assíncrono mais simples;
- empacotamento framework-dependent ou self-contained;
- APIs de ACL de nível mais alto.

Limitações para este gate:

- `PipeOptions.CurrentUserOnly` representa o usuário atual, não comprova isolamento pelo SID de logon;
- `NamedPipeServerStreamAcl.Create` ignora o `PipeSecurity` fornecido quando `CurrentUserOnly` está ativo;
- a API de alto nível não oferece evidência suficiente de `PIPE_REJECT_REMOTE_CLIENTS` para este desenho;
- atender todos os requisitos pode exigir P/Invoke, reduzindo a vantagem de abstração;
- o SDK/runtime .NET moderno não está disponível neste ambiente; publicação self-contained aumenta tamanho e responsabilidade por atualizações do runtime.

### Addon Node-API

Não recomendado para esta prova. Aumentaria o acoplamento com ABI/build do Node.js, exigiria I/O nativo assíncrono dentro do processo e faria uma falha de memória do helper derrubar o Native Messaging Host.

## Recomendação

A arquitetura candidata continua sendo o sidecar Win32 nativo mínimo, não um addon. Essa recomendação permanece `proposed`: existe evidência local positiva do helper nativo (M01–M14, M18–M19 em `pass`), mas a homologação externa (M15–M17) foi postergada como dívida técnica aceita pelo mantenedor.

### Dívidas técnicas aceitas (M15–M17)
O mantenedor decidiu adiar formalmente os testes M15 (outra conta Windows), M16 (outra sessão de logon) e M17 (máquina remota via SMB) devido à indisponibilidade de infraestrutura de laboratório multi-máquina e multi-usuário no ambiente atual. A aprovação dos testes locais está formalmente separada da homologação externa. A POC-05B Etapa 2 permanece em `pending_validation` / `blocked`, não sendo declarada concluída sem a quitação ou deliberação sobre esses critérios no Marco 1.

### Revisão técnica de I/O, timing e CancelIoEx
A verificação por `PeekNamedPipe` atesta a ausência de bytes já presentes no buffer do kernel, mas não garante a rejeição de segundos frames que cheguem assincronamente com atraso após a primeira inspeção. Foi deliberado não incorporar automaticamente janelas arbitrárias de temporização (ex.: 35 ms) no código nativo desta prova, para não introduzir latência desnecessária e para permitir que a implementação definitiva do `@argonauta/ipc` trate exaustivamente potenciais condições de corrida entre cancelamento via `CancelIoEx` e conclusões normais de I/O.

## Referências

- [ADR-0002 — Gate de segurança do Windows Named Pipe com node:net](0002-node-net-security-gate.md)
- [Microsoft — CreateNamedPipeW](https://learn.microsoft.com/pt-br/windows/win32/api/namedpipeapi/nf-namedpipeapi-createnamedpipew)
- [Microsoft — segurança e direitos de acesso de Named Pipes](https://learn.microsoft.com/windows/win32/ipc/named-pipe-security-and-access-rights)
- [Microsoft — GetSecurityInfo](https://learn.microsoft.com/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo)
- [Microsoft — TOKEN_GROUPS e SE_GROUP_LOGON_ID](https://learn.microsoft.com/windows/win32/api/winnt/ns-winnt-token_groups)
- [Microsoft — NamedPipeServerStreamAcl.Create](https://learn.microsoft.com/dotnet/api/system.io.pipes.namedpipeserverstreamacl.create)
- [Microsoft — publicação de aplicações .NET](https://learn.microsoft.com/dotnet/core/deploying/)
