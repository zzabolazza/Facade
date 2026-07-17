import type { BrowserProxy } from '../../types'

export const BUILTIN_PROXY_IDS = new Set(['__direct__'])

export const BUILTIN_PROXIES: BrowserProxy[] = [
  { proxyId: '__direct__', proxyName: '直连（不走代理）', proxyConfig: 'direct://' },
]

export interface DirectImportForm {
  proxyName: string
  protocol: 'direct' | 'http' | 'https' | 'socks5'
  server: string
  port: string
  username: string
  password: string
}

export const DIRECT_PROXY_PROTOCOL_OPTIONS = [
  { value: 'direct', label: '直连' },
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
  { value: 'socks5', label: 'SOCKS5' },
] as const

export const INITIAL_DIRECT_IMPORT_FORM: DirectImportForm = {
  proxyName: '',
  protocol: 'http',
  server: '',
  port: '',
  username: '',
  password: '',
}

export interface ImportCandidate {
  proxyName: string
  proxyConfig: string
  groupName?: string
}

export interface ProxyDisplayInfo {
  proxyId: string
  proxyName: string
  proxyConfig: string
  groupName: string
  type: string
  server: string
  port: number
  latencyMs?: number
}

export function ensureBuiltinProxies(list: BrowserProxy[]): BrowserProxy[] {
  const hasDirect = list.some((item) => item.proxyId === '__direct__')
  if (hasDirect) return list
  return [...BUILTIN_PROXIES, ...list]
}

export function toDisplayList(proxies: BrowserProxy[]): ProxyDisplayInfo[] {
  return proxies.map((proxy) => {
    const info = parseProxyDisplay(proxy.proxyConfig)
    return {
      proxyId: proxy.proxyId,
      proxyName: proxy.proxyName,
      proxyConfig: proxy.proxyConfig,
      groupName: proxy.groupName || '',
      type: info.type,
      server: info.server,
      port: info.port,
      latencyMs: proxy.lastLatencyMs,
    }
  })
}

function parseProxyDisplay(proxyConfig: string): { type: string; server: string; port: number } {
  const raw = (proxyConfig || '').trim()
  if (!raw || raw === 'direct://') {
    return { type: 'direct', server: '-', port: 0 }
  }
  try {
    const parsed = new URL(raw)
    const type = (parsed.protocol || '').replace(/:$/, '').toLowerCase() || 'unknown'
    const port = Number(parsed.port || 0)
    return {
      type,
      server: parsed.hostname || '-',
      port: Number.isFinite(port) ? port : 0,
    }
  } catch {
    return { type: 'unknown', server: '-', port: 0 }
  }
}

export function nextProxyID(existing: BrowserProxy[]): string {
  const used = new Set(existing.map((item) => item.proxyId))
  let index = existing.length + 1
  while (used.has(`proxy-${index}`)) index += 1
  return `proxy-${index}`
}
