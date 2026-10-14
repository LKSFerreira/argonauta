[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$nomeHost = 'com.argonauta.poc05a'
$caminhoRegistro = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$nomeHost"

if (-not (Test-Path -LiteralPath $caminhoRegistro)) {
    Write-Host 'O Native Messaging Host não está registrado para o usuário atual.'
    exit 0
}

Write-Host 'Esta operação removerá somente a chave de Registro da POC-05A no usuário atual.'
Write-Host "Chave: $caminhoRegistro"
$confirmacao = Read-Host 'Digite DESINSTALAR para confirmar'

if ($confirmacao -cne 'DESINSTALAR') {
    Write-Host 'Desinstalação cancelada; o Registro do Windows não foi alterado.'
    exit 0
}

Remove-Item -LiteralPath $caminhoRegistro -Recurse -Force
Write-Host 'Registro do Native Messaging Host removido com sucesso.'
