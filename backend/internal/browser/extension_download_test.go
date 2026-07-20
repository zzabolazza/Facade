package browser

import (
	"facade/backend/internal/config"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestBuildChromeExtensionDownloadURL_UsesProvidedProdVersion(t *testing.T) {
	url := BuildChromeExtensionDownloadURL("nkbihfbeogaeaoehlefnkodbefgpgknn", "142.0.7444.175")
	if !strings.Contains(url, "prodversion=142.0.7444.175") {
		t.Fatalf("expected dynamic prodversion in %q", url)
	}
	if BuildChromeExtensionDownloadURL("nkbihfbeogaeaoehlefnkodbefgpgknn", "") != "" {
		t.Fatal("empty prodversion should not build URL")
	}
}

func TestNormalizeChromeProdVersion(t *testing.T) {
	cases := map[string]string{
		"142.0.7444.175":          "142.0.7444.175",
		"Chromium 131.0.6778.85\n": "131.0.6778.85",
		"  120.0.0.0 ":             "120.0.0.0",
		"":                        "",
		"not-a-version":           "",
	}
	for input, want := range cases {
		if got := NormalizeChromeProdVersion(input); got != want {
			t.Fatalf("NormalizeChromeProdVersion(%q)=%q want %q", input, got, want)
		}
	}
}

func TestResolveExtensionDownloadProdVersion_FromDefaultCore(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("windows executable shim not covered in this test")
	}
	root := t.TempDir()
	coreDir := filepath.Join(root, "chrome")
	if err := os.MkdirAll(coreDir, 0o755); err != nil {
		t.Fatal(err)
	}
	exePath := filepath.Join(coreDir, "chromium")
	if err := os.WriteFile(exePath, []byte("#!/bin/sh\necho 'Chromium 131.0.6778.85'\n"), 0o755); err != nil {
		t.Fatal(err)
	}

	manager := &Manager{
		AppRoot: root,
		Config: &config.Config{
			Browser: config.BrowserConfig{
				Cores: []Core{
					{CoreId: "core-1", CoreName: "Chrome", CorePath: coreDir, IsDefault: true},
				},
			},
		},
	}
	got, err := manager.ResolveExtensionDownloadProdVersion()
	if err != nil {
		t.Fatal(err)
	}
	if got != "131.0.6778.85" {
		t.Fatalf("got %q", got)
	}
}

func TestResolveExtensionDownloadProdVersion_MissingCore(t *testing.T) {
	manager := &Manager{
		Config: &config.Config{},
	}
	_, err := manager.ResolveExtensionDownloadProdVersion()
	if err == nil {
		t.Fatal("expected error when no cores configured")
	}
}

func TestNormalizeExtensionArchiveData_Empty(t *testing.T) {
	_, err := normalizeExtensionArchiveData(nil)
	if err == nil {
		t.Fatal("expected error for empty package")
	}
}

func TestDownloadChromeExtensionCRXOnce_RejectsNoContent(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	_, err := downloadChromeExtensionCRXOnce(t.Context(), server.Client(), server.URL, "131.0.6778.85")
	if err == nil || !strings.Contains(err.Error(), "HTTP 204") {
		t.Fatalf("expected HTTP 204 error, got %v", err)
	}
}
