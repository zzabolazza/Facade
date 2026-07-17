import { useState } from 'react'
import { toast } from '../../../shared/components'
import type { BrowserProxy } from '../types'
import { saveBrowserProxies } from '../api'
import {
  INITIAL_DIRECT_IMPORT_FORM,
  buildDirectImportCandidate,
  ensureBuiltinProxies,
  nextProxyID,
  type DirectImportForm,
} from '../pages/proxyPool/helpers'
import { ProxyPoolImportModal } from '../pages/proxyPool/ProxyPoolImportModal'

interface ProxyImportModalProps {
  open: boolean
  onClose: () => void
  existingProxies: BrowserProxy[]
  groups: string[]
  onImported: (proxies: BrowserProxy[]) => void
}

export function ProxyImportModal({
  open,
  onClose,
  existingProxies,
  groups,
  onImported,
}: ProxyImportModalProps) {
  const [importGroupName, setImportGroupName] = useState('')
  const [directImportText, setDirectImportText] = useState('')
  const [directImportForm, setDirectImportForm] = useState<DirectImportForm>(() => ({ ...INITIAL_DIRECT_IMPORT_FORM }))
  const [saving, setSaving] = useState(false)

  const canParseImport =
    directImportForm.protocol === 'direct' ||
    !!directImportText.trim() ||
    (!!directImportForm.server.trim() && !!directImportForm.port.trim())

  const handleParse = async () => {
    setSaving(true)
    try {
      const candidate = buildDirectImportCandidate(directImportForm)
      const proxyId = nextProxyID(existingProxies)
      const next = ensureBuiltinProxies([
        ...existingProxies,
        {
          proxyId,
          proxyName: candidate.proxyName,
          proxyConfig: candidate.proxyConfig,
          groupName: importGroupName.trim() || undefined,
        },
      ])
      await saveBrowserProxies(next)
      onImported(next)
      setImportGroupName('')
      setDirectImportText('')
      setDirectImportForm({ ...INITIAL_DIRECT_IMPORT_FORM })
      onClose()
      toast.success('代理已创建')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProxyPoolImportModal
      open={open}
      groups={groups}
      importGroupName={importGroupName}
      directImportText={directImportText}
      directImportForm={directImportForm}
      canParseImport={canParseImport && !saving}
      onClose={onClose}
      onParse={() => void handleParse()}
      onImportGroupNameChange={setImportGroupName}
      onDirectImportTextChange={setDirectImportText}
      onApplyDirectText={() => toast.info('请在代理池页面使用文本批量导入')}
      onDirectImportFormChange={(patch) => setDirectImportForm((prev) => ({ ...prev, ...patch }))}
    />
  )
}
