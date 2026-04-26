import type { TuneObject } from 'abcjs'
import { usePlayback } from '../../hooks/usePlayback'
import { useEditorStore } from '../../store/editorStore'

interface PlaybackBarProps {
  getTune: () => TuneObject | null
}

export function PlaybackBar({ getTune }: PlaybackBarProps) {
  const { play, pause, stop, isPlaying, isPaused, getMidiFile } = usePlayback()
  const tempo = useEditorStore(s => s.tempo)
  const setTempo = useEditorStore(s => s.setTempo)
  const abcNotation = useEditorStore(s => s.abcNotation)

  const handlePlay = async () => {
    const tune = getTune()
    if (!tune) return
    if (isPlaying && !isPaused) {
      pause()
    } else {
      await play(tune)
    }
  }

  const downloadMidi = () => {
    const dataUrl = getMidiFile(abcNotation)
    const a = document.createElement('a')
    a.href = dataUrl as string
    a.download = 'tune.mid'
    a.click()
  }

  const downloadAbc = () => {
    const blob = new Blob([abcNotation], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tune.abc'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-toolbar border-t border-gray-700 flex items-center gap-3 px-4 h-11">
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <button
          className="tb-btn text-base"
          onClick={stop}
          title="Stop"
        >
          ⏹
        </button>
        <button
          className={`tb-btn text-base ${isPlaying && !isPaused ? 'tb-btn-active' : ''}`}
          onClick={handlePlay}
          title={isPlaying && !isPaused ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying && !isPaused ? '⏸' : '▶'}
        </button>
      </div>

      <div className="tb-separator" />

      {/* Tempo control */}
      <div className="flex items-center gap-2 text-white text-xs">
        <span className="text-gray-300">♩=</span>
        <input
          type="number"
          min={20}
          max={400}
          value={tempo ?? 120}
          onChange={e => setTempo(Number(e.target.value))}
          className="w-16 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 text-center"
          title="Tempo (BPM)"
        />
        <button
          className="text-gray-400 hover:text-white text-xs"
          onClick={() => setTempo(null)}
          title="Use tempo from score (Q:)"
        >
          ↺
        </button>
      </div>

      <div className="flex-1" />

      {/* Export buttons */}
      <div className="flex items-center gap-1">
        <button
          className="tb-btn text-xs px-2"
          onClick={downloadAbc}
          title="Download ABC file"
        >
          ABC↓
        </button>
        <button
          className="tb-btn text-xs px-2"
          onClick={downloadMidi}
          title="Download MIDI file"
        >
          MIDI↓
        </button>
      </div>
    </div>
  )
}
