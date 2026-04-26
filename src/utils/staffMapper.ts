import type { StaffGeometry, PositionedElement } from '../types/abc'

// Matches abcjs/src/write/helpers/spacing.js: STEP = 30 * 93 / 720
export const STEP = 3.875

const DIATONIC_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

// How many diatonic steps from each clef's top staff line DOWN to C4.
// Positive = C4 is below the top line (larger SVG Y), negative = C4 is above.
// treble top = F5 (10 steps above C4)  → +10
// bass top   = A3 (2 steps below C4)   → -2
// alto top   = G4 (4 steps above C4)   → +4
// tenor top  = E4 (2 steps above C4)   → +2
const CLEF_TOP_TO_C4: Record<string, number> = {
  treble: 10,
  bass:   -2,
  alto:    4,
  tenor:   2,
  perc:   10,
}

/**
 * Build staff geometry from the rendered SVG using .abcjs-staff elements.
 * Each such element is the <g> group containing all 5 staff lines for one staff row.
 *
 * bbox.y  = Y of the top staff line (F5 for treble, A3 for bass, …)
 * absoluteY (C4 reference) = bbox.y + CLEF_TOP_TO_C4[clef] * STEP
 *
 * tuneObj is used only to read clef type per staff so bass/alto/tenor render correctly.
 */
