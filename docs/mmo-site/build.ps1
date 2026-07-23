# mmo.src.html -> index.html : Pretendard/JetBrains Mono를 사용 글리프만 서브셋해 base64 인라인.
# python + fontTools 없으면 전체 폰트로 폴백. Usage: powershell -ExecutionPolicy Bypass -File build.ps1
# -Fast: 폰트 서브셋(python) 생략 → 통짜 폰트 인라인, _preview.html 로 출력(빠른 렌더 검증용). index.html 은 안 건드림.
param([switch]$Fast)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $here 'mmo.src.html'
$html = Get-Content -Raw -Encoding UTF8 $src

function Get-FontB64([string]$full) {
  if ($Fast) { return [Convert]::ToBase64String([IO.File]::ReadAllBytes($full)) }
  try {
    $out = Join-Path $env:TEMP ('mf_' + [IO.Path]::GetRandomFileName() + '.woff2')
    & python -m fontTools.subset $full "--text-file=$src" --flavor=woff2 "--layout-features=*" "--output-file=$out"
    if (($LASTEXITCODE -eq 0) -and (Test-Path $out)) {
      $b = [IO.File]::ReadAllBytes($out)
      Remove-Item $out -Force -ErrorAction SilentlyContinue
      Write-Host ('  subset ' + (Split-Path $full -Leaf) + ' -> ' + [Math]::Round($b.Length/1kb) + ' KB')
      return [Convert]::ToBase64String($b)
    }
  } catch { }
  Write-Host ('  subset skipped (' + (Split-Path $full -Leaf) + ') - full font')
  return [Convert]::ToBase64String([IO.File]::ReadAllBytes($full))
}

$map = [ordered]@{
  '__PRETENDARD_WOFF2_BASE64__' = (Join-Path $here 'fonts\PretendardVariable.woff2')
  '__JBMONO_WOFF2_BASE64__'     = (Join-Path $here 'fonts\JetBrainsMono.woff2')
}
foreach ($ph in $map.Keys) {
  $b64 = Get-FontB64 $map[$ph]
  $html = $html.Replace($ph, $b64)
  if ($html.Contains($ph)) { throw "$ph not replaced" }
}

$outName = if ($Fast) { '_preview.html' } else { 'index.html' }
$outPath = Join-Path $here $outName
[IO.File]::WriteAllText($outPath, $html, (New-Object Text.UTF8Encoding($false)))
Write-Host ('Built ' + $outPath + ' (' + [Math]::Round((Get-Item $outPath).Length/1kb) + ' KB)')
