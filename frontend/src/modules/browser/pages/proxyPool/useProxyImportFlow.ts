import { useState } from 'react'
import { toast } from '../../../../shared/components'
import type { BrowserProxy } from '../../types'
import {
  INITIAL_DIRECT_IMPORT_FORM,
  buildDirectImportCandidate,
  buildDirectImportCandidatesFromText,
  ensureBuiltinProxies,
  nextProxyID,
  parseDirectImportText,
  toDisplayList,
  type DirectImportForm,
  type ImportCandidate,
  type ProxyDisplayInfo,
} from './helpers'

interface UseProxyImportFlowOptions {
  proxies: BrowserProxy[]
  saveProxies: (list: BrowserProxy[]) => Promise<void>
}

export function useProxyImportFlow({ proxies, saveProxies }: UseProxyImportFlowOptions) {
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importGroupName, setImportGroupName] = useState('')
  const [directImportText, setDirectImportText] = useState('')
  const [directImportForm, setDirectImportForm] = useState<DirectImportForm>(() => ({ ...INITIAL_DIRECT_IMPORT_FORM }))
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewList, setPreviewList] = useState<ProxyDisplayInfo[]>([])
  const [previewCandidates, setPreviewCandidates] = useState<ImportCandidate[]>([])
  const [removedPreviewProxyNames, setRemovedPreviewProxyNames] = useState<string[]>([])
  const [importing, setImporting] = useState(false)

  const canParseImport =
    directImportForm.protocol === 'direct' ||
    !!directImportText.trim() ||
    (!!directImportForm.server.trim() && !!directImportForm.port.trim())

  const resetImportState = () => {
    setImportGroupName('')
    setDirectImportText('')
    setDirectImportForm({ ...INITIAL_DIRECT_IMPORT_FORM })
    setPreviewList([])
    setPreviewCandidates([])
    setRemovedPreviewProxyNames([])
  }

  const handleApplyDirectText = () => {
    try {
      const parsed = parseDirectImportText(directImportText)
      setDirectImportForm(parsed.form)
      if (parsed.groupName) setImportGroupName(parsed.groupName)
      toast.success('已应用到表单')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '解析失败')
    }
  }

  const handleRemovePreviewProxy = (proxyId: string) => {
    const removed = previewList.find((item) => item.proxyId === proxyId)
    setPreviewList((prev) => prev.filter((item) => item.proxyId !== proxyId))
    setPreviewCandidates((prev) => prev.filter((_, index) => previewList[index]?.proxyId !== proxyId))
    if (removed) {
      setRemovedPreviewProxyNames((prev) => [...prev, removed.proxyName])
    }
  }

  const handleParseImport = () => {
    try {
      let candidates: ImportCandidate[] = []
      if (directImportText.trim()) {
        const parsed = buildDirectImportCandidatesFromText(directImportText)
        candidates = parsed.candidates
        if (!importGroupName.trim() && parsed.defaultGroupName) {
          setImportGroupName(parsed.defaultGroupName)
        }
      } else {
        candidates = [buildDirectImportCandidate(directImportForm)]
      }

      const groupName = importGroupName.trim()
      const withGroup = candidates.map((item) => ({
        ...item,
        groupName: item.groupName || groupName || undefined,
      }))

      const tempList: BrowserProxy[] = withGroup.map((item, index) => ({
        proxyId: `preview-${index}`,
        proxyName: item.proxyName,
        proxyConfig: item.proxyConfig,
        groupName: item.groupName,
      }))

      setPreviewCandidates(withGroup)
      setPreviewList(toDisplayList(tempList))
      setRemovedPreviewProxyNames([])
      setPreviewModalOpen(true)
      setImportModalOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '解析失败')
    }
  }

  const handleConfirmImport = async () => {
    if (previewCandidates.length === 0) return
    setImporting(true)
    try {
      let next = [...proxies]
      for (const candidate of previewCandidates) {
        const proxyId = nextProxyID(next)
        next.push({
          proxyId,
          proxyName: candidate.proxyName,
          proxyConfig: candidate.proxyConfig,
          groupName: candidate.groupName,
        })
      }
      next = ensureBuiltinProxies(next)
      await saveProxies(next)
      toast.success(`已导入 ${previewCandidates.length} 条代理`)
      setPreviewModalOpen(false)
      resetImportState()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return {
    importModalOpen,
    setImportModalOpen,
    importGroupName,
    setImportGroupName,
    directImportText,
    setDirectImportText,
    directImportForm,
    setDirectImportForm,
    previewModalOpen,
    setPreviewModalOpen,
    previewList,
    removedPreviewProxyNames,
    importing,
    canParseImport,
    handleRemovePreviewProxy,
    handleApplyDirectText,
    handleParseImport,
    handleConfirmImport,
    resetImportState,
  }
}
