import { useEffect, useRef, useCallback } from 'react'
import * as abcjs from 'abcjs'
import type { TuneObject, AbcElem, ClickListenerAnalysis, ClickListenerDrag } from 'abcjs'
import { useEditorStore } from '../store/editorStore'
import { buildPositionIndex } from '../utils/staffMapper'
import { transposeNoteAt } from '../utils/abcStringOps'
import type { PositionedElement } from '../types/abc'

interface UseAbcRendererOptions {
  onTuneReady?: (tune: TuneObject, positions: PositionedElement[]) => void
}

export function useAbcRenderer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: UseAbcRendererOptions
) {
  const abcNotation = useEditorStore(s => s.abcNotation)
  const inputMode = useEditorStore(s => s.inputMode)
  const setSelectedElement = useEditorStore(s => s.setSelectedElement)
  const setCursorChar = useEditorStore(s => s.setCursorChar)

  const tuneRef = useRef<TuneObject | null>(null)
  const positionsRef = useRef<PositionedElement[]>([])

  // Keep a ref to inputMode to avoid stale closure in click listener
  const currentInputMode = useRef(inputMode)
  currentInputMode.current = inputMode

  const clickHandler = useRef<abcjs.ClickListener | null>(null)

  clickHandler.current = (
    abcElem: AbcElem,
    _tuneNum: number,
    _classes: string,
    _analysis: ClickListenerAnalysis,
    drag: ClickListenerDrag
  ) => {
    if (!abcElem || abcElem.startChar < 0) return

    if (drag && drag.step !== undefined && drag.step !== 0) {
      const current = useEditorStore.getState().abcNotation
      const updated = transposeNoteAt(current, abcElem.startChar, abcElem.endChar, drag.step)
      useEditorStore.getState().setAbcNotation(updated)
      return
    }

    setSelectedElement({
      startChar: abcElem.startChar,
      endChar: abcElem.endChar,
      type: abcElem.el_type ?? '',
      el_type: abcElem.el_type,
      pitches: abcElem.pitches as unknown as Array<{ pitch: number }>,
      midiPitches: abcElem.midiPitches as unknown as Array<{ pitch: number; duration: number; volume: number; instrument: number; start: number; gap: number }>,
    })
    setCursorChar(abcElem.endChar)

    // Play individual note on click in select mode
    if (abcElem.midiPitches && currentInputMode.current === 'select') {
      const tune = tuneRef.current as unknown as { millisecondsPerMeasure?: () => number }
      const msPerMeasure = tune?.millisecondsPerMeasure?.() ?? 2000
      abcjs.synth.playEvent(
        abcElem.midiPitches as unknown as abcjs.MidiPitches,
        abcElem.midiGraceNotePitches as unknown as abcjs.MidiGracePitches,
        msPerMeasure
      ).catch(() => {})
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    const tunes = abcjs.renderAbc(containerRef.current, abcNotation, {
      add_classes: true,
      dragging: true,
      selectionColor: '#0078d4',
      dragColor: '#ff6600',
      responsive: 'resize',
      clickListener: (e, t, c, a, d) => clickHandler.current?.(e, t, c, a, d),
      selectTypes: ['note', 'bar', 'keySignature', 'timeSignature'],
    } as abcjs.AbcVisualParams)

    if (tunes && tunes[0]) {
      tuneRef.current = tunes[0]
      const positions = buildPositionIndex(tunes[0])
      positionsRef.current = positions
      options?.onTuneReady?.(tunes[0], positions)
    }
  }, [abcNotation]) // eslint-disable-line react-hooks/exhaustive-deps

  const getTune = useCallback(() => tuneRef.current, [])
  const getPositions = useCallback(() => positionsRef.current, [])

  return { getTune, getPositions }
}
