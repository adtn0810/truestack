#requires -Version 7.0
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repoRoot = Split-Path $PSScriptRoot -Parent
$installer = Join-Path $repoRoot 'install.ps1'
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('truestack-test-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot | Out-Null
$passed = $false
function Assert([bool]$Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function New-Home([string]$Name) { $path = Join-Path $testRoot $Name; New-Item -ItemType Directory -Path $path | Out-Null; return $path }
function Put([string]$Path, [string]$Text) {
    New-Item -ItemType Directory -Path (Split-Path $Path -Parent) -Force | Out-Null
    [IO.File]::WriteAllText($Path, $Text)
}
function Read-Json([string]$Path) { Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable }
function Run-Install([string]$Destination, [string[]]$Extra = @(), [string]$Failure = '') {
    $output = & (Get-Process -Id $PID).Path -NoProfile -File $installer -UserHome $Destination @Extra 2>&1
    if ($Failure) {
        Assert ($LASTEXITCODE -ne 0) "Expected failure: $Failure"
        Assert (($output -join "`n") -match $Failure) "Unexpected error: $output"
    } else { Assert ($LASTEXITCODE -eq 0) "Install failed: $output" }
}
try {
    $fresh = New-Home 'fresh home'
    Put (Join-Path $fresh '.codex/config.toml') 'model = "keep-this-model"'
    Put (Join-Path $fresh '.claude/settings.json') '{"permissions":{"allow":["Read"]},"model":"existing","mcpServers":{"keep":{}}}'
    Put (Join-Path $fresh '.agents/skills/unrelated/SKILL.md') 'keep unrelated'
    $settingsHash = (Get-FileHash (Join-Path $fresh '.claude/settings.json')).Hash
    Run-Install $fresh
    $names = @(Get-ChildItem (Join-Path $repoRoot 'skills') -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') })
    Assert ($names.Count -eq 10) 'Expected ten release skills'
    foreach ($name in $names.Name) {
        $canonical = Join-Path $fresh ".agents/skills/$name/SKILL.md"
        $mirror = Join-Path $fresh ".claude/skills/$name/SKILL.md"
        Assert ((Get-FileHash $canonical).Hash -eq (Get-FileHash $mirror).Hash) "Mirror mismatch: $name"
        Assert (-not ((Get-Item (Split-Path $mirror -Parent)).Attributes -band [IO.FileAttributes]::ReparsePoint)) 'Mirror must be physical'
    }
    Assert (-not (Test-Path (Join-Path $fresh '.codex/skills'))) 'Duplicate Codex skills created'
    Assert ((Get-FileHash (Join-Path $fresh '.claude/settings.json')).Hash -eq $settingsHash) 'Default install touched settings'
    Assert ((Get-Content (Join-Path $fresh '.agents/skills/unrelated/SKILL.md') -Raw) -eq 'keep unrelated') 'Unrelated skill changed'
    Run-Install $fresh
    Assert (-not (Test-Path (Join-Path $fresh '.agents/truestack/backups'))) 'Unchanged refresh should not produce backups'

    $edited = Join-Path $fresh '.agents/skills/code-review/SKILL.md'
    Put $edited 'local customization'
    Run-Install $fresh @() 'Existing local file differs'
    Assert ((Get-Content $edited -Raw) -eq 'local customization') 'Collision overwritten'
    Run-Install $fresh @('-ReplaceExisting')
    $copies = @(Get-ChildItem (Join-Path $fresh '.agents/truestack/backups') -Filter SKILL.md -Recurse -Force)
    Assert (@($copies | Where-Object { (Get-Content $_.FullName -Raw) -eq 'local customization' }).Count -eq 1) 'Original customization not backed up'

    $hooks = New-Home 'hooks home'
    $settingsPath = Join-Path $hooks '.claude/settings.json'
    $original = '{"model":"keep","permissions":{"deny":["Bash(rm:*)"]},"mcpServers":{"existing":{"command":"keep"}},"hooks":{"PreToolUse":[{"matcher":"*","hooks":[{"type":"command","command":"node \"/old/truestack/hooks/pretooluse-gate.mjs\""},{"type":"command","command":"keep-sibling"}]}],"Stop":[{"hooks":[{"type":"command","command":"keep-stop"}]}]}}'
    Put $settingsPath $original
    Put (Join-Path $hooks '.codex/config.toml') 'model = "preserve"'
    Put (Join-Path $hooks '.codex/auth.json') '{"keep":"authentication"}'
    $configHash = (Get-FileHash (Join-Path $hooks '.codex/config.toml')).Hash
    $authHash = (Get-FileHash (Join-Path $hooks '.codex/auth.json')).Hash
    Run-Install $hooks @('-WireHooks')
    $settings = Read-Json $settingsPath
    Assert ($settings.model -eq 'keep' -and $settings.permissions.deny[0] -eq 'Bash(rm:*)' -and $settings.mcpServers.existing.command -eq 'keep') 'Unrelated settings changed'
    $commands = @($settings.hooks.PreToolUse | ForEach-Object { $_.hooks | ForEach-Object { $_.command } })
    Assert ($commands -contains 'keep-sibling') 'Sibling hook lost'
    Assert (-not ($commands -match 'pretooluse-gate')) 'Legacy hook retained'
    foreach ($relative in @('.claude/settings.json','.codex/hooks.json')) {
        $config = Read-Json (Join-Path $hooks $relative)
        foreach ($event in @('SessionStart','UserPromptSubmit','SubagentStart','PreToolUse','PostToolUse','Stop')) {
            $owned = @($config.hooks[$event] | Where-Object { @($_.hooks | Where-Object { $_.command -match 'skill-guard.cjs' }).Count })
            Assert ($owned.Count -eq 1 -and $owned[0].hooks[0].timeout -eq 5) "Incorrect registration: $relative $event"
            if ($event -in @('PreToolUse','PostToolUse')) { Assert ($owned[0].matcher -eq '^(Write|Edit|MultiEdit|apply_patch)$') 'Edit matcher broadened' }
        }
    }
    Assert ((Get-FileHash (Join-Path $hooks '.codex/config.toml')).Hash -eq $configHash) 'Codex config changed'
    Assert ((Get-FileHash (Join-Path $hooks '.codex/auth.json')).Hash -eq $authHash) 'Authentication changed'
    $backups = @(Get-ChildItem (Join-Path $hooks '.agents/truestack/backups') -Filter settings.json -Recurse -Force)
    Assert ($backups.Count -eq 1 -and (Get-Content $backups[0].FullName -Raw) -eq $original) 'Original settings backup missing'
    $registeredHash = (Get-FileHash $settingsPath).Hash
    Run-Install $hooks @('-WireHooks')
    $settings = Read-Json $settingsPath
    Assert (@($settings.hooks.PreToolUse | ForEach-Object { $_.hooks } | Where-Object { $_.command -match 'skill-guard.cjs' }).Count -eq 1) 'Refresh duplicated hooks'
    Assert ((Get-FileHash $settingsPath).Hash -eq $registeredHash) 'Unchanged hook refresh rewrote settings'

    $variants = New-Home 'command-variants'
    $variantGuard = (Join-Path $variants '.agents/hooks/skill-guard.cjs').Replace('\','/')
    $nodeExecutable = (Get-Command node).Source
    $events = @('SessionStart','UserPromptSubmit','SubagentStart','PreToolUse','PostToolUse','Stop')
    foreach ($client in @('claude','codex')) {
        $otherClient = if ($client -eq 'claude') { 'codex' } else { 'claude' }
        $equivalent = @(
            ('"' + $nodeExecutable + '" "' + $variantGuard + '" --platform=' + $client),
            ("'" + $nodeExecutable + "' '" + $variantGuard + "' --platform " + $client),
            ('node "' + $variantGuard + '" --platform=' + $client),
            ('"node" "' + $variantGuard + '" --platform ' + $client)
        )
        $preserved = @(
            ('node "' + $variants.Replace('\','/') + '/another/skill-guard.cjs" --platform=' + $client),
            ('node "' + $variantGuard + '" --platform=' + $otherClient),
            ('node "' + $variantGuard + '" --platform=' + $client + ' && keep-sibling')
        )
        $configuration = @{ hooks=@{} }
        foreach ($event in $events) {
            $configuration.hooks[$event] = @(@{ hooks=@(($equivalent + $preserved) | ForEach-Object { @{ type='command'; command=$_ } }) })
        }
        $relative = if ($client -eq 'claude') { '.claude/settings.json' } else { '.codex/hooks.json' }
        Put (Join-Path $variants $relative) ($configuration | ConvertTo-Json -Depth 20)
    }
    Run-Install $variants @('-WireHooks')
    foreach ($client in @('claude','codex')) {
        $relative = if ($client -eq 'claude') { '.claude/settings.json' } else { '.codex/hooks.json' }
        $configuration = Read-Json (Join-Path $variants $relative)
        $otherClient = if ($client -eq 'claude') { 'codex' } else { 'claude' }
        foreach ($event in $events) {
            $commands = @($configuration.hooks[$event] | ForEach-Object { $_.hooks } | ForEach-Object { $_.command })
            $expected = 'node "' + $variantGuard + '" --platform=' + $client
            Assert ($commands.Count -eq 4 -and @($commands | Where-Object { $_ -eq $expected }).Count -eq 1) "Equivalent guard commands duplicated: $client $event"
            Assert ($commands -contains ('node "' + $variants.Replace('\','/') + '/another/skill-guard.cjs" --platform=' + $client)) 'Unrelated same-name script removed'
            Assert ($commands -contains ('node "' + $variantGuard + '" --platform=' + $otherClient)) 'Different-platform guard removed'
            Assert ($commands -contains ($expected + ' && keep-sibling')) 'Compound hook command removed'
        }
    }

    $codex = New-Home 'codex'
    Run-Install $codex @('-Platform','codex','-WireHooks')
    Assert (-not (Test-Path (Join-Path $codex '.claude'))) 'Codex-only created Claude files'
    $claude = New-Home 'claude'
    Run-Install $claude @('-Platform','claude','-WireHooks')
    Assert (-not (Test-Path (Join-Path $claude '.codex'))) 'Claude-only created Codex files'

    $legacy = New-Home 'legacy'
    Put (Join-Path $legacy '.claude/skills/truestack-orchestrate/SKILL.md') 'legacy'
    Run-Install $legacy @() 'Legacy truestack'
    Assert (-not (Test-Path (Join-Path $legacy '.agents'))) 'Legacy refusal wrote new files'
    Assert ((Get-Content (Join-Path $legacy '.claude/skills/truestack-orchestrate/SKILL.md') -Raw) -eq 'legacy') 'Legacy file moved or removed'

    $invalid = New-Home 'invalid'
    Put (Join-Path $invalid '.claude/settings.json') '{"hooks":{"Stop":{}}}'
    Run-Install $invalid @('-WireHooks') 'Expected array'
    Assert (-not (Test-Path (Join-Path $invalid '.agents'))) 'Invalid JSON shape caused partial writes'
    $linked = New-Home 'linked'
    $outside = New-Home 'outside'
    $linkType = if ($IsWindows) { 'Junction' } else { 'SymbolicLink' }
    New-Item -ItemType $linkType -Path (Join-Path $linked '.agents') -Target $outside | Out-Null
    Run-Install $linked @() 'Refusing linked/reparse'
    Assert (@(Get-ChildItem $outside -Force).Count -eq 0) 'Link target modified'
    # Remove just this test-created link; never traverse it during cleanup.
    if ($IsWindows) { [IO.Directory]::Delete((Join-Path $linked '.agents'), $false) }
    else { Remove-Item -LiteralPath (Join-Path $linked '.agents') -Force }
    $backupLinked = New-Home 'backup-linked'
    $backupParent = Join-Path $backupLinked '.agents/truestack'
    New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
    $backupLink = Join-Path $backupParent 'backups'
    New-Item -ItemType $linkType -Path $backupLink -Target $outside | Out-Null
    Run-Install $backupLinked @() 'Refusing linked/reparse'
    Assert (-not (Test-Path (Join-Path $backupLinked '.agents/skills'))) 'Backup link refusal happened after writing skills'
    Assert (@(Get-ChildItem $outside -Force).Count -eq 0) 'Backup link target modified'
    if ($IsWindows) { [IO.Directory]::Delete($backupLink, $false) }
    else { Remove-Item -LiteralPath $backupLink -Force }
    $passed = $true
    Write-Host 'PASS: fresh install, refresh, mirrors, collision and backup, hook merge and command variants, platform isolation, legacy, malformed settings, and linked-path refusal.'
} finally {
    # Leave failure evidence; successful runs remove only their validated isolated root.
    if ($passed) {
        $resolved = [IO.Path]::GetFullPath($testRoot)
        $tempPrefix = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
        if ($resolved.StartsWith($tempPrefix) -and (Split-Path $resolved -Leaf) -like 'truestack-test-*') { Remove-Item -LiteralPath $resolved -Recurse -Force }
    } else { Write-Host "Test artifacts: $testRoot" }
}
# Expected child-process failures are assertions, not the final suite result.
# Reach this only after every assertion and cleanup succeeds; GitHub's pwsh
# wrapper otherwise propagates the last intentionally nonzero child exit code.
exit 0
