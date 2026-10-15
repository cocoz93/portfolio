$ErrorActionPreference = 'Stop'
$sourceRoot = [System.IO.Path]::GetFullPath('C:/Users/USER/.codex/visualizations/2026/10/08/01a11c42-4baf-7450-b29c-e804573c9d61')
$destinationRoot = [System.IO.Path]::GetFullPath('C:/Users/USER/Desktop/MyGit/portfolio/docs/mmo-site/visualizations')
$allowedDestinationParent = [System.IO.Path]::GetFullPath('C:/Users/USER/Desktop/MyGit/portfolio/docs/mmo-site')
if ([System.IO.Path]::GetDirectoryName($destinationRoot) -ne $allowedDestinationParent) { throw 'Destination escaped the authorized directory.' }
if (Test-Path -LiteralPath $destinationRoot) { throw 'Destination exists; refusing to merge or overwrite.' }
$plan = Get-Content -LiteralPath (Join-Path $sourceRoot 'migration/preflight.json') -Raw | ConvertFrom-Json
if ([System.IO.Path]::GetFullPath($plan.source) -ne $sourceRoot -or [System.IO.Path]::GetFullPath($plan.destination) -ne $destinationRoot) { throw 'Preflight paths differ.' }
$entries = @(Get-ChildItem -LiteralPath $sourceRoot -Force)
foreach ($entry in $entries) {
    $resolvedSource = [System.IO.Path]::GetFullPath($entry.FullName)
    $resolvedTarget = [System.IO.Path]::GetFullPath((Join-Path $destinationRoot $entry.Name))
    if (-not $resolvedSource.StartsWith($sourceRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Source escaped the task directory.' }
    if (-not $resolvedTarget.StartsWith($destinationRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Target escaped the authorized directory.' }
}
$links = @(Get-ChildItem -LiteralPath $sourceRoot -Recurse -Force | Where-Object { $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint })
if ($links.Count -gt 0) { throw 'Reparse points are not allowed in this migration.' }
New-Item -ItemType Directory -Path $destinationRoot | Out-Null
foreach ($entry in $entries) { Move-Item -LiteralPath $entry.FullName -Destination (Join-Path $destinationRoot $entry.Name) }
if (@(Get-ChildItem -LiteralPath $sourceRoot -Force).Count -ne 0) { throw 'Source directory still contains files.' }
Write-Output ('Moved all task files to ' + $destinationRoot)
