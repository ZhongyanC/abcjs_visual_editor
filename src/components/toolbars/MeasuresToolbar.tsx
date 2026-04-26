import { useEditorStore } from '../../store/editorStore'
import { addMeasure } from '../../utils/abcTemplate'
import { insertBarline } from '../../utils/abcStringOps'

const BARLINES = [
  { type: '|',   label: '|',   title: 'Single bar line' },
  { type: '||',  label: '‖',   title: 'Double bar line' },
  { type: '[|',  label: '𝄁',   title: 'Final bar line' },
  { type: '|:',  label: '|:',  title: 'Start repeat' },
  { type: ':|',  label: ':|',  title: 'End repeat' },
  { type: ':|:', label: ':|:', title: 'Double repeat' },
]

export function MeasuresToolbar() {
  const abcNotation = useEditorStore(s => s.abcNotation)
  const cursorChar = useEditorStore(s => s.cursorChar)
  const selectedElement = useEditorStore(s => s.selectedElement)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const insertPos = selectedElement?.endChar ?? cursorChar ?? abcNotation.length

  const addBar = () => {
    const updated = addMeasure(abcNotation)
    setAbcNotation(updated)
  }

  const insertBar = (type: string) => {
    const updated = insertBarline(abcNotation, insertPos, type)
    setAbcNotation(updated)
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      <button
        className="tb-btn text-xs px-2"
        onClick={addBar}
        title="Add measure at end"
      >
        +⬜
      </button>
      <div className="tb-separator" />
      {BARLINES.map(({ type, label, title }) => (
        <button
          key={type}
          className="tb-btn text-xs"
          onClick={() => insertBar(type)}
          title={title}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
