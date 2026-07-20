package browser

import (
	"facade/backend/internal/config"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestGetChromeVersion_FromExecutableCommand(t *testing.T) {
	root := t.TempDir()
	exePath := filepath.Join(root, "chromium")
	script := "#!/bin/sh\necho 'Chromium 148.0.7778.215'\n"
	if runtime.GOOS == "windows" {
		exePath = filepath.Join(root, "chrome.exe")
		// On Windows unit tests we still validate parsing via a shim is OS-specific;
		// skip executable spawn and only cover darwin/linux here.
		t.Skip("windows executable shim not covered in this test")
	}
	if err := os.WriteFile(exePath, []byte(script), 0o755); err != nil {
		t.Fatal(err)
	}

	manager := &Manager{AppRoot: root, Config: &config.Config{}}
	got := manager.GetChromeVersion(root)
	if got != "148.0.7778.215" {
		t.Fatalf("GetChromeVersion=%q", got)
	}
}

func TestGetChromeVersion_RealChromiumApp(t *testing.T) {
	if runtime.GOOS != "darwin" {
		t.Skip("macOS only")
	}
	const appPath = "/Applications/Chromium.app"
	if _, err := os.Stat(appPath); err != nil {
		t.Skip("Chromium.app not installed")
	}
	manager := &Manager{Config: &config.Config{}}
	got := manager.GetChromeVersion(appPath)
	if NormalizeChromeProdVersion(got) == "" {
		t.Fatalf("expected version from %s --version, got %q", appPath, got)
	}
	t.Logf("Chromium.app --version => %s", got)
}

func TestResolveExtensionDownloadProdVersion_FromExecutableCommand(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("windows executable shim not covered in this test")
	}
	root := t.TempDir()
	exePath := filepath.Join(root, "chromium")
	if err := os.WriteFile(exePath, []byte("#!/bin/sh\necho 'Chromium 148.0.7778.215'\n"), 0o755); err != nil {
		t.Fatal(err)
	}

	manager := &Manager{
		AppRoot: root,
		Config: &config.Config{
			Browser: config.BrowserConfig{
				Cores: []Core{
					{CoreId: "chromium", CoreName: "Chromium", CorePath: root, IsDefault: true},
				},
			},
		},
	}
	got, err := manager.ResolveExtensionDownloadProdVersion()
	if err != nil {
		t.Fatal(err)
	}
	if got != "148.0.7778.215" {
		t.Fatalf("got %q", got)
	}
}
