import type { Duration, Accidental } from '../types/editor'
import { DURATION_TO_ABC_LENGTH } from '../types/abc'

/**
 * Convert duration enum + dotted flag to ABC length string.
 * Assumes L:1/8 (eighth note = 1 unit).
 */
export function durationToAbcLength(duration: Duration, dotted: boolean): string {
  const base = DURATION_TO_ABC_LENGTH[duration] ?? ''
  if (!dotted) return base

  // Dotted = 3/2 the length.
  // Calculate the numeric multiplier, then back to string.
  const map: Record<string, number> = {
    '8': 8, '4': 4, '2': 2, '': 1, '/2': 0.5, '/4': 0.25, '/8': 0.125,
  }
  const num = map[base] ?? 1
  const dotted_num = num * 1.5
  return numToAbcLength(dotted_num)
}

function numToAbcLength(n: number): string {
  if (n === 8) return '8'
  if (n === 6) return '6'
  if (n === 4) return '4'
  if (n === 3) return '3'
  if (n === 2) return '2'
  if (n === 1.5) return '3/2'
  if (n === 1) return ''
  if (n === 0.75) return '3/4'
  if (n === 0.5) return '/2'
  if (n === 0.375) return '3/8'
  if (n === 0.25) return '/4'
  return ''
}

/**
 * Convert accidental enum to ABC prefix character(s).
 */
export function accidentalToAbc(acc: Accidental | null): string {
  if (!acc) return ''
  const map: Record<Accidental, string> = {
    'flat': '_',
    'natural': '=',
    'sharp': '^',
    'double-flat': '__',
    'double-sharp': '^^',
  }
  return map[acc]
}

/**
 * Convert a pitch note + octave to ABC pitch string.
 * Octave 4 = C4 (middle C). In ABC: C4=C, C5=c, C6=c', C3=C,
 */
export function pitchToAbcNote(note: string, octave: number, accidental: Accidental | null): string {
  const acc = accidentalToAbc(accidental)
  // ABC middle octave: uppercase C-B = octave 4 (for treble clef default)
  // 'c' without comma = C5
  const upper = note.toUpperCase()
  const lower = note.toLowerCase()

  if (octave <= 3) {
    const commas = ','.repeat(4 - octave)
    return `${acc}${upper}${commas}`
  } else if (octave === 4) {
    return `${acc}${upper}`
  } else if (octave === 5) {
    return `${acc}${lower}`
  } else {
    const apostrophes = "'".repeat(octave - 5)
    return `${acc}${lower}${apostrophes}`
  }
}

/**
 * Build a full note ABC token: [accidental][pitch][octave_marks][length]
 */
export function buildNoteToken(
  note: string,
  octave: number,
  duration: Duration,
  dotted: boolean,
  accidental: Accidental | null,
  isRest: boolean
): string {
  if (isRest) {
    const len = durationToAbcLength(duration, dotted)
    return `z${len}`
  }
  const pitch = pitchToAbcNote(note, octave, accidental)
  const len = durationToAbcLength(duration, dotted)
  return `${pitch}${len}`
}

/**
 * Duration display labels for toolbar
 */
export const DURATION_LABELS: Array<{ duration: Duration; label: string; title: string; key: string }> = [
  { duration: 'whole',        label: '𝅝',  title: 'Whole note (1)',        key: '1' },
  { duration: 'half',         label: '𝅗𝅥',  title: 'Half note (2)',         key: '2' },
  { duration: 'quarter',      label: '𝅘𝅥',  title: 'Quarter note (3)',      key: '3' },
  { duration: 'eighth',       label: '𝅘𝅥𝅮',  title: 'Eighth note (4)',       key: '4' },
  { duration: 'sixteenth',    label: '𝅘𝅥𝅯',  title: 'Sixteenth note (5)',    key: '5' },
  { duration: 'thirty-second',label: '𝅘𝅥𝅰',  title: '32nd note (6)',         key: '6' },
  { duration: 'sixty-fourth', label: '𝅘𝅥𝅱',  title: '64th note (7)',         key: '7' },
]
