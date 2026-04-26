import { useRef, useCallback } from 'react'
import { useEditorStore } from '../../store/editorStore'

interface ABCTextEditorProps {
  onFocusChange?: (focused: boolean) => void
}

export function ABCTextEditor({ onFocusChange }: ABCTextEditorProps) {
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const layout = useEditorStore(s => s.layout)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAbcNotation(e.target.value)
  }, [setAbcNotation])

  if (!layout.showABCEditor) return null

  return (
    <div
      className="border-t border-gray-300 bg-gray-50 flex flex-col"
      style={{ height: layout.abcEditorHeight }}
    >
      <div className="flex items-center justify-between px-2 py-0.5 bg-gray-200 border-b border-gray-300 text-xs text-gray-600">
        <span className="font-medium">ABC Notation</span>
        <div className="flex gap-2">
          <button
            className="hover:text-gray-900"
            onClick={() => useEditorStore.getState().updateLayout({ showABCEditor: false })}
            title="Hide ABC editor"
          >
            ✕
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={abcNotation}
        onChange={handleChange}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        className="flex-1 w-full font-mono text-xs p-2 resize-none bg-white focus:outline-none"
        spellCheck={false}
        placeholder="Enter ABC notation here..."
      />
    </div>
  )
}
