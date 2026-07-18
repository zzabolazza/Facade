import { ReactNode, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from './Button'

const openModalStack: symbol[] = []
let originalBodyOverflow = ''

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
  closable?: boolean
  padding?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = '500px',
  closable = true,
  padding = true,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const modalIdRef = useRef(Symbol('modal'))
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    if (openModalStack.length === 0) {
      originalBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    openModalStack.push(modalIdRef.current)

    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current
      if (dialog && !dialog.contains(document.activeElement)) dialog.focus()
    }, 0)
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTopModal = openModalStack[openModalStack.length - 1] === modalIdRef.current
      if (event.key === 'Escape' && closable && isTopModal) {
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      const stackIndex = openModalStack.lastIndexOf(modalIdRef.current)
      if (stackIndex >= 0) openModalStack.splice(stackIndex, 1)
      if (openModalStack.length === 0) {
        document.body.style.overflow = originalBodyOverflow
      }
      previouslyFocused?.focus?.()
    }
  }, [closable, open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-[var(--color-overlay)] animate-fade-in"
        onClick={closable ? onClose : undefined}
      />

      {/* 弹窗内容 */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : '对话框'}
        tabIndex={-1}
        className="relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-overlay)] outline-none animate-scale-in sm:max-h-[calc(100vh-3rem)]"
        style={{ width, maxWidth: 'calc(100vw - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {(title || closable) && (
          <div className="flex min-h-[52px] flex-shrink-0 items-center justify-between border-b border-[var(--color-border-muted)] px-5 py-3">
            {title && (
              <h3 id={titleId} className="text-[15px] font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">
                {title}
              </h3>
            )}
            {closable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭弹窗"
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* 内容区 */}
        <div className={clsx('min-h-0 flex-1', padding ? 'overflow-y-auto px-5 py-4' : 'overflow-hidden')}>
          {children}
        </div>

        {/* 底部按钮 */}
        {footer && (
          <div className="flex min-h-[56px] flex-shrink-0 items-center justify-end gap-2.5 border-t border-[var(--color-border-muted)] bg-[var(--color-bg-subtle)] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// 确认对话框
interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  content: ReactNode
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = '确认',
  content,
  confirmText = '确定',
  cancelText = '取消',
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="400px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-0.5">
        <div className={clsx(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          danger
            ? 'bg-[rgb(239_71_87_/_0.1)] text-[var(--color-error)]'
            : 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
        )}>
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 pt-1 text-[13.5px] leading-6 text-[var(--color-text-secondary)]">
          {content}
        </div>
      </div>
    </Modal>
  )
}
