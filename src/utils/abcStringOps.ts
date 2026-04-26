import * as abcjs from 'abcjs'
import type { TuneMetadata, VoiceConfig } from '../types/editor'
import type { Duration, Accidental } from '../types/editor'
import { buildNoteToken } from './noteFormat'

// ──────────────────────────────────────────────
// Metadata parsing
// ──────────────────────────────────────────────

export function parseMetadata(abc: string): TuneMetadata {
  const field = (tag: string) =>
    abc.match(new RegExp(`^${tag}:(.*)$`, 'm'))?.[1]?.trim() ?? ''

  return {
    refNumber:       field('X'),
    title:           field('T'),
    composer:        field('C'),
    timeSignature:   field('M'),
    defaultNoteLength: field('L'),
    tempo:           field('Q'),
    key:             field('K'),
    rhythm:          field('R'),
  }
}

/** Update a single header field (e.g. T:, K:, M:) in the ABC string */
export function updateField(abc: string, tag: string, value: string): string {
  const regex = new RegExp(`^${tag}:.*$`, 'm')
  if (regex.test(abc)) {
    return abc.replace(regex, `${tag}:${value}`)
  }
  // Insert before K: if field not present (except K: itself goes at end of header)
  const kIdx = abc.indexOf('\nK:')
  if (kIdx !== -1 && tag !== 'K') {
    return abc.slice(0, kIdx + 1) + `${tag}:${value}\n` + abc.slice(kIdx + 1)
  }
  return abc + `${tag}:${value}\n`
}

// ──────────────────────────────────────────────
// Note insertion
// ──────────────────────────────────────────────

/**
 * Insert a note token at `insertPos` in the ABC string.
 * Adds a space before and after for readability.
 */
export function insertNoteAt(
  abc: string,
  insertPos: number,
  note: string,
  octave: number,
  duration: Duration,
  dotted: boolean,
  accidental: Accidental | null,
  isRest: boolean
): string {
  const token = buildNoteToken(note, octave, duration, dotted, accidental, isRest)
  const before = abc.slice(0, insertPos)
  const after = abc.slice(insertPos)

  // Avoid double-spacing
  const sep = (before.endsWith(' ') || before.endsWith('|') || before.endsWith(':')) ? '' : ' '
  const sepAfter = (after.startsWith(' ') || after.startsWith('|') || after.startsWith('\n')) ? '' : ' '
  return before + sep + token + sepAfter + after
}

// ──────────────────────────────────────────────
// Note deletion
// ──────────────────────────────────────────────

/**
 * Delete the element at charPos (note or rest) from the ABC string.
 * Removes surrounding whitespace cleanly.
 */
export function deleteElementAt(abc: string, startChar: number, endChar: number): string {
  let before = abc.slice(0, startChar)
  let after = abc.slice(endChar)

  // Remove trailing space from before
  before = before.replace(/\s+$/, '')
  // Remove leading space from after
  after = after.replace(/^\s+/, '')

  const sep = (before.endsWith('|') || before.endsWith(':') || before.endsWith('\n')) ? '' : ' '
  return before + sep + after
}

// ──────────────────────────────────────────────
// Note modification
// ──────────────────────────────────────────────

export interface NoteChange {
  note?: string
  octave?: number
  duration?: Duration
  dotted?: boolean
  accidental?: Accidental | null
}

/**
 * Replace the note token at [startChar, endChar) with modified version.
 */
export function modifyNoteAt(
  abc: string,
  startChar: number,
  endChar: number,
  note: string,
  octave: number,
  duration: Duration,
  dotted: boolean,
  accidental: Accidental | null
): string {
  const token = buildNoteToken(note, octave, duration, dotted, accidental, false)
  return abc.slice(0, startChar) + token + abc.slice(endChar)
}

// ──────────────────────────────────────────────
// Decorations
// ──────────────────────────────────────────────

/**
 * Add a decoration (e.g. "!staccato!") before the note at startChar.
 */
