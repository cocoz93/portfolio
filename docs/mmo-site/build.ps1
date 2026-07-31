# mmo.src.html(셸) + parts/* -> index.html : 조각을 합친 뒤
# Pretendard/JetBrains Mono를 사용 글리프만 서브셋해 base64 인라인.
# python + fontTools 없으면 전체 폰트로 폴백. Usage: powershell -ExecutionPolicy Bypass -File build.ps1
# -Fast: 폰트 서브셋(python) 생략 → 통짜 폰트 인라인, _preview.html 로 출력(빠른 렌더 검증용). index.html 은 안 건드림.
param([switch]$Fast,[switch]$NoSync)
$ErrorActionPreference = 'Stop'
$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
$src   = Join-Path $here 'mmo.src.html'
$parts = Join-Path $here 'parts'
$utf8  = New-Object Text.UTF8Encoding($false)
$html  = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)

# 셸의 <!--#include xxx --> 를 parts/ 조각으로 채운다.
# 조각 순서(= IIFE 실행 순서)는 셸이 들고 있다 — 여기서 순서를 정하지 않는 이유가 그것이다.
# -replace 를 안 쓰는 까닭: 치환문자열의 $1 ${x} $& 를 해석하므로 조각에 JS 템플릿 리터럴이
# 한 줄만 들어와도 조용히 깨진다. MatchEvaluator 는 그런 해석을 하지 않는다.
$used = @{}
$html = [regex]::Replace($html, '(?m)^[ \t]*<!--#include[ \t]+(\S+)[ \t]*-->\r?\n', {
  param($m)
  $name = $m.Groups[1].Value
  $p = Join-Path $parts $name
  if (-not (Test-Path $p)) { throw "part not found: $p" }
  $used[$name] = $true
  [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)
})
if ($html -match '<!--#include') { throw 'unreplaced include marker' }
# 조각은 고쳤는데 셸에 마커를 안 넣어 반영이 안 되는 사고를 여기서 잡는다
$orphan = @(Get-ChildItem $parts -File | Where-Object { $_.Extension -in '.css','.js','.html' } |
            Select-Object -ExpandProperty Name | Where-Object { -not $used.ContainsKey($_) })
if ($orphan.Count) { throw ('part not included by shell: ' + ($orphan -join ', ')) }

function Get-FontB64([string]$full) {
  if ($Fast) { return [Convert]::ToBase64String([IO.File]::ReadAllBytes($full)) }
  try {
    $out = Join-Path $env:TEMP ('mf_' + [IO.Path]::GetRandomFileName() + '.woff2')
    & python -m fontTools.subset $full "--text-file=$textFile" --flavor=woff2 "--layout-features=*" "--output-file=$out"
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
# 서브셋에 넘길 텍스트는 '합쳐진 전체 HTML' 이다. 셸만 넘기면 본문이 없어 한글 글리프가 통째로 빠진다.
# 반드시 UTF-8 로 쓸 것 — Out-File/Set-Content 는 UTF-16LE 나 CP949 로 쓰고, 그러면 fontTools 가
# exit=1 로 죽는다. Get-FontB64 는 그 실패를 조용히 삼켜 통짜 폰트로 폴백하므로(산출물 594KB -> 4MB)
# 콘솔에는 'subset skipped' 한 줄만 남는다. 루프 밖에서 한 번만 쓰는 이유는, 안에서 쓰면 두 번째
# 호출 때 이미 치환된 첫 폰트의 base64 가 텍스트에 섞이기 때문이다.
$textFile = Join-Path $env:TEMP ('mmotext_' + [IO.Path]::GetRandomFileName() + '.html')
[IO.File]::WriteAllText($textFile, $html, $utf8)
try {
  foreach ($ph in $map.Keys) {
    $b64 = Get-FontB64 $map[$ph]
    $html = $html.Replace($ph, $b64)
    if ($html.Contains($ph)) { throw "$ph not replaced" }
  }
} finally { Remove-Item $textFile -Force -ErrorAction SilentlyContinue }

$outName = if ($Fast) { '_preview.html' } else { 'index.html' }
$outPath = Join-Path $here $outName
[IO.File]::WriteAllText($outPath, $html, (New-Object Text.UTF8Encoding($false)))
Write-Host ('Built ' + $outPath + ' (' + [Math]::Round((Get-Item $outPath).Length/1kb) + ' KB)')
# 서브셋이 폴백하면 산출물이 4배로 부푸는데 그때도 스크립트는 '성공' 한다 — 크기로 잡는다
if (-not $Fast -and (Get-Item $outPath).Length -gt 900kb) {
  Write-Warning 'output > 900KB - font subset fell back to the full font. check before commit'
}

# 풀 빌드(-Fast 아님)는 곧 "이 그림을 내보낸다"는 뜻이므로, 포폴 홈에 박힌 정지컷도 같이 맞춘다.
# 두 산출물이 어긋난 채 커밋되면 같은 사이트에 같은 그림이 두 버전으로 남는다 (실제로 한 커밋 밀려 있었다).
# -Fast 는 _preview.html 만 만드는 반복 확인용이라 건드리지 않는다. -NoSync 로 이번만 건너뛸 수 있다.
if (-not $Fast -and -not $NoSync) {
  $sync = Join-Path $here '..\sync-scene.ps1'
  if (Test-Path $sync) {
    Write-Host '[build] syncing portfolio home cut ...'
    & powershell -ExecutionPolicy Bypass -File $sync
  } else {
    Write-Host '[build] sync-scene.ps1 not found - portfolio home cut left as is'
  }
}
