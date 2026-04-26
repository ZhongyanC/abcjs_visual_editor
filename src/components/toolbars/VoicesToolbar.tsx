import { useEditorStore } from '../../store/editorStore'
import { addVoice } from '../../utils/abcStringOps'
import type { VoiceConfig } from '../../types/editor'

export function VoicesToolbar() {
  const voices = useEditorStore(s => s.voices)
  const activeVoice = useEditorStore(s => s.activeVoice)
  const setActiveVoice = useEditorStore(s => s.setActiveVoice)
  const setVoices = useEditorStore(s => s.setVoices)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const addNewVoice = () => {
    const newId = Math.max(...voices.map(v => v.id), 0) + 1
    const newVoice: VoiceConfig = {
      id: newId,
      name: `Voice ${newId}`,
      clef: newId % 2 === 0 ? 'bass' : 'treble',
      stem: 'auto',
    }
    const updatedVoices = [...voices, newVoice]
    setVoices(updatedVoices)
    const updatedAbc = addVoice(abcNotation, newVoice)
    setAbcNotation(updatedAbc)
    setActiveVoice(newId)
  }

  return (
    <div className="flex items-center gap-0.5 px-1">
      {voices.map(v => (
        <button
          key={v.id}
          className={`tb-btn px-2 text-xs ${activeVoice === v.id ? 'tb-btn-active' : ''}`}
          onClick={() => setActiveVoice(v.id)}
          title={`Voice ${v.id}: ${v.name}`}
        >
          V{v.id}
        </button>
      ))}
      <button
        className="tb-btn text-sm"
        onClick={addNewVoice}
        title="Add voice"
      >
        +
      </button>
    </div>
  )
}
