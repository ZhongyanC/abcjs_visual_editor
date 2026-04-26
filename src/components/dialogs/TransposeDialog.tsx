import { useState } from 'react'
import * as abcjs from 'abcjs'
import { useEditorStore } from '../../store/editorStore'

interface TransposeDialogProps {
  onClose: () => void
}

export function TransposeDialog({ onClose }: TransposeDialogProps) {
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const [steps, setSteps] = useState(0)

  const apply = () => {
    try {
      const tunes = abcjs.parseOnly(abcNotation)
      if (tunes && tunes.length > 0) {
        const transposed = abcjs.strTranspose(abcNotation, tunes, steps)
        setAbcNotation(transposed)
      }
    } catch {
      console.error('Transpose failed')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-64 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Transpose</h2>
        <div className="text-xs text-gray-600 mb-3">Transpose by semitones (positive = up, negative = down)</div>

        <div className="flex items-center gap-3 justify-center my-3">
          <button
            className="w-8 h-8 bg-gray-200 rounded text-lg font-bold hover:bg-gray-300"
            onClick={() => setSteps(s => s - 1)}
          >−</button>
          <span className="text-xl font-mono w-10 text-center">{steps > 0 ? `+${steps}` : steps}</span>
          <button
            className="w-8 h-8 bg-gray-200 rounded text-lg font-bold hover:bg-gray-300"
            onClick={() => setSteps(s => s + 1)}
          >+</button>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={apply}>Apply</button>
        </div>
      </div>
    </div>
  )
}
