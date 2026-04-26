import { createContext, useContext } from 'react'
import type { LayoutConfig } from '../../types/editor'
import { useEditorStore } from '../../store/editorStore'

interface LayoutContextValue {
  layout: LayoutConfig
  updateLayout: (patch: Partial<LayoutConfig>) => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const layout = useEditorStore(s => s.layout)
  const updateLayout = useEditorStore(s => s.updateLayout)

  return (
    <LayoutContext.Provider value={{ layout, updateLayout }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used inside LayoutProvider')
  return ctx
}
