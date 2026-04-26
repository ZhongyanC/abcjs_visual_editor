import { useEditorStore } from '../../store/editorStore'
import { updateField } from '../../utils/abcStringOps'
import { ALL_KEYS, TIME_SIGNATURES } from '../../utils/keyUtils'

export function TuneInfoPanel() {
  const metadata = useEditorStore(s => s.metadata)
  const abcNotation = useEditorStore(s => s.abcNotation)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)

  const update = (tag: string, value: string) => {
    setAbcNotation(updateField(abcNotation, tag, value))
  }

  return (
    <div className="p-2 text-xs flex flex-col gap-1.5 overflow-y-auto">
      <div className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-1">
        Tune Info
      </div>

      <Field label="Title">
        <input
          className="input-field"
          value={metadata.title}
          onChange={e => update('T', e.target.value)}
        />
      </Field>

      <Field label="Composer">
        <input
          className="input-field"
          value={metadata.composer}
          onChange={e => update('C', e.target.value)}
        />
      </Field>

      <Field label="Key">
        <select
          className="input-field"
          value={metadata.key}
          onChange={e => update('K', e.target.value)}
        >
          {ALL_KEYS.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </Field>

      <Field label="Time Sig.">
        <select
          className="input-field"
          value={metadata.timeSignature}
          onChange={e => update('M', e.target.value)}
        >
          {TIME_SIGNATURES.map(ts => (
            <option key={ts} value={ts}>{ts}</option>
          ))}
        </select>
      </Field>

      <Field label="Note Length">
        <select
          className="input-field"
          value={metadata.defaultNoteLength}
          onChange={e => update('L', e.target.value)}
        >
          {['1/4', '1/8', '1/16'].map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </Field>

      <Field label="Tempo">
        <input
          className="input-field"
          value={metadata.tempo}
          onChange={e => update('Q', e.target.value)}
          placeholder="1/4=120"
        />
      </Field>

      <Field label="Rhythm">
        <input
          className="input-field"
          value={metadata.rhythm}
          onChange={e => update('R', e.target.value)}
          placeholder="reel, jig, waltz..."
        />
      </Field>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-gray-600 w-20 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}
