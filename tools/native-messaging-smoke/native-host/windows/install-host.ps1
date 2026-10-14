[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$nomeHost = 'com.argonauta.poc05a'
$origemPermitida = 'chrome-extension://kmhnfligldbfbjmdmodckpmbnfmehfba/'
$caminhoManifesto = Join-Path $PSScriptRoot "$nomeHost.json"
$caminhoRegistro = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$nomeHost"

if (-not (Test-Path -LiteralPath $caminhoManifesto -PathType Leaf)) {
    throw "Manifesto do Native Messaging Host não encontrado: $caminhoManifesto"
}

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw 'Node.js não foi encontrado no PATH. Instale ou configure o Node.js antes de continuar.'
}

$manifesto = Get-Content -Raw -LiteralPath $caminhoManifesto | ConvertFrom-Json
if ($manifesto.allowed_origins.Count -ne 1 -or $manifesto.allowed_origins[0] -ne $origemPermitida) {
    throw 'O manifesto não restringe allowed_origins ao identificador esperado da extensão.'
}

Write-Host 'Esta operação registrará o host somente para o usuário atual (HKCU).'
Write-Host "Chave: $caminhoRegistro"
Write-Host "Manifesto: $caminhoManifesto"
$confirmacao = Read-Host 'Digite INSTALAR para confirmar'

if ($confirmacao -cne 'INSTALAR') {
    Write-Host 'Instalação cancelada; o Registro do Windows não foi alterado.'
    exit 0
}

New-Item -Path $caminhoRegistro -Force | Out-Null
Set-Item -Path $caminhoRegistro -Value ([System.IO.Path]::GetFullPath($caminhoManifesto))

Write-Host 'Native Messaging Host registrado com sucesso para o usuário atual.'