export function addDecoration(abc: string, startChar: number, decoration: string): string {
  const decorated = `!${decoration}!`
  return abc.slice(0, startChar) + decorated + abc.slice(startChar)
}

/** Remove a decoration from a note */
export function removeDecoration(abc: string, startChar: number, endChar: number, decoration: string): string {
  const segment = abc.slice(startChar, endChar)
  const cleaned = segment.replace(new RegExp(`!${decoration}!`, 'g'), '')
  return abc.slice(0, startChar) + cleaned + abc.slice(endChar)
}

// ──────────────────────────────────────────────
// Slur / Tie
// ──────────────────────────────────────────────

export function addSlur(abc: string, startChar: number, endChar: number): string {
  return abc.slice(0, startChar) + '(' + abc.slice(startChar, endChar) + ')' + abc.slice(endChar)
}

export function addTie(abc: string, endChar: number): string {
  return abc.slice(0, endChar) + '-' + abc.slice(endChar)
}

// ──────────────────────────────────────────────
// Measure operations
// ──────────────────────────────────────────────

export function insertBarline(abc: string, insertPos: number, type: string = '|'): string {
  const before = abc.slice(0, insertPos).trimEnd()
  const after = abc.slice(insertPos).trimStart()
  return before + ` ${type} ` + after
}

/**
 * After a note is inserted, scan each voice for measures whose beat count has
 * reached the time signature's length and insert a `|` barline there
 * automatically.
 *
 * Durations in abcjs are fractional whole notes; getBarLength() returns the
 * same unit (e.g. 4/4 → 1.0, 3/4 → 0.75, 6/8 → 0.75).
 *
 * Force-insertion rule: if the user clicks inside a measure that is already
 * full (and already has a barline), inserting a note pushes the cumulative
 * count past barLength. autoBarlines then places a new barline right after
 * the beat that fills the measure, naturally splitting the overfull measure.
 */
export function autoBarlines(abc: string): string {
  const tunes = abcjs.parseOnly(abc)
  if (!tunes?.[0]) return abc

  const tune = tunes[0] as unknown as {
    getBarLength: () => number
    lines: Array<{
      staff?: Array<{
        voices?: Array<Array<{
          el_type: string
          duration?: number
          startChar: number
          endChar: number
        }>>
      }>
    }>
  }

  const barLen = tune.getBarLength?.()
  if (!barLen || !isFinite(barLen) || barLen <= 0) return abc

  const EPS = 1e-6

  // Collect absolute endChar positions where a barline must be inserted.
  // Using a Set deduplicates in case multiple voices agree on the same position.
  const needBarAt = new Set<number>()

  for (const line of tune.lines ?? []) {
    for (const staff of line.staff ?? []) {
      for (const voice of staff.voices ?? []) {
        let cum = 0

        for (let i = 0; i < voice.length; i++) {
          const el = voice[i]

          if (el.el_type === 'bar') {
            cum = 0
            continue
          }
          if (el.el_type !== 'note' && el.el_type !== 'rest') continue

          cum += el.duration ?? 0

          // Measure is exactly full (or overflowed due to force-insert).
          // Add a barline only if the next element is not already a barline.
          if (cum >= barLen - EPS) {
            const next = voice[i + 1]
            if (!next || next.el_type !== 'bar') {
              needBarAt.add(el.endChar)
            }
            // Subtract one barLen so overflow carries into the next measure
            cum -= barLen
          }
        }
      }
    }
  }

  if (needBarAt.size === 0) return abc

  // Insert barlines from right to left so earlier positions stay valid
  const positions = [...needBarAt].sort((a, b) => b - a)
  let result = abc
  for (const pos of positions) {
    const before = result.slice(0, pos)
    const after  = result.slice(pos)
    // Avoid double-spacing: trim trailing space from before, leading space from after
    result = before.trimEnd() + ' |' + (after.trimStart() === '' ? '' : ' ' + after.trimStart())
  }

  return result
}

