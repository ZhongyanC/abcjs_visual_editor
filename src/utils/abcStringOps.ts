import * as abcjs from 'abcjs'
import type { TuneMetadata, VoiceConfig } from '../types/editor'
import type { Duration, Accidental } from '../types/editor'
import { buildNoteToken, pitchToAbcNote } from './noteFormat'

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
// Chord operations
// ──────────────────────────────────────────────

/**
 * Parse the L: default note length field ("1/8", "1/4", etc.) to a
 * fractional whole-note value (0.125, 0.25, …).
 */
export function parseLValue(l: string): number {
  const m = l.match(/(\d+)\/(\d+)/)
  if (m) return parseInt(m[1]) / parseInt(m[2])
  const n = parseFloat(l)
  return isNaN(n) ? 0.125 : n
}

/**
 * Add a note token to an existing note or chord at [startChar, endChar).
 * If the existing token is already a chord `[...]`, appends inside the brackets.
 * Otherwise wraps both notes: `[oldToken newToken]`.
 */
export function addNoteToChord(
  abc: string,
  startChar: number,
  endChar: number,
  newToken: string
): string {
  const existing = abc.slice(startChar, endChar).trim()
  let chordToken: string
  if (existing.startsWith('[') && existing.endsWith(']')) {
    chordToken = existing.slice(0, -1) + newToken + ']'
  } else {
    chordToken = '[' + existing + newToken + ']'
  }
  return abc.slice(0, startChar) + chordToken + abc.slice(endChar)
}

/**
 * Parse individual note tokens out of the interior of a chord bracket.
 * e.g. "^C2_E2G2" → [{token:"^C2"}, {token:"_E2"}, {token:"G2"}]
 */
function parseChordTokens(inside: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < inside.length) {
    const start = i
    // accidentals: ^, ^^, _, __, =
    while (i < inside.length && (inside[i] === '^' || inside[i] === '_' || inside[i] === '=')) i++
    if (i >= inside.length || !/[A-Ga-g]/.test(inside[i])) { i++; continue }
    i++ // note letter
    while (i < inside.length && (inside[i] === ',' || inside[i] === "'")) i++ // octave marks
    while (i < inside.length && /[\d/]/.test(inside[i])) i++ // length
    if (i < inside.length && inside[i] === '>') i++ // broken rhythm marker
    tokens.push(inside.slice(start, i))
  }
  return tokens
}

/** Parse an ABC note token like "^C2" or "c'" back to {note, octave}. */
function abcTokenToNoteOctave(token: string): { note: string; octave: number } | null {
  let i = 0
  while (i < token.length && '^_='.includes(token[i])) i++
  if (i >= token.length || !/[A-Ga-g]/.test(token[i])) return null
  const letter = token[i]; i++
  const isLower = letter !== letter.toUpperCase()
  let octave = isLower ? 5 : 4
  while (i < token.length && token[i] === ',') { octave--; i++ }
  while (i < token.length && token[i] === "'") { octave++; i++ }
  return { note: letter.toUpperCase(), octave }
}

/**
 * Transpose one specific pitch (targetNote + targetOctave) inside a chord at
 * [startChar, endChar) by `steps` diatonic steps.  All other pitches are left
 * unchanged.  Returns the updated ABC string plus the new note + octave of the
 * transposed pitch so the caller can update its selection state.
 *
 * Falls back to a full-element transpose when the element is not a chord.
 */
export function transposeNoteInChord(
  abc: string,
  startChar: number,
  endChar: number,
  targetNote: string,
  targetOctave: number,
  steps: number,
): { abc: string; newNote: string; newOctave: number } {
  const raw = abc.slice(startChar, endChar)
  const bracketIdx = raw.indexOf('[')
  if (bracketIdx === -1) {
    return {
      abc: transposeNoteAt(abc, startChar, endChar, steps),
      newNote: targetNote,
      newOctave: targetOctave,
    }
  }

  const decorPrefix = raw.slice(0, bracketIdx)
  const closeIdx = raw.lastIndexOf(']')
  const inside = raw.slice(bracketIdx + 1, closeIdx)
  const suffix = raw.slice(closeIdx + 1)

  const tokens = parseChordTokens(inside)
  const targetAbc = pitchToAbcNote(targetNote, targetOctave, null)

  let newNote = targetNote
  let newOctave = targetOctave

  const newTokens = tokens.map(t => {
    const stripped = t.replace(/^[_^=]+/, '')
    if (stripped.startsWith(targetAbc)) {
      const transposed = transposeNoteText(t, steps)
      const parsed = abcTokenToNoteOctave(transposed)
      if (parsed) { newNote = parsed.note; newOctave = parsed.octave }
      return transposed
    }
    return t
  })

  const newChord = decorPrefix + '[' + newTokens.join('') + ']' + suffix
  return {
    abc: abc.slice(0, startChar) + newChord + abc.slice(endChar),
    newNote,
    newOctave,
  }
}

