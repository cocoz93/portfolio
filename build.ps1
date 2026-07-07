# Build a fully self-contained index.html by inlining the Pretendard woff2 font as a base64 data URI.
# Usage:  powershell -ExecutionPolicy Bypass -File build.ps1
# Output: index.html — serves as BOTH the GitHub Pages entry point and the Claude artifact source.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $here 'portfolio.html')

# Pretendard variable font
$font = Join-Path $here 'fonts\PretendardVariable.woff2'
$fontB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($font))
$html = $html.Replace('__PRETENDARD_WOFF2_BASE64__', $fontB64)
if ($html.Contains('__PRETENDARD_WOFF2_BASE64__')) { throw 'font placeholder not replaced' }

$dst = Join-Path $here 'index.html'
[IO.File]::WriteAllText($dst, $html, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ("built: " + $dst + "  (" + [math]::Round((Get-Item $dst).Length/1MB,2) + " MB)")
