package apppath

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func withIsolatedHome(t *testing.T) string {
	t.Helper()
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("XDG_DATA_HOME", filepath.Join(home, "xdg-data"))
	t.Setenv("LOCALAPPDATA", filepath.Join(home, "AppData", "Local"))
	return home
}

func TestStateRootIsHomeBased(t *testing.T) {
	home := withIsolatedHome(t)
	install := t.TempDir()
	root := detectForOS(install, runtime.GOOS)
	if !root.detached {
		t.Fatalf("expected detached=true on %s", runtime.GOOS)
	}
	if root.stateRoot == root.installRoot {
		t.Fatalf("state root should not equal install root")
	}
	if filepath.Base(root.stateRoot) != appStateDirName {
		t.Fatalf("unexpected state root base: %s", root.stateRoot)
	}
	if !filepath.IsAbs(root.stateRoot) {
		t.Fatalf("state root must be absolute: %s", root.stateRoot)
	}
	switch runtime.GOOS {
	case "darwin":
		want := filepath.Join(home, "Library", "Application Support", appStateDirName)
		if root.stateRoot != want {
			t.Fatalf("got %s want %s", root.stateRoot, want)
		}
	case "linux":
		want := filepath.Join(home, "xdg-data", appStateDirName)
		if root.stateRoot != want {
			t.Fatalf("got %s want %s", root.stateRoot, want)
		}
	case "windows":
		want := filepath.Join(home, "AppData", "Local", appStateDirName)
		if root.stateRoot != want {
			t.Fatalf("got %s want %s", root.stateRoot, want)
		}
	}
}

func TestResolveDataGoesToStateRoot(t *testing.T) {
	_ = withIsolatedHome(t)
	install := t.TempDir()
	got := resolveForOS(install, "data/app.db", runtime.GOOS)
	want := filepath.Join(detectForOS(install, runtime.GOOS).stateRoot, "data", "app.db")
	if got != want {
		t.Fatalf("got %s want %s", got, want)
	}
}

func TestUserStateRootForWindows(t *testing.T) {
	home := withIsolatedHome(t)
	got := userStateRootForOS("windows", installFallback(t))
	want := filepath.Join(home, "AppData", "Local", appStateDirName)
	if got != want {
		t.Fatalf("got %s want %s", got, want)
	}
}

func TestEnsureWritableLayoutCreatesDataNotChrome(t *testing.T) {
	_ = withIsolatedHome(t)
	install := t.TempDir()
	if err := os.MkdirAll(filepath.Join(install, "chrome"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(install, "chrome", "README.md"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
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

func installFallback(t *testing.T) string {
	t.Helper()
	return t.TempDir()
}
