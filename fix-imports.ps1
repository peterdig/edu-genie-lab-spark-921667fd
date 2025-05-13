$file = "src\hooks\useSupabaseHook.ts"
$content = Get-Content $file -Raw
$newContent = $content -replace 'import \{ useAuth \} from [''"]@/contexts/AuthContext[''"];', 'import { useAuth } from ''@/lib/AuthContext.jsx'';'
Set-Content -Path $file -Value $newContent -NoNewline
Write-Host "Import path in $file updated successfully" 