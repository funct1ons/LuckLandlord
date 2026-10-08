param([string]$Edge='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',[string]$Profile=(Join-Path $env:TEMP ('fog-port-edge-'+[guid]::NewGuid().ToString('N'))))
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$profile=$Profile
foreach($case in @(@('index.html','route-h-browser-result.html'),@('ui-smoke.html','route-h-ui-smoke-result.html'),@('storage-smoke.html?write','route-h-storage-write-result.html'),@('storage-smoke.html?read','route-h-storage-read-result.html'))){
$url='file:///'+($root.Replace('\','/'))+'/tests/'+$case[0]
$p=Start-Process -FilePath $Edge -ArgumentList "--headless --disable-gpu --no-first-run --user-data-dir=$profile --dump-dom $url" -Wait -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot $case[1]) -RedirectStandardError (Join-Path $PSScriptRoot 'route-h-edge-stderr.txt')
Write-Output "$($case[0]): Edge exit=$($p.ExitCode)"
$content=[IO.File]::ReadAllText((Join-Path $PSScriptRoot $case[1]))
if($p.ExitCode -ne 0 -or $content -notmatch 'data-(result|smoke)="pass"'){throw "Browser case failed: $($case[0])"}
}
Write-Output '4/4 Edge file:// browser checks passed (automated, not human play).'
