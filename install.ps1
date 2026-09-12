#requires -Version 7.0
[CmdletBinding()]
param(
    [ValidateSet('both','claude','codex')][string]$Platform = 'both',
    [string]$UserHome = $HOME,
    [switch]$WireHooks,
    [switch]$ReplaceExisting
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$skillNames = @('architecture-planning','backend-engineering','frontend-engineering','systematic-debugging','ui-ux-review','code-review','test-verify','database-api-evolution','execution-loop','deployment-safety')
$repoRoot = [IO.Path]::GetFullPath($PSScriptRoot)
if (-not [IO.Path]::IsPathFullyQualified($UserHome)) { throw 'UserHome must be absolute.' }
$installHome = [IO.Path]::GetFullPath($UserHome).TrimEnd('\','/')
if (-not (Test-Path -LiteralPath $installHome -PathType Container) -or $installHome -eq [IO.Path]::GetPathRoot($installHome).TrimEnd('\','/')) { throw 'UserHome must be an existing directory, not a filesystem root.' }
function Assert-SafePath([string]$Path, [string]$Boundary) {
    $full = [IO.Path]::GetFullPath($Path)
    $comparison = if ($IsWindows) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }
    if (-not $full.StartsWith($Boundary.TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar, $comparison)) { throw "Path escapes boundary: $full" }
    $cursor = $full
    while ($cursor) {
        $item = Get-Item -LiteralPath $cursor -Force -ErrorAction SilentlyContinue
        if ($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Refusing linked/reparse path: $cursor. Back up and replace the link manually." }
        $parent = Split-Path $cursor -Parent
        if ($parent -eq $cursor) { break }
        $cursor = $parent
    }
    return $full
}
function Read-Object([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return @{} }
    $value = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
    if ($value -isnot [System.Collections.IDictionary]) { throw "Expected JSON object: $Path" }
    return $value
}
$statePath = Assert-SafePath (Join-Path $installHome '.agents/truestack/install-state.json') $installHome
$state = Read-Object $statePath
if ($state.Count -and ($state['package'] -ne 'truestack' -or $state['files'] -isnot [System.Collections.IDictionary])) { throw "Unrecognized installer state: $statePath" }
$knownFiles = if ($state.Contains('files')) { $state['files'] } else { [ordered]@{} }
# A name alone is insufficient evidence to delete a user's installation.
foreach ($relative in @('.claude/skills','.agents/skills','.codex/skills','.claude/commands')) {
    $directory = Assert-SafePath (Join-Path $installHome $relative) $installHome
    if (Test-Path -LiteralPath $directory) {
        if (@(Get-ChildItem -LiteralPath $directory -Force | Where-Object { $_.Name -like 'truestack-*' }).Count) {
            throw "Legacy truestack installation found in $directory. Back up and move old truestack-* entries outside active discovery and disable the old plugin before installing 0.1.0. No files have been changed."
        }
    }
}
$writes = [Collections.Generic.List[object]]::new()
function Queue-File([string]$Relative, [string]$Source) {
    $destination = Assert-SafePath (Join-Path $installHome $Relative) $installHome
    $safeSource = Assert-SafePath $Source $repoRoot
    if (-not (Test-Path -LiteralPath $safeSource -PathType Leaf)) { throw "Missing release file: $safeSource" }
    $newHash = (Get-FileHash -LiteralPath $safeSource -Algorithm SHA256).Hash
    $oldHash = if (Test-Path -LiteralPath $destination -PathType Leaf) { (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash } else { $null }
    if ((Test-Path -LiteralPath $destination) -and -not $oldHash) { throw "Expected a file: $destination" }
    $owned = $knownFiles.Contains($Relative) -and $knownFiles[$Relative] -eq $oldHash
    if ($oldHash -and $oldHash -ne $newHash -and -not $owned -and -not $ReplaceExisting) { throw "Existing local file differs: $destination. Review it, then rerun with -ReplaceExisting to back up and replace that file. No files have been changed." }
    $writes.Add(@{ Path=$destination; Relative=$Relative; Source=$safeSource; Hash=$newHash; Changed=($oldHash -ne $newHash) })
}
foreach ($name in $skillNames) {
    $source = Join-Path $repoRoot "skills/$name/SKILL.md"
    Queue-File ".agents/skills/$name/SKILL.md" $source
    if ($Platform -in @('both','claude')) { Queue-File ".claude/skills/$name/SKILL.md" $source }
}
function Test-OwnedGuardCommand([string]$Command, [string]$GuardPath, [string]$Client) {
    # Recognize only a direct Node invocation of this exact script and platform.
    # Unknown flags, shell wrappers, chained commands, and other script paths stay untouched.
    $normalized = $Command.Replace('\','/')
    $escapedPath = [regex]::Escape($GuardPath.Replace('\','/'))
    $scriptArgument = '(?:"' + $escapedPath + '"|''' + $escapedPath + ''''
    if ($GuardPath -notmatch '\s') { $scriptArgument += '|' + $escapedPath }
    $scriptArgument += ')'
    $nodeArgument = '(?:"(?:[^"]*/)?node(?:\.exe)?"|''(?:[^'']*/)?node(?:\.exe)?''|(?:[^\s"'';&|<>]*/)?node(?:\.exe)?)'
    $pattern = '^\s*' + $nodeArgument + '\s+' + $scriptArgument + '\s+--platform(?:=|\s+)' + [regex]::Escape($Client) + '\s*$'
    $options = [Text.RegularExpressions.RegexOptions]::CultureInvariant
    if ($IsWindows) { $options = $options -bor [Text.RegularExpressions.RegexOptions]::IgnoreCase }
    return [regex]::IsMatch($normalized, $pattern, $options)
}
$configWrites = [Collections.Generic.List[object]]::new()
if ($WireHooks) {
    Get-Command node -ErrorAction Stop | Out-Null
    Queue-File '.agents/hooks/skill-guard.cjs' (Join-Path $repoRoot 'hooks/skill-guard.cjs')
    $guardPath = (Join-Path $installHome '.agents/hooks/skill-guard.cjs').Replace('\','/')
    if ($guardPath.IndexOfAny([char[]]@(34,96,36,37,13,10)) -ge 0) { throw 'Hook path contains shell expansion characters; use a simple home path.' }
    $platforms = if ($Platform -eq 'both') { @('claude','codex') } else { @($Platform) }
    foreach ($client in $platforms) {
        $relative = if ($client -eq 'claude') { '.claude/settings.json' } else { '.codex/hooks.json' }
        $path = Assert-SafePath (Join-Path $installHome $relative) $installHome
        $settings = Read-Object $path
        if (-not $settings.Contains('hooks')) { $settings['hooks'] = @{} }
        if ($settings['hooks'] -isnot [System.Collections.IDictionary]) { throw "Expected hooks object: $path" }
        $command = 'node "' + $guardPath + '" --platform=' + $client
        foreach ($event in @('SessionStart','UserPromptSubmit','SubagentStart','PreToolUse','PostToolUse','Stop')) {
            $groups = @()
            if ($settings['hooks'].Contains($event)) {
                if ($settings['hooks'][$event] -isnot [array]) { throw "Expected array for $event in $path" }
                foreach ($group in $settings['hooks'][$event]) {
                    if ($group -isnot [System.Collections.IDictionary] -or $group['hooks'] -isnot [array]) { throw "Invalid hook group for $event in $path" }
                    $remaining = @($group['hooks'] | Where-Object {
                        $hookCommand = if ($_ -is [System.Collections.IDictionary] -and $_.Contains('command')) { [string]$_['command'] } else { '' }
                        $legacyOwned = $hookCommand -match '(?i)truestack[^"]*[/\\](pretooluse-gate\.mjs|truestack-orchestrate-reminder\.js)(?=["\s]|$)'
                        -not (Test-OwnedGuardCommand $hookCommand $guardPath $client) -and -not $legacyOwned
                    })
                    if ($remaining.Count) { $group['hooks'] = $remaining; $groups += $group }
                }
            }
            $entry = [ordered]@{ hooks=@([ordered]@{ type='command'; command=$command; timeout=5 }) }
            if ($event -in @('PreToolUse','PostToolUse')) { $entry['matcher'] = '^(Write|Edit|MultiEdit|apply_patch)$' }
            $settings['hooks'][$event] = @($groups) + @($entry)
        }
        $configWrites.Add(@{ Path=$path; Relative=$relative; Text=($settings | ConvertTo-Json -Depth 100) + "`n" })
    }
}
# Complete all source, collision, link, and JSON checks before the first write.
$backupRoot = Join-Path $installHome ('.agents/truestack/backups/' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ') + '-' + [Guid]::NewGuid().ToString('N'))
$null = Assert-SafePath $backupRoot $installHome
function Prepare-Write([string]$Path, [string]$Relative) {
    $null = Assert-SafePath $Path $installHome
    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        $backup = Assert-SafePath (Join-Path $backupRoot $Relative) $installHome
        New-Item -ItemType Directory -Path (Split-Path $backup -Parent) -Force | Out-Null
        Copy-Item -LiteralPath $Path -Destination $backup
    }
    New-Item -ItemType Directory -Path (Split-Path $Path -Parent) -Force | Out-Null
    $null = Assert-SafePath $Path $installHome
}
foreach ($write in $writes) {
    if ($write.Changed) {
        Prepare-Write $write.Path $write.Relative
        # In-place writes preserve existing ACLs and Unix modes.
        [IO.File]::WriteAllBytes($write.Path, [IO.File]::ReadAllBytes($write.Source))
    }
    $knownFiles[$write.Relative] = $write.Hash
}
foreach ($write in $configWrites) {
    $oldText = if (Test-Path -LiteralPath $write.Path) { [IO.File]::ReadAllText($write.Path) } else { $null }
    if ($oldText -ne $write.Text) {
        Prepare-Write $write.Path $write.Relative
        [IO.File]::WriteAllText($write.Path, $write.Text, [Text.UTF8Encoding]::new($false))
    }
}
$newState = [ordered]@{ package='truestack'; version='0.1.0'; files=$knownFiles } | ConvertTo-Json -Depth 10
if (-not (Test-Path -LiteralPath $statePath) -or [IO.File]::ReadAllText($statePath) -ne $newState) {
    Prepare-Write $statePath '.agents/truestack/install-state.json'
    [IO.File]::WriteAllText($statePath, $newState, [Text.UTF8Encoding]::new($false))
}
Write-Host "Installed 10 canonical skills for $Platform. Claude selections also receive physical copies."
if (Test-Path -LiteralPath $backupRoot) { Write-Host "Backups: $backupRoot" }
if ($WireHooks) { Write-Host 'Hooks registered. In Codex, review and trust new or changed commands through /hooks before execution.' }
else { Write-Host 'Hooks unchanged. Use -WireHooks for optional reminders.' }
