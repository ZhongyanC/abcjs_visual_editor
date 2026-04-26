import { useEditorStore } from '../../store/editorStore'
import type { VoiceConfig } from '../../types/editor'

const CLEFS = ['treble', 'bass', 'alto', 'tenor', 'treble+8', 'bass+8'] as const

export function VoicePanel() {
  const voices = useEditorStore(s => s.voices)
  const activeVoice = useEditorStore(s => s.activeVoice)
  const setVoices = useEditorStore(s => s.setVoices)
  const setActiveVoice = useEditorStore(s => s.setActiveVoice)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const updateVoice = (id: number, patch: Partial<VoiceConfig>) => {
    const updated = voices.map(v => v.id === id ? { ...v, ...patch } : v)
    setVoices(updated)

    const voice = updated.find(v => v.id === id)
    if (!voice) return
    const decl = `V:${id} clef=${voice.clef} name="${voice.name}"`
    const abc2 = abcNotation.replace(
      new RegExp(`V:${id}[^\\n]*`, 'm'),
      decl
    )
    setAbcNotation(abc2)
  }

  const removeVoice = (id: number) => {
    if (voices.length <= 1) return
    setVoices(voices.filter(v => v.id !== id))
    if (activeVoice === id) setActiveVoice(voices[0].id)
  }

  return (
    <div className="p-2 text-xs flex flex-col gap-2">
      <div className="font-semibold text-gray-700 uppercase text-xs tracking-wide">
        Voices
      </div>

      {voices.map(v => (
        <div
          key={v.id}
          className={`rounded border p-2 cursor-pointer ${activeVoice === v.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
          onClick={() => setActiveVoice(v.id)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-700">Voice {v.id}</span>
            {voices.length > 1 && (
              <button
                className="text-red-400 hover:text-red-600 text-xs"
                onClick={e => { e.stopPropagation(); removeVoice(v.id) }}
                title="Remove voice"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <input
              className="input-field text-xs"
              value={v.name}
              onChange={e => updateVoice(v.id, { name: e.target.value })}
              onClick={e => e.stopPropagation()}
              placeholder="Name"
            />
            <select
              className="input-field text-xs"
              value={v.clef}
              onChange={e => updateVoice(v.id, { clef: e.target.value as VoiceConfig['clef'] })}
              onClick={e => e.stopPropagation()}
            >
              {CLEFS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
