import { useEffect, useRef, useCallback } from 'react'
import * as abcjs from 'abcjs'
import type { TuneObject, AbcElem, ClickListenerAnalysis, ClickListenerDrag } from 'abcjs'
import { useEditorStore } from '../store/editorStore'
import {
  buildPositionIndex,
  extractStaffGeometryFromSVG,
  findDecorationAtClick,
  findNoteForDecoration,
  getSvgCoords,
  getStaffAtY,
  yToPitch,
} from '../utils/staffMapper'
import { transposeNoteAt, findDecorationsInRange } from '../utils/abcStringOps'
import type { PositionedElement, StaffGeometry } from '../types/abc'

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
  const stavesRef = useRef<StaffGeometry[]>([])

  // Track the last mousedown position so the clickListener can read it.
  const lastMousePos = useRef({ clientX: 0, clientY: 0 })

  // Custom highlight state: track what we've highlighted so we can reset it
  // before applying the next highlight.
  const customHighlightEl  = useRef<SVGElement | null>(null)  // specific child (note head / decoration)
  const customHighlightGroup = useRef<SVGElement | null>(null) // the <g> group whose fill we reset
  const customGroupFgColor = useRef<string>('#000000')

  // Keep a ref to inputMode to avoid stale closure in click listener
  const currentInputMode = useRef(inputMode)
  currentInputMode.current = inputMode

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Undo any previous per-element highlight we applied manually. */
  function clearCustomHighlight() {
    if (customHighlightEl.current) {
      customHighlightEl.current.removeAttribute('fill')
      customHighlightEl.current.removeAttribute('stroke')
      customHighlightEl.current = null
    }
    if (customHighlightGroup.current) {
      customHighlightGroup.current.setAttribute('fill', customGroupFgColor.current)
      // remove the abcjs selection class from the group too
      const kls = customHighlightGroup.current.getAttribute('class') ?? ''
      customHighlightGroup.current.setAttribute(
        'class', kls.replace(/\babcjs-note_selected\b/g, '').trim()
      )
      customHighlightGroup.current = null
    }
  }

  /**
   * Override abcjs's whole-group highlight so only `target` is coloured.
   * `group` is the <g> that abcjs just painted with selectionColor — we reset
   * it to the foreground colour and instead paint just `target`.
   */
  function applySubElementHighlight(
    group: SVGElement,
    target: SVGElement,
    selectionColor: string,
    fgColor: string,
  ) {
    clearCustomHighlight()

    // Reset the group abcjs just highlighted
    group.setAttribute('fill', fgColor)
    const kls = group.getAttribute('class') ?? ''
    group.setAttribute('class', kls.replace(/\babcjs-note_selected\b/g, '').trim())
    customHighlightGroup.current = group
    customGroupFgColor.current = fgColor

    // Apply colour to the specific child element
    target.setAttribute('fill', selectionColor)
    target.setAttribute('stroke', selectionColor)
    customHighlightEl.current = target
  }

  // ── Click handler ─────────────────────────────────────────────────────────

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

    // ── Fine-grained selection in select mode ─────────────────────────────
    if (currentInputMode.current === 'select') {
      const svg = containerRef.current?.querySelector('svg') as SVGSVGElement | null
      if (svg) {
        const coords = getSvgCoords(lastMousePos.current as MouseEvent, svg)
        const abc    = useEditorStore.getState().abcNotation

        // Foreground colour used to reset highlighted groups
        const fgColor: string =
          (tuneRef.current as unknown as { engraver?: { renderer?: { foregroundColor?: string } } })
            ?.engraver?.renderer?.foregroundColor ?? '#000000'

        // Chord group element (abcjs renders all chord notes inside one <g>)
        const absEl   = (abcElem as unknown as { abselem?: { elemset?: SVGElement[] } }).abselem
        const group   = absEl?.elemset?.[0] ?? null

        // ── 1. Decoration click ──────────────────────────────────────────
        const decorEl = findDecorationAtClick(svg, coords.x, coords.y)
        if (decorEl) {
          const parentNote = findNoteForDecoration(decorEl, positionsRef.current)
          if (parentNote) {
            const decors = findDecorationsInRange(abc, parentNote.startChar, parentNote.endChar)
            const best   = decors[0]   // most decoration clicks are single; extend later if needed
            if (best) {
              // Reset the note group that abcjs highlighted, apply to decoration only
              const noteGroup =
                decorEl.closest<SVGElement>('[class*="abcjs-note"]') ??
                group
              if (noteGroup) applySubElementHighlight(noteGroup, decorEl, '#0078d4', fgColor)
              else clearCustomHighlight()

              setSelectedElement({
                startChar:       parentNote.startChar,
                endChar:         parentNote.endChar,
                type:            'decoration',
                isDecoration:    true,
                decorationName:  best.name,
                decorationStart: best.start,
                decorationEnd:   best.end,
              })
              setCursorChar(parentNote.endChar)
              return
            }
          }
        }

        // ── 2. Chord — individual note head ──────────────────────────────
        const pitchArr = abcElem.pitches as unknown as Array<{ pitch: number }> | undefined
        if (abcElem.el_type === 'note' && pitchArr && pitchArr.length > 1 && group) {
          // Find the .abcjs-notehead child closest to the click Y, and record its center Y
          const noteHeads = group.querySelectorAll<SVGGraphicsElement>('.abcjs-notehead')
          let closestNH: SVGGraphicsElement | null = null
          let closestDist = Infinity
          let closestNHCenterY = coords.y
          noteHeads.forEach(nh => {
            const bb = nh.getBBox?.()
            if (!bb) return
            const centerY = bb.y + bb.height / 2
            const dist = Math.abs(centerY - coords.y)
            if (dist < closestDist) { closestDist = dist; closestNH = nh; closestNHCenterY = centerY }
          })

          if (closestNH) {
            applySubElementHighlight(group, closestNH, '#0078d4', fgColor)
          }

          // Use the notehead's center Y (not raw click Y) so pitch snaps to the actual rendered note
          const staff = getStaffAtY(closestNHCenterY, stavesRef.current)
          if (staff) {
            const { note, octave } = yToPitch(closestNHCenterY, staff)
            setSelectedElement({
              startChar:  abcElem.startChar,
              endChar:    abcElem.endChar,
              type:       abcElem.el_type,
              el_type:    abcElem.el_type,
              pitches:    pitchArr,
              midiPitches: abcElem.midiPitches as unknown as Array<{
                pitch: number; duration: number; volume: number
                instrument: number; start: number; gap: number
              }>,
              chordNote: { note, octave },
            })
            setCursorChar(abcElem.endChar)
            if (abcElem.midiPitches) {
              const tune = tuneRef.current as unknown as { millisecondsPerMeasure?: () => number }
              abcjs.synth.playEvent(
                abcElem.midiPitches as unknown as abcjs.MidiPitches,
                abcElem.midiGraceNotePitches as unknown as abcjs.MidiGracePitches,
                tune?.millisecondsPerMeasure?.() ?? 2000
              ).catch(() => {})
            }
            return
          }
        }
      }
    }

    // ── Default selection (whole element) ─────────────────────────────────
    // Clear any sub-element highlight we left from a previous chord/decoration click
    clearCustomHighlight()

    setSelectedElement({
      startChar:  abcElem.startChar,
      endChar:    abcElem.endChar,
      type:       abcElem.el_type ?? '',
      el_type:    abcElem.el_type,
      pitches:    abcElem.pitches as unknown as Array<{ pitch: number }>,
      midiPitches: abcElem.midiPitches as unknown as Array<{
        pitch: number; duration: number; volume: number
        instrument: number; start: number; gap: number
      }>,
    })
    setCursorChar(abcElem.endChar)

    if (abcElem.midiPitches && currentInputMode.current === 'select') {
      const tune = tuneRef.current as unknown as { millisecondsPerMeasure?: () => number }
      abcjs.synth.playEvent(
        abcElem.midiPitches as unknown as abcjs.MidiPitches,
        abcElem.midiGraceNotePitches as unknown as abcjs.MidiGracePitches,
        tune?.millisecondsPerMeasure?.() ?? 2000
      ).catch(() => {})
    }
  }

  // ── Effect: render and register mouse listener ────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Capture mouse position on every mousedown so the click listener
    // (which doesn't receive a native event) can read it.
    const onMouseDown = (e: MouseEvent) => {
      lastMousePos.current = { clientX: e.clientX, clientY: e.clientY }
    }
    container.addEventListener('mousedown', onMouseDown)

    const tunes = abcjs.renderAbc(container, abcNotation, {
      add_classes: true,
      dragging: true,
      selectionColor: '#0078d4',
      dragColor: '#0078d4',
      responsive: 'resize',
      clickListener: (e, t, c, a, d) => clickHandler.current?.(e, t, c, a, d),
      selectTypes: ['note', 'bar', 'keySignature', 'timeSignature'],
    } as abcjs.AbcVisualParams)

    if (tunes && tunes[0]) {
      tuneRef.current = tunes[0]
      const positions = buildPositionIndex(tunes[0])
      positionsRef.current = positions

      // Build staves so click listener can resolve pitch from Y coordinate
      const svg = container.querySelector('svg') as SVGSVGElement | null
      if (svg) {
        stavesRef.current = extractStaffGeometryFromSVG(svg, tunes[0])
      }

      // Re-render invalidates our custom highlight references
      clearCustomHighlight()

      options?.onTuneReady?.(tunes[0], positions)
    }

    return () => container.removeEventListener('mousedown', onMouseDown)
  }, [abcNotation]) // eslint-disable-line react-hooks/exhaustive-deps

  const getTune = useCallback(() => tuneRef.current, [])
  const getPositions = useCallback(() => positionsRef.current, [])

  return { getTune, getPositions }
}