export function extractStaffGeometryFromSVG(
  svgEl: SVGElement,
  tuneObj?: unknown
): StaffGeometry[] {
  const staffEls = svgEl.querySelectorAll('.abcjs-staff')

  interface Entry {
    lineNum: number
    voiceNum: number
    topLineY: number
  }

  const entries: Entry[] = []

  staffEls.forEach(el => {
    const cls = el.getAttribute('class') ?? ''
    const lm = cls.match(/abcjs-l(\d+)/)
    const vm = cls.match(/abcjs-v(\d+)/)
    if (!lm || !vm) return

    const bbox = (el as SVGGraphicsElement).getBBox?.()
    // A valid 5-line staff has significant height; skip degenerate bboxes
    if (!bbox || bbox.height < 5) return

    entries.push({
      lineNum:  parseInt(lm[1]),
      voiceNum: parseInt(vm[1]),
      topLineY: bbox.y,
    })
  })

  // Sort by system line first, then voice
  entries.sort((a, b) => a.lineNum - b.lineNum || a.voiceNum - b.voiceNum)

  // Deduplicate (multiple measures create duplicate bboxes for the same staff row)
  const seen = new Set<string>()
  const unique = entries.filter(e => {
    const key = `${e.lineNum}-${e.voiceNum}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const tune = tuneObj as {
    lines?: Array<{
      staff?: Array<{
        clef?: { type?: string }
      }>
    }>
  } | undefined

  return unique.map(({ lineNum, voiceNum, topLineY }, idx) => {
    const clef = tune?.lines?.[lineNum]?.staff?.[voiceNum]?.clef?.type ?? 'treble'
    const stepsToC4 = CLEF_TOP_TO_C4[clef] ?? 10

    // The actual STEP constant is authoritative; use it for absoluteY calculation.
    // stepSize from bbox is close but may differ slightly due to line thickness.
    const absoluteY = topLineY + stepsToC4 * STEP

    // Hit zone: extend 4 steps above top line and 4 steps below bottom line
    const bottomLineY = topLineY + 8 * STEP   // E4 for treble (8 steps below F5)
    const extend = 4 * STEP

    return {
      voiceIndex: idx,
      svgStaffIndex: idx,
      absoluteY,
      topY:    topLineY  - extend,
      bottomY: bottomLineY + extend,
      clef,
      keyAccidentals: [],
    }
  })
}

// Alias for components still using the old name (returns empty — SVG approach is preferred)
export function extractStaffGeometry(_svgEl: SVGElement): StaffGeometry[] {
  return []
}

// Used in ScoreDisplay's fallback path after re-render
export function extractStaffGeometryFromTune(tuneObj: unknown): StaffGeometry[] {
  const tune = tuneObj as {
    engraver?: {
      staffgroups?: Array<{
        staffs?: Array<{ absoluteY?: number }>
      }>
    }
  }
  const staffgroups = tune?.engraver?.staffgroups
  if (!staffgroups?.length) return []

  const result: StaffGeometry[] = []
  for (const group of staffgroups) {
    for (const staff of group.staffs ?? []) {
      const absoluteY = staff.absoluteY
      if (absoluteY === undefined) continue
      const voiceIndex = result.length
      result.push({
        voiceIndex,
        svgStaffIndex: voiceIndex,
        absoluteY,
        topY:    absoluteY - 14 * STEP,
        bottomY: absoluteY + 14 * STEP,
        clef: 'treble',
        keyAccidentals: [],
      })
    }
  }
  return result
}

/**
 * Find the staff whose hit zone contains y; if none, return the nearest staff.
 */
export function getStaffAtY(y: number, staves: StaffGeometry[]): StaffGeometry | null {
  if (staves.length === 0) return null

  // Prefer a staff whose zone contains the click
  let best: StaffGeometry | null = null
  let bestDist = Infinity

  for (const staff of staves) {
    if (y >= staff.topY && y <= staff.bottomY) {
      const dist = Math.abs(staff.absoluteY - y)
      if (dist < bestDist) { bestDist = dist; best = staff }
    }
  }
  if (best) return best

  // Fall back to nearest by absoluteY (click outside any zone)
  bestDist = Infinity
  for (const staff of staves) {
    const dist = Math.abs(staff.absoluteY - y)
    if (dist < bestDist) { bestDist = dist; best = staff }
  }
  return best
}

/**
 * Convert SVG Y → musical pitch using absoluteY + STEP.
 * Snaps to the nearest diatonic step automatically.
 */
export function yToPitch(
  y: number,
  staff: StaffGeometry,
): { note: string; octave: number } {
  const steps = Math.round((staff.absoluteY - y) / STEP)
  const note   = DIATONIC_NOTES[((steps % 7) + 7) % 7]
  const octave = 4 + Math.floor(steps / 7)
  return { note, octave }
}

/**
 * Convert note + octave back to SVG Y — used for the hover snap indicator.
 */
export function pitchToSvgY(note: string, octave: number, staff: StaffGeometry): number {
  const noteIdx = DIATONIC_NOTES.indexOf(note.toUpperCase())
  if (noteIdx === -1) return staff.absoluteY
  const steps = (octave - 4) * 7 + noteIdx
  return staff.absoluteY - steps * STEP
}

/**
 * Map X → best insertion position in the ABC string.
 */
export function xToInsertPosition(
  x: number,
  elements: PositionedElement[],
  voiceIndex?: number
): number {
  const relevant = voiceIndex !== undefined
    ? elements.filter(e => e.voiceIndex === voiceIndex)
    : elements

  if (relevant.length === 0) return -1

  const leftOf = relevant.filter(e => e.x + e.w / 2 <= x)
  if (leftOf.length === 0) return relevant[0].startChar

  leftOf.sort((a, b) => (b.x + b.w) - (a.x + a.w))
  return leftOf[0].endChar
}

/**
 * Build a flat array of positioned elements from the abcjs TuneObject.
 *
 * abcjs never writes x/y/w back onto the parsed AbcElem objects in
 * tuneObj.lines[].staff[].voices[][]; those fields are always undefined.
 * The true SVG positions live on tune.engraver.selectables[n].svgEl —
 * the same elements abcjs itself uses for click detection via getBBox().
 */
export function buildPositionIndex(tuneObj: unknown): PositionedElement[] {
  const tune = tuneObj as {
    engraver?: {
      selectables?: Array<{
        absEl?: {
          abcelem?: {
            startChar?: number
            endChar?: number
            el_type?: string
          }
        }
        svgEl?: Element
      }>
    }
  }

  const selectables = tune?.engraver?.selectables
  if (!selectables?.length) return []

  const result: PositionedElement[] = []

  for (const sel of selectables) {
    const abcelem = sel.absEl?.abcelem
    if (!abcelem || abcelem.startChar === undefined || abcelem.startChar < 0) continue

    const svgEl = sel.svgEl as SVGGraphicsElement | undefined
    if (!svgEl?.getBBox) continue

    const bbox = svgEl.getBBox()

    // Parse voice index from the element's 'abcjs-v{n}' CSS class
    const cls      = svgEl.getAttribute?.('class') ?? ''
    const voiceMatch = cls.match(/abcjs-v(\d+)/)
    const voiceIndex = voiceMatch ? parseInt(voiceMatch[1]) : 0

    result.push({
      x: bbox.x,
      y: bbox.y,
      w: bbox.width,
      startChar: abcelem.startChar,
      endChar:   abcelem.endChar ?? abcelem.startChar,
      type:      abcelem.el_type ?? '',
      voiceIndex,
      measureNum: 0,
    })
  }

  return result
}

/**
 * Convert mouse event coordinates to SVG viewBox coordinate space.
 */
export function getSvgCoords(
  e: React.MouseEvent | MouseEvent,
  svgEl: SVGSVGElement
): { x: number; y: number } {
  const rect   = svgEl.getBoundingClientRect()
  const svgW   = svgEl.viewBox.baseVal.width  || rect.width
  const svgH   = svgEl.viewBox.baseVal.height || rect.height
  return {
    x: (e.clientX - rect.left) * (svgW / rect.width),
    y: (e.clientY - rect.top)  * (svgH / rect.height),
  }
}
