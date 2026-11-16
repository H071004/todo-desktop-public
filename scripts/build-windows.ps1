$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$runtime=Join-Path $root 'node_modules/electron/dist'
if(!(Test-Path (Join-Path $runtime 'electron.exe'))){throw 'Run npm ci on Windows x64 first.'}
$target=Join-Path $root 'dist/TODO-Windows-x64'
if(Test-Path $target){throw 'Output already exists; choose a fresh build directory before rebuilding.'}
New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item "$runtime/*" $target -Recurse
Rename-Item (Join-Path $target 'electron.exe') 'TODO.exe'
$appDir=Join-Path $target 'resources/app'
New-Item -ItemType Directory -Path $appDir -Force | Out-Null
foreach($name in @('main.js','preload.js','geometry.js','renderer.js','sections.js','calendar-labels.js','index.html','style.css','package.json','THIRD_PARTY_NOTICES.md','LICENSE')){Copy-Item (Join-Path $root $name) $appDir}
Copy-Item (Join-Path $root 'fonts') $appDir -Recurse
Write-Output "Built: $target"

