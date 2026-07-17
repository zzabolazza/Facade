import { Button } from '../../../../shared/components'

interface ProxyPoolHeaderProps {
  checkingAllIPHealth: boolean
  onCheckAllIPHealth: () => void
  onOpenImport: () => void
  onOpenSettings: () => void
  onTestAll: () => void
  testingAll: boolean
  totalCount: number
}

export function ProxyPoolHeader({
  checkingAllIPHealth,
  onCheckAllIPHealth,
  onOpenImport,
  onOpenSettings,
  onTestAll,
  testingAll,
  totalCount,
}: ProxyPoolHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">代理池配置</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-2 py-1 shadow-sm">
          <Button size="sm" variant="secondary" onClick={onOpenSettings}>
            检测设置
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onCheckAllIPHealth}
            loading={checkingAllIPHealth}
            disabled={totalCount === 0}
          >
            检测IP健康
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onTestAll}
            loading={testingAll}
            disabled={totalCount === 0}
          >
            测试全部
          </Button>
        </div>
        <Button size="sm" onClick={onOpenImport}>
          新建代理
        </Button>
      </div>
    </div>
  )
}
