import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { create } from 'zustand'
import { useNotificationStore } from '../../store/notificationStore'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    // 自动移除
    const duration = toast.duration ?? 3000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

// Toast 工具函数
function recordErrorNotification(message: string) {
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: '操作异常',
    message,
  })
}

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', message, duration }),
  error: (message: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'error', message, duration })
    recordErrorNotification(message)
  },
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', message, duration }),
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  success: 'text-[var(--color-success)] border-[rgb(22_199_132_/_0.22)]',
  error: 'text-[var(--color-error)] border-[rgb(239_71_87_/_0.22)]',
  warning: 'text-[var(--color-warning)] border-[rgb(245_165_36_/_0.22)]',
  info: 'text-[var(--color-accent)] border-[rgb(75_110_255_/_0.22)]',
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast)
  const Icon = icons[t.type]

  return (
    <div
      role="status"
      className={`flex min-w-72 items-start gap-3 rounded-[10px] border bg-[var(--color-bg-surface)] px-4 py-3 shadow-[var(--shadow-lg)] animate-slide-in-right ${styles[t.type]}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{t.message}</p>
      <button
        type="button"
        aria-label="关闭通知"
        onClick={() => removeToast(t.id)}
        className="p-0.5 rounded hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
