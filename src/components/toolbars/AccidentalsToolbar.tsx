import { useEditorStore } from '../../store/editorStore'
import type { Accidental } from '../../types/editor'
import { MS } from '../../utils/musicSymbols'
import { MusicGlyph } from './MusicGlyph'

const ACCIDENTALS: Array<{ acc: Accidental; symbol: string; title: string }> = [
  { acc: 'double-flat',  symbol: MS.dblFlat,  title: 'Double flat' },
  { acc: 'flat',         symbol: MS.flat,     title: 'Flat' },
  { acc: 'natural',      symbol: MS.natural,  title: 'Natural' },
  { acc: 'sharp',        symbol: MS.sharp,    title: 'Sharp' },
  { acc: 'double-sharp', symbol: MS.dblSharp, title: 'Double sharp' },
]

export function AccidentalsToolbar() {
  const inputAccidental = useEditorStore(s => s.inputAccidental)
  const setInputAccidental = useEditorStore(s => s.setInputAccidental)
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const iconSize = useEditorStore(s => s.layout.toolbarIconSize) || 20

  const applyAccidental = (acc: Accidental) => {
    if (acc === inputAccidental) {
      setInputAccidental(null)
    } else {
      setInputAccidental(acc)
    }

    if (selectedElement && selectedElement.startChar >= 0 && selectedElement.type === 'note') {
      const noteText = abcNotation.slice(selectedElement.startChar, selectedElement.endChar)
      const accMap: Record<string, string> = {
        'double-flat': '__', 'flat': '_', 'natural': '=', 'sharp': '^', 'double-sharp': '^^',
      }
      const stripped = noteText.replace(/^[\^_=]+/, '')
      const updated = abcNotation.slice(0, selectedElement.startChar) +
        accMap[acc] + stripped +
        abcNotation.slice(selectedElement.endChar)
      setAbcNotation(updated)
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      {ACCIDENTALS.map(({ acc, symbol, title }) => (
        <button
          key={acc}
          className={`tb-btn ${inputAccidental === acc ? 'tb-btn-active' : ''}`}
          onClick={() => applyAccidental(acc)}
          title={title}
        >
          <MusicGlyph symbol={symbol} size={iconSize} />
        </button>
      ))}
    </div>
  )
}
