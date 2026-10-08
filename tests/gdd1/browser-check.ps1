param([string]$Browser='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',[string]$Label='edge')
$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$fileUrl='file:///'+$root.Replace('\','/')+'/tests/gdd1/index.html'
$cases=@(@('file',$fileUrl),@('http','http://127.0.0.1:8314/tests/gdd1/index.html'))
foreach($case in $cases){
  $profile=Join-Path $env:TEMP ('gdd1-f1-'+$Label+'-'+$case[0]+'-'+[guid]::NewGuid().ToString('N'))
  foreach($mode in @('write','read')){
    $url=$case[1]+'?storage='+$mode
    $out=Join-Path $PSScriptRoot ('f1-'+$Label+'-'+$case[0]+'-'+$mode+'.html')
    $err=Join-Path $PSScriptRoot ('f1-'+$Label+'-'+$case[0]+'-'+$mode+'-stderr.txt')
    $p=Start-Process -FilePath $Browser -ArgumentList "--headless --disable-gpu --no-first-run --user-data-dir=$profile --dump-dom $url" -Wait -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
    $html=[IO.File]::ReadAllText($out)
    if($p.ExitCode -ne 0 -or $html -notmatch 'data-passed="true"'){throw "Failed $Label $($case[0]) $mode exit=$($p.ExitCode); inspect $out"}
    Write-Output "${Label} $($case[0]) $mode`: pass"
  }
}
