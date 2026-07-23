# Build a fully self-contained index.html — inlines Pretendard, JetBrains Mono, and career background art as base64.
# Fonts are subset to only the glyphs used in portfolio.html (Pretendard 2MB -> ~85KB) via fonttools.
# Falls back to the full font automatically if python/fonttools is unavailable.
# Usage:  powershell -ExecutionPolicy Bypass -File build.ps1
# Output: index.html — GitHub Pages entry point and Claude artifact source.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcPath = Join-Path $here 'portfolio.html'
$html = Get-Content -Raw -Encoding UTF8 $srcPath

# Return woff2 bytes subset to the characters used in portfolio.html; full font on any failure.
function Get-FontBytes([string]$fullPath) {
  try {
    $out = Join-Path $env:TEMP ('pf_' + [IO.Path]::GetRandomFileName() + '.woff2')
    & python -m fontTools.subset $fullPath "--text-file=$srcPath" --flavor=woff2 "--layout-features=*" "--output-file=$out"
    if (($LASTEXITCODE -eq 0) -and (Test-Path $out)) {
      $bytes = [IO.File]::ReadAllBytes($out)
      Remove-Item $out -Force -ErrorAction SilentlyContinue
      return ,$bytes
    }
  } catch { }
  Write-Host ('  subset skipped (' + (Split-Path $fullPath -Leaf) + ') - using full font')
  return ,([IO.File]::ReadAllBytes($fullPath))
}

# Fonts (base64 data URIs, subset)
$fonts = [ordered]@{
  '__PRETENDARD_WOFF2_BASE64__' = 'fonts\PretendardVariable.woff2'
  '__JBMONO_WOFF2_BASE64__'     = 'fonts\JetBrainsMono.woff2'
}
foreach ($ph in $fonts.Keys) {
  $b64 = [Convert]::ToBase64String((Get-FontBytes (Join-Path $here $fonts[$ph])))
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
Write-Host ('built: ' + $dst + '  (' + [math]::Round((Get-Item $dst).Length/1KB,0) + ' KB)')
