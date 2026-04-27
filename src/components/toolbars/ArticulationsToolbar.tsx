import { useEditorStore } from '../../store/editorStore'
import { addDecoration } from '../../utils/abcStringOps'
import { MS } from '../../utils/musicSymbols'
import { MusicGlyph } from './MusicGlyph'

const ARTICULATIONS: Array<{ decoration: string; title: string; symbol?: string; label?: string }> = [
  { decoration: 'staccato',        symbol: MS.staccato,   title: 'Staccato' },
  { decoration: 'tenuto',          symbol: MS.tenuto,     title: 'Tenuto' },
  { decoration: 'accent',          symbol: MS.accent,     title: 'Accent' },
  { decoration: 'marcato',         symbol: MS.marcato,    title: 'Marcato' },
  { decoration: 'fermata',         symbol: MS.fermata,    title: 'Fermata' },
  { decoration: 'invertedfermata', symbol: MS.fermataDown,title: 'Inverted Fermata' },
  { decoration: 'breath',          symbol: MS.breath,     title: 'Breath mark' },
  { decoration: 'upbow',           symbol: MS.upBow,      title: 'Up bow' },
  { decoration: 'downbow',         symbol: MS.downBow,    title: 'Down bow' },
  { decoration: 'snap',            symbol: MS.snapPizz,   title: 'Snap pizzicato' },
]

export function ArticulationsToolbar() {
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const iconSize = useEditorStore(s => s.layout.toolbarIconSize) || 20

  const apply = (decoration: string) => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = addDecoration(abcNotation, selectedElement.startChar, decoration)
    setAbcNotation(updated)
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      {ARTICULATIONS.map(({ decoration, title, symbol, label }) => (
        <button
          key={decoration}
          className="tb-btn"
          onClick={() => apply(decoration)}
          title={title}
        >
          {symbol
            ? <MusicGlyph symbol={symbol} size={iconSize} />
            : <span className="text-sm">{label}</span>
          }
        </button>
      ))}
    </div>
  )
}
