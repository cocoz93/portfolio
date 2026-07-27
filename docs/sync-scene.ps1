# mmo-site 서버 구조도(#scene)를 포폴 홈(portfolio.html)의 정지컷으로 옮긴다.
#
# 왜 필요한가:
#   mmo.src.html 의 #scene 은 빈 SVG 이고, 실제 도형은 런타임에 JS 가 그린다.
#   반면 portfolio.html 에는 그 결과를 한 번 떠서 붙여넣은 정적 마크업이 박혀 있다.
#   두 파일 사이에 연결이 없어, mmo-site 를 고쳐도 포폴 홈 그림은 따라오지 않는다.
#   이 스크립트가 손으로 다시 뜨던 그 한 단계를 대신한다.
#
# 하는 일:
#   mmo-site/index.html 을 헤드리스로 띄워 씬이 그려지길 기다린 뒤,
#   hover 전용 요소(.halo)만 걷어내고 outerHTML 을 portfolio.html 에 주입한다.
#   .halo 만 지우는 이유: mmo-site 는 '#scene .hit .halo{opacity:0}' 로 숨겨두고 hover 때만 켜는데,
#   포폴 홈에는 그 CSS 가 없어 opacity 기본값 1 이 되어 점선 테두리가 항상 보인다.
#   반대로 .beacon(게임 루프 큐브 위 안테나)은 stroke/fill 이 인라인 속성이라 CSS 없이도 제대로 그려진다 — 지우면 안 된다.
#
# 선행 조건: mmo-site/index.html 이 최신이어야 한다 (mmo-site\build.ps1 먼저 실행).
# 사용법:   powershell -ExecutionPolicy Bypass -File sync-scene.ps1
#           -NoBuild  portfolio.html 만 갱신하고 index.html 재빌드는 건너뛴다.
param([switch]$NoBuild)
$ErrorActionPreference = 'Stop'
$here      = Split-Path -Parent $MyInvocation.MyCommand.Path
$siteBuilt = Join-Path $here 'mmo-site\index.html'
$target    = Join-Path $here 'portfolio.html'
foreach ($f in @($siteBuilt, $target)) { if (-not (Test-Path $f)) { throw "not found: $f" } }

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) { $chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" }
if (-not (Test-Path $chrome)) { throw "Chrome/Edge not found" }

# 씬을 꺼내오는 방법: div.textContent 는 --dump-dom 에서 HTML 이스케이프되므로
# script[type=text/plain] 에 담아 원문 그대로 나오게 한다.
$probe = @'
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var s = document.getElementById('scene');
    var out = document.createElement('script');
    out.type = 'text/plain'; out.id = '__scene';
    if (s) {
      var c = s.cloneNode(true);
      c.querySelectorAll('.halo').forEach(function (e) { e.remove(); });
      out.textContent = c.outerHTML;
    } else { out.textContent = ''; }
    document.body.appendChild(out);
  }, 2000);
});
</script>
'@

# 렌더는 ASCII 임시 폴더에서. chrome.exe 는 GUI 앱이라 '&' 로는 대기가 안 되므로 Start-Process -Wait.
$render = Join-Path $env:TEMP 'scene-sync'
if (Test-Path $render) { Remove-Item $render -Recurse -Force }
New-Item -ItemType Directory -Path $render -Force | Out-Null
$html = [IO.File]::ReadAllText($siteBuilt, [Text.Encoding]::UTF8)
[IO.File]::WriteAllText((Join-Path $render 'probe.html'), ($html + $probe), (New-Object Text.UTF8Encoding($false)))

