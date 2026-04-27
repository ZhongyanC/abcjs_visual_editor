import { useEditorStore } from '../../store/editorStore'
import type { Duration } from '../../types/editor'
import { MS } from '../../utils/musicSymbols'
import { MusicGlyph } from './MusicGlyph'

const DURATION_ITEMS: Array<{ duration: Duration; symbol: string; title: string; key: string }> = [
  { duration: 'whole',         symbol: MS.noteWhole,   title: 'Whole note',   key: '1' },
  { duration: 'half',          symbol: MS.noteHalf,    title: 'Half note',    key: '2' },
  { duration: 'quarter',       symbol: MS.noteQuarter, title: 'Quarter note', key: '3' },
  { duration: 'eighth',        symbol: MS.note8th,     title: 'Eighth note',  key: '4' },
  { duration: 'sixteenth',     symbol: MS.note16th,    title: '16th note',    key: '5' },
  { duration: 'thirty-second', symbol: MS.note32nd,    title: '32nd note',    key: '6' },
  { duration: 'sixty-fourth',  symbol: MS.note64th,    title: '64th note',    key: '7' },
]

const REST_ITEMS: Record<Duration, string> = {
  'whole':         MS.restWhole,
  'half':          MS.restHalf,
  'quarter':       MS.restQuarter,
  'eighth':        MS.rest8th,
  'sixteenth':     MS.rest16th,
  'thirty-second': MS.rest32nd,
  'sixty-fourth':  MS.rest64th,
}

export function NoteInputToolbar() {
  const inputMode = useEditorStore(s => s.inputMode)
  const inputDuration = useEditorStore(s => s.inputDuration)
  const inputDot = useEditorStore(s => s.inputDot)
  const inputRest = useEditorStore(s => s.inputRest)
  const setInputMode = useEditorStore(s => s.setInputMode)
  const setInputDuration = useEditorStore(s => s.setInputDuration)
  const setInputDot = useEditorStore(s => s.setInputDot)
  const setInputRest = useEditorStore(s => s.setInputRest)
  const iconSize = useEditorStore(s => s.layout.toolbarIconSize) || 20

  const isActive = inputMode === 'note-input'

  return (
    <div className="flex items-center gap-0.5 px-1">
      <button
        className={`tb-btn font-bold text-sm px-2 ${isActive ? 'tb-btn-active' : ''}`}
        onClick={() => setInputMode(isActive ? 'select' : 'note-input')}
        title="Toggle note input mode (N)"
      >
        N
      </button>

      <div className="tb-separator" />

      {DURATION_ITEMS.map(({ duration, symbol, title, key }) => (
        <button
          key={duration}
          className={`tb-btn ${inputDuration === duration && isActive ? 'tb-btn-active' : ''}`}
          onClick={() => {
            setInputDuration(duration)
            if (!isActive) setInputMode('note-input')
          }}
          title={`${title} [${key}]`}
        >
          <MusicGlyph symbol={symbol} size={iconSize} />
        </button>
      ))}

      <div className="tb-separator" />

      <button
        className={`tb-btn ${inputDot ? 'tb-btn-active' : ''}`}
        onClick={() => setInputDot(!inputDot)}
        title="Dotted note [.]"
      >
        <MusicGlyph symbol={MS.augDot} size={iconSize * 0.7} />
      </button>

      <button
        className={`tb-btn ${inputRest ? 'tb-btn-active' : ''}`}
        onClick={() => {
          setInputRest(!inputRest)
          if (!isActive) setInputMode('note-input')
        }}
        title="Rest (Z)"
      >
        <MusicGlyph symbol={REST_ITEMS[inputDuration]} size={iconSize} />
      </button>
    </div>
  )
}
