export interface AbcNote {
  pitch: string    // 'A'-'G' or 'a'-'g'
  octave: number   // 4 = middle C octave (C is 'C', c is one octave higher)
  duration: number // in units of L: length (1 = L, 2 = 2*L, 0.5 = half of L)
  accidental?: '^' | '_' | '=' | '^^' | '__'
  dotted?: boolean
  tie?: boolean
  slurStart?: boolean
  slurEnd?: boolean
  decorations?: string[]
  startChar: number
  endChar: number
}

export interface AbcRest {
  duration: number
  startChar: number
  endChar: number
}

export interface AbcBar {
  type: 'bar_thin' | 'bar_thin_thin' | 'bar_left_repeat' | 'bar_right_repeat' | 'bar_dbl_repeat' | 'bar_thick_thin' | 'bar_thin_thick' | 'bar_invisible'
  startChar: number
  endChar: number
}

export type AbcElement = AbcNote | AbcRest | AbcBar

export interface StaffGeometry {
  voiceIndex: number
  svgStaffIndex: number
  // SVG Y coordinate of middle C (C4) for this staff — from abcjs engraver.
  // All pitch ↔ Y conversions are derived from this + STEP (3.875 SVG units/diatonic step).
  absoluteY: number
  // Extended Y bounds for hit-zone detection (includes ledger lines)
  topY: number
  bottomY: number
  clef: string
  keyAccidentals: Array<{ note: string; acc: string }>
}

export interface PositionedElement {
  x: number
  y: number
  w: number
  startChar: number
  endChar: number
  type: string
  voiceIndex: number
  measureNum: number
  duration?: number  // fractional whole notes (from abcjs absEl.abcelem.duration)
}

// Maps duration enum to ABC notation length multipliers relative to L: (default L:1/8)
export const DURATION_TO_ABC_LENGTH: Record<string, string> = {
  'whole': '8',
  'half': '4',
  'quarter': '2',
  'eighth': '',         // = 1 (default unit)
  'sixteenth': '/2',
  'thirty-second': '/4',
  'sixty-fourth': '/8',
}

// Maps duration enum to multiplier in default-note-length units
export const DURATION_MULTIPLIER: Record<string, number> = {
  'whole': 8,
  'half': 4,
  'quarter': 2,
  'eighth': 1,
  'sixteenth': 0.5,
  'thirty-second': 0.25,
  'sixty-fourth': 0.125,
}

// Key signature accidentals: key → sharps/flats applied
export const KEY_ACCIDENTALS: Record<string, Array<{ note: string; acc: string }>> = {
  'C': [],
  'G': [{ note: 'F', acc: '^' }],
  'D': [{ note: 'F', acc: '^' }, { note: 'C', acc: '^' }],
  'A': [{ note: 'F', acc: '^' }, { note: 'C', acc: '^' }, { note: 'G', acc: '^' }],
  'E': [{ note: 'F', acc: '^' }, { note: 'C', acc: '^' }, { note: 'G', acc: '^' }, { note: 'D', acc: '^' }],
  'B': [{ note: 'F', acc: '^' }, { note: 'C', acc: '^' }, { note: 'G', acc: '^' }, { note: 'D', acc: '^' }, { note: 'A', acc: '^' }],
  'F#': [{ note: 'F', acc: '^' }, { note: 'C', acc: '^' }, { note: 'G', acc: '^' }, { note: 'D', acc: '^' }, { note: 'A', acc: '^' }, { note: 'E', acc: '^' }],
  'F': [{ note: 'B', acc: '_' }],
  'Bb': [{ note: 'B', acc: '_' }, { note: 'E', acc: '_' }],
  'Eb': [{ note: 'B', acc: '_' }, { note: 'E', acc: '_' }, { note: 'A', acc: '_' }],
  'Ab': [{ note: 'B', acc: '_' }, { note: 'E', acc: '_' }, { note: 'A', acc: '_' }, { note: 'D', acc: '_' }],
  'Db': [{ note: 'B', acc: '_' }, { note: 'E', acc: '_' }, { note: 'A', acc: '_' }, { note: 'D', acc: '_' }, { note: 'G', acc: '_' }],
  'Gb': [{ note: 'B', acc: '_' }, { note: 'E', acc: '_' }, { note: 'A', acc: '_' }, { note: 'D', acc: '_' }, { note: 'G', acc: '_' }, { note: 'C', acc: '_' }],
  // minor keys map to relative major accidentals
  'Am': [],
  'Em': [{ note: 'F', acc: '^' }],
  'Bm': [{ note: 'F', acc: '^' }, { note: 'C', acc: '^' }],
  'Dm': [{ note: 'B', acc: '_' }],
  'Gm': [{ note: 'B', acc: '_' }, { note: 'E', acc: '_' }],
}
