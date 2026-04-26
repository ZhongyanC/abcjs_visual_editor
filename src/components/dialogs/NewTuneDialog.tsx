import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { generateNewTune } from '../../utils/abcTemplate'
import { ALL_KEYS, TIME_SIGNATURES } from '../../utils/keyUtils'

interface NewTuneDialogProps {
  onClose: () => void
}

export function NewTuneDialog({ onClose }: NewTuneDialogProps) {
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const setVoices = useEditorStore(s => s.setVoices)

  const [title, setTitle] = useState('New Tune')
  const [composer, setComposer] = useState('')
  const [key, setKey] = useState('C')
  const [meter, setMeter] = useState('4/4')
  const [tempo, setTempo] = useState('1/4=120')
  const [numVoices, setNumVoices] = useState(1)

  const create = () => {
    const voices = Array.from({ length: numVoices }, (_, i) => ({
      id: i + 1,
      name: i === 0 ? 'Voice 1' : i === 1 ? 'Voice 2' : `Voice ${i + 1}`,
      clef: (i % 2 === 1 ? 'bass' : 'treble') as 'treble' | 'bass',
      stem: 'auto' as const,
    }))
    const abc = generateNewTune({ title, composer, key, timeSignature: meter, tempo, voices })
    setAbcNotation(abc)
    setVoices(voices)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-80 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">New Tune</h2>

        <div className="flex flex-col gap-2 text-xs">
          <Field label="Title">
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
          </Field>
          <Field label="Composer">
            <input className="input-field" value={composer} onChange={e => setComposer(e.target.value)} />
          </Field>
          <Field label="Key">
            <select className="input-field" value={key} onChange={e => setKey(e.target.value)}>
              {ALL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Time Sig.">
            <select className="input-field" value={meter} onChange={e => setMeter(e.target.value)}>
              {TIME_SIGNATURES.map(ts => <option key={ts} value={ts}>{ts}</option>)}
            </select>
          </Field>
          <Field label="Tempo">
            <input className="input-field" value={tempo} onChange={e => setTempo(e.target.value)} placeholder="1/4=120" />
          </Field>
          <Field label="Voices">
            <select className="input-field" value={numVoices} onChange={e => setNumVoices(Number(e.target.value))}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={create}>Create</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-gray-600 w-16 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}