/**
 * Delete a specific pitch (identified by note letter + octave) from a chord at
 * [startChar, endChar). If the chord collapses to one note, unwraps the brackets.
 * If the element is not a chord, falls through to deleteElementAt.
 */
export function deleteNoteFromChord(
  abc: string,
  startChar: number,
  endChar: number,
  targetNote: string,
  targetOctave: number,
): string {
  const raw = abc.slice(startChar, endChar)
  const bracketIdx = raw.indexOf('[')
  if (bracketIdx === -1) return deleteElementAt(abc, startChar, endChar)

  const decorPrefix = raw.slice(0, bracketIdx)
  const closeIdx = raw.lastIndexOf(']')
  const inside = raw.slice(bracketIdx + 1, closeIdx)
  const suffix = raw.slice(closeIdx + 1)   // any length modifier after ]

  const tokens = parseChordTokens(inside)
  if (tokens.length <= 1) return deleteElementAt(abc, startChar, endChar)

  const targetAbc = pitchToAbcNote(targetNote, targetOctave, null)
  const filtered = tokens.filter(t => {
    const stripped = t.replace(/^[_^=]+/, '')
    return !stripped.startsWith(targetAbc)
  })

  if (filtered.length === tokens.length) return deleteElementAt(abc, startChar, endChar)

  let newToken: string
  if (filtered.length === 0) {
    return deleteElementAt(abc, startChar, endChar)
  } else if (filtered.length === 1) {
    newToken = decorPrefix + filtered[0] + suffix
  } else {
    newToken = decorPrefix + '[' + filtered.join('') + ']' + suffix
  }

  return abc.slice(0, startChar) + newToken + abc.slice(endChar)
}

/**
 * Return all !decoration! prefixes found at the start of the token at
 * [startChar, endChar), as absolute char positions in `abc`.
 */
export function findDecorationsInRange(
  abc: string,
  startChar: number,
  endChar: number,
): Array<{ name: string; start: number; end: number }> {
  const result: Array<{ name: string; start: number; end: number }> = []
  let i = startChar
  while (i < endChar && abc[i] === '!') {
    const close = abc.indexOf('!', i + 1)
    if (close === -1 || close >= endChar) break
    result.push({ name: abc.slice(i + 1, close), start: i, end: close + 1 })
    i = close + 1
  }
  return result
}

/**
 * Remove a single decoration token at [decorationStart, decorationEnd) and
 * clean up any resulting double space.
 */