$prof = Join-Path $env:TEMP ('scene-prof-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
$dom  = Join-Path $render 'dom.txt'
$chromeArgs = @(
  '--headless=new', '--disable-gpu', '--allow-file-access-from-files',
  "--user-data-dir=$prof", '--virtual-time-budget=20000', '--dump-dom',
  '--window-size=1400,900',
  ('file:///' + ($render -replace '\\', '/') + '/probe.html')
)
Write-Host '[sync] rendering mmo-site/index.html ...'
Start-Process -FilePath $chrome -ArgumentList $chromeArgs -NoNewWindow -Wait -RedirectStandardOutput $dom
Remove-Item $prof -Recurse -Force -ErrorAction SilentlyContinue

$dumped = [IO.File]::ReadAllText($dom, [Text.Encoding]::UTF8)
$m = [regex]::Match($dumped, '(?s)<script[^>]*id="__scene"[^>]*>(.*?)</script>')
if (-not $m.Success) { throw 'scene dump not found - #scene 이 그려지기 전에 덤프됐을 수 있다 (virtual-time-budget 을 늘려볼 것)' }
$scene = $m.Groups[1].Value

# --- 받아온 씬 검증: 조용히 빈 값이 들어가는 사고를 막는다 ---
function Count-Tag([string]$s, [string]$tag) { ([regex]::Matches($s, "<$tag[ >]")).Count }
if ($scene.Length -lt 20000)            { throw "scene too small ($($scene.Length) chars)" }
if (-not $scene.StartsWith('<svg id="scene"')) { throw 'unexpected scene root' }
if ((Count-Tag $scene 'text') -lt 20)   { throw "label count too low ($(Count-Tag $scene 'text'))" }
if ($scene -match 'class="halo"')   { throw 'hover-only .halo survived the strip' }
if ($scene -notmatch 'class="beacon"') { throw '.beacon 이 사라졌다 - 게임 루프 안테나가 빠진다' }
if ($scene.IndexOf('<svg', 1) -ge 0)    { throw 'nested <svg> - 아래 </svg> 매칭이 안전하지 않다' }

# --- portfolio.html 의 기존 #scene 블록 교체 ---
$t = [IO.File]::ReadAllText($target, [Text.Encoding]::UTF8)
$i = $t.IndexOf('<svg id="scene"')
if ($i -lt 0) { throw 'portfolio.html 에 #scene 이 없다' }
$j = $t.IndexOf('</svg>', $i)
if ($j -lt 0) { throw 'portfolio.html 의 #scene 이 닫히지 않았다' }
$j += 6
$before = $t.Substring($i, $j - $i)
# 홈 컷에는 상세카드가 없다. 원본은 카드 자리로 오른쪽 259칸을 비워 두는데(폭 1042),
# 그대로 가져오면 그림이 왼쪽으로 몰리고 오른쪽 1/4 이 빈 채로 남는다.
# 내용 실측은 x246~1042 · y207~658 이므로 그 범위에 맞춰 다시 잡는다 = 같은 카드 폭에서 그림이 커진다.
# 원본(mmo-site)은 카드가 있어 1042 가 맞다 — 그쪽은 건드리지 않고 여기서만 바꾼다.
$homeVB = 'viewBox="216 172 856 500"'
$scene  = [regex]::Replace($scene, 'viewBox="[^"]*"', $homeVB, 1)
if ($scene -notmatch [regex]::Escape($homeVB)) { throw '홈 컷 viewBox 치환 실패' }

$scene  = ($scene -replace "`r`n", "`n") -replace "`n", "`r`n"   # 파일 줄바꿈(CRLF)에 맞춘다
if ($before -eq $scene) { Write-Host '[sync] 이미 최신 - 변경 없음'; }
else {
  [IO.File]::WriteAllText($target, ($t.Substring(0, $i) + $scene + $t.Substring($j)), (New-Object Text.UTF8Encoding($false)))
  Write-Host '[sync] portfolio.html #scene 교체 완료'
}
foreach ($tag in @('g', 'text', 'polygon', 'circle')) {
  Write-Host ('       {0,-8} {1,4} -> {2,4}' -f $tag, (Count-Tag $before $tag), (Count-Tag $scene $tag))
}
Write-Host ('       {0,-8} {1,4} -> {2,4}' -f 'chars', $before.Length, $scene.Length)
Remove-Item $render -Recurse -Force -ErrorAction SilentlyContinue

if (-not $NoBuild) {
  Write-Host '[sync] rebuilding index.html ...'
  & powershell -ExecutionPolicy Bypass -File (Join-Path $here 'build.ps1')
}
