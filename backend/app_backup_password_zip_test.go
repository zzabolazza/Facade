package backend

import (
	"errors"
	"facade/backend/internal/backup"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestPasswordZipRoundTripAndWrongPassword(t *testing.T) {
	root := t.TempDir()
	srcDir := filepath.Join(root, "payload", "app", "data")
	if err := os.MkdirAll(srcDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(srcDir, "note.txt"), []byte("hello-backup"), 0o644); err != nil {
		t.Fatal(err)
	}

	scope := backup.Scope{
		Entries: []backup.ScopeEntry{{
			ID:          "app_data",
			SourcePath:  filepath.Join(root, "payload", "app", "data"),
			ArchivePath: "payload/app/data/",
			Required:    true,
		}},
	}
	manifest := backup.BuildManifest(scope, "Facade", "test", time.Now())
	zipPath := filepath.Join(root, "backup.zip")
	password := "correct-password"

	if _, _, _, err := backupWritePackageZip(zipPath, scope, manifest, password, nil); err != nil {
		t.Fatalf("write password zip: %v", err)
	}

	extractOK := filepath.Join(root, "ok")
	if err := os.MkdirAll(extractOK, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := backupUnzipPasswordZip(zipPath, extractOK, password); err != nil {
		t.Fatalf("unzip with password: %v", err)
	}
	got, err := os.ReadFile(filepath.Join(extractOK, "payload", "app", "data", "note.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "hello-backup" {
		t.Fatalf("unexpected content: %q", got)
	}

	extractBad := filepath.Join(root, "bad")
	if err := os.MkdirAll(extractBad, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := backupUnzipPasswordZip(zipPath, extractBad, "wrong-password"); !errors.Is(err, backup.ErrInvalidPassword) {
		t.Fatalf("expected invalid password, got %v", err)
	}
}

func TestPasswordZipRejectsPlainZip(t *testing.T) {
	root := t.TempDir()
	srcDir := filepath.Join(root, "data")
	if err := os.MkdirAll(srcDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(srcDir, "a.txt"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	scope := backup.Scope{
		Entries: []backup.ScopeEntry{{
			ID:          "data",
			SourcePath:  srcDir,
			ArchivePath: "payload/data/",
			Required:    true,
		}},
	}
	manifest := backup.BuildManifest(scope, "Facade", "test", time.Now())
	plainZip := filepath.Join(root, "plain.zip")
	if _, _, _, err := backupWritePackageZip(plainZip, scope, manifest, "", nil); err != nil {
		t.Fatal(err)
	}
	dest := filepath.Join(root, "out")
	_ = os.MkdirAll(dest, 0o755)
	err := backupUnzipPasswordZip(plainZip, dest, "any-password")
	if err == nil {
		t.Fatal("expected plain zip rejection")
	}
}
