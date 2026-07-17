package proxy

import (
	"io"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"ant-chrome/backend/internal/config"
)

const defaultBrowserPageProbeConcurrency = 8

var DefaultBrowserPageProbeConfig = BrowserPageProbeConfig{
	URLs:        []string{DefaultSpeedTestURL},
	Timeout:     15 * time.Second,
	Concurrency: defaultBrowserPageProbeConcurrency,
}

type BrowserPageProbeConfig struct {
	URLs        []string
	Timeout     time.Duration
	Concurrency int
}

type BrowserPageProbeResult struct {
	ProxyId     string
	Ok          bool
	TotalMs     int64
	AverageMs   int64
	P95Ms       int64
	Bytes       int64
	Completed   int
	Failed      int
	Concurrency int
	Error       string
}

func ProbeBrowserPageConnectivity(
	proxyId string,
	proxies []config.BrowserProxy,
	cfg *BrowserPageProbeConfig,
) BrowserPageProbeResult {
	normalized := normalizeBrowserPageProbeConfig(cfg)
	client, err := buildProxyHTTPClient("", proxyId, proxies, normalized.Timeout)
	if err != nil {
		return BrowserPageProbeResult{ProxyId: proxyId, Ok: false, Error: err.Error(), Concurrency: normalized.Concurrency}
	}
	return runBrowserPageProbe(proxyId, client, normalized)
}

func normalizeBrowserPageProbeConfig(cfg *BrowserPageProbeConfig) BrowserPageProbeConfig {
	normalized := DefaultBrowserPageProbeConfig
	normalized.URLs = append([]string{}, DefaultBrowserPageProbeConfig.URLs...)
	if cfg == nil {
		return normalized
	}
	urls := make([]string, 0, len(cfg.URLs))
	for _, rawURL := range cfg.URLs {
		if url := strings.TrimSpace(rawURL); url != "" {
			urls = append(urls, url)
		}
	}
	if len(urls) > 0 {
		normalized.URLs = urls
	}
	if cfg.Timeout > 0 {
		normalized.Timeout = cfg.Timeout
	}
	if cfg.Concurrency > 0 {
		normalized.Concurrency = cfg.Concurrency
	}
	return normalized
}

func runBrowserPageProbe(proxyId string, client *http.Client, cfg BrowserPageProbeConfig) BrowserPageProbeResult {
	type probeItem struct {
		ok      bool
		elapsed time.Duration
		bytes   int64
	}

	jobs := make(chan string, len(cfg.URLs))
	results := make(chan probeItem, len(cfg.URLs))
	var wg sync.WaitGroup
	workers := cfg.Concurrency
	if workers > len(cfg.URLs) {
		workers = len(cfg.URLs)
	}
	if workers < 1 {
		workers = 1
	}
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for target := range jobs {
				start := time.Now()
				resp, err := client.Get(target)
				elapsed := time.Since(start)
				if err != nil {
					results <- probeItem{ok: false, elapsed: elapsed}
					continue
				}
				n, _ := io.Copy(io.Discard, resp.Body)
				_ = resp.Body.Close()
				ok := resp.StatusCode >= 200 && resp.StatusCode < 400
				results <- probeItem{ok: ok, elapsed: elapsed, bytes: n}
			}
		}()
	}
	for _, u := range cfg.URLs {
		jobs <- u
	}
	close(jobs)
	wg.Wait()
	close(results)

	var completed, failed int
	var totalBytes int64
	var totalMs int64
	latencies := make([]int64, 0, len(cfg.URLs))
	for item := range results {
		totalMs += item.elapsed.Milliseconds()
		totalBytes += item.bytes
		latencies = append(latencies, item.elapsed.Milliseconds())
		if item.ok {
			completed++
		} else {
			failed++
		}
	}

	result := BrowserPageProbeResult{
		ProxyId:     proxyId,
		Ok:          failed == 0 && completed > 0,
		TotalMs:     totalMs,
		Bytes:       totalBytes,
		Completed:   completed,
		Failed:      failed,
		Concurrency: workers,
	}
	if len(latencies) > 0 {
		sort.Slice(latencies, func(i, j int) bool { return latencies[i] < latencies[j] })
		sum := int64(0)
		for _, v := range latencies {
			sum += v
		}
		result.AverageMs = sum / int64(len(latencies))
		idx := int(float64(len(latencies)-1) * 0.95)
		if idx < 0 {
			idx = 0
		}
		result.P95Ms = latencies[idx]
	}
	if !result.Ok && failed > 0 {
		result.Error = "部分或全部探测失败"
	}
	return result
}
