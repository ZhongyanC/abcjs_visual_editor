export type InputMode = 'select' | 'note-input'

export type Duration =
  | 'sixty-fourth'
  | 'thirty-second'
  | 'sixteenth'
  | 'eighth'
  | 'quarter'
  | 'half'
  | 'whole'

export type Accidental = 'flat' | 'natural' | 'sharp' | 'double-flat' | 'double-sharp'

export interface SelectedElement {
  startChar: number
  endChar: number
  type: string
  el_type?: string
  pitches?: Array<{ pitch: number }>
  midiPitches?: Array<{ pitch: number; duration: number; volume: number; instrument: number; start: number; gap: number }>
  // Set when a specific note inside a chord was clicked
  chordNote?: { note: string; octave: number }
  // Set when a decoration symbol (!tenuto! etc.) was clicked
  isDecoration?: boolean
  decorationName?: string
  decorationStart?: number  // char offset of '!' open in abcNotation
  decorationEnd?: number    // char offset after '!' close in abcNotation
}

export interface TuneMetadata {
  refNumber: string
  title: string
  composer: string
  timeSignature: string
  defaultNoteLength: string
  tempo: string
  key: string
  rhythm: string
}

export interface VoiceConfig {
  id: number
  name: string
  clef: 'treble' | 'bass' | 'alto' | 'tenor' | 'treble+8' | 'bass+8'
  stem?: 'up' | 'down' | 'auto'
}

export interface LayoutConfig {
  showLeftPanel: boolean
  showRightPanel: boolean
  showABCEditor: boolean
  abcEditorHeight: number
  rightPanelWidth: number
  leftPanelWidth: number
  toolbarIconSize: number
  toolbarsEnabled: {
    noteInput: boolean
    accidentals: boolean
    articulations: boolean
    dynamics: boolean
    ornaments: boolean
    lines: boolean
    measures: boolean
    voices: boolean
    edit: boolean
  }
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  showLeftPanel: false,
  showRightPanel: true,
  showABCEditor: true,
  abcEditorHeight: 150,
  rightPanelWidth: 220,
  leftPanelWidth: 180,
  toolbarIconSize: 16,
  toolbarsEnabled: {
    noteInput: true,
    accidentals: true,
    articulations: true,
    dynamics: true,
    ornaments: true,
    lines: true,
    measures: true,
    voices: true,
    edit: true,
  },
}
