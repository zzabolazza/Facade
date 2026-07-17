import { Button, FormItem, Input, Modal, Select } from '../../../../shared/components'
import type { ProxyIPHealthResult } from '../../types'
import { DIRECT_PROXY_PROTOCOL_OPTIONS, type DirectImportForm, type ProxyDisplayInfo } from './helpers'
import type { TableColumn } from '../../../../shared/components/Table'
import { Table } from '../../../../shared/components'

export interface ProxyEditFormValue {
  proxyName: string
  protocol: DirectImportForm['protocol']
  server: string
  port: string
  username: string
  password: string
  groupName: string
}

export { ProxyPoolImportModal } from './ProxyPoolImportModal'

interface ProxyPoolPreviewModalProps {
  open: boolean
  previewList: ProxyDisplayInfo[]
  removedPreviewProxyNames: string[]
  importing: boolean
  onClose: () => void
  onBack: () => void
  onConfirm: () => void
  onRemoveProxy: (proxyId: string) => void
}

export function ProxyPoolPreviewModal({
  open,
  previewList,
  removedPreviewProxyNames,
  importing,
  onClose,
  onBack,
  onConfirm,
  onRemoveProxy,
}: ProxyPoolPreviewModalProps) {
  const previewColumns: TableColumn<ProxyDisplayInfo>[] = [
    { key: 'proxyName', title: '代理名称', width: '200px' },
    { key: 'type', title: '类型', width: '100px' },
    { key: 'server', title: '服务器', width: '200px' },
    { key: 'port', title: '端口', width: '100px', render: (value) => value || '-' },
    {
      key: 'actions',
      title: '操作',
      width: '96px',
      render: (_, record) => (
        <Button size="sm" variant="danger" onClick={() => onRemoveProxy(record.proxyId)}>
          删除
        </Button>
      ),
    },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="确认导入以下代理"
      width="700px"
      footer={
        <>
          <Button variant="secondary" onClick={onBack}>
            返回修改
          </Button>
          <Button onClick={onConfirm} loading={importing} disabled={previewList.length === 0}>
            确认导入
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          保留 {previewList.length} 条，删除 {removedPreviewProxyNames.length} 条。
        </p>
        <Table columns={previewColumns} data={previewList} rowKey="proxyId" maxHeight="380px" emptyText="无代理数据" />
      </div>
    </Modal>
  )
}

interface ProxyPoolEditModalProps {
  open: boolean
  saving: boolean
  groups: string[]
  editForm: ProxyEditFormValue
  onClose: () => void
  onSave: () => void
  onChange: (patch: Partial<ProxyEditFormValue>) => void
}

export function ProxyPoolEditModal({
  open,
  saving,
  groups,
  editForm,
  onClose,
  onSave,
  onChange,
}: ProxyPoolEditModalProps) {
  const isDirect = editForm.protocol === 'direct'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="编辑代理"
      width="500px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onSave} loading={saving}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormItem label="协议类型" required>
          <Select
            value={editForm.protocol}
            onChange={(event) => onChange({ protocol: event.target.value as ProxyEditFormValue['protocol'] })}
            options={[...DIRECT_PROXY_PROTOCOL_OPTIONS]}
          />
        </FormItem>
        <FormItem label="代理名称" required>
          <Input
            value={editForm.proxyName}
            onChange={(event) => onChange({ proxyName: event.target.value })}
            placeholder="节点名称"
          />
        </FormItem>
        <FormItem label="分组名称（可选）">
          <Input
            value={editForm.groupName}
            onChange={(event) => onChange({ groupName: event.target.value })}
            placeholder="分组名称"
            list="edit-proxy-groups-datalist"
          />
          <datalist id="edit-proxy-groups-datalist">
            {groups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </FormItem>
        {!isDirect && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormItem label="服务器" required>
              <Input
                value={editForm.server}
                onChange={(event) => onChange({ server: event.target.value })}
              />
            </FormItem>
            <FormItem label="端口" required>
              <Input
                type="number"
                min={1}
                max={65535}
                value={editForm.port}
                onChange={(event) => onChange({ port: event.target.value })}
              />
            </FormItem>
            <FormItem label="账号（可选）">
              <Input
                value={editForm.username}
                onChange={(event) => onChange({ username: event.target.value })}
              />
            </FormItem>
            <FormItem label="密码（可选）">
              <Input
                type="password"
                value={editForm.password}
                onChange={(event) => onChange({ password: event.target.value })}
              />
            </FormItem>
          </div>
        )}
      </div>
    </Modal>
  )
}

interface ProxyPoolIPHealthDetailModalProps {
  open: boolean
  detail: ProxyIPHealthResult | null
  onClose: () => void
}

export function ProxyPoolIPHealthDetailModal({
  open,
  detail,
  onClose,
}: ProxyPoolIPHealthDetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="IP健康原始返回"
      width="760px"
      footer={
        <Button variant="secondary" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <div className="space-y-3">
        {detail && (
          <>
            <div className="text-xs text-[var(--color-text-muted)]">
              代理ID：{detail.proxyId} | 来源：{detail.source} | 时间：{detail.updatedAt}
            </div>
            {!detail.ok && <div className="text-sm text-red-500">{detail.error || '检测失败'}</div>}
            <pre className="max-h-[420px] overflow-auto text-xs leading-5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-3">
              {JSON.stringify(detail.rawData || {}, null, 2)}
            </pre>
          </>
        )}
      </div>
    </Modal>
  )
}
