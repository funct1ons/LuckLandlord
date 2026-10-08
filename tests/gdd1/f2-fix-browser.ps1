param([string]$Browser='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$cases=@(@('file',('file:///'+$root.Replace('\','/')+'/tests/gdd1/f2-fix-browser.html')),@('http','http://127.0.0.1:8323/tests/gdd1/f2-fix-browser.html'))
foreach($c in $cases){$profile=Join-Path $env:TEMP ('gdd1-f2-fix-'+$c[0]+'-'+[guid]::NewGuid().ToString('N'));foreach($mode in @('write','read')){$out=Join-Path $PSScriptRoot ('f2-fix-edge-'+$c[0]+'-'+$mode+'.html');$err=Join-Path $PSScriptRoot ('f2-fix-edge-'+$c[0]+'-'+$mode+'-stderr.txt');$p=Start-Process -FilePath $Browser -ArgumentList "--headless --disable-gpu --allow-file-access-from-files --no-first-run --virtual-time-budget=12000 --user-data-dir=$profile --dump-dom $($c[1])?mode=$mode" -Wait -PassThru -RedirectStandardOutput $out -RedirectStandardError $err;$html=[IO.File]::ReadAllText($out);if($p.ExitCode -ne 0 -or $html -notmatch 'data-complete="true"'){throw "F2 fix failed: $($c[0]) $mode exit=$($p.ExitCode)"};Write-Output "F2 fix Edge $($c[0]) ${mode}: complete (inspect assertions)"}}

