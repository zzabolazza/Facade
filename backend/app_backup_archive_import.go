package backend

import (
	"encoding/json"
	"errors"
	"facade/backend/internal/backup"
	"facade/backend/internal/config"
	"facade/backend/internal/snapshot"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/yeka/zip"
)

func backupExtractAndValidate(zipPath string, password string) (string, backup.Manifest, error) {
	tmpDir, err := os.MkdirTemp("", "facade-import-*")
	if err != nil {
		return "", backup.Manifest{}, err
	}
	if err := backupUnzipPackage(zipPath, tmpDir, password); err != nil {
		_ = os.RemoveAll(tmpDir)
		return "", backup.Manifest{}, err
	}

	manifestPath := filepath.Join(tmpDir, "manifest.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		_ = os.RemoveAll(tmpDir)
		return "", backup.Manifest{}, fmt.Errorf("备份包缺少 manifest.json")
	}
	var manifest backup.Manifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		_ = os.RemoveAll(tmpDir)
		return "", backup.Manifest{}, fmt.Errorf("manifest.json 解析失败: %w", err)
	}
	if manifest.Format != backup.PackageFormat {
		_ = os.RemoveAll(tmpDir)
		return "", backup.Manifest{}, fmt.Errorf("不支持的备份格式: %s", manifest.Format)
	}
	if manifest.ManifestVersion != backup.ManifestVersion {
		_ = os.RemoveAll(tmpDir)
		return "", backup.Manifest{}, fmt.Errorf("不支持的 manifest 版本: %d", manifest.ManifestVersion)
	}
	if _, err := os.Stat(filepath.Join(tmpDir, "payload")); err != nil {
		_ = os.RemoveAll(tmpDir)
		return "", backup.Manifest{}, fmt.Errorf("备份包缺少 payload 目录")
	}
	return tmpDir, manifest, nil
}

func backupUnzipPackage(zipPath, dest, password string) error {
	password = strings.TrimSpace(password)
	if password == "" {
		if err := snapshot.UnzipTo(zipPath, dest); err != nil {
			return fmt.Errorf("解压备份包失败: %w", err)
		}
		return nil
	}
	if err := backupUnzipPasswordZip(zipPath, dest, password); err != nil {
		return err
	}
	return nil
}

func backupUnzipPasswordZip(zipPath, dest, password string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("打开备份 ZIP 失败: %w", err)
	}
	defer r.Close()

	sawEncrypted := false
	for _, f := range r.File {
		target := filepath.Join(dest, filepath.FromSlash(f.Name))
		if !strings.HasPrefix(filepath.Clean(target), filepath.Clean(dest)+string(os.PathSeparator)) &&
			filepath.Clean(target) != filepath.Clean(dest) {
			return fmt.Errorf("非法路径: %s", f.Name)
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, 0o755); err != nil {
				return err
			}
			continue
		}
		if f.IsEncrypted() {
			sawEncrypted = true
			f.SetPassword(password)
		} else {
			return fmt.Errorf("备份必须为 AES 密码保护的 ZIP（7-Zip 可解压）")
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		out, err := os.Create(target)
		if err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			out.Close()
			if errors.Is(err, zip.ErrPassword) {
				return fmt.Errorf("%w", backup.ErrInvalidPassword)
			}
			return fmt.Errorf("%w", backup.ErrInvalidPassword)
		}
		_, copyErr := io.Copy(out, rc)
		rc.Close()
		out.Close()
		if copyErr != nil {
			if errors.Is(copyErr, zip.ErrPassword) {
				return fmt.Errorf("%w", backup.ErrInvalidPassword)
			}
			return fmt.Errorf("解压备份失败: %w", copyErr)
		}
	}
	if !sawEncrypted {
		return fmt.Errorf("备份必须为 AES 密码保护的 ZIP（7-Zip 可解压）")
	}
	return nil
}

func backupLoadIncomingConfig(payloadRoot string) (*config.Config, bool, error) {
	cfgPath := filepath.Join(payloadRoot, "system", "config.yaml")
	if _, err := os.Stat(cfgPath); err != nil {
		if os.IsNotExist(err) {
			return nil, false, nil
		}
		return nil, false, err
	}
	cfg, err := config.Load(cfgPath)
	if err != nil {
		return nil, false, err
	}
	return cfg, true, nil
}

func backupDetectPresentManifestEntries(extractRoot string, manifest backup.Manifest) map[string]backup.ManifestEntry {
	result := make(map[string]backup.ManifestEntry, len(manifest.Entries))
	for _, entry := range manifest.Entries {
		id := strings.TrimSpace(entry.ID)
		if id == "" {
			continue
		}
		archivePath := strings.TrimSpace(strings.TrimSuffix(entry.ArchivePath, "/"))
		if archivePath == "" {
			continue
		}
		absPath := filepath.Join(extractRoot, filepath.FromSlash(archivePath))
		if _, err := os.Stat(absPath); err == nil {
			result[id] = entry
		}
	}
	return result
}
