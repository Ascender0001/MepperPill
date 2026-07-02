import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import '../styles/Toast.css'
import { IconCheck, IconX } from './icons'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error'
  exiting: boolean
}

interface ToastContextValue {
  showToast: (text: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    timersRef.current.delete(id)
  }, [])

  const startExit = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    const timer = setTimeout(() => removeToast(id), 250)
    timersRef.current.set(id, timer)
  }, [removeToast])

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, text, type, exiting: false }])
    const timer = setTimeout(() => startExit(id), 3000)
    timersRef.current.set(id, timer)
  }, [startExit])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}>
            <span>{t.type === 'success' ? <IconCheck size={14} /> : <IconX size={14} />}</span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
