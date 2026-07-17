package proxy

import (
	"fmt"
	"net/url"
	"strings"
)

// proxyEndpoint 从原生代理配置中提取 server:port，用于 TCP ping。
func proxyEndpoint(src string) (string, error) {
	src = strings.TrimSpace(src)
	if src == "" || strings.EqualFold(src, "direct://") {
		return "", fmt.Errorf("直连无需 TCP 探测")
	}
	normalized, err := ParseNativeProxyURL(src)
	if err != nil {
		return "", err
	}
	parsed, err := url.Parse(normalized)
	if err != nil {
		return "", err
	}
	if parsed.Host == "" {
		return "", fmt.Errorf("缺少代理地址")
	}
	return parsed.Host, nil
}
