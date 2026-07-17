package backend

import (
	"ant-chrome/backend/internal/browser"
	"ant-chrome/backend/internal/proxy"
	"strings"
)

func (a *App) BrowserProxyList() []BrowserProxy {
	return browser.ListProxiesWithFallback(a.browserMgr.ProxyDAO, a.config.Browser.Proxies)
}

func (a *App) BrowserProxyListGroups() []string {
	return browser.ListProxyGroups(a.browserMgr.ProxyDAO)
}

func (a *App) BrowserProxyListByGroup(groupName string) []BrowserProxy {
	return browser.ListProxiesByGroupWithFallback(a.browserMgr.ProxyDAO, groupName, a.config.Browser.Proxies)
}

func (a *App) ValidateProxyConfig(proxyConfig string, proxyId string) ProxyValidationResult {
	proxies := a.getLatestProxies()
	supported, errorMsg := proxy.ValidateProxyConfig(proxyConfig, proxies, proxyId)
	return ProxyValidationResult{
		Supported: supported,
		ErrorMsg:  errorMsg,
	}
}

func (a *App) TestProxyConnectivity(proxyId string, proxyConfig string) ProxyTestResult {
	proxies := a.getLatestProxies()
	result := proxy.TestConnectivity(proxyId, proxyConfig, proxies)
	return buildProxyTestResult(result)
}

func (a *App) TestProxyRealConnectivity(proxyId string) ProxyTestResult {
	proxies := a.getLatestProxies()
	result := proxy.TestRealConnectivity(proxyId, proxies, a.proxySpeedTestConfig())
	return buildProxyTestResult(result)
}

func resolveProxyConfigForApp(proxyConfig string, proxies []BrowserProxy, proxyId string) string {
	proxyConfig = strings.TrimSpace(proxyConfig)
	proxyId = strings.TrimSpace(proxyId)
	if proxyId == "" {
		return proxyConfig
	}
	for _, item := range proxies {
		if strings.EqualFold(item.ProxyId, proxyId) {
			return strings.TrimSpace(item.ProxyConfig)
		}
	}
	return proxyConfig
}

func (a *App) getLatestProxies() []BrowserProxy {
	return browser.LatestProxiesWithFallback(a.browserMgr.ProxyDAO, a.config.Browser.Proxies)
}
