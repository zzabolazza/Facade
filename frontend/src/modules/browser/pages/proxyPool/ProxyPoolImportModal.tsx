import { Button, FormItem, Input, Modal, Select, Textarea } from '../../../../shared/components'
import {
  DIRECT_PROXY_PROTOCOL_OPTIONS,
  type DirectImportForm,
} from './helpers'

interface ProxyPoolImportModalProps {
  open: boolean
  groups: string[]
  importGroupName: string
  directImportText: string
  directImportForm: DirectImportForm
  canParseImport: boolean
  onClose: () => void
  onParse: () => void
  onImportGroupNameChange: (nextValue: string) => void
  onDirectImportTextChange: (nextValue: string) => void
  onApplyDirectText: () => void
  onDirectImportFormChange: (patch: Partial<DirectImportForm>) => void
}

export function ProxyPoolImportModal({
  open,
  groups,
  importGroupName,
  directImportText,
  directImportForm,
  canParseImport,
  onClose,
  onParse,
  onImportGroupNameChange,
  onDirectImportTextChange,
  onApplyDirectText,
  onDirectImportFormChange,
}: ProxyPoolImportModalProps) {
  const isDirect = directImportForm.protocol === 'direct'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建代理"
      width="560px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onParse} disabled={!canParseImport}>
            确认
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormItem label="协议类型" required>
          <Select
            value={directImportForm.protocol}
            onChange={(event) =>
              onDirectImportFormChange({ protocol: event.target.value as DirectImportForm['protocol'] })
            }
            options={[...DIRECT_PROXY_PROTOCOL_OPTIONS]}
          />
        </FormItem>
        <FormItem label="代理名称" required>
          <Input
            value={directImportForm.proxyName}
            onChange={(event) => onDirectImportFormChange({ proxyName: event.target.value })}
            placeholder={isDirect ? '直连（不走代理）' : '节点名称'}
          />
        </FormItem>
        <FormItem label="分组名称（可选）">
          <Input
            value={importGroupName}
            onChange={(event) => onImportGroupNameChange(event.target.value)}
            placeholder="分组名称"
            list="create-proxy-groups-datalist"
          />
          <datalist id="create-proxy-groups-datalist">
            {groups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </FormItem>
        {!isDirect && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormItem label="服务器" required>
                <Input
                  value={directImportForm.server}
                  onChange={(event) => onDirectImportFormChange({ server: event.target.value })}
                  placeholder="主机名或 IP"
                />
              </FormItem>
              <FormItem label="端口" required>
                <Input
                  type="number"
                  min={1}
                  max={65535}
                  value={directImportForm.port}
                  onChange={(event) => onDirectImportFormChange({ port: event.target.value })}
                  placeholder="端口"
                />
              </FormItem>
              <FormItem label="账号（可选）">
                <Input
                  value={directImportForm.username}
                  onChange={(event) => onDirectImportFormChange({ username: event.target.value })}
                />
              </FormItem>
              <FormItem label="密码（可选）">
                <Input
                  type="password"
                  value={directImportForm.password}
                  onChange={(event) => onDirectImportFormChange({ password: event.target.value })}
                />
              </FormItem>
            </div>
            <FormItem label="文本辅助（可选）" hint="支持多行 http:// / https:// / socks5://，每行一个">
              <Textarea
                value={directImportText}
                onChange={(event) => onDirectImportTextChange(event.target.value)}
                rows={4}
                placeholder={'http://127.0.0.1:7890\nsocks5://user:pass@127.0.0.1:1080'}
              />
              <div className="mt-2">
                <Button size="sm" variant="secondary" onClick={onApplyDirectText} disabled={!directImportText.trim()}>
                  应用到表单
                </Button>
              </div>
            </FormItem>
          </>
        )}
      </div>
    </Modal>
  )
}
