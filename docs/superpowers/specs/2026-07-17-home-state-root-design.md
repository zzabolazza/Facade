# Home State Root Design

**Date:** 2026-07-17  
**Status:** Approved

## Goal

Move all application state and browser instance user data out of the project/install directory into a per-user home state root on macOS, Linux, and Windows. Development and packaged runs use the same layout. Delete in-repo `data/` and `chrome/` placeholders.

## State Roots

| Platform | State root |
|----------|------------|
| macOS | `~/Library/Application Support/ant-browser` |
| Linux | `$XDG_DATA_HOME/ant-browser` or `~/.local/share/ant-browser` |
| Windows | `%LOCALAPPDATA%\ant-browser` |

Relative paths never resolve into the project or install tree (except `bin/` for installed binaries).

## Layout Under State Root

```
<stateRoot>/
  config.yaml
  proxies.yaml
  data/
    app.db
    logs/app.log
    extensions/
    snapshots/
    <profileId>/
```

Config defaults keep relative paths (`data/app.db`, `UserDataRoot: "data"`, `data/logs/app.log`). Those paths resolve against `<stateRoot>`, not the repo.

No `chrome/` directory under state root or in the repository. Browser cores remain user-registered absolute/relative paths via 内核管理.

## Behavior Changes

1. **`apppath`**: Always use detached state root on darwin / linux / windows. Do not gate on install-dir writability or macOS app-bundle detection for “whether to detach”.
2. **`EnsureWritableLayout`**: Create state root and `data/`. Optionally copy default `config.yaml` / `proxies.yaml` from install root when missing. Remove any `chrome/` copy logic.
3. **Windows single-instance lock**: Align `single_instance_state_windows.go` with `%LOCALAPPDATA%\ant-browser` (same name as `apppath`).
4. **Repo cleanup**: Delete project `data/` and `chrome/` directories. Update `.gitignore` and docs so they no longer assume in-repo placeholders.
5. **Migration**: Do **not** auto-migrate old project-local `data/`. Users who need old data copy it into the new state root manually.

## Out of Scope

- Changing how cores are discovered or validated
- Automatic migration UI
- Changing relative path strings in default config (only their resolution base changes)

## Testing

- Unit tests for `StateRoot` / `Resolve` on macOS, Linux, Windows path rules
- Layout ensure: creates `data/`, never creates/copies `chrome/`
- Windows single-instance root matches state root
- Smoke: config, DB, logs, and profile `userDataDir` land under state root
