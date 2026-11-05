import { useEffect, useRef } from 'react'

// A true overlay dialog: role="dialog"/aria-modal, Escape closes it, and
// focus returns to whatever triggered it on close (captured on mount, so
// callers don't need to pass a trigger ref themselves).
export default function Modal({ onClose, children, className = '', labelledBy, maxWidth }) {
  const triggerRef = useRef(document.activeElement)
  const modalRef = useRef(null)

  useEffect(() => {
    const trigger = triggerRef.current
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    modalRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (trigger && typeof trigger.focus === 'function') trigger.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal${className ? ` ${className}` : ''}`}
        style={maxWidth ? { maxWidth } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        ref={modalRef}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}
