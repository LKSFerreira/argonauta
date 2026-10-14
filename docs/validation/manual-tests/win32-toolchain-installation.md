# Teste manual — instalação e validação do toolchain Win32 (POC-05B, Etapa 2)

## Estado e escopo

**Estado deste roteiro:** `done` exclusivamente para o pré-requisito ambiental Win32 — T01–T11 foram executados e registrados como `pass` pelo mantenedor em 14/10/2026.

**Estado da POC-05B — Etapa 2:** `blocked`. O helper seguro ainda não foi implementado e os gates de DACL, SID de logon, criação segura desde o primeiro handle e rejeição remota continuam pendentes.

**Autorização do mantenedor:** instalação **manual** do Microsoft C++ Build Tools e de um Windows SDK, exclusivamente para remover o bloqueio ambiental da investigação Win32 da **POC-05B — Etapa 2**. Essa autorização não inclui a instalação automática por agente, a implementação de `@argonauta/ipc`, criação de servidor Named Pipe, autenticação HMAC, integração Chrome, alterações no Registro do Argonauta, commit, push ou início da Etapa 3.

O gate anterior de `node:net` continua **`blocked`**, conforme a [ADR-0002](../../architecture/decisions/0002-node-net-security-gate.md). A [ADR-0003](../../architecture/decisions/0003-win32-named-pipe-security-probe.md) contém a arquitetura candidata Win32, ainda não validada. Este roteiro verifica **somente a disponibilidade e o funcionamento do toolchain**; não valida DACL, SID de logon nem rejeição remota.

## Objetivo

Comprovar em Windows x64 que:

1. o instalador oficial da Microsoft foi obtido e validado;
2. as ferramentas MSVC C++ de x64/x86 e um Windows SDK compatível estão instalados;
3. um ambiente **x64 nativo** localiza `cl.exe`, `link.exe` e `rc.exe` corretos;
4. um programa de diagnóstico temporário compila, vincula e executa com código de saída `0`, incluindo cabeçalhos Win32 e uma referência à API de ACL;
5. a base existente do Argonauta não sofreu regressões e o gate antigo mantém o resultado esperado.

**Resultado do pré-requisito ambiental:** `done`, pois todos os critérios **T01–T11** estão registrados como `pass`, com evidência sanitizada e revisão do mantenedor. **A POC-05B Etapa 2 continua `blocked` até seu próprio gate IPC passar.**

## Pré-requisitos

- Windows 11 x64 ou ambiente Windows x64 compatível; conta com autorização para aprovar o instalador via UAC.
- Conexão à internet para obter os arquivos na origem oficial Microsoft.
- Espaço livre suficiente para a seleção informada pelo instalador; **não presumir tamanho fixo** (o conjunto total varia conforme as opções).
- Repositório Argonauta existente e ambiente Node.js/npm já validado.
- Acesso ao **PowerShell** e ao **Prompt de Comando** no Windows; o Antigravity IDE permanece o ambiente principal de desenvolvimento.
- A instalação é conduzida e confirmada manualmente pelo mantenedor; não executar scripts automatizados de instalação nem alterar as seleções sem revisão.

Não é necessário instalar a IDE Visual Studio, o aplicativo VS Code, .NET SDK, CMake, Ninja ou toolchains alternativas nesta execução.

## Regras de segurança e evidência

