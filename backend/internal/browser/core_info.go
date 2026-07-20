package browser

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// GetChromeVersion 通过已配置内核路径定位可执行文件，并执行 `--version` 获取版本号。
func (m *Manager) GetChromeVersion(corePath string) string {
	corePath = strings.TrimSpace(corePath)
	if corePath == "" {
		return ""
	}

	baseDir := m.ResolveRelativePath(corePath)
	exePath, _, ok := FindCoreExecutable(baseDir)
	if !ok {
		return ""
	}
	return readChromeVersionFromExecutable(exePath)
}

func readChromeVersionFromExecutable(exePath string) string {
	exePath = strings.TrimSpace(exePath)
	if exePath == "" {
		return ""
	}
	if abs, err := filepath.Abs(exePath); err == nil {
		exePath = abs
	}
	if info, err := os.Stat(exePath); err != nil || info.IsDir() {
		return ""
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, exePath, "--version")
	cmd.Env = append(os.Environ(), "CHROME_HEADLESS=1")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return ""
	}
	return NormalizeChromeProdVersion(string(output))
}

// CountInstancesByCore 统计使用指定内核的实例数量
func (m *Manager) CountInstancesByCore(coreId string) int {
	coreId = strings.TrimSpace(coreId)
	count := 0
	countByCoreID := func(profileCoreId string) {
		// 如果实例的 CoreId 为空，则使用默认内核
		if profileCoreId == "" {
			defaultCore, found := m.GetDefaultCore()
			if found && strings.EqualFold(defaultCore.CoreId, coreId) {
				count++
			}
		} else if strings.EqualFold(profileCoreId, coreId) {
			count++
		}
	}

	if len(m.Profiles) > 0 {
		for _, profile := range m.Profiles {
			countByCoreID(normalizeProfileCoreID(profile.CoreId))
		}
		return count
	}

	for _, profile := range m.Config.Browser.Profiles {
		countByCoreID(normalizeProfileCoreID(profile.CoreId))
	}
	return count
}

// GetCoresExtendedInfo 获取所有内核的扩展信息
func (m *Manager) GetCoresExtendedInfo() []CoreExtendedInfo {
	cores := m.ListCores()
	result := make([]CoreExtendedInfo, 0, len(cores))
	for _, core := range cores {
		info := CoreExtendedInfo{
			CoreId:        core.CoreId,
			ChromeVersion: m.GetChromeVersion(core.CorePath),
			InstanceCount: m.CountInstancesByCore(core.CoreId),
		}
		result = append(result, info)
	}
	return result
}
