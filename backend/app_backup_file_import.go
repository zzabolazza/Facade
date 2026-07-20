package backend

import (
	"facade/backend/internal/config"
	"os"
	"path/filepath"
	"strings"
)

func (a *App) backupImportFileTrees(payloadRoot string, incomingCfg *config.Config, resetFirst bool, stats *backupMergeStats, preservePaths []string, onIssue func(componentID, componentName string, err error)) {
	report := func(componentID, componentName string, err error) {
		if onIssue != nil && err != nil {
			onIssue(componentID, componentName, err)
		}
	}

	appDataSrc := filepath.Join(payloadRoot, "app", "data")
	appDataDst := a.resolveAppPath("data")
	dbPath := a.backupResolveDBPath(a.config)
	skipDBFiles := backupDBFileSkipMatcher(appDataDst, dbPath)
	skipOperationalFiles := func(rel string) bool {
		if skipDBFiles(rel) {
			return true
		}
		target := filepath.Join(appDataDst, filepath.FromSlash(rel))
		for _, path := range preservePaths {
			if strings.TrimSpace(path) != "" && backupPathWithin(target, path) {
				return true
			}
		}
		return false
	}
	keepDB := map[string]struct{}{
		backupNormalizePath(dbPath):          {},
		backupNormalizePath(dbPath + "-wal"): {},
		backupNormalizePath(dbPath + "-shm"): {},
	}
	for _, path := range preservePaths {
		if backupPathWithin(path, appDataDst) {
			keepDB[backupNormalizePath(path)] = struct{}{}
		}
	}

	if backupPathExists(appDataSrc) {
		if resetFirst {
			if err := backupRemoveContentsExcept(appDataDst, keepDB); err != nil {
				report("app_data_root", "应用数据目录（含数据库、快照及默认浏览器数据）", err)
			} else if err := backupSyncDir(appDataSrc, appDataDst, true, stats, skipOperationalFiles); err != nil {
				report("app_data_root", "应用数据目录（含数据库、快照及默认浏览器数据）", err)
			}
		} else {
			if err := backupSyncDir(appDataSrc, appDataDst, false, stats, skipDBFiles); err != nil {
				report("app_data_root", "应用数据目录（含数据库、快照及默认浏览器数据）", err)
			}
		}
	}

	userDataSrc := filepath.Join(payloadRoot, "browser", "user-data")
	userDataDst := a.backupResolveUserDataRoot(a.config)
	if backupPathExists(userDataSrc) {
		if resetFirst {
			if err := os.RemoveAll(userDataDst); err != nil {
				report("browser_user_data_root", "浏览器用户数据根目录", err)
			} else if err := os.MkdirAll(userDataDst, 0755); err != nil {
				report("browser_user_data_root", "浏览器用户数据根目录（若与 data 重合则自动去重）", err)
			} else if err := backupSyncDir(userDataSrc, userDataDst, true, stats, nil); err != nil {
				report("browser_user_data_root", "浏览器用户数据根目录（若与 data 重合则自动去重）", err)
			}
		} else {
			if err := backupSyncDir(userDataSrc, userDataDst, false, stats, nil); err != nil {
				report("browser_user_data_root", "浏览器用户数据根目录（若与 data 重合则自动去重）", err)
			}
		}
	}

	externalSrcRoot := filepath.Join(payloadRoot, "browser", "cores", "external")
	if backupPathExists(externalSrcRoot) {
		// 内核文件不在备份范围内：旧包若仍含外部内核树，一律跳过，绝不写入本机 core_path。
		entries, err := os.ReadDir(externalSrcRoot)
		if err != nil {
			stats.Skipped++
			return
		}
		skippedFolders := 0
		for _, entry := range entries {
			if entry.IsDir() {
				skippedFolders++
				stats.Skipped++
			}
		}
		if skippedFolders == 0 {
			stats.Skipped++
		}
	}
}
