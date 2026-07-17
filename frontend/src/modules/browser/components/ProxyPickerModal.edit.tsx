import type { Dispatch, SetStateAction } from 'react'
import { Button, FormItem, Input, Modal, Select } from '../../../shared/components'
import { DIRECT_PROXY_PROTOCOL_OPTIONS, type DirectImportForm } from '../pages/proxyPool/helpers'

export interface ProxyEditFormValue {
  proxyName: string
  protocol: DirectImportForm['protocol']
  server: string
  port: string
  username: string
  password: string
  groupName: string
}

interface ProxyEditModalProps {
  open: boolean
  editForm: ProxyEditFormValue
  groups: string[]
  saving: boolean
  setEditForm: Dispatch<SetStateAction<ProxyEditFormValue>>
  onClose: () => void
  onSave: () => void
}

export function ProxyEditModal({
  open,
  editForm,
  groups,
  saving,
  setEditForm,
  onClose,
  onSave,
}: ProxyEditModalProps) {
  const isDirect = editForm.protocol === 'direct'
  const patch = (next: Partial<ProxyEditFormValue>) => setEditForm(prev => ({ ...prev, ...next }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="编辑代理"
      width="500px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>取消</Button>
          <Button onClick={onSave} loading={saving}>保存</Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormItem label="协议类型" required>
          <Select
            value={editForm.protocol}
            onChange={e => patch({ protocol: e.target.value as ProxyEditFormValue['protocol'] })}
            options={[...DIRECT_PROXY_PROTOCOL_OPTIONS]}
          />
        </FormItem>
        <FormItem label="代理名称" required>
          <Input value={editForm.proxyName} onChange={e => patch({ proxyName: e.target.value })} placeholder="节点名称" />
        </FormItem>
        <FormItem label="分组名称（可选）">
          <Input value={editForm.groupName} onChange={e => patch({ groupName: e.target.value })} placeholder="分组名称" list="picker-edit-proxy-groups" />
          <datalist id="picker-edit-proxy-groups">
            {groups.map(group => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </FormItem>
        {!isDirect && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormItem label="服务器" required>
              <Input value={editForm.server} onChange={e => patch({ server: e.target.value })} />
            </FormItem>
            <FormItem label="端口" required>
              <Input type="number" min={1} max={65535} value={editForm.port} onChange={e => patch({ port: e.target.value })} />
            </FormItem>
            <FormItem label="账号（可选）">
              <Input value={editForm.username} onChange={e => patch({ username: e.target.value })} />
            </FormItem>
            <FormItem label="密码（可选）">
              <Input type="password" value={editForm.password} onChange={e => patch({ password: e.target.value })} />
            </FormItem>
          </div>
        )}
      </div>
    </Modal>
  )
}
