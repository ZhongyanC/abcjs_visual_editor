import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InputMode, Duration, Accidental, SelectedElement, TuneMetadata, VoiceConfig, LayoutConfig } from '../types/editor'
import { DEFAULT_LAYOUT } from '../types/editor'
import { parseMetadata } from '../utils/abcStringOps'

const MAX_HISTORY = 100

export const DEFAULT_ABC = `X:1
T:My Tune
C:Composer
M:4/4
L:1/8
Q:1/4=120
K:C
|: CDEF GABc | dedB AGFE | CDEC CDEC | D4 D4 :|
`

interface EditorState {
  // Core ABC content
  abcNotation: string

  // Cursor & selection
  cursorChar: number
  selectedElement: SelectedElement | null

  // Input mode
  inputMode: InputMode
  inputDuration: Duration
  inputDot: boolean
  inputAccidental: Accidental | null
  inputRest: boolean
  activeVoice: number

  // Playback
  isPlaying: boolean
  isPaused: boolean
  tempo: number | null  // null = use Q: from ABC

  // History (undo/redo)
  history: string[]
  historyIndex: number

  // Layout (persisted separately)
  layout: LayoutConfig

  // Voices
  voices: VoiceConfig[]

  // Derived (from parsing)
  metadata: TuneMetadata

  // Actions
  setAbcNotation: (abc: string) => void
  setAbcNotationNoHistory: (abc: string) => void
  setCursorChar: (char: number) => void
  setSelectedElement: (el: SelectedElement | null) => void
  setInputMode: (mode: InputMode) => void
  setInputDuration: (d: Duration) => void
  setInputDot: (dot: boolean) => void
  setInputAccidental: (acc: Accidental | null) => void
  setInputRest: (rest: boolean) => void
  setActiveVoice: (v: number) => void
  setIsPlaying: (p: boolean) => void
  setIsPaused: (p: boolean) => void
  setTempo: (t: number | null) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  updateLayout: (patch: Partial<LayoutConfig>) => void
  setVoices: (voices: VoiceConfig[]) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      abcNotation: DEFAULT_ABC,
      cursorChar: DEFAULT_ABC.length,
      selectedElement: null,

      inputMode: 'select',
      inputDuration: 'quarter',
      inputDot: false,
      inputAccidental: null,
      inputRest: false,
      activeVoice: 1,

      isPlaying: false,
      isPaused: false,
      tempo: null,

      history: [DEFAULT_ABC],
      historyIndex: 0,

      layout: DEFAULT_LAYOUT,

      voices: [{ id: 1, name: 'Voice 1', clef: 'treble', stem: 'auto' }],

      metadata: parseMetadata(DEFAULT_ABC),

      setAbcNotation(abc) {
        const { history, historyIndex } = get()
        const newHistory = history.slice(0, historyIndex + 1)
        if (newHistory.length >= MAX_HISTORY) newHistory.shift()
        newHistory.push(abc)
        set({
          abcNotation: abc,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          metadata: parseMetadata(abc),
        })
      },

      setAbcNotationNoHistory(abc) {
        set({ abcNotation: abc, metadata: parseMetadata(abc) })
      },

      setCursorChar(char) { set({ cursorChar: char }) },
      setSelectedElement(el) { set({ selectedElement: el }) },
      setInputMode(mode) { set({ inputMode: mode }) },
      setInputDuration(d) { set({ inputDuration: d }) },
      setInputDot(dot) { set({ inputDot: dot }) },
      setInputAccidental(acc) { set({ inputAccidental: acc }) },
      setInputRest(rest) { set({ inputRest: rest }) },
      setActiveVoice(v) { set({ activeVoice: v }) },
      setIsPlaying(p) { set({ isPlaying: p }) },
      setIsPaused(p) { set({ isPaused: p }) },
      setTempo(t) { set({ tempo: t }) },

      undo() {
        const { history, historyIndex } = get()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          set({
            historyIndex: newIndex,
            abcNotation: history[newIndex],
            metadata: parseMetadata(history[newIndex]),
          })
        }
      },

      redo() {
        const { history, historyIndex } = get()
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1
          set({
            historyIndex: newIndex,
            abcNotation: history[newIndex],
            metadata: parseMetadata(history[newIndex]),
          })
        }
      },

      canUndo() { return get().historyIndex > 0 },
      canRedo() { return get().historyIndex < get().history.length - 1 },

      updateLayout(patch) {
        set(state => ({ layout: { ...state.layout, ...patch } }))
      },

      setVoices(voices) { set({ voices }) },
    }),
    {
      name: 'abc-editor-storage',
      partialize: state => ({
        abcNotation: state.abcNotation,
        layout: state.layout,
        voices: state.voices,
        tempo: state.tempo,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<typeof current>
        return {
          ...current,
          ...p,
          layout: { ...DEFAULT_LAYOUT, ...(p.layout ?? {}) },
        }
      },
    }
  )
)
