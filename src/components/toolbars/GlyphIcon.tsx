import { ABC_GLYPHS, type GlyphName } from '../../utils/abcGlyphs'
import type { Duration } from '../../types/editor'

// Stem geometry in glyph coordinate units
const STEM_X = 9.84   // x position of stem (right edge of quarter notehead)
const STEM_H = 14     // stem height — compact for toolbar icon
const STEM_W = 0.9

// Per-duration note icon configs.
// ViewBox keeps the notehead large and shows enough stem/flag for recognition.
// y: -16 to +5 (height=21) for stem notes keeps notehead ~7px at size=16.
const NOTE_CONFIGS: Record<Duration, {
  head: GlyphName | null
  flag: GlyphName | null
  stem: boolean
  vbox: [number, number, number, number]  // [minX, minY, width, height]
}> = {
  whole:           { head: 'noteheads.whole',   flag: null,           stem: false, vbox: [-2, -5, 18, 10] },
  half:            { head: 'noteheads.half',    flag: null,           stem: true,  vbox: [-2, -16, 14, 21] },
  quarter:         { head: 'noteheads.quarter', flag: null,           stem: true,  vbox: [-2, -16, 14, 21] },
  eighth:          { head: 'noteheads.quarter', flag: 'flags.u8th',   stem: true,  vbox: [-2, -16, 18, 21] },
  sixteenth:       { head: 'noteheads.quarter', flag: 'flags.u16th',  stem: true,  vbox: [-2, -16, 18, 21] },
  'thirty-second': { head: 'noteheads.quarter', flag: 'flags.u32nd',  stem: true,  vbox: [-2, -16, 18, 21] },
  'sixty-fourth':  { head: 'noteheads.quarter', flag: 'flags.u64th',  stem: true,  vbox: [-2, -16, 18, 21] },
}

const REST_GLYPH: Record<Duration, GlyphName> = {
  whole:           'rests.whole',
  half:            'rests.half',
  quarter:         'rests.quarter',
  eighth:          'rests.8th',
  sixteenth:       'rests.16th',
  'thirty-second': 'rests.32nd',
  'sixty-fourth':  'rests.64th',
}

const REST_VBOX: Record<Duration, [number, number, number, number]> = {
  whole:           [-1, -1, 13, 5],
  half:            [-1, -7, 13, 5],
  quarter:         [-1, -13, 10, 16],
  eighth:          [-1, -7, 9, 10],
  sixteenth:       [-1, -7, 12, 16],
  'thirty-second': [-1, -15, 13, 22],
  'sixty-fourth':  [-1, -15, 15, 26],
}

// ViewBox for single-glyph icons (accidentals, articulations, ornaments)
const GLYPH_VBOX: Partial<Record<GlyphName, [number, number, number, number]>> = {
  'accidentals.sharp':    [-1, -12, 10, 15],
  'accidentals.flat':     [-1, -15, 8,  17],
  'accidentals.nat':      [-1, -12, 8,  14],
  'accidentals.dblflat':  [-1, -15, 15, 17],
  'accidentals.dblsharp': [-1,  -5, 9,   9],
  'scripts.ufermata':     [-1, -10, 17, 12],
  'scripts.dfermata':     [-1,  -2, 17, 12],
  'scripts.staccato':     [-2,  -3,  6,  6],
  'scripts.tenuto':       [-1,  -2, 11,  4],
  'scripts.umarcato':     [-1,  -9,  9, 11],
  'scripts.sforzato':     [-1,  -5,  9, 10],
  'scripts.trill':        [-1,  -9, 15, 11],
  'scripts.prall':        [-1,  -9, 13, 11],
  'scripts.mordent':      [-1,  -9, 13, 11],
  'scripts.roll':         [-1,  -7, 12, 10],
  'scripts.upbow':        [-1, -11, 13, 14],
  'scripts.downbow':      [-1,  -9, 13, 12],
  'scripts.arpeggio':     [-1, -13,  7, 16],
  'scripts.comma':        [-1,  -6,  5,  7],
  'dots.dot':             [-1,  -2,  5,  5],
}

interface NoteIconProps {
  duration: Duration
  size?: number
  color?: string
}

export function NoteIcon({ duration, size = 16, color = 'currentColor' }: NoteIconProps) {
  const cfg = NOTE_CONFIGS[duration]
  if (!cfg || !cfg.head) return null
  const headData = ABC_GLYPHS[cfg.head]
  const [vx, vy, vw, vh] = cfg.vbox
  const sz = size || 16
  const w = sz * (vw / vh)
  const h = sz

  return (
    <svg width={w} height={h} viewBox={`${vx} ${vy} ${vw} ${vh}`} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d={headData.d} />
      {cfg.stem && (
        <rect x={STEM_X} y={-STEM_H} width={STEM_W} height={STEM_H} />
      )}
      {cfg.flag && ABC_GLYPHS[cfg.flag] && (
        <g transform={`translate(${STEM_X},${-STEM_H})`}>
          <path d={ABC_GLYPHS[cfg.flag].d} />
        </g>
      )}
    </svg>
  )
}

interface RestIconProps {
  duration: Duration
  size?: number
  color?: string
}

export function RestIcon({ duration, size = 16, color = 'currentColor' }: RestIconProps) {
  const glyphName = REST_GLYPH[duration]
  const data = ABC_GLYPHS[glyphName]
  const [vx, vy, vw, vh] = REST_VBOX[duration]
  const sz = size || 16
  const w = sz * (vw / vh)
  const h = sz

  return (
    <svg width={w} height={h} viewBox={`${vx} ${vy} ${vw} ${vh}`} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d={data.d} />
    </svg>
  )
}

interface GlyphIconProps {
  glyph: GlyphName
  size?: number
  color?: string
}

export function GlyphIcon({ glyph, size = 16, color = 'currentColor' }: GlyphIconProps) {
  const data = ABC_GLYPHS[glyph]
  if (!data) return null
  const vbox = GLYPH_VBOX[glyph]
  if (!vbox) return null
  const [vx, vy, vw, vh] = vbox
  const sz = size || 16
  const w = sz * (vw / vh)
  const h = sz

  return (
    <svg width={w} height={h} viewBox={`${vx} ${vy} ${vw} ${vh}`} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d={data.d} />
    </svg>
  )
}
