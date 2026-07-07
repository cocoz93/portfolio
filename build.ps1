# Build a fully self-contained index.html — inlines Pretendard, JetBrains Mono, and career background art as base64.
# Usage:  powershell -ExecutionPolicy Bypass -File build.ps1
# Output: index.html — GitHub Pages entry point and Claude artifact source.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $here 'portfolio.html')

# Fonts (base64 data URIs)
$fonts = [ordered]@{
  '__PRETENDARD_WOFF2_BASE64__' = 'fonts\PretendardVariable.woff2'
  '__JBMONO_WOFF2_BASE64__'     = 'fonts\JetBrainsMono.woff2'
}
foreach ($ph in $fonts.Keys) {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $here $fonts[$ph])))
  $html = $html.Replace($ph, $b64)
  if ($html.Contains($ph)) { throw "$ph not replaced" }
}

# Career card background art (resized JPEGs) — data URI mime prefix is already in the HTML
$artFiles = [ordered]@{
  '__ART_RAG__'      = 'art\rag.jpg'
  '__ART_DNF__'      = 'art\dnf.jpg'
  '__ART_PROJECTR__' = 'art\projectr.jpg'
}
foreach ($ph in $artFiles.Keys) {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $here $artFiles[$ph])))
  $html = $html.Replace($ph, $b64)
  if ($html.Contains($ph)) { throw "$ph not replaced" }
}

$dst = Join-Path $here 'index.html'
[IO.File]::WriteAllText($dst, $html, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ("built: " + $dst + "  (" + [math]::Round((Get-Item $dst).Length/1MB,2) + " MB)")
