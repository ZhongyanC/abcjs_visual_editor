import { useEditorStore } from '../../store/editorStore'
import type { Accidental } from '../../types/editor'

const ACCIDENTALS: Array<{ acc: Accidental | null; label: string; title: string }> = [
  { acc: 'double-flat', label: '𝄫', title: 'Double flat' },
  { acc: 'flat',        label: '♭', title: 'Flat' },
  { acc: 'natural',     label: '♮', title: 'Natural' },
  { acc: 'sharp',       label: '♯', title: 'Sharp' },
  { acc: 'double-sharp',label: '𝄪', title: 'Double sharp' },
]

export function AccidentalsToolbar() {
  const inputAccidental = useEditorStore(s => s.inputAccidental)
  const setInputAccidental = useEditorStore(s => s.setInputAccidental)
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const applyAccidental = (acc: Accidental | null) => {
    if (acc === inputAccidental) {
      setInputAccidental(null)
    } else {
      setInputAccidental(acc)
    }

    // If a note is selected, apply immediately
    if (selectedElement && selectedElement.startChar >= 0 && selectedElement.type === 'note') {
      // Replace existing accidental prefix (^, _, =, ^^, __) or add one
      const noteText = abcNotation.slice(selectedElement.startChar, selectedElement.endChar)
      const accMap: Record<string, string> = {
        'double-flat': '__', 'flat': '_', 'natural': '=', 'sharp': '^', 'double-sharp': '^^',
      }
      const accChar = acc ? accMap[acc] : ''
      const stripped = noteText.replace(/^[\^_=]+/, '')
      const updated = abcNotation.slice(0, selectedElement.startChar) +
        accChar + stripped +
        abcNotation.slice(selectedElement.endChar)
      setAbcNotation(updated)
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      {ACCIDENTALS.map(({ acc, label, title }) => (
        <button
          key={acc}
          className={`tb-btn text-base ${inputAccidental === acc ? 'tb-btn-active' : ''}`}
          onClick={() => applyAccidental(acc)}
          title={title}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
