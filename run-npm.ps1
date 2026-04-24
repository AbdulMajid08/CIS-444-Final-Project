# Ensures `node` is on PATH for this session (fixes "node is not recognized" when npm works).
$nodeDirs = @(
    "C:\Program Files\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
)
foreach ($dir in $nodeDirs) {
    if (Test-Path (Join-Path $dir "node.exe")) {
        $env:Path = "$dir;$env:Path"
        break
    }
}

Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Could not find node.exe. Install Node.js from https://nodejs.org or add its folder to your user PATH."
    exit 1
}

if ($args.Count -eq 0) {
    Write-Host "Usage: .\run-npm.ps1 install" -ForegroundColor Yellow
    Write-Host "       .\run-npm.ps1 run dev" -ForegroundColor Yellow
    exit 1
}

& npm @args
