import { useEditorStore } from '../../store/editorStore'
import { addDecoration } from '../../utils/abcStringOps'

const ORNAMENTS = [
  { d: 'trill',          label: 'tr',   title: 'Trill' },
  { d: 'trill(',         label: 'tr(',  title: 'Start trill' },
  { d: 'trill)',         label: 'tr)',  title: 'End trill' },
  { d: 'uppermordent',   label: '𝆐',    title: 'Upper mordent (pralltriller)' },
  { d: 'lowermordent',   label: '𝆙',    title: 'Lower mordent' },
  { d: 'turn',           label: '∫',    title: 'Turn' },
  { d: 'turnx',          label: '∫×',   title: 'Turn with accidental' },
  { d: 'roll',           label: '~',    title: 'Roll (Irish)' },
  { d: 'irishroll',      label: '~irl', title: 'Irish roll' },
  { d: 'slide',          label: '/',    title: 'Slide' },
  { d: 'arpeggio',       label: '≋',    title: 'Arpeggio' },
  { d: 'glissando(',     label: 'gl(',  title: 'Start glissando' },
  { d: 'glissando)',     label: 'gl)',  title: 'End glissando' },
]

export function OrnamentsToolbar() {
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const apply = (d: string) => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = addDecoration(abcNotation, selectedElement.startChar, d)
    setAbcNotation(updated)
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      {ORNAMENTS.map(({ d, label, title }) => (
        <button
          key={d}
          className="tb-btn text-xs"
          onClick={() => apply(d)}
          title={title}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
