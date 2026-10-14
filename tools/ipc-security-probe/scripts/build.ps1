$ErrorActionPreference = 'Stop'

$pastaProjeto = Split-Path -Parent $PSScriptRoot
$pastaBuild = Join-Path $pastaProjeto 'build'
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'

if (-not (Test-Path -LiteralPath $vswhere)) {
    throw 'vswhere.exe não foi encontrado. O pré-requisito MSVC não está disponível.'
}

$instalacao = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $instalacao) {
    throw 'Uma instalação MSVC com ferramentas C++ x64/x86 não foi encontrada.'
}

$vsDevCmd = Join-Path $instalacao 'Common7\Tools\VsDevCmd.bat'
if (-not (Test-Path -LiteralPath $vsDevCmd)) {
    throw 'VsDevCmd.bat não foi encontrado na instalação MSVC selecionada.'
}

New-Item -ItemType Directory -Path $pastaBuild -Force | Out-Null

$fontes = @(
    (Join-Path $pastaProjeto 'src\main.cpp'),
    (Join-Path $pastaProjeto 'src\seguranca-logon.cpp'),
    (Join-Path $pastaProjeto 'src\servidor-pipe-nomeado.cpp')
)
$executavel = Join-Path $pastaBuild 'ipc-security-probe.exe'
$argumentosFontes = ($fontes | ForEach-Object { '"' + $_ + '"' }) -join ' '
$comando = '"' + $vsDevCmd + '" -no_logo -arch=x64 -host_arch=x64 && cl.exe /nologo /std:c++20 /W4 /WX /EHsc /permissive- /utf-8 /sdl /GS /guard:cf /O2 /MT /DUNICODE /D_UNICODE /D_WIN32_WINNT=0x0A00 ' + $argumentosFontes + ' /Fe:"' + $executavel + '" /Fo:"' + $pastaBuild + '\\" /link /INCREMENTAL:NO /DYNAMICBASE /NXCOMPAT /HIGHENTROPYVA /guard:cf Advapi32.lib Bcrypt.lib'

& cmd.exe /d /s /c $comando
if ($LASTEXITCODE -ne 0) {
    throw "A compilação nativa falhou com código $LASTEXITCODE."
}

Write-Output 'COMPILACAO_WIN32=PASS'