// ──────────────────────────────────────────────
// Voice operations
// ──────────────────────────────────────────────

export function addVoice(abc: string, voice: VoiceConfig): string {
  const voiceDef = `V:${voice.id} clef=${voice.clef} name="${voice.name}"`
  // Insert before K: line
  const kMatch = abc.match(/^K:.*$/m)
  if (!kMatch || kMatch.index === undefined) return abc + voiceDef + '\n'
  const kIdx = kMatch.index
  const before = abc.slice(0, kIdx)
  const after = abc.slice(kIdx)
  return before + voiceDef + '\n' + after
}

/**
 * Find the character position where a voice's music ends (end of last [V:N] section).
 * Returns position to append new notes for that voice.
 */
export function findVoiceInsertPos(abc: string, voiceId: number): number {
  // Find all occurrences of [V:voiceId] or V:voiceId on its own line
  const inlinePattern = new RegExp(`\\[V:${voiceId}\\]`, 'g')
  let lastPos = -1
  let match: RegExpExecArray | null

  while ((match = inlinePattern.exec(abc)) !== null) {
    lastPos = match.index + match[0].length
  }

  if (lastPos !== -1) {
    // Find end of the music content for this voice section (until next [V:] or end of line)
    const remaining = abc.slice(lastPos)
    const nextVoiceOrBarline = remaining.search(/\n\[V:|\n[A-Z]:/)
    if (nextVoiceOrBarline === -1) {
      return lastPos + remaining.length
    }
    return lastPos + nextVoiceOrBarline
  }

  // Single voice: insert at end of music (before final newline)
  return abc.trimEnd().length
}

// ──────────────────────────────────────────────
// Note pitch transposition (string level)
// ──────────────────────────────────────────────

const ALL_PITCHES = [
  'C,,,,', 'D,,,,', 'E,,,,', 'F,,,,', 'G,,,,', 'A,,,,', 'B,,,,',
  'C,,,',  'D,,,',  'E,,,',  'F,,,',  'G,,,',  'A,,,',  'B,,,',
  'C,,',   'D,,',   'E,,',   'F,,',   'G,,',   'A,,',   'B,,',
  'C,',    'D,',    'E,',    'F,',    'G,',    'A,',    'B,',
  'C',     'D',     'E',     'F',     'G',     'A',     'B',
  'c',     'd',     'e',     'f',     'g',     'a',     'b',
  "c'",    "d'",    "e'",    "f'",    "g'",    "a'",    "b'",
  "c''",   "d''",   "e''",   "f''",   "g''",   "a''",   "b''",
  "c'''",  "d'''",  "e'''",  "f'''",  "g'''",  "a'''",  "b'''",
]

function tokenizeNoteText(str: string): string[] {
  const arr = str.split(/(!.+?!|".+?")/g)
  const output: string[] = []
  for (const part of arr) {
    if (part.startsWith('"') || part.startsWith('!')) {
      output.push(part)
    } else {
      const parts2 = part.split(/([A-Ga-g][,']*)/g)
      output.push(...parts2)
    }
  }
  return output
}

/** Transpose a note (in ABC notation format) by `steps` diatonic steps */
export function transposeNoteText(noteText: string, steps: number): string {
  const tokens = tokenizeNoteText(noteText)
  return tokens.map(t => {
    const idx = ALL_PITCHES.indexOf(t)
    if (idx >= 0) {
      const newIdx = Math.max(0, Math.min(ALL_PITCHES.length - 1, idx - steps))
      return ALL_PITCHES[newIdx]
    }
    return t
  }).join('')
}

/** Transpose the note at [startChar, endChar) by `steps` */
export function transposeNoteAt(abc: string, startChar: number, endChar: number, steps: number): string {
  const noteText = abc.slice(startChar, endChar)
  const transposed = transposeNoteText(noteText, steps)
  return abc.slice(0, startChar) + transposed + abc.slice(endChar)
}
