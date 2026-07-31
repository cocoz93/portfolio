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

# 같은 페이지를 여러 진입 경로로 낸다. 경로 목록은 entries.local.txt 에서 읽는다.
# 그 파일은 git 에 올라가지 않는다 - 여기(공개 저장소)에 목록을 박아두지 않으려는 것이다.
# 파일이 없으면 이 단계는 통째로 건너뛴다. 다른 PC 에서 클론해 빌드해도 실패하지 않게.
$listPath = Join-Path $here 'entries.local.txt'
if (Test-Path $listPath) {
  $slugs = Get-Content -Encoding UTF8 $listPath |
    ForEach-Object { ($_ -split '#')[0].Trim() } |
    Where-Object { $_ -ne '' }
  foreach ($slug in $slugs) {
    if ($slug -notmatch '^[a-z0-9-]+$') { throw "entry slug not usable in a URL: $slug" }
    $dir = Join-Path $here $slug
    New-Item -ItemType Directory -Force $dir | Out-Null
    # 한 칸 깊어지므로 mmo-site 상대링크를 올리고, 검색에는 원본만 남게 색인을 막는다.
    # (canonical 은 이미 절대 URL 로 /portfolio/ 를 가리킨다 - 그대로 둔다)
    $copy = $html.Replace('href="mmo-site/"', 'href="../mmo-site/"')
    $copy = $copy.Replace('<link rel="canonical"', ('<meta name="robots" content="noindex">' + "`n" + '<link rel="canonical"'))
    if ($copy -eq $html) { throw "entry copy not rewritten: $slug" }
    [IO.File]::WriteAllText((Join-Path $dir 'index.html'), $copy, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ('  entry: /' + $slug + '/')
  }

  # 목록에서 뺀 경로는 폴더째 걷는다 - 안 그러면 죽은 링크가 저장소에 남는다.
  # 여기서 만든 것만 건드리도록 세 가지를 모두 만족할 때만 지운다:
  # 파일이 index.html 하나뿐이고, 그 안에 위에서 넣은 noindex 표식이 있을 것.
  # (mmo-site 는 파일이 여럿이고, fonts / art 에는 index.html 이 없어 걸리지 않는다)
  Get-ChildItem -Directory $here | Where-Object { $slugs -notcontains $_.Name } | ForEach-Object {
    $files = @(Get-ChildItem $_.FullName -Recurse -File)
    if ($files.Count -eq 1 -and $files[0].Name -eq 'index.html') {
      if ((Get-Content -Raw -Encoding UTF8 $files[0].FullName).Contains('<meta name="robots" content="noindex">')) {
        Remove-Item $_.FullName -Recurse -Force
        Write-Host ('  removed: /' + $_.Name + '/')
      }
    }
  }
}
