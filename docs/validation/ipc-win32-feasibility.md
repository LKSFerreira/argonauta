# Investigação de viabilidade — helper Win32 para o gate IPC

## Resultado

**Estado:** `blocked` em 14/10/2026 por ausência de toolchain C/C++ Win32 e Windows SDK no ambiente autorizado.

A investigação confirmou o desenho técnico necessário, mas não produziu nem executou um helper. A DACL segura, a rejeição remota e a criação protegida desde o primeiro handle não foram comprovadas. Pela condição de parada, a implementação integral da POC-05B Etapa 2 não foi iniciada.

O resultado anterior do servidor `node:net` permanece `blocked` e foi reproduzido sem alterações.

## Escopo efetivamente executado

- leitura das diretrizes, arquitetura, ADR-0002, validação anterior e modelo de ameaças;
- inspeção de `HEAD`, branch, histórico recente e estado do working tree;
- inventário somente leitura do toolchain e SDK;
- reprodução do gate `node:net` existente;
- compilação TypeScript, typecheck, 77 testes, fixtures e auditoria npm;
- inspeção de pipes residuais após o gate;
- análise das APIs públicas Win32 e comparação arquitetural com sidecar .NET.

Não houve instalação, mudança no Registro, acesso ao Chrome, Gemini Web, sessão, credencial, workspace da IDE ou interface de rede.

## Estado do repositório antes da investigação

| Item | Evidência |
|---|---|
| Branch | `main` |
| HEAD | `5976d397a0a8372c0f99aa06e6eaf6d30e422c12` |
| Relação remota | alinhada a `origin/main` |
| Working tree | limpa |
| Mudanças preexistentes | nenhuma mudança local; `README.md` não foi modificado |

## Ambiente

| Item | Resultado |
|---|---|
| Sistema | Windows 11 Pro `10.0.26300`, x64 |
| Node.js | `v24.16.0` |
| npm | `11.13.0` |
| libuv | `1.52.1` |
| MSVC/Build Tools | não encontrado |
| Windows SDK | não encontrado |
| CMake/Ninja | não encontrados |
| LLVM/Clang | não encontrado |
| MinGW/GCC | não encontrado |
| .NET SDK moderno | não encontrado |
| .NET Framework | 4.8 disponível, sem adoção nesta investigação |

O `link.exe` encontrado no `PATH` pertence ao Git for Windows e não é um linker C/C++ Win32 utilizável com o SDK da Microsoft.

## Comandos de inspeção do ambiente

Os comandos abaixo são somente leitura e podem reproduzir a detecção:

```powershell
where.exe cl.exe
where.exe msbuild.exe
where.exe vswhere.exe
where.exe rc.exe
where.exe cmake.exe
where.exe ninja.exe
where.exe clang-cl.exe
where.exe gcc.exe
where.exe g++.exe

Test-Path "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
Test-Path "${env:ProgramFiles(x86)}\Windows Kits\10"
Test-Path "$env:ProgramFiles\Microsoft Visual Studio"
Test-Path "${env:ProgramFiles(x86)}\Microsoft Visual Studio"
```

Todos os compiladores, ferramentas e diretórios necessários retornaram ausentes. Nenhum instalador foi executado.

## Gate `node:net` preservado

Comando executado:

```powershell
npm run verificar:ipc-security-gate
```

Resultado esperado e observado: código de saída `2`, estado `blocked`.

| Verificação | Resultado observado |
|---|---|
| Comunicação local `PING_GATE`/`PONG_GATE` | `pass` |
| DACL inspecionada | `pass` para inspeção |
| DACL restrita | `fail` |
| SID de logon presente | `false` |
| `Everyone` com leitura | `true` |
| `Anonymous` com leitura | `true` |
| `\\localhost\pipe\...` | conectou e recebeu `PONG_GATE` |
| Segunda instância | rejeitada com `EADDRINUSE` |
| Pipe residual após encerramento | nenhum |

DACL efetiva sanitizada do pipe criado por `node:net`:

```text
O:<SID_IDENTIDADE>G:<SID_IDENTIDADE>D:(A;;FR;;;WD)(A;;FR;;;AN)(A;;FA;;;SY)(A;;FA;;;BA)(A;;FA;;;<SID_IDENTIDADE>)
```

Essa evidência pertence somente ao gate antigo. Ela não é apresentada como DACL do helper Win32, pois o helper não foi construído.

## Matriz da prova Win32

