import { useEditorStore } from '../../store/editorStore'
import { deleteElementAt } from '../../utils/abcStringOps'

export function EditToolbar() {
  const undo = useEditorStore(s => s.undo)
  const redo = useEditorStore(s => s.redo)
  const canUndo = useEditorStore(s => s.canUndo)
  const canRedo = useEditorStore(s => s.canRedo)
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const iconSize = useEditorStore(s => s.layout.toolbarIconSize)
  const updateLayout = useEditorStore(s => s.updateLayout)

  const deleteSelected = () => {
    if (!selectedElement || selectedElement.startChar < 0) return
    const updated = deleteElementAt(abcNotation, selectedElement.startChar, selectedElement.endChar)
    setAbcNotation(updated)
  }

  const decreaseIconSize = () => updateLayout({ toolbarIconSize: Math.max(14, iconSize - 2) })
  const increaseIconSize = () => updateLayout({ toolbarIconSize: Math.min(36, iconSize + 2) })

  return (
    <div className="flex items-center gap-0.5 px-1">
      <button
        className="tb-btn disabled:opacity-40"
        onClick={undo}
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>
      <button
        className="tb-btn disabled:opacity-40"
        onClick={redo}
        disabled={!canRedo()}
        title="Redo (Ctrl+Y)"
      >
        ↪
      </button>
      <div className="tb-separator" />
      <button
        className="tb-btn disabled:opacity-40"
        onClick={deleteSelected}
        disabled={!selectedElement}
        title="Delete selected (Del)"
      >
        🗑
      </button>
      <div className="tb-separator" />
      <button
        className="tb-btn text-xs font-bold disabled:opacity-40"
        onClick={decreaseIconSize}
        disabled={iconSize <= 14}
        title="Decrease icon size"
      >
        A-
      </button>
      <button
        className="tb-btn text-xs font-bold disabled:opacity-40"
        onClick={increaseIconSize}
        disabled={iconSize >= 36}
        title="Increase icon size"
      >
        A+
      </button>
    </div>
  )
}