- **Não** executar o instalador a partir de links de terceiros, mirrors ou anexos desconhecidos.
- Conferir a assinatura Authenticode do executável baixado. Se a assinatura for inválida, não executar.
- Conferir *nome, versão, componentes e espaço em disco* no resumo do instalador **antes** de selecionar **Instalar**. Se a interface mudar ou os componentes estiverem indisponíveis, registrar `unsupported` ou `fail` e parar para revisão.
- A instalação de Build Tools pode acrescentar componentes e entradas de sistema necessários ao produto Microsoft; isso **não autoriza** editar manualmente o Registro do Windows nem registrar o Native Messaging Host do Argonauta.
- Nenhum teste deve acessar Gemini Web, Chrome, cookies, tokens, credenciais ou arquivos privados do workspace.
- Evidências públicas: somente estados, versões de software e dados técnicos necessários. **Omitir ou mascarar** nome de usuário, e-mail, nome do computador, números de série, SID, caminhos de perfil, nomes de projetos privados e tokens.
- Não enviar saída integral de `set`, `Get-ChildItem Env:`, dumps de Registro ou logs completos do instalador sem revisão e sanitização.
- `pass` é reservado a operação realmente observada; `fail` indica operação presente com erro; `unsupported` indica ausência comprovada de recurso ou ambiente. Campos ainda não executados devem permanecer **`PENDENTE`**, sem inventar resultado.
- Se o Windows solicitar reinício, concluir o reinício antes de validar; anotar somente se ocorreu, sem forçar reinício por script.

## Preparação — antes de instalar

1. No **PowerShell**, dentro da raiz do repositório, execute **somente leitura**:

   ```powershell
   git status --short --branch
   git rev-parse HEAD
   node --version
   npm --version
   [System.Environment]::OSVersion.Version.ToString()
   [System.Environment]::Is64BitOperatingSystem
   Get-PSDrive -Name C | Select-Object Name,Free,Used
   ```

2. Registre o SHA do commit e o estado da árvore. **Não presuma** que a branch está limpa; preserve alterações locais preexistentes e não as inclua em alterações de documentação inadvertidamente.
3. Inspecione a situação anterior dos instaladores, sem instalar nada:

   ```powershell
   $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
   $pastaSdk = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10'
   Test-Path -LiteralPath $vswhere
   Test-Path -LiteralPath $pastaSdk
   ```

4. Registre se cada caminho existe. A ausência antes da instalação é **estado de entrada**, não falha do roteiro.
5. Verifique espaço livre disponível na unidade de instalação escolhida; compare com a **estimativa mostrada pelo instalador**. Pare se não houver espaço suficiente.

## Instalação manual — passos numerados

