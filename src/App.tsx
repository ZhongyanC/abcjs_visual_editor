import { useRef } from 'react'
import { LayoutProvider } from './components/layout/LayoutContext'
import { EditorLayout } from './components/layout/EditorLayout'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { TuneObject } from 'abcjs'

function AppInner() {
  const textEditorFocused = useRef(false)
  const getTune = useRef<() => TuneObject | null>(() => null)

  useKeyboardShortcuts(
    () => getTune.current(),
    () => textEditorFocused.current
  )

  return <EditorLayout />
}

export default function App() {
  return (
    <LayoutProvider>
      <AppInner />
    </LayoutProvider>
  )
}
