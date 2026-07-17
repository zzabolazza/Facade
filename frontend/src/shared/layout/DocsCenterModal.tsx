import { Modal } from '../components'
import { useLaunchContext } from '../../modules/browser/hooks/useLaunchContext'

interface DocsCenterModalProps {
  open: boolean
  onClose: () => void
}

export function DocsCenterModal({ open, onClose }: DocsCenterModalProps) {
  const {
    launchBaseUrl,
    launchServerReady,
    launchContextLoading,
    refreshLaunchContext,
  } = useLaunchContext({ enabled: open })

  const swaggerUrl = `${launchBaseUrl.replace(/\/$/, '')}/swagger/`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="API 文档"
      width="1200px"
      padding={false}
    >
      <div className="h-[72vh] min-h-[480px]">
        {launchContextLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            加载文档中...
          </div>
        ) : launchServerReady ? (
          <iframe
            title="Launch API Swagger"
            src={swaggerUrl}
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--color-text-muted)]">
            <p>Launch API 服务未启动，无法打开 Swagger 文档。</p>
            <button
              type="button"
              onClick={() => void refreshLaunchContext(true)}
              className="rounded-md bg-[var(--color-accent-muted)] px-3 py-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