| Verificação exigida | Estado | Evidência |
|---|---|---|
| Descritor explícito em `SECURITY_ATTRIBUTES` antes da criação | `blocked` | Sem binário compilável para executar `CreateNamedPipeW`. |
| DACL efetiva por `GetSecurityInfo` | `blocked` | Nenhum handle Win32 seguro foi criado. |
| Única ACE para SID de logon | `blocked` | Não executado; SID de usuário não foi confundido com SID de logon. |
| Ausência de `Everyone`, `Anonymous` e outros principals | `blocked` | Não executado no helper. |
| Handle não herdável | `blocked` | Não executado no helper. |
| `PIPE_REJECT_REMOTE_CLIENTS` aplicado | `blocked` | Não executado no helper. |
| Cliente Node.js local autorizado | `blocked` | Não existe servidor Win32 compilado. |
| Rejeição de `\\localhost\pipe\...` | `blocked` | Não existe servidor Win32 compilado. |
| Pipe squatting e primeira instância | `blocked` | Não executado. |
| Criação concorrente e segunda instância | `blocked` | Não executado. |
| Encerramento abrupto, timeout e limpeza do helper | `blocked` | Não executado. |
| Máquina remota real | `pending_manual_validation` | Ambiente remoto não disponibilizado. |
| Outra conta Windows | `pending_manual_validation` | Conta secundária não disponibilizada. |
| Outra sessão/logon | `pending_manual_validation` | Sessão secundária não disponibilizada. |

Nenhuma linha `blocked` ou `pending_manual_validation` deve ser reinterpretada como aprovação.

## Regressões executadas

| Comando | Resultado |
|---|---|
| `npm run compilar` | `pass`, código `0` |
| `npm run typecheck` | `pass`, código `0` |
| `npm test` | `pass`, 77 testes e 0 falhas |
| `npm run verificar:fixtures` | `pass`, PING/PONG preservados |
| `npm audit --audit-level=high` | `pass`, 0 vulnerabilidades |
| `git diff --check` após a documentação | `pass` |

Distribuição dos testes:

- protocolo: 46;
- probe de compatibilidade: 11;
- POC-05A Native Messaging: 13;
- integração/fixtures: 7.

Hashes preservados:

- PING: `414061fd7df7c40fa1686903b5a1781636042c75fd858383c45c39973b2328cd`;
- PONG: `4c9bbe64c0dc3fc163a9200dfbf45d9de65e20d121dafa9d4017087dc84af392`.

## Comandos propostos para uma retomada autorizada

Quando MSVC Build Tools e Windows SDK estiverem disponíveis, a localização e inicialização do ambiente podem ser feitas sem exigir o aplicativo Visual Studio:

```powershell
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$instalacao = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
$vsDevCmd = Join-Path $instalacao 'Common7\Tools\VsDevCmd.bat'
cmd.exe /d /s /c "`"$vsDevCmd`" -no_logo -arch=x64 -host_arch=x64 && cl.exe /Bv"
```

Com o código da POC previamente revisado, a compilação endurecida de um executável simples pode usar:

```powershell
cl.exe /nologo /std:c++20 /W4 /WX /EHsc /permissive- /utf-8 /sdl /GS /guard:cf /O2 /MT /DUNICODE /D_UNICODE /D_WIN32_WINNT=0x0A00 src\main.cpp src\logon-security.cpp src\named-pipe-server.cpp /Fe:build\ipc-security-probe.exe /link /INCREMENTAL:NO /DYNAMICBASE /NXCOMPAT /HIGHENTROPYVA /guard:cf Advapi32.lib
```

Esses comandos são uma proposta de retomada e não foram executados. O repositório não contém ainda os fontes citados.

## Testes obrigatórios quando a prova puder ser executada

1. inspecionar DACL e handle antes de sinalizar prontidão;
2. concluir `PING_GATE`/`PONG_GATE` por processo Node.js independente;
3. rejeitar `\\localhost\pipe\...` sem retornar payload;
4. iniciar um squatter antes do helper e confirmar falha fechada;
5. tentar segunda instância e criação concorrente;
6. enviar mensagens inválidas, excessivas e truncadas;
7. provocar cliente silencioso, queda do cliente e encerramento abrupto do helper;
8. repetir execuções e confirmar ausência de PID, handle e pipe residual;
9. executar manualmente em máquina remota real, outra conta e outra sessão/logon.

## Decisão e próxima ação

A POC-05B Etapa 2 permanece `blocked`. A arquitetura candidata está documentada na [ADR-0003](../architecture/decisions/0003-win32-named-pipe-security-probe.md), mas não aprovada nem validada.

Antes de criar `tools/ipc-security-probe/`, é necessária uma decisão explícita do mantenedor sobre toolchain nativo ou investigação .NET. A implementação definitiva do transporte e a Etapa 3 continuam fora do escopo.
