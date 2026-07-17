# Home State Root Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Always store app state and browser profile data under a home state root on macOS/Linux/Windows; stop writing into the project tree; remove in-repo `data/` and `chrome/`.

**Architecture:** Make `apppath` always detached on supported OSes. Relative paths (`data/...`, `config.yaml`) resolve to `StateRoot`. Remove chrome copy logic. Align Windows single-instance lock path. Update docs and delete placeholders.

**Tech Stack:** Go (`backend/internal/apppath`), existing Wails/backend path helpers, markdown docs.

**Spec:** `docs/superpowers/specs/2026-07-17-home-state-root-design.md`

---

### Task 1: apppath always uses home state root

**Files:**
- Modify: `backend/internal/apppath/apppath.go`
- Create: `backend/internal/apppath/apppath_test.go`

- [ ] **Step 1: Add tests for StateRoot / Resolve / no chrome copy**

```go
package apppath

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestStateRootIsHomeBased(t *testing.T) {
	install := t.TempDir()
	root := detectForOS(install, runtime.GOOS)
	if !root.detached {
		t.Fatalf("expected detached=true on %s", runtime.GOOS)
	}
	if root.stateRoot == root.installRoot {
		t.Fatalf("state root should not equal install root")
	}
	switch runtime.GOOS {
	case "darwin":
		if !filepath.IsAbs(root.stateRoot) || filepath.Base(root.stateRoot) != appStateDirName {
			t.Fatalf("unexpected darwin state root: %s", root.stateRoot)
		}
	case "linux":
		if !filepath.IsAbs(root.stateRoot) || filepath.Base(root.stateRoot) != appStateDirName {
			t.Fatalf("unexpected linux state root: %s", root.stateRoot)
		}
	case "windows":
		if !filepath.IsAbs(root.stateRoot) || filepath.Base(root.stateRoot) != appStateDirName {
			t.Fatalf("unexpected windows state root: %s", root.stateRoot)
		}
	}
}

func TestResolveDataGoesToStateRoot(t *testing.T) {
	install := t.TempDir()
	got := resolveForOS(install, "data/app.db", runtime.GOOS)
	want := filepath.Join(detectForOS(install, runtime.GOOS).stateRoot, "data", "app.db")
	if got != want {
		t.Fatalf("got %s want %s", got, want)
	}
}

func TestEnsureWritableLayoutDoesNotCopyChrome(t *testing.T) {
	if runtime.GOOS == "windows" {
		// HOME/LOCALAPPDATA isolation is OS-specific; still assert no chrome dir under state root.
	}
	install := t.TempDir()
	_ = os.MkdirAll(filepath.Join(install, "chrome"), 0o755)
	_ = os.WriteFile(filepath.Join(install, "chrome", "README.md"), []byte("x"), 0o644)
	if err := ensureWritableLayoutForOS(install, runtime.GOOS); err != nil {
		t.Fatal(err)
	}
	state := detectForOS(install, runtime.GOOS).stateRoot
	if _, err := os.Stat(filepath.Join(state, "chrome")); !os.IsNotExist(err) {
		t.Fatalf("chrome should not be created under state root, err=%v", err)
	}
	if _, err := os.Stat(filepath.Join(state, "data")); err != nil {
		t.Fatalf("data dir missing: %v", err)
	}
}
```

- [ ] **Step 2: Implement always-detach + Windows state root + remove chrome copy**

In `shouldDetachStateRoot`, return true for `linux`, `darwin`, and `windows`.

In `userStateRootForOS`, add Windows:

```go
case "windows":
	if base := strings.TrimSpace(os.Getenv("LOCALAPPDATA")); base != "" {
		return filepath.Join(base, appStateDirName)
	}
	if home := configuredHomeDir(); home != "" {
		return filepath.Join(home, "AppData", "Local", appStateDirName)
	}
```

Remove the `copyDirIfMissing(... "chrome" ...)` block from `ensureWritableLayoutForOS`.

- [ ] **Step 3: Run tests**

```bash
go test ./backend/internal/apppath/ -count=1
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/internal/apppath/
git commit -m "feat: always use home state root for app data"
```

---

### Task 2: Align Windows single-instance + startup messaging

**Files:**
- Modify: `single_instance_state_windows.go`
- Modify: `main.go` (optional log text if it still says “install dir read-only”)

- [ ] **Step 1: Point Windows lock root at ant-browser**

```go
func singleInstanceStateRoot(appRoot string) string {
	if root := strings.TrimSpace(backend.RuntimeStateRoot(appRoot)); root != "" {
		return root
	}
	// fallbacks only if RuntimeStateRoot empty
	...
}
```

Prefer calling `backend.RuntimeStateRoot` like `single_instance_state_other.go` so paths cannot diverge.

- [ ] **Step 2: Commit**

```bash
git commit -m "fix: align Windows single-instance lock with state root"
```

---

### Task 3: Delete in-repo data/ and chrome/; update docs and ignore rules

**Files:**
- Delete: `data/`, `chrome/`
- Modify: `.gitignore`, `README.md`, `publish/mac/README.md`, `publish/linux/README.md`
- Modify frontend mocks if they imply project-relative `data` as a filesystem location (display-only ok)

- [ ] Delete directories and update docs to document home state roots.
- [ ] Commit: `chore: remove in-repo data/chrome placeholders`

---

### Task 4: Verify build

```bash
go test ./backend/internal/apppath/ ./backend/... -count=1
```

Smoke: start app once and confirm state root path in logs / that files appear under home state root.
