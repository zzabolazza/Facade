package proxy

import (
	"ant-chrome/backend/internal/config"
	"fmt"
	"strings"
)

// ProxyBuildDiagnostic 原生代理诊断结果（不启动外部进程）。
type ProxyBuildDiagnostic struct {
	ProxyId         string   `json:"proxyId"`
	ProxyName       string   `json:"proxyName"`
	Found           bool     `json:"found"`
	Ok              bool     `json:"ok"`
	Engine          string   `json:"engine"`
	RawConfigMasked string   `json:"rawConfigMasked"`
	StandardProxy   string   `json:"standardProxy"`
	Errors          []string `json:"errors"`
}

// BuildProxyDiagnostic 校验原生代理配置并返回诊断信息。
func BuildProxyDiagnostic(proxyConfig string, proxies []config.BrowserProxy, proxyId string) ProxyBuildDiagnostic {
	proxyId = strings.TrimSpace(proxyId)
	item, found := findProxyForDiagnostic(proxies, proxyId)
	src := strings.TrimSpace(proxyConfig)
	if proxyId != "" && found {
		src = strings.TrimSpace(item.ProxyConfig)
	}

	result := ProxyBuildDiagnostic{
		ProxyId:         proxyId,
		Found:           found || proxyId == "",
		RawConfigMasked: maskProxyConfig(src),
	}
	if found {
		result.ProxyName = item.ProxyName
	}
	if proxyId != "" && !found && src == "" {
		result.Errors = append(result.Errors, fmt.Sprintf("代理池节点已不存在: %s", proxyId))
		return result
	}
	if src == "" {
		result.Engine = "empty"
		result.Ok = true
		return result
	}

	normalized, err := ParseNativeProxyURL(src)
	if err != nil {
		result.Engine = DetectProxyProtocol(src)
		result.Errors = append(result.Errors, err.Error())
		return result
	}
	result.Engine = DetectProxyProtocol(normalized)
	result.StandardProxy = normalized
	result.RawConfigMasked = maskProxyConfig(normalized)
	result.Ok = true
	return result
}

func findProxyForDiagnostic(proxies []config.BrowserProxy, proxyId string) (config.BrowserProxy, bool) {
	proxyId = strings.TrimSpace(proxyId)
	if proxyId == "" {
		return config.BrowserProxy{}, false
	}
	for _, item := range proxies {
		if strings.EqualFold(strings.TrimSpace(item.ProxyId), proxyId) {
			return item, true
		}
	}
	return config.BrowserProxy{}, false
}

func maskProxyConfig(src string) string {
	src = strings.TrimSpace(src)
	if src == "" {
		return ""
	}
	if strings.Contains(src, "@") {
		parts := strings.SplitN(src, "@", 2)
		schemeAndUser := parts[0]
		if idx := strings.Index(schemeAndUser, "://"); idx >= 0 {
			return schemeAndUser[:idx+3] + "***@" + parts[1]
		}
	}
	return src
}
