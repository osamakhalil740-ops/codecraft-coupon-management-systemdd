$files = Get-ChildItem -Path "src/app/api" -Filter "route.ts" -Recurse

$configToAdd = @"

// Force dynamic rendering
export const dynamic = 'force-dynamic';
"@

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if already has dynamic config
    if ($content -match "export const dynamic") {
        Write-Host "Skipping $($file.Name) - already has dynamic config"
        continue
    }
    
    # Find the position after imports
    $lines = $content -split "`n"
    $lastImportLine = 0
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $trimmed = $lines[$i].Trim()
        if ($trimmed -match "^import " -or $trimmed -eq "" -or $trimmed -match "^//") {
            $lastImportLine = $i
        } else {
            break
        }
    }
    
    # Insert config after imports
    $newLines = $lines[0..$lastImportLine] + $configToAdd + $lines[($lastImportLine + 1)..($lines.Count - 1)]
    $newContent = $newLines -join "`n"
    
    Set-Content -Path $file.FullName -Value $newContent -NoNewline
    Write-Host "✓ Added dynamic config to $($file.FullName)"
}

Write-Host "`n✓ Processed $($files.Count) API route files"
