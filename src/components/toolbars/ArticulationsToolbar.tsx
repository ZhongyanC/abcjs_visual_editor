import { useEditorStore } from '../../store/editorStore'
import { addDecoration } from '../../utils/abcStringOps'

const ARTICULATIONS = [
  { decoration: 'staccato',  label: '·',  title: 'Staccato' },
  { decoration: 'tenuto',    label: '—',  title: 'Tenuto' },
  { decoration: 'accent',    label: '>',  title: 'Accent' },
  { decoration: 'marcato',   label: '^',  title: 'Marcato' },
  { decoration: 'fermata',   label: '𝄐',  title: 'Fermata' },
  { decoration: 'invertedfermata', label: '𝄑', title: 'Inverted Fermata' },
  { decoration: 'breath',    label: ',',  title: 'Breath mark' },
  { decoration: 'upbow',     label: '∩',  title: 'Up bow' },
  { decoration: 'downbow',   label: '⌣',  title: 'Down bow' },
  { decoration: 'snap',      label: '⊙',  title: 'Snap pizzicato' },
]

export function ArticulationsToolbar() {
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const apply = (decoration: string) => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = addDecoration(abcNotation, selectedElement.startChar, decoration)
    setAbcNotation(updated)
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      {ARTICULATIONS.map(({ decoration, label, title }) => (
        <button
          key={decoration}
          className="tb-btn"
          onClick={() => apply(decoration)}
          title={title}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
