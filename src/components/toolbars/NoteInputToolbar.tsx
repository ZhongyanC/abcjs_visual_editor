import { useEditorStore } from '../../store/editorStore'
import { DURATION_LABELS } from '../../utils/noteFormat'
import type { Duration } from '../../types/editor'

export function NoteInputToolbar() {
  const inputMode = useEditorStore(s => s.inputMode)
  const inputDuration = useEditorStore(s => s.inputDuration)
  const inputDot = useEditorStore(s => s.inputDot)
  const inputRest = useEditorStore(s => s.inputRest)
  const setInputMode = useEditorStore(s => s.setInputMode)
  const setInputDuration = useEditorStore(s => s.setInputDuration)
  const setInputDot = useEditorStore(s => s.setInputDot)
  const setInputRest = useEditorStore(s => s.setInputRest)

  const isActive = inputMode === 'note-input'

  return (
    <div className="flex items-center gap-0.5 px-1">
      {/* Note input mode toggle */}
      <button
        className={`tb-btn font-bold text-sm px-2 ${isActive ? 'tb-btn-active' : ''}`}
        onClick={() => setInputMode(isActive ? 'select' : 'note-input')}
        title="Toggle note input mode (N)"
      >
        N
      </button>

      <div className="tb-separator" />

      {/* Duration buttons */}
      {DURATION_LABELS.map(({ duration, label, title, key }) => (
        <button
          key={duration}
          className={`tb-btn text-base ${inputDuration === duration && isActive ? 'tb-btn-active' : ''}`}
          onClick={() => {
            setInputDuration(duration as Duration)
            if (!isActive) setInputMode('note-input')
          }}
          title={`${title} [${key}]`}
        >
          {label}
        </button>
      ))}

      <div className="tb-separator" />

      {/* Dot */}
      <button
        className={`tb-btn font-bold ${inputDot ? 'tb-btn-active' : ''}`}
        onClick={() => setInputDot(!inputDot)}
        title="Dotted note [.]"
      >
        •
      </button>

      {/* Rest */}
      <button
        className={`tb-btn ${inputRest ? 'tb-btn-active' : ''}`}
        onClick={() => {
          setInputRest(!inputRest)
          if (!isActive) setInputMode('note-input')
        }}
        title="Rest (Z)"
      >
        𝄽
      </button>
    </div>
  )
}
