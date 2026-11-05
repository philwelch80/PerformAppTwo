import { createContext, useCallback, useContext, useRef, useState } from 'react'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'

const ConfirmContext = createContext(null)

// confirm({ title, description, confirmLabel, danger }) -> Promise<boolean>,
// a drop-in replacement for window.confirm() that renders the shared
// ConfirmDialog instead of a native dialog.
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolveRef = useRef(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setRequest(options)
    })
  }, [])

  function settle(result) {
    resolveRef.current?.(result)
    resolveRef.current = null
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ConfirmDialog
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          danger={request.danger}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
