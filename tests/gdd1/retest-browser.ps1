param([string]$Browser='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$fileUrl='file:///'+$projectRoot.Replace('\','/')+'/tests/gdd1/retest-browser.html'
$cases=@(@('file',$fileUrl),@('http','http://127.0.0.1:8321/tests/gdd1/retest-browser.html'))
foreach($c in $cases){$profile=Join-Path $env:TEMP ('gdd1-f1-retest-'+$c[0]+'-'+[guid]::NewGuid().ToString('N'));foreach($mode in @('write','read')){$out=Join-Path $PSScriptRoot ('retest-edge-'+$c[0]+'-'+$mode+'.html');$err=Join-Path $PSScriptRoot ('retest-edge-'+$c[0]+'-'+$mode+'-stderr.txt');$p=Start-Process -FilePath $Browser -ArgumentList "--headless --disable-gpu --no-first-run --virtual-time-budget=2000 --user-data-dir=$profile --dump-dom $($c[1])?mode=$mode" -Wait -PassThru -RedirectStandardOutput $out -RedirectStandardError $err;$html=[IO.File]::ReadAllText($out);if($p.ExitCode -ne 0 -or $html -notmatch 'data-passed="true"'){throw "Retest failed: $($c[0]) $mode exit=$($p.ExitCode)"};Write-Output "retest Edge $($c[0]) ${mode}: passed"}}
