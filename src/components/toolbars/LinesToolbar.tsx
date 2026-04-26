import { useEditorStore } from '../../store/editorStore'
import { addSlur, addTie } from '../../utils/abcStringOps'

export function LinesToolbar() {
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const applySlur = () => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = addSlur(abcNotation, selectedElement.startChar, selectedElement.endChar)
    setAbcNotation(updated)
  }

  const applyTie = () => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = addTie(abcNotation, selectedElement.endChar)
    setAbcNotation(updated)
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      <button className="tb-btn text-xs" onClick={applySlur} title="Slur (S)">
        ⌢
      </button>
      <button className="tb-btn text-xs" onClick={applyTie} title="Tie">
        ~
      </button>
    </div>
  )
}
