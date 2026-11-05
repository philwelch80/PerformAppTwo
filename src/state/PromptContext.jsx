import { createContext, useCallback, useContext, useRef, useState } from 'react'
import PromptDialog from '../components/common/PromptDialog.jsx'

const PromptContext = createContext(null)

// prompt({ title, label, defaultValue, confirmLabel }) -> Promise<string|null>,
// a drop-in replacement for window.prompt() that renders the shared
// PromptDialog instead of a native dialog. Resolves null if cancelled.
export function PromptProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolveRef = useRef(null)

  const prompt = useCallback((options) => {
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
    <PromptContext.Provider value={prompt}>
      {children}
      {request && (
        <PromptDialog
          title={request.title}
          label={request.label}
          defaultValue={request.defaultValue}
          confirmLabel={request.confirmLabel}
          onConfirm={(value) => settle(value)}
          onCancel={() => settle(null)}
        />
      )}
    </PromptContext.Provider>
  )
}

export function usePrompt() {
  const ctx = useContext(PromptContext)
  if (!ctx) throw new Error('usePrompt must be used within a PromptProvider')
  return ctx
}
