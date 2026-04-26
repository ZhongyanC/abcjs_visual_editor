# abcjs Visual Editor

A visual ABC music notation editor built with React and [abcjs](https://github.com/paulrosen/abcjs).

---

## Features

### Score Editing
- **Visual note input** — enter note-input mode (toolbar or `N` key), hover over the staff to see a live pitch indicator with note name label, then click to place the note at the exact pitch and horizontal position
- **Auto-barlines** — barlines are inserted automatically when a measure reaches its full beat count (based on the time signature). Force-inserting into a full measure is allowed; the measure is split at the correct beat boundary
- **Note deletion** — select a note and press `Del` / `Backspace`
- **Pitch transposition** — drag a note up/down, or use `↑` / `↓` (semitone) and `Alt+↑` / `Alt+↓` (octave)
- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y` (full history stack)
- **Dotted notes** — toggle the dot modifier from the toolbar or press `.`
- **Accidentals** — ♭ ♮ ♯ 𝄫 𝄪 from the Accidentals toolbar
- **Articulations & dynamics** — staccato, accent, tenuto, marcato, fermata; pp p mp mf f ff sfz
- **Ornaments** — trill, mordent, turn, roll
- **Slurs, ties, lines** — slur, crescendo/diminuendo hairpins

### Score Navigation & Layout
- **Multiple voices** — add and manage up to 4 voices; each voice renders on its own staff
- **Resizable panels** — drag the dividers to resize the right panel and the ABC text editor pane
- **Toggleable panels** — show/hide the right panel and the raw ABC text editor from the View menu
- **Playback** — ▶ ⏸ ⏹ transport controls with tempo slider; plays back the score via the Web Audio API through abcjs's built-in synthesizer

### Tune Metadata
- Editable **Info panel** (right sidebar): Title, Composer, Key, Time signature, Default length, Tempo, Rhythm/Style
- Changes update the ABC header in real time

### Import / Export
- **Open ABC** — load any `.abc` or `.txt` file from disk
- **Save ABC** — download the current score as `tune.abc`
- **MIDI export** — export from the Playback bar

### Dialogs
- **New Tune** — wizard to set key, meter, tempo, title
- **Transpose** — semitone or key-based transposition

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Toggle note-input mode |
| `A` – `G` | Insert pitch (in note-input mode) |
| `Z` | Insert rest |
| `R` | Toggle rest mode |
| `.` | Toggle dotted |
| `1` – `7` | Duration: whole → 64th |
| `↑` / `↓` | Transpose selected note ±semitone |
| `Alt+↑` / `Alt+↓` | Transpose ±octave |
| `Del` / `Backspace` | Delete selected note |
| `←` / `→` | Move cursor to prev/next element |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Space` | Play / Pause |
| `Esc` | Exit note-input mode |
| `Ctrl+S` | Save ABC file |

---

## Tech Stack

| Layer | Library |
|-------|---------|
| Bundler | Vite 8 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v3 |
| State | Zustand v5 (with `persist` middleware) |
| Notation | abcjs 6.6.x (local source, `file:./abcjs`) |
| Audio | abcjs synth → Web Audio API |

---

## Project Structure

```
src/
├── store/
│   └── editorStore.ts          # Zustand store — single source of truth
├── hooks/
│   ├── useAbcRenderer.ts       # Reactive renderAbc wrapper
│   ├── usePlayback.ts          # abcjs synth integration
│   └── useKeyboardShortcuts.ts # Global hotkeys
├── utils/
│   ├── abcStringOps.ts         # insertNoteAt, deleteElementAt, autoBarlines, …
│   ├── staffMapper.ts          # SVG coord ↔ pitch mapping (getBBox + STEP)
│   ├── noteFormat.ts           # Duration → ABC length string
│   ├── keyUtils.ts             # Key signature helpers
│   └── abcTemplate.ts          # New-tune skeleton generator
├── components/
│   ├── layout/                 # EditorLayout, LayoutContext, ResizablePanel
│   ├── score/                  # ScoreDisplay, ScoreOverlay (click-to-place)
│   ├── toolbars/               # NoteInput, Accidentals, Articulations, …
│   ├── panels/                 # TuneInfoPanel, PropertiesPanel, VoicePanel
│   ├── playback/               # PlaybackBar
│   ├── abc-editor/             # ABCTextEditor (raw text pane)
│   └── dialogs/                # NewTuneDialog, TransposeDialog
└── types/
    ├── editor.ts               # InputMode, Duration, LayoutConfig, …
    └── abc.ts                  # StaffGeometry, PositionedElement, …
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & run

```bash
git clone https://github.com/ZhongyanC/abcjs_visual_editor.git
cd abcjs_visual_editor
npm install
npm run dev
```

The editor opens at **http://localhost:5173**.

### Build for production

```bash
npm run build
npm run preview
```

---

## How Click-to-Place Notes Works

1. Press `N` to enter note-input mode — the cursor becomes a crosshair.
2. Select a duration from the toolbar (or press `1`–`7`).
3. Hover over the staff: a blue snap line, ghost note-head, and pitch label (`G4`, `C5`, …) follow the cursor, snapping to the nearest diatonic position.
4. Click to place the note. The editor reads the staff's exact SVG bounding box (`.abcjs-staff` element) to derive the reference Y for middle C, then uses the abcjs spacing constant (`STEP = 3.875` SVG units/step) for sub-pixel pitch accuracy.
5. After insertion, `autoBarlines` runs: if the current measure is now full according to the time signature, a `|` barline is automatically appended.

---

## ABC Notation

The editor uses [ABC Notation Standard 2.1](https://abcnotation.com/wiki/abc:standard:v2.1). The raw ABC text is always visible in the collapsible text pane at the bottom and can be edited directly — the score updates in real time.

---

## License

MIT
