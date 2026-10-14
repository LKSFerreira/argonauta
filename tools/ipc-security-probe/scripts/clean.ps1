$ErrorActionPreference = 'Stop'

$pastaProjeto = Split-Path -Parent $PSScriptRoot
$pastaBuild = Join-Path $pastaProjeto 'build'

if (Test-Path -LiteralPath $pastaBuild) {
    $caminhoProjeto = [System.IO.Path]::GetFullPath($pastaProjeto)
    $caminhoBuild = [System.IO.Path]::GetFullPath($pastaBuild)

    if (-not $caminhoBuild.StartsWith($caminhoProjeto + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'A pasta de build resolvida está fora do projeto do probe.'
    }

    Remove-Item -LiteralPath $caminhoBuild -Recurse -Force
}
