import type { DirectImportForm, ImportCandidate } from './helpers.types'

function normalizeDirectProxyConfig(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^socket:\/\//i.test(trimmed)) {
    return trimmed.replace(/^socket:\/\//i, 'socks5://')
  }
  if (/^socks:\/\//i.test(trimmed)) {
    return trimmed.replace(/^socks:\/\//i, 'socks5://')
  }
  return trimmed
}

function resolveDirectProxyName(
  rawName: string,
  scheme: string,
  server: string,
  port: number,
  index: number,
): string {
  const name = rawName.trim()
  if (scheme === 'direct') {
    return name || '直连（不走代理）'
  }
  const fallbackName = server
    ? `${scheme.toUpperCase()}-${server}${port > 0 ? `:${port}` : ''}`
    : `新建代理 ${index + 1}`
  return name || fallbackName
}

function formatDirectProxyHost(raw: string): string {
  const host = raw.trim()
  if (!host) return ''
  if (host.startsWith('[') && host.endsWith(']')) {
    return host
  }
  return host.includes(':') ? `[${host}]` : host
}

function normalizeDirectProtocol(raw: unknown): DirectImportForm['protocol'] {
  const protocol = String(raw || '').trim().toLowerCase()
  if (protocol === 'direct' || protocol === 'http' || protocol === 'https' || protocol === 'socks5') {
    return protocol
  }
  if (protocol === 'socks' || protocol === 'socket') {
    return 'socks5'
  }
  throw new Error('protocol 仅支持 direct / http / https / socks5')
}

export function parseDirectProxyURL(raw: string): DirectImportForm {
  const normalized = normalizeDirectProxyConfig(raw)
  if (!normalized) {
    throw new Error('请输入标准代理地址')
  }
  if (/^direct:\/\//i.test(normalized)) {
    return {
      proxyName: '',
      protocol: 'direct',
      server: '',
      port: '',
      username: '',
      password: '',
    }
  }
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(normalized)) {
    throw new Error('单行文本需要包含协议头')
  }

  let parsedURL: URL
  try {
    parsedURL = new URL(normalized)
  } catch {
    throw new Error('单行代理文本格式无效')
  }

  const protocol = normalizeDirectProtocol(parsedURL.protocol.replace(/:$/, ''))
  const server = parsedURL.hostname.replace(/^\[(.*)\]$/, '$1').trim()
  if (!server) {
    throw new Error('代理地址缺少主机名')
  }

  const port = Number(parsedURL.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('代理地址缺少有效端口')
  }

  return {
    proxyName: '',
    protocol,
    server,
    port: String(port),
    username: parsedURL.username ? decodeURIComponent(parsedURL.username) : '',
    password: parsedURL.password ? decodeURIComponent(parsedURL.password) : '',
  }
}

export function formFromProxyConfig(proxyName: string, proxyConfig: string): DirectImportForm {
  if (!proxyConfig.trim() || proxyConfig.trim() === 'direct://') {
    return {
      proxyName,
      protocol: 'direct',
      server: '',
      port: '',
      username: '',
      password: '',
    }
  }
  const parsed = parseDirectProxyURL(proxyConfig)
  return { ...parsed, proxyName: proxyName || parsed.proxyName }
}

export function buildDirectImportCandidate(form: DirectImportForm): ImportCandidate {
  if (form.protocol === 'direct') {
    return {
      proxyName: resolveDirectProxyName(form.proxyName, 'direct', '', 0, 0),
      proxyConfig: 'direct://',
    }
  }

  const serverInput = form.server.trim()
  if (!serverInput) {
    throw new Error('请输入代理地址')
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(serverInput)) {
    throw new Error('代理地址只需要填写主机名或 IP，不需要协议头')
  }

  const portInput = form.port.trim()
  if (!portInput) {
    throw new Error('请输入代理端口')
  }
  if (!/^\d+$/.test(portInput)) {
    throw new Error('代理端口必须为数字')
  }

  const port = Number(portInput)
  if (port < 1 || port > 65535) {
    throw new Error('代理端口必须在 1-65535 之间')
  }

  const username = form.username.trim()
  const password = form.password
  if (password && !username) {
    throw new Error('填写密码时请同时填写账号')
  }

  const auth = username
    ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ''}@`
    : ''
  const rawConfig = `${form.protocol}://${auth}${formatDirectProxyHost(serverInput)}:${port}`

  let parsedURL: URL
  try {
    parsedURL = new URL(rawConfig)
  } catch {
    throw new Error('请输入有效的代理地址')
  }

  if (!parsedURL.hostname) {
    throw new Error('请输入有效的代理地址')
  }

  const normalizedConfig = normalizeDirectProxyConfig(parsedURL.toString()).replace(/\/$/, '')
  const normalizedServer = parsedURL.hostname.replace(/^\[(.*)\]$/, '$1')

  return {
    proxyName: resolveDirectProxyName(form.proxyName, form.protocol, normalizedServer, port, 0),
    proxyConfig: normalizedConfig,
  }
}
