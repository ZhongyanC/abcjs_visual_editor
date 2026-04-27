import { useEditorStore } from '../../store/editorStore'
import { addDecoration } from '../../utils/abcStringOps'
import { MS } from '../../utils/musicSymbols'
import { MusicGlyph } from './MusicGlyph'

const ORNAMENTS: Array<{ d: string; title: string; symbol?: string; label?: string }> = [
  { d: 'trill',        symbol: MS.trill,        title: 'Trill' },
  { d: 'trill(',       label:  'tr(',           title: 'Start trill' },
  { d: 'trill)',       label:  'tr)',           title: 'End trill' },
  { d: 'uppermordent', symbol: MS.upperMordent, title: 'Upper mordent (pralltriller)' },
  { d: 'lowermordent', symbol: MS.lowerMordent, title: 'Lower mordent' },
  { d: 'turn',         symbol: MS.turn,         title: 'Turn' },
  { d: 'turnx',        symbol: MS.turnSlash,    title: 'Turn with accidental' },
  { d: 'roll',         label:  '~',             title: 'Roll (Irish)' },
  { d: 'irishroll',    label:  '~irl',          title: 'Irish roll' },
  { d: 'slide',        label:  '/',             title: 'Slide' },
  { d: 'arpeggio',     label:  '≋',             title: 'Arpeggio' },
  { d: 'glissando(',   label:  'gl(',           title: 'Start glissando' },
  { d: 'glissando)',   label:  'gl)',           title: 'End glissando' },
]

export function OrnamentsToolbar() {
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const iconSize = useEditorStore(s => s.layout.toolbarIconSize) || 20

  const apply = (d: string) => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = addDecoration(abcNotation, selectedElement.startChar, d)
    setAbcNotation(updated)
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      {ORNAMENTS.map(({ d, title, symbol, label }) => (
        <button
          key={d}
          className="tb-btn text-xs"
          onClick={() => apply(d)}
          title={title}
        >
          {symbol
            ? <MusicGlyph symbol={symbol} size={iconSize} />
            : <span>{label}</span>
          }
        </button>
      ))}
    </div>
  )
}
