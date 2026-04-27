import { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { insertNoteAt, autoBarlines, autoBeaming, addNoteToChord, parseLValue, parseMetadata } from '../../utils/abcStringOps'
import { yToPitch, getStaffAtY, xToInsertPosition, getSvgCoords, pitchToSvgY } from '../../utils/staffMapper'
import { buildNoteToken } from '../../utils/noteFormat'
import { DURATION_MULTIPLIER } from '../../types/abc'
import type { PositionedElement, StaffGeometry } from '../../types/abc'

interface ScoreOverlayProps {
  svgEl: SVGSVGElement
  positions: PositionedElement[]
  staves: StaffGeometry[]
}

interface HoverState {
  cssX: number   // mouse X relative to overlay left edge (CSS px)
  cssY: number   // snapped pitch Y relative to overlay top edge (CSS px)
  note: string
  octave: number
}

export function ScoreOverlay({ svgEl, positions, staves }: ScoreOverlayProps) {
  const [hover, setHover] = useState<HoverState | null>(null)

  // Reset the indicator whenever the SVG is replaced (new note rendered).
  const prevSvgEl = useRef<SVGSVGElement | null>(null)
  useEffect(() => {
    if (prevSvgEl.current !== svgEl) {
      prevSvgEl.current = svgEl
      setHover(null)
    }
  }, [svgEl])

  // ── Coordinate helpers ────────────────────────────────────────────────────
  // These are re-derived on every render so they always reflect the live SVG.

  function getScaleY() {
    const rect = svgEl.getBoundingClientRect()
    const vb   = svgEl.viewBox.baseVal
    const svgH = vb.height || rect.height
    return { scaleY: rect.height / svgH, svgVY: vb.y || 0 }
  }

  /** SVG-unit Y → CSS px offset from top of overlay div. */
  function toCssY(svgY: number) {
    const { scaleY, svgVY } = getScaleY()
    return (svgY - svgVY) * scaleY
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  function resolveHover(e: React.MouseEvent): HoverState | null {
    const svgRect = svgEl.getBoundingClientRect()
    const coords  = getSvgCoords(e.nativeEvent, svgEl)
    const staff   = getStaffAtY(coords.y, staves)
    if (!staff) return null

    const { note, octave } = yToPitch(coords.y, staff)
    const snappedSvgY = pitchToSvgY(note, octave, staff)

    return {
      cssX: e.clientX - svgRect.left,
      cssY: toCssY(snappedSvgY),
      note,
      octave,
    }
  }

  const handleMouseMove  = (e: React.MouseEvent<HTMLDivElement>) => setHover(resolveHover(e))
  const handleMouseLeave = () => setHover(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { inputDuration, inputDot, inputAccidental, inputRest,
            abcNotation, setAbcNotation } = useEditorStore.getState()

    const coords = getSvgCoords(e.nativeEvent, svgEl)
    const staff  = getStaffAtY(coords.y, staves)

    let note = 'C', octave = 5
    if (staff) {
      const p = yToPitch(coords.y, staff)
      note = p.note; octave = p.octave
    }

    // Check if the click lands on an existing note with the same duration → chord
    if (!inputRest) {
      const voicePositions = staff != null
        ? positions.filter(el => el.voiceIndex === staff.voiceIndex)
        : positions
      const hit = voicePositions.find(
        el => el.type === 'note' && coords.x >= el.x && coords.x <= el.x + el.w
      )
      if (hit && hit.duration !== undefined) {
        const metadata = parseMetadata(abcNotation)
        const lValue = parseLValue(metadata.defaultNoteLength || '1/8')
        const inputWhole = DURATION_MULTIPLIER[inputDuration] * lValue * (inputDot ? 1.5 : 1)
        if (Math.abs(hit.duration - inputWhole) < 1e-6) {
          const newToken = buildNoteToken(note, octave, inputDuration, inputDot, inputAccidental, false)
          setAbcNotation(autoBeaming(autoBarlines(addNoteToChord(abcNotation, hit.startChar, hit.endChar, newToken))))
          return
        }
      }
    }

    // Default: insert at horizontal position
    const insertPos = xToInsertPosition(coords.x, positions, staff?.voiceIndex)
    const pos = insertPos >= 0 ? insertPos : abcNotation.trimEnd().length

    setAbcNotation(autoBeaming(autoBarlines(insertNoteAt(abcNotation, pos, note, octave, inputDuration, inputDot, inputAccidental, inputRest))))
  }

  // ── Overlay positioning ───────────────────────────────────────────────────
  // Position the overlay div exactly over the SVG element.

  const svgRect    = svgEl.getBoundingClientRect()
  const parentRect = (svgEl.parentElement?.getBoundingClientRect()) ?? svgRect

  return (
    <div
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute"
      style={{
        left:   svgRect.left - parentRect.left,
        top:    svgRect.top  - parentRect.top,
        width:  svgRect.width,
        height: svgRect.height,
        cursor: 'crosshair',
        zIndex: 10,
      }}
    >
      {hover && (
        <SnapIndicator
          hover={hover}
          overlayWidth={svgRect.width}
        />
      )}
    </div>
  )
}

// ── Snap indicator ────────────────────────────────────────────────────────────

function SnapIndicator({ hover, overlayWidth }: { hover: HoverState; overlayWidth: number }) {
  const { cssX, cssY, note, octave } = hover
  const labelX = Math.min(cssX + 12, overlayWidth - 46)

  return (
    <>
      {/* Horizontal line at the snapped pitch */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: cssY,
          height: 1.5,
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0, 120, 212, 0.55)',
        }}
      />

      {/* Ghost note-head */}
      <div
        className="absolute pointer-events-none"
        style={{
          left:   cssX - 7,
          top:    cssY - 5,
          width:  13,
          height: 10,
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 120, 212, 0.35)',
          border: '1.5px solid rgba(0, 120, 212, 0.75)',
          transform: 'rotate(-20deg)',
        }}
      />

      {/* Note label */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left:       labelX,
          top:        cssY - 22,
          padding:    '1px 5px',
          fontSize:   11,
          fontWeight: 600,
          lineHeight: '16px',
          color:      '#0060b8',
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: 3,
          boxShadow:  '0 1px 4px rgba(0,0,0,0.18)',
          whiteSpace: 'nowrap',
        }}
      >
        {note}{octave}
      </div>
    </>
  )
}
