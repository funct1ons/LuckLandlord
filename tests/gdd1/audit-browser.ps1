param([string]$Browser='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$fileUrl='file:///'+$root.Replace('\','/')+'/tests/gdd1/audit-browser.html'
$cases=@(@('file',$fileUrl),@('http','http://127.0.0.1:8317/tests/gdd1/audit-browser.html'))
foreach($c in $cases){
 $profile=Join-Path $env:TEMP ('gdd1-independent-audit-'+$c[0]+'-'+[guid]::NewGuid().ToString('N'))
 foreach($mode in @('write','read')){
  $out=Join-Path $PSScriptRoot ('audit-edge-'+$c[0]+'-'+$mode+'.html')
  $err=Join-Path $PSScriptRoot ('audit-edge-'+$c[0]+'-'+$mode+'-stderr.txt')
  $url=$c[1]+'?mode='+$mode
  $p=Start-Process -FilePath $Browser -ArgumentList "--headless --disable-gpu --no-first-run --virtual-time-budget=1500 --user-data-dir=$profile --dump-dom $url" -Wait -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
  $html=[IO.File]::ReadAllText($out)
  if($p.ExitCode -ne 0 -or $html -notmatch 'data-passed="true"'){throw "Audit failed: $($c[0]) $mode exit=$($p.ExitCode)"}
  Write-Output "audit Edge $($c[0]) ${mode}: passed"
 }
}
