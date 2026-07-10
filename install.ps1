# truestack drop-in installer / refresher (Windows).
# - Junctions the truestack-* skills into ~/.claude/skills (no admin needed)
# - Copies the truestack-* commands into ~/.claude/commands (re-run after git pull)
# - Moves any STALE pre-namespacing truestack copies (un-prefixed folder names) to a backup dir
# - With -WireHooks: merges the PreToolUse gate + orchestrate reminder into ~/.claude/settings.json
#   (backs the file up first). Without it, prints the snippet to merge manually.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File .\install.ps1 [-WireHooks]

param([switch]$WireHooks)

$ErrorActionPreference = "Stop"
$repo = $PSScriptRoot
$claude = Join-Path $HOME ".claude"
$skillsDir = Join-Path $claude "skills"
$commandsDir = Join-Path $claude "commands"
New-Item -ItemType Directory -Force $skillsDir, $commandsDir | Out-Null

# The 23 canonical skill names (prefixed) — used to detect stale un-prefixed copies.
$repoSkills = Get-ChildItem (Join-Path $repo "skills") -Directory -Filter "truestack-*"
$stale = @()
foreach ($s in $repoSkills) {
  $bare = $s.Name -replace "^truestack-", ""
  $old = Join-Path $skillsDir $bare
  if (Test-Path $old) { $stale += $old }
}
$oldCmds = Get-ChildItem $commandsDir -File -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -notlike "truestack-*" -and (Test-Path (Join-Path $repo "commands\truestack-$($_.Name)"))
}
if ($stale.Count -or ($oldCmds -and $oldCmds.Count)) {
  $backup = Join-Path $claude ("truestack-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
  New-Item -ItemType Directory -Force $backup | Out-Null
  foreach ($p in $stale) { Move-Item $p (Join-Path $backup (Split-Path $p -Leaf)) }
  foreach ($f in $oldCmds) { Move-Item $f.FullName (Join-Path $backup $f.Name) }
  Write-Host "Moved stale pre-namespacing copies to $backup"
}

foreach ($s in $repoSkills) {
  $link = Join-Path $skillsDir $s.Name
  # Remove-Item on a junction prompts to recurse (hangs non-interactive re-runs);
  # Directory.Delete removes just the link and never touches the target.
  if (Test-Path $link) { [System.IO.Directory]::Delete($link, $false) }
  New-Item -ItemType Junction -Path $link -Target $s.FullName | Out-Null
}
Get-ChildItem (Join-Path $repo "commands") -Filter "truestack-*.md" | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $commandsDir $_.Name) -Force
}
Write-Host "Linked $($repoSkills.Count) skills (junctions) and copied the truestack-* commands."

$gate = (Join-Path $repo "hooks\pretooluse-gate.mjs") -replace "\\", "/"
$reminder = (Join-Path $repo "hooks\truestack-orchestrate-reminder.js") -replace "\\", "/"
$settingsPath = Join-Path $claude "settings.json"

if ($WireHooks) {
  if (Test-Path $settingsPath) {
    Copy-Item $settingsPath "$settingsPath.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
  } else { $settings = [pscustomobject]@{} }
  if (-not $settings.PSObject.Properties["hooks"]) {
    $settings | Add-Member -NotePropertyName hooks -NotePropertyValue ([pscustomobject]@{})
  }
  $keep = { param($arr) @($arr | Where-Object { ($_ | ConvertTo-Json -Depth 10) -notmatch "truestack-orchestrate-reminder|pretooluse-gate" }) }
  $pre = if ($settings.hooks.PSObject.Properties["PreToolUse"]) { & $keep $settings.hooks.PreToolUse } else { @() }
  $ups = if ($settings.hooks.PSObject.Properties["UserPromptSubmit"]) { & $keep $settings.hooks.UserPromptSubmit } else { @() }
  $pre += [pscustomobject]@{ matcher = "*"; hooks = @([pscustomobject]@{ type = "command"; command = "node `"$gate`""; timeout = 30 }) }
  $ups += [pscustomobject]@{ hooks = @([pscustomobject]@{ type = "command"; command = "node `"$reminder`""; timeout = 10 }) }
  $settings.hooks | Add-Member -Force -NotePropertyName PreToolUse -NotePropertyValue $pre
  $settings.hooks | Add-Member -Force -NotePropertyName UserPromptSubmit -NotePropertyValue $ups
  # Write UTF-8 WITHOUT a BOM. `Out-File -Encoding utf8` on Windows PowerShell 5.1 prepends a
  # BOM, and a leading U+FEFF makes Node's JSON.parse throw — which would corrupt the user's
  # entire ~/.claude/settings.json. WriteAllText with UTF8Encoding($false) is BOM-free on 5.1 and 7+.
  $json = $settings | ConvertTo-Json -Depth 20
  [System.IO.File]::WriteAllText($settingsPath, $json, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "Wired PreToolUse gate + orchestrate reminder into $settingsPath (backup saved)."
} else {
  Write-Host "`nHooks NOT wired (run with -WireHooks, or merge this into $settingsPath):"
  Write-Host @"
{ "hooks": {
  "PreToolUse": [ { "matcher": "*", "hooks": [
    { "type": "command", "command": "node \"$gate\"", "timeout": 30 } ] } ],
  "UserPromptSubmit": [ { "hooks": [
    { "type": "command", "command": "node \"$reminder\"", "timeout": 10 } ] } ]
} }
"@
}
Write-Host "`nVerify: node `"$($repo -replace '\\','/')/hooks/test-gate.mjs`"  (expect 84/84), then /hooks in Claude Code."