export function deleteDecoration(
  abc: string,
  decorationStart: number,
  decorationEnd: number,
): string {
  const before = abc.slice(0, decorationStart)
  const after  = abc.slice(decorationEnd)
  // If we leave a double space, compress it
  return (before + after).replace(/  +/g, ' ')
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
// Beaming
// ──────────────────────────────────────────────

/**
 * Return the beam-group duration (in fractional whole notes) for a time signature string.
 * Notes shorter than a quarter in the same beam group are beamed together (no space).
 */
function getBeamGroupDuration(timeSig: string): number {
  if (timeSig === 'C')  return 0.5   // common time = 4/4, beam in half-note groups
  if (timeSig === 'C|') return 0.5   // cut time = 2/2
  const m = timeSig.match(/^(\d+)\/(\d+)$/)
  if (!m) return 0.25
  const num = parseInt(m[1])
  const den = parseInt(m[2])
  // Compound meters (6/8, 9/8, 12/8 …): beam in dotted-quarter groups
  if (num % 3 === 0 && num >= 6) return 3 / den
  // 3/8: entire measure is one beam group (3 eighths = one compound beat)
  if (num === 3 && den === 8) return 3 / 8
  // 4/4 and 2/2: beam across two beats (half-note group)
  if ((num === 4 && den === 4) || (num === 2 && den === 2)) return 0.5
  // All other simple meters: one beat per group
  return 1 / den
}

/**
 * Re-apply correct beaming to every voice in `abc` according to the time signature.
 *
 * In abcjs's parse output, consecutive note tokens have no gap between them:
 * each note's endChar === next note's startChar. The beam-break is encoded as a
 * TRAILING SPACE at position `abc[prev.endChar - 1]` within the previous note's range.
 * Removing that trailing space beams two notes; inserting a space at `prev.endChar`
 * breaks the beam.
 *
 * Rules:
 *  - Notes shorter than a quarter (duration < 0.25 whole notes) AND in the same
 *    beat group → beamed (no trailing space on the preceding note).
 *  - All other adjacent pairs → space between them (beam break).
 *  - Rests (`el.rest` is defined in abcjs) always break a beam.
 *  - If there is a gap between token ranges (decorations, inline fields), leave untouched.
 */
export function autoBeaming(abc: string): string {
  const tunes = abcjs.parseOnly(abc)
  if (!tunes?.[0]) return abc

  const tune = tunes[0] as unknown as {
    lines: Array<{
      staff?: Array<{
        voices?: Array<Array<{
          el_type: string
          duration?: number
          startChar: number
          endChar: number
          rest?: object
        }>>
      }>
    }>
  }

  const timeSig = abc.match(/^M:(.+)$/m)?.[1]?.trim() ?? '4/4'
  const defaultBeamGroupDur = getBeamGroupDuration(timeSig)
  const EPS = 1e-9

  // Whether the beat unit is a quarter note (*/4 meters).
  // In these meters, if any note in the measure is a 16th or shorter,
  // we shrink the beam group to one quarter-note beat (0.25).
  const isQuarterBeatMeter = /\/4$/.test(timeSig) || timeSig === 'C'
  const SIXTEENTH = 0.0625   // 1/16 whole note

  // Each edit is either: remove char at `pos`, or insert ' ' at `pos`
  const edits: Array<{ pos: number; remove: boolean }> = []

  type El = { el_type: string; duration?: number; startChar: number; endChar: number; rest?: object }

  const processMeasure = (notes: El[], cum0: number, beamGroupDur: number) => {
    let cum = cum0
    let prev: { el: El; cumBefore: number } | null = null

    for (const el of notes) {
      const cumBefore = cum
      cum += el.duration ?? 0

      if (el.rest) { prev = null; continue }

      if (prev) {
        if (prev.el.endChar !== el.startChar) { prev = { el, cumBefore }; continue }

        const prevGroup  = Math.floor((prev.cumBefore + EPS) / beamGroupDur)
        const currGroup  = Math.floor((cumBefore        + EPS) / beamGroupDur)
        const prevShort  = (prev.el.duration ?? 0) < 0.25 - EPS
        const currShort  = (el.duration        ?? 0) < 0.25 - EPS
        const shouldBeam = prevGroup === currGroup && prevShort && currShort

        const breakPos = prev.el.endChar - 1
        const hasBreak = breakPos >= prev.el.startChar && abc[breakPos] === ' '

        if (shouldBeam && hasBreak) {
          edits.push({ pos: breakPos, remove: true })
        } else if (!shouldBeam && !hasBreak) {
          edits.push({ pos: prev.el.endChar, remove: false })
        }
      }

      prev = { el, cumBefore }
    }
  }

  const processVoice = (voice: El[]) => {
    // Split into measures so we can inspect each measure's note values
    let measureNotes: El[] = []

    const flushMeasure = () => {
      if (measureNotes.length === 0) return

      // Determine effective beam group for this measure
      let beamGroupDur = defaultBeamGroupDur
      if (isQuarterBeatMeter && defaultBeamGroupDur > 0.25) {
        // If any non-rest note is shorter than an eighth (i.e. 16th or smaller),
        // collapse to one-beat (quarter-note) beam groups
        const hasFast = measureNotes.some(
          el => !el.rest && (el.duration ?? 1) < 0.125 - EPS
        )
        if (hasFast) beamGroupDur = 0.25
      }

      processMeasure(measureNotes, 0, beamGroupDur)
      measureNotes = []
    }

    for (const el of voice) {
      if (el.el_type === 'bar') { flushMeasure(); continue }
      if (el.el_type !== 'note') continue
      measureNotes.push(el)
    }
    flushMeasure()
  }

  for (const line of tune.lines ?? []) {
    for (const staff of line.staff ?? []) {
      for (const voice of staff.voices ?? []) {
        processVoice(voice as El[])
      }
    }
  }

  if (edits.length === 0) return abc

  // Deduplicate by position, apply right-to-left so earlier offsets stay valid
  const unique = [...new Map(edits.map(e => [e.pos, e])).values()]
  unique.sort((a, b) => b.pos - a.pos)

  let result = abc
  for (const edit of unique) {
    if (edit.remove) {
      result = result.slice(0, edit.pos) + result.slice(edit.pos + 1)
    } else {
      result = result.slice(0, edit.pos) + ' ' + result.slice(edit.pos)
    }
  }
  return result
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
