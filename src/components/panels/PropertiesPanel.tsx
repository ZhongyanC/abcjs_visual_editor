import { useEditorStore } from '../../store/editorStore'
import { transposeNoteAt } from '../../utils/abcStringOps'

export function PropertiesPanel() {
  const selectedElement = useEditorStore(s => s.selectedElement)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  if (!selectedElement) {
    return (
      <div className="p-3 text-xs text-gray-500">
        Click a note to see its properties.
      </div>
    )
  }

  const noteText = abcNotation.slice(selectedElement.startChar, selectedElement.endChar)

  const transposeSemitone = (steps: number) => {
    const updated = transposeNoteAt(abcNotation, selectedElement.startChar, selectedElement.endChar, steps)
    setAbcNotation(updated)
  }

  return (
    <div className="p-2 text-xs flex flex-col gap-2">
      <div className="font-semibold text-gray-700 uppercase text-xs tracking-wide">
        Properties
      </div>

      <div className="bg-gray-100 rounded p-2 font-mono text-sm text-gray-800 break-all">
        {noteText || '—'}
      </div>

      <div className="text-gray-600 space-y-0.5">
        <div><span className="text-gray-400">Type: </span>{selectedElement.el_type ?? selectedElement.type}</div>
        <div><span className="text-gray-400">Char: </span>{selectedElement.startChar}–{selectedElement.endChar}</div>
        {selectedElement.pitches && selectedElement.pitches.length > 0 && (
          <div><span className="text-gray-400">Pitch: </span>{selectedElement.pitches[0].pitch}</div>
        )}
      </div>

      {/* Pitch transpose buttons */}
      {selectedElement.pitches && (
        <div className="mt-1">
          <div className="text-gray-500 mb-1">Transpose</div>
          <div className="flex gap-1 flex-wrap">
            <button
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              onClick={() => transposeSemitone(-7)}
              title="Octave up"
            >↑ Oct</button>
            <button
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              onClick={() => transposeSemitone(-1)}
              title="Step up"
            >↑ Step</button>
            <button
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              onClick={() => transposeSemitone(1)}
              title="Step down"
            >↓ Step</button>
            <button
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              onClick={() => transposeSemitone(7)}
              title="Octave down"
            >↓ Oct</button>
          </div>
        </div>
      )}
    </div>
  )
}
