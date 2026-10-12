# Compiles the backend with javac and starts the server on port 8080.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (Test-Path out) { Remove-Item -Recurse -Force out }
$sources = Get-ChildItem -Recurse -Filter *.java src | ForEach-Object { $_.FullName }
javac -encoding UTF-8 -d out $sources
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
java -cp out searchengine.Main documents
