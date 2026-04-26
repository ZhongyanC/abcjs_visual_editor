import type { TuneMetadata, VoiceConfig } from '../types/editor'

export function generateNewTune(
  meta: Partial<TuneMetadata> & { voices?: VoiceConfig[] }
): string {
  const refNumber = meta.refNumber ?? '1'
  const title = meta.title ?? 'New Tune'
  const composer = meta.composer ?? ''
  const meter = meta.timeSignature ?? '4/4'
  const noteLen = meta.defaultNoteLength ?? '1/8'
  const tempo = meta.tempo ?? '1/4=120'
  const key = meta.key ?? 'C'
  const voices = meta.voices ?? [{ id: 1, name: 'Voice 1', clef: 'treble', stem: 'auto' }]

  const lines: string[] = [
    `X:${refNumber}`,
    `T:${title}`,
  ]
  if (composer) lines.push(`C:${composer}`)
  lines.push(`M:${meter}`)
  lines.push(`L:${noteLen}`)
  lines.push(`Q:${tempo}`)

  if (voices.length > 1) {
    voices.forEach(v => {
      lines.push(`V:${v.id} clef=${v.clef} name="${v.name}"${v.stem && v.stem !== 'auto' ? ` stem=${v.stem}` : ''}`)
    })
  }

  lines.push(`K:${key}`)

  if (voices.length > 1) {
    voices.forEach(v => {
      lines.push(`[V:${v.id}] z4 |`)
    })
  } else {
    lines.push('z4 |')
  }

  return lines.join('\n') + '\n'
}

export function addMeasure(abc: string): string {
  // Find end of last music line (before last newline) and append a measure
  const trimmed = abc.trimEnd()
  const lastLine = trimmed.split('\n').pop() ?? ''

  // If last line ends with '|', add another measure of rests
  if (lastLine.includes('|')) {
    return trimmed + ' z4 |\n'
  }
  return trimmed + ' | z4 |\n'
}
