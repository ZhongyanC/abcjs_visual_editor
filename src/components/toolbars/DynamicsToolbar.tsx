import { useEditorStore } from '../../store/editorStore'
import { addDecoration } from '../../utils/abcStringOps'

const DYNAMICS = [
  { d: 'pppp', label: 'pppp' },
  { d: 'ppp',  label: 'ppp' },
  { d: 'pp',   label: 'pp' },
  { d: 'p',    label: 'p' },
  { d: 'mp',   label: 'mp' },
  { d: 'mf',   label: 'mf' },
  { d: 'f',    label: 'f' },
  { d: 'ff',   label: 'ff' },
  { d: 'fff',  label: 'fff' },
  { d: 'ffff', label: 'ffff' },
  { d: 'sfz',  label: 'sfz' },
  { d: 'crescendo(', label: '<', title: 'Start crescendo' },
  { d: 'crescendo)', label: '<|', title: 'End crescendo' },
  { d: 'diminuendo(', label: '>', title: 'Start diminuendo' },
  { d: 'diminuendo)', label: '>|', title: 'End diminuendo' },
]

export function DynamicsToolbar() {
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const apply = (d: string) => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = addDecoration(abcNotation, selectedElement.startChar, d)
    setAbcNotation(updated)
  }

  return (
    <div className="flex items-center gap-0.5 px-1 flex-wrap">
      {DYNAMICS.map(({ d, label, title }) => (
        <button
          key={d}
          className="tb-btn font-italic text-xs px-1.5"
          style={{ fontStyle: 'italic' }}
          onClick={() => apply(d)}
          title={title ?? label}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
