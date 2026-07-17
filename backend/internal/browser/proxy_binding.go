package browser

import (
	"strings"
	"time"
)

func normalizeProxyBindValue(v string) string {
	return strings.ToLower(strings.TrimSpace(v))
}

func (m *Manager) listProxyCatalog() []Proxy {
	if m.ProxyDAO != nil {
		if list, err := m.ProxyDAO.List(); err == nil && len(list) > 0 {
			return append([]Proxy{}, list...)
		}
	}
	return append([]Proxy{}, m.Config.Browser.Proxies...)
}

func findProxyByID(list []Proxy, proxyID string) (Proxy, bool) {
	target := normalizeProxyBindValue(proxyID)
	if target == "" {
		return Proxy{}, false
	}
	for _, item := range list {
		if normalizeProxyBindValue(item.ProxyId) == target {
			return item, true
		}
	}
	return Proxy{}, false
}

func uniqueProxyMatch(list []Proxy, match func(Proxy) bool) (Proxy, bool) {
	var hit Proxy
	matched := 0
	for _, item := range list {
		if !match(item) {
			continue
		}
		hit = item
		matched++
		if matched > 1 {
			return Proxy{}, false
		}
	}
	return hit, matched == 1
}

func (m *Manager) GetProxyByID(proxyID string) (Proxy, bool) {
	return findProxyByID(m.listProxyCatalog(), proxyID)
}

func BindProfileToProxy(profile *Profile, proxy Proxy, syncProxyConfig bool) bool {
	if profile == nil {
		return false
	}

	changed := false
	if profile.ProxyId != strings.TrimSpace(proxy.ProxyId) {
		profile.ProxyId = strings.TrimSpace(proxy.ProxyId)
		changed = true
	}
	if syncProxyConfig {
		proxyConfig := strings.TrimSpace(proxy.ProxyConfig)
		if proxyConfig != "" && profile.ProxyConfig != proxyConfig {
			profile.ProxyConfig = proxyConfig
			changed = true
		}
	}

	proxyName := strings.TrimSpace(proxy.ProxyName)
	if profile.ProxyBindName != proxyName {
		profile.ProxyBindName = proxyName
		changed = true
	}
	if changed {
		profile.ProxyBindUpdatedAt = time.Now().Format(time.RFC3339)
	}
	return changed
}

func ClearProfileProxyBinding(profile *Profile) bool {
	if profile == nil {
		return false
	}
	changed := false
	if profile.ProxyBindName != "" {
		profile.ProxyBindName = ""
		changed = true
	}
	if changed {
		profile.ProxyBindUpdatedAt = time.Now().Format(time.RFC3339)
	}
	return changed
}

func (m *Manager) ResolveProfileProxyBinding(profile *Profile) (bool, bool, string) {
	if profile == nil {
		return false, false, ""
	}
	proxies := m.listProxyCatalog()
	if len(proxies) == 0 {
		return false, false, ""
	}

	if proxy, ok := findProxyByID(proxies, profile.ProxyId); ok {
		changed := BindProfileToProxy(profile, proxy, true)
		return changed, true, "proxy_id"
	}

	allowConfigFallback := strings.TrimSpace(profile.ProxyId) != "" || strings.TrimSpace(profile.ProxyBindName) != ""
	if proxy, ok, mode := matchProxyBySnapshot(profile, proxies, allowConfigFallback); ok {
		changed := BindProfileToProxy(profile, proxy, true)
		return changed, true, mode
	}

	return false, false, ""
}

func matchProxyBySnapshot(profile *Profile, proxies []Proxy, allowConfigFallback bool) (Proxy, bool, string) {
	nameKey := normalizeProxyBindValue(profile.ProxyBindName)
	cfgKey := normalizeProxyBindValue(profile.ProxyConfig)

	if nameKey != "" {
		if hit, ok := uniqueProxyMatch(proxies, func(item Proxy) bool {
			return normalizeProxyBindValue(item.ProxyName) == nameKey
		}); ok {
			return hit, true, "name"
		}
	}

	if allowConfigFallback && cfgKey != "" {
		if hit, ok := uniqueProxyMatch(proxies, func(item Proxy) bool {
			return normalizeProxyBindValue(item.ProxyConfig) == cfgKey
		}); ok {
			return hit, true, "config"
		}
	}

	return Proxy{}, false, ""
}
