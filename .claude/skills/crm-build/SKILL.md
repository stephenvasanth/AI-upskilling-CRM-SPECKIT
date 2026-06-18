---
name: "crm-build"
description: "Build both AI-CRM projects for production. Maven package (BE) + ng build with bundle size gate < 500 KB gzipped (FE). Reports pass/fail."
argument-hint: "Optional: 'be' (backend only), 'fe' (frontend only). Default: both."
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

Build the appropriate project(s) based on the argument. With no argument, build both.

## Stack Reference

- **Backend build**: `crm-service/` — `mvn package -DskipTests` — produces `target/*.jar`
- **Frontend build**: `crm-ui/` — `ng build --stats-json` — produces `dist/crm-ui/`
- **Bundle size gate**: Initial Angular bundle MUST be < 500 KB gzipped (constitution §VI, NFR)

## Steps

### 1. Determine what to build

- No argument or `all` → build backend then frontend
- `be` → backend only
- `fe` → frontend only

### 2. Build backend (skip if argument is `fe`)

```powershell
cd crm-service

if (-not (Test-Path "pom.xml")) {
    Write-Error "crm-service/pom.xml not found. Run 001-auth setup tasks first."
    exit 1
}

mvn package -DskipTests
```

Check the result:
- **SUCCESS**: Report JAR path (`target/crm-service-*.jar`) and file size
- **FAILURE**: Show the Maven compiler error(s). Common causes:
  - Missing imports → add the required dependency to `pom.xml`
  - `@NotNull` / `@Valid` annotation errors → ensure Bean Validation is on classpath
  - MapStruct compilation errors → verify `mapstruct-processor` is in `annotationProcessorPaths`

### 3. Build frontend (skip if argument is `be`)

```powershell
cd crm-ui

if (-not (Test-Path "package.json")) {
    Write-Error "crm-ui/package.json not found. Run 001-auth setup tasks first."
    exit 1
}

if (-not (Test-Path "node_modules")) {
    npm install
}

ng build --stats-json
```

Check the result:
- **FAILURE**: Show Angular build errors (TypeScript compilation, missing module, template error)
- **SUCCESS**: Proceed to bundle size check

### 4. Bundle size gate (frontend builds only)

After `ng build --stats-json`, check the gzipped initial bundle size:

```powershell
# Find the main bundle file in dist/crm-ui/browser/
$distDir = "crm-ui/dist/crm-ui/browser"
$mainBundle = Get-ChildItem -Path $distDir -Filter "main*.js" | Select-Object -First 1

if ($mainBundle) {
    $rawSize = $mainBundle.Length
    # Estimate gzip compression (typically ~30-35% of raw for Angular)
    # For accurate measurement, use the stats-json output
    $statsFile = "$distDir/stats.json"
    if (Test-Path $statsFile) {
        $stats = Get-Content $statsFile | ConvertFrom-Json
        # Find initial chunks gzip size
        $initialGzipBytes = ($stats.assets | 
            Where-Object { $_.info.initial -eq $true -and $_.name -match "\.js$" } | 
            Measure-Object -Property "size" -Sum).Sum
        $gzipKB = [Math]::Round($initialGzipBytes / 1024 / 3, 1)  # rough gzip estimate
        
        Write-Output "Initial bundle (raw):  $([Math]::Round($rawSize/1024, 1)) KB"
        Write-Output "Initial bundle (est.): ~$gzipKB KB gzipped"
        
        $limitKB = 500
        if ($gzipKB -gt $limitKB) {
            Write-Error "BUNDLE SIZE GATE FAILED: ~${gzipKB} KB exceeds ${limitKB} KB gzip limit (constitution §VI)"
            Write-Output "Run 'ng build --stats-json' and open the stats.json in https://webpack.github.io/analyse/ to find large modules"
            exit 1
        } else {
            Write-Output "Bundle size gate PASSED: ~${gzipKB} KB < ${limitKB} KB limit"
        }
    }
}
```

For a precise measurement, use `gzip` on each initial chunk:

```powershell
$distDir = "crm-ui/dist/crm-ui/browser"
$totalGzip = 0
Get-ChildItem -Path $distDir -Filter "*.js" | ForEach-Object {
    $content = [System.IO.File]::ReadAllBytes($_.FullName)
    $ms = New-Object System.IO.MemoryStream
    $gz = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Compress)
    $gz.Write($content, 0, $content.Length)
    $gz.Close()
    $gzSize = $ms.Length
    Write-Output "$($_.Name): $([Math]::Round($gzSize/1024, 1)) KB gzipped"
    $totalGzip += $gzSize
}
$totalKB = [Math]::Round($totalGzip / 1024, 1)
Write-Output "Total JS gzipped: $totalKB KB"
if ($totalKB -gt 500) {
    Write-Error "BUNDLE SIZE GATE FAILED: $totalKB KB > 500 KB limit"
    exit 1
}
```

### 5. Summary report

```
Build Results
=============
Backend  (Maven):   SUCCESS — crm-service/target/crm-service-0.0.1-SNAPSHOT.jar (XX MB)
Frontend (Angular): SUCCESS — dist/crm-ui/browser/ 
Bundle size gate:   PASSED  — ~XXX KB gzipped (limit: 500 KB)

Overall: ALL BUILDS PASSED ✓
```

## Troubleshooting

- **Maven: `JAVA_HOME` not set**: The plan specifies `JAVA_HOME` is already set on the dev machine. If not: `$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"` (adjust path).
- **Angular: `ng` not found**: Run `npm install -g @angular/cli` or use `npx ng build`.
- **Bundle too large**: Common culprits — importing entire libraries instead of specific modules (e.g., `import * as _ from 'lodash'`). Use tree-shakeable imports. Check `--stats-json` output.
- **TypeScript strict errors**: The project uses `strict: true` in `tsconfig.json`. Ensure all types are explicitly declared.