1. Abra, no navegador, a [página oficial de downloads do Visual Studio](https://visualstudio.microsoft.com/downloads/).
2. Localize **Tools for Visual Studio / Ferramentas para Visual Studio** e selecione **Build Tools for Visual Studio** da versão **estável e com suporte** disponibilizada. Não escolha versão *Preview/Insiders*. Na data deste roteiro, a página disponibiliza a família **2026**; uma versão estável anterior e suportada também pode servir, desde que a versão selecionada seja registrada.
3. Baixe **somente** o instalador oficial. Registre: nome do produto, versão escolhida e se a origem foi `visualstudio.microsoft.com` (não inclua o caminho pessoal de Downloads).
4. Antes de executar, abra o **PowerShell** e selecione manualmente o `.exe` baixado:

   ```powershell
   $arquivoInstalador = (Get-Item -LiteralPath (Read-Host 'Informe o caminho completo do instalador oficial')).FullName
   $assinatura = Get-AuthenticodeSignature -LiteralPath $arquivoInstalador
   $assinatura.Status
      $assinatura.SignerCertificate.Subject
   Get-FileHash -LiteralPath $arquivoInstalador -Algorithm SHA256 | Select-Object Algorithm,Hash
   ```

   **Aceitação:** `Status = Valid` e assinante compatível com **Microsoft**. O SHA-256 é anotado apenas para rastrear o arquivo utilizado; **não** é, isoladamente, prova de autenticidade. Se o certificado ou assinatura forem inesperados, **pare**.
5. Execute o instalador manualmente pelo Explorador de Arquivos. Revise o prompt do Windows/UAC e autorize somente se o editor e o aplicativo forem os esperados.
6. Selecione a carga de trabalho **Desktop development with C++ / Desenvolvimento para desktop com C++** no Visual Studio Installer.
7. Em **Detalhes da instalação / Componentes individuais**, confira que estão selecionados:

   - **MSVC C++ x64/x86 Build Tools** da versão estável escolhida (o nome exato pode variar por versão);
   - **Windows 11 SDK**, em versão compatível disponibilizada pelo instalador (registre o número exato);
   - ferramentas principais de build de C++ para aplicações Windows desktop (incluídas na carga de trabalho).

   Para esta prova, CMake, vcpkg, MFC/ATL, compiladores ARM, workloads web, .NET e SDKs adicionais **não são exigidos**. Não escolha componentes extras apenas por hábito. Caso algum seja dependência obrigatória exibida pelo instalador, documente a inclusão.
8. Revise e registre a versão do Build Tools, versão do MSVC, versão do SDK, pasta/unidade de instalação (sem dados pessoais no relatório), espaço estimado e eventuais dependências obrigatórias.
9. Somente depois da revisão manual, clique em **Instalar**. Aguarde conclusão sem cancelar processos à força.
10. Registre o estado final apresentado pelo instalador. Se solicitar reinicialização, salve o trabalho, reinicie o Windows e retorne a este roteiro. **Não siga adiante em caso de erro.**

## Validação da instalação — PowerShell (somente leitura)

Abra um **novo PowerShell** após a instalação/reinício.

1. Encontre o `vswhere.exe` instalado e a instância com o componente C++ necessário:

   ```powershell
   $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
   if (-not (Test-Path -LiteralPath $vswhere)) { throw 'vswhere.exe não encontrado: instalação incompleta.' }
   $instalacao = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
   if (-not $instalacao) { throw 'Instância com MSVC C++ x64/x86 não encontrada.' }
   $vsDevCmd = Join-Path $instalacao 'Common7\Tools\VsDevCmd.bat'
   if (-not (Test-Path -LiteralPath $vsDevCmd)) { throw 'VsDevCmd.bat não encontrado.' }
   'VSWHERE=PASS'
   'VSDEVCMD=PASS'
   ```

   **Atenção:** não publique o valor bruto de `$instalacao`, pois pode conter caminho personalizado. Se o identificador do componente tiver mudado em uma versão futura, inspecione a instalação pelo próprio Visual Studio Installer e documente a divergência; não marque o teste como aprovado por suposição.
2. Confira a disponibilidade do SDK selecionado:

   ```powershell
   $pastaSdk = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10'
   if (-not (Test-Path -LiteralPath $pastaSdk)) { throw 'Pasta do Windows SDK não encontrada.' }
   Get-ChildItem -LiteralPath (Join-Path $pastaSdk 'Include') -Directory | Select-Object -ExpandProperty Name
   ```

   Registre **apenas os números de versão** listados e confirme que a versão marcada no instalador aparece. A presença de uma pasta, isoladamente, ainda não comprova que o toolchain compila.

## Validação da compilação — Prompt de Comando x64

1. No menu Iniciar, abra **x64 Native Tools Command Prompt** correspondente à **mesma versão estável do Build Tools** instalada. Não confunda com um terminal PowerShell comum. Se o atalho não existir, abra `cmd.exe` e execute o `VsDevCmd.bat` localizado no passo anterior, usando a localização verdadeira da instalação:

   ```bat
   call "CAMINHO_REAL_DO_VsDevCmd.bat" -no_logo -arch=x64 -host_arch=x64
   ```

   Substitua `CAMINHO_REAL_DO_VsDevCmd.bat` pelo arquivo encontrado; **não execute literalmente o marcador**. O ambiente deve ser preparado no mesmo `cmd.exe` que usará o compilador.
2. Dentro desse **Prompt de Comando x64 Native Tools Command**, execute:

   ```bat
   where cl.exe
   where link.exe
   where rc.exe
   cl.exe /Bv
   echo SDK=%WindowsSDKVersion%
   echo VSCMD_ARCH=%VSCMD_ARG_TGT_ARCH%
   ```

   `cl.exe /Bv` sem arquivo-fonte exibe o inventário detalhado da versão e, em seguida, encerra com o erro **D8003**, pois nenhum arquivo-fonte foi informado. Essa ocorrência é esperada neste comando exploratório e não deve ser registrada como falha da instalação nem como compilação aprovada.

   **Aceitação desta inspeção:** `cl.exe`, `link.exe` e `rc.exe` são encontrados a partir das pastas Microsoft correspondentes; `cl.exe /Bv` exibe a versão antes do D8003 esperado; SDK identificado; arquitetura de destino `x64`. **O `link.exe` do Git for Windows não pode substituir o linker do MSVC.** Não registre caminhos pessoais na evidência.
3. Faça a seguinte **prova temporária, sem abrir um Named Pipe e sem alterar o repositório**. No mesmo prompt:

   ```bat
   mkdir "%TEMP%\argonauta-win32-smoke"
   notepad "%TEMP%\argonauta-win32-smoke\smoke.cpp"
   ```

   No Bloco de Notas, cole exatamente este conteúdo e salve como `smoke.cpp` (sem sufixo `.txt`):

   ```cpp
   #include <windows.h>
   #include <namedpipeapi.h>
   #include <aclapi.h>

   int main() {
       const auto criacaoPipe = &CreateNamedPipeW;
       const auto consultaSeguranca = &GetSecurityInfo;
       const DWORD identificadorProcesso = GetCurrentProcessId();

       return identificadorProcesso != 0 && criacaoPipe != nullptr && consultaSeguranca != nullptr ? 0 : 1;
   }
   ```

   **Esse programa não cria pipe, não consulta ACL real e não valida o gate IPC**: verifica somente disponibilidade do compilador, cabeçalhos, bibliotecas, linker e execução local.
4. Ainda dentro desse **Prompt de Comando x64 Native Tools Command**, valide novamente a versão usando o arquivo diagnóstico já criado. Diferentemente do comando exploratório anterior, esta chamada fornece uma fonte válida e deve terminar sem D8003:

   ```bat
   cd /d "%TEMP%\argonauta-win32-smoke"
   cl.exe /nologo /Bv /c smoke.cpp
   echo CODIGO_BV_COM_FONTE=%ERRORLEVEL%
   ```

   **Aceitação:** inventário de versão apresentado, `CODIGO_BV_COM_FONTE=0` e `smoke.obj` gerado sem erros. Se o código for diferente de `0`, pare e registre a saída sanitizada.

5. Compile, vincule e execute o diagnóstico:

   ```bat
   cd /d "%TEMP%\argonauta-win32-smoke"
   cl.exe /nologo /std:c++20 /W4 /WX /EHsc /utf-8 /sdl /GS /guard:cf smoke.cpp /Fe:smoke.exe /link /INCREMENTAL:NO /DYNAMICBASE /NXCOMPAT /guard:cf Advapi32.lib
   echo CODIGO_COMPILACAO=%ERRORLEVEL%
   ```

   Se `CODIGO_COMPILACAO` for diferente de `0`, **pare** e não execute o binário. Somente após a compilação aprovada, execute no mesmo prompt:

   ```bat
   smoke.exe
   echo CODIGO_SMOKE=%ERRORLEVEL%
   ```

   **Aceitação:** compilação e vinculação sem erros nem avisos tratados como erros; `CODIGO_SMOKE=0`. Se falhar, registre diagnóstico sanitizado e **pare**; não pule para a POC nativa.
6. Não envie nem versione `smoke.cpp`, `smoke.exe`, `.obj` ou pastas temporárias. Após registrar os resultados, remova **somente** `%TEMP%\argonauta-win32-smoke` pelo Explorador de Arquivos. Não execute comandos genéricos de limpeza sobre o workspace.

## Regressões do repositório — depois da instalação

Execute em um **terminal comum do Antigravity IDE**, na raiz do repositório (não é necessário o prompt MSVC). Anote o resultado e código de saída de cada comando:

```powershell
npm run compilar
npm run typecheck
npm test
npm run verificar:fixtures
npm audit --audit-level=high
git diff --check
git status --short --branch
```

Reproduza também **separadamente** o gate antigo:

```powershell
npm run verificar:ipc-security-gate
$LASTEXITCODE
```

**Resultado esperado do gate antigo:** código `2` e `blocked`. Isso é um **`pass` de preservação da evidência antiga**, **não** um `pass` de segurança do `node:net`. Se o resultado inesperadamente mudar, registre `fail` e investigue antes de continuar. Não inclua esse script de saída `2` no conjunto global de testes aprovados.

O número histórico de 77 testes é uma baseline, não quantidade garantida para todo commit futuro; registre o total realmente observado. A instalação de Build Tools não deveria modificar arquivos do repositório; alterações documentais locais preexistentes devem ser preservadas.

## Matriz de verificações — execução concluída

| ID | Critério | Resultado esperado | Resultado executado (`pass` / `fail` / `unsupported`) | Evidência sanitizada |
|---|---|---|---|---|
| T01 | Baseline do repositório registrada | SHA, branch e estado inicial anotados | `pass` | `adcaa60`, `main`, árvore de trabalho limpa, Windows 10.0.26300.0 x64, ~15.1 GB livres |
| T02 | Instalador oficial conferido | Origem Microsoft, assinatura `Valid` | `pass` | Status `Valid`, assinante `CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US`, SHA-256 `5F06F1052F562620F27D0C14C5F9AB9658FF6B6908B35C59755AB14E2EB5A473` |
| T03 | Componentes selecionados corretamente | MSVC x64/x86 + Windows SDK | `pass` | MSVC x64/x86 mais recente, SDK Windows 11 (10.0.26100.8249), AddressSanitizer do MSVC |
| T04 | Instalação finalizada | Instalador sem erros; reboot, se exigido | `pass` | Visual Studio Build Tools 2026 v18.11.0 concluído sem erros, reinício não solicitado |
| T05 | Instalação localizada por `vswhere` | `VSWHERE=PASS` e `VSDEVCMD=PASS` | `pass` | `VSWHERE=PASS` e `VSDEVCMD=PASS` confirmados via PowerShell |
| T06 | SDK inspecionado | Versão instalada localizada | `pass` | Pasta `Include\10.0.26100.0` confirmada em `Windows Kits\10` |
| T07 | Prompt do desenvolvedor x64 | `cl`, linker MSVC, `rc`, SDK, arquitetura x64 | `pass` | `cl.exe` (MSVC 19.51.36260 x64), `link.exe` (14.51.36260.0), `rc.exe` (10.0.26100.0), x64 |
| T08 | Compilação diagnóstica temporária | Sem erros de compilação/vinculação | `pass` | `cl.exe /std:c++20 /guard:cf /sdl /GS /WX` compilado sem avisos ou erros (`CODIGO_COMPILACAO=0`) |
| T09 | Execução diagnóstica | `CODIGO_SMOKE=0`; limpeza temporária confirmada | `pass` | `smoke.exe` executou com `CODIGO_SMOKE=0`; pasta `%TEMP%\argonauta-win32-smoke` removida |
| T10 | Regressões do Argonauta | Build, typecheck, testes, fixtures, audit e diff sem falhas | `pass` | 77 testes aprovados, typecheck nos 3 workspaces OK, fixtures íntegras, audit 0 vulnerabilidades |
| T11 | Gate original preservado | `node:net` segue `blocked`, código `2` | `pass` | `verify-ipc-security-gate.mjs` retornou `blocked` (código `2`), permissões abertas preservadas |

**Regra de resultado geral:** `pass` com todos os onze itens em `pass` e aprovação do mantenedor.

## Classificação das evidências

### Evidência executada pelo mantenedor

Os resultados T01–T11 e o registro de execução abaixo representam operações realizadas localmente pelo mantenedor em 14/10/2026. T01–T09 cobrem ambiente, instalação, localização das ferramentas, compilação e execução do smoke test. T10 e T11 cobrem, respectivamente, as regressões locais do Argonauta e a reprodução do gate histórico `node:net` como `blocked` com código `2`.

A correção documental de `cl.exe /Bv /c smoke.cpp` torna o roteiro reproduzível sem D8003 depois que a fonte existe. Ela não é apresentada retroativamente como um comando adicional executado na evidência original; o T08 permanece sustentado pela compilação completa já registrada com código `0`.

### Confirmação documental

Este documento preserva as versões, o hash do instalador e as evidências sanitizadas informadas pelo mantenedor. A revisão documental confirma coerência entre o estado `done` do pré-requisito ambiental e os onze resultados `pass`; ela não substitui nem amplia os testes manuais executados.

### CI

O workflow `.github/workflows/validation.yml` executa em Windows com Node.js 20: typecheck, testes, verificação das fixtures, auditoria npm e `git diff --check`. Ele não instala nem valida MSVC/Windows SDK, não executa o smoke test C++ e não executa o gate `node:net` de saída deliberadamente bloqueante. Portanto, CI é evidência complementar da base TypeScript, não evidência do pré-requisito ambiental Win32 nem aprovação da POC-05B Etapa 2.

## Diagnóstico de falhas e retomada

| Sintoma | Hipótese a conferir | Ação permitida |
|---|---|---|
| Instalador desconhecido ou assinatura inválida | Origem incorreta ou arquivo adulterado | Parar, descartar o arquivo e obter outro na Microsoft após revisão |
| Windows SDK não selecionável | Componentes/versões indisponíveis | Parar e registrar nome/versão da interface; não instalar outra ferramenta automaticamente |
| `vswhere.exe` ausente | Instalação não finalizada ou caminho alterado | Reabrir o Visual Studio Installer e revisar o estado |
| `vswhere` não retorna instância com C++ | MSVC ausente ou componente diferente | Revisar detalhes da instalação; não inferir sucesso pela existência do produto |
| `cl.exe` não encontrado | Terminal sem ambiente de desenvolvimento | Abrir x64 Native Tools Command Prompt; não editar `PATH` global |
| `link.exe` aponta para Git | Prompt errado/ordem de `PATH` | Reabrir o prompt x64 da Microsoft, verificar `where link.exe` |
| `rc.exe` ou headers Win32 ausentes | SDK incompleto | Revisar o componente Windows SDK no instalador |
| Falha com `/guard:cf` | Toolchain/SDK incompleto ou incompatível | Registrar saída sanitizada e propor ajuste documentado; não omitir flags silenciosamente |
| Smoke retorna diferente de `0` | Ferramentas ou ambiente inadequados | Preservar erro sanitizado; gate do toolchain reprovado |
| Regressões falham | Dependência, ambiente ou mudança preexistente | Diagnosticar e registrar antes de retomar a implementação |
| Gate `node:net` muda para código `0` | Resultado incompatível com baseline | Parar e auditar o comportamento; não concluir que segurança foi resolvida |

Não executar desinstalação, limpeza ampla, reparação invasiva, alteração de políticas de execução ou mudança do Registro sem nova revisão/consentimento.

## Registro da execução realizada pelo mantenedor

| Campo | Valor observado |
|---|---|
| Data/hora (fuso informado) | 2026-10-14 14:50 -03:00 |
| Responsável pela execução | Mantenedor do projeto |
| Branch / HEAD local | `main` / `adcaa6013e3b22773d1c0306f2fd98726b90c4e6` |
| Git `status` inicial / final | working tree limpa (commit `adcaa60`) / `.gitignore` atualizado e roteiro documentado |
| Windows (versão e arquitetura) | 10.0.26300.0, 64-bit |
| Espaço livre inicial em C: | ~15,1 GB (15.107.166.208 bytes) |
| Ferramentas prévias (`vswhere` / `Windows Kits`) | `False` / `False` (ambiente inicial limpo) |
| Node.js e npm | Node `v24.16.0`, npm `11.13.0` |
| Produto/versão Build Tools | Ferramentas de Build do Visual Studio 2026 (v18.11.0, outubro 2026) |
| MSVC (saída de versão sanitizada) | `Microsoft (R) C/C++ Optimizing Compiler Version 19.51.36260 for x64` (Tools `14.51.36231`) |
| Windows SDK instalado | `10.0.26100.8249` (Windows 11 SDK `10.0.26100.0`) |
| Reinício solicitado/concluído | Não solicitado |
| Origem e assinatura do instalador | Microsoft Corporation (`Status = Valid`, `CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US`) |
| Hash SHA-256 do instalador (opcional) | `5F06F1052F562620F27D0C14C5F9AB9658FF6B6908B35C59755AB14E2EB5A473` |
| `VSWHERE` / `VSDEVCMD` | `VSWHERE=PASS` e `VSDEVCMD=PASS` |
| `cl`, `link`, `rc`, arquitetura | `cl.exe` (19.51.36260), `link.exe` (14.51.36260.0), `rc.exe` (10.0.26100.0), arquitetura x64 |
| Smoke: compilação / execução / limpeza | `CODIGO_COMPILACAO=0`, `CODIGO_SMOKE=0`, limpeza temporária confirmada (`false`) |
| Regressões: quantidade e estado | 77 testes aprovados (protocolo: 46, probe: 11, smoke: 13, integração: 7); typecheck e fixtures OK |
| Gate antigo: estado/código | Preservado como `blocked` (código `2`) em `verify-ipc-security-gate.mjs` |
| Resultado geral da instalação | `pass` (todos os 11 critérios T01–T11 aprovados) |
| Evidências sanitizadas anexadas/referenciadas | Registradas neste documento e logs de execução |
| Revisão e aprovação explícita do mantenedor | Mantenedor presente e acompanhando a execução |

## Encerramento e próximo gate

Com T01–T11 aprovados e o registro revisado, **o pré-requisito ambiental de toolchain está `done`**. Esse estado se limita à disponibilidade e ao funcionamento de MSVC/Windows SDK e **não** altera a situação `blocked` da POC-05B Etapa 2.

Somente após a confirmação do mantenedor, o próximo trabalho, **ainda dentro da Etapa 2**, será preparar e executar o helper diagnóstico Win32 definido pela ADR-0003, com criação de Named Pipe segura desde o primeiro handle, DACL efetiva, SID de logon, `PIPE_REJECT_REMOTE_CLIENTS`, testes negativos e regressões. Nada autoriza iniciar a Etapa 3.

## Fontes e referências

- [Microsoft — Downloads do Visual Studio (Build Tools)](https://visualstudio.microsoft.com/downloads/).
- [Microsoft Learn — Instalar as ferramentas MSVC](https://learn.microsoft.com/pt-br/cpp/overview/acquire-msvc?view=msvc-170).
- [Microsoft Learn — Ferramentas de compilação na linha de comando](https://learn.microsoft.com/pt-br/cpp/build/building-on-the-command-line?view=msvc-170).
- [Microsoft Learn — Componentes das Build Tools](https://learn.microsoft.com/pt-br/visualstudio/install/workload-component-id-vs-build-tools?view=visualstudio).
- [Microsoft — vswhere / localização do MSVC](https://github.com/microsoft/vswhere/wiki/Find-VC).
- [ADR-0003 — arquitetura candidata Win32](../../architecture/decisions/0003-win32-named-pipe-security-probe.md).
- [Relatório anterior de viabilidade Win32](../ipc-win32-feasibility.md).
- [Regras dos testes manuais](README.md).
