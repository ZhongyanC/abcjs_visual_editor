import { KEY_ACCIDENTALS } from '../types/abc'

const NOTE_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

// Treble clef: top line = F5
const CLEF_TOP: Record<string, { note: string; octave: number }> = {
  treble: { note: 'F', octave: 5 },
  bass:   { note: 'A', octave: 3 },
  alto:   { note: 'G', octave: 4 },
  tenor:  { note: 'E', octave: 4 },
}

/**
 * Convert a staff position index (0 = top line, positive = going down)
 * to a musical pitch. Each step = one diatonic note.
 */
export function staffPositionToNote(
  staffPos: number,
  clef: 'treble' | 'bass' | 'alto' | 'tenor'
): { note: string; octave: number } {
  const top = CLEF_TOP[clef] ?? CLEF_TOP.treble
  const topNoteIdx = NOTE_ORDER.indexOf(top.note)
  const topAbsStep = top.octave * 7 + topNoteIdx
  const absStep = topAbsStep - staffPos
  const note = NOTE_ORDER[((absStep % 7) + 7) % 7]
  const oct = Math.floor(absStep / 7)
  return { note, octave: oct }
}

/**
 * Map Y coordinate to a staff position index.
 * lineSpacing = pixels per diatonic step (half a line space).
 */
export function yToStaffPosition(y: number, topLineY: number, lineSpacing: number): number {
  return Math.round((y - topLineY) / lineSpacing)
}

/** Extract key root from full key string (e.g. "Emin" → "Em", "G" → "G") */
export function parseKeyRoot(keyStr: string): string {
  const m = keyStr.match(/^([A-G][b#]?)(m|min|maj|Dor|Mix|Phr|Lyd|Loc)?/i)
  if (!m) return 'C'
  const root = m[1]
  const mode = (m[2] ?? '').toLowerCase()
  if (mode === 'm' || mode === 'min') return root + 'm'
  return root
}

export function getKeyAccidentals(keyStr: string) {
  const root = parseKeyRoot(keyStr)
  return KEY_ACCIDENTALS[root] ?? []
}

export const ALL_KEYS = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#',
  'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb',
  'Am', 'Em', 'Bm', 'Dm', 'Gm',
]

export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8', 'C', 'C|']
