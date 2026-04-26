import { useRef, useState } from 'react'
import type { TuneObject } from 'abcjs'
import { useEditorStore } from '../../store/editorStore'
import { useLayout } from './LayoutContext'
import { ResizeHandle } from './ResizablePanel'
import { ToolbarArea } from '../toolbars/ToolbarArea'
import { ScoreDisplay } from '../score/ScoreDisplay'
import type { ScoreDisplayHandle } from '../score/ScoreDisplay'
import { ABCTextEditor } from '../abc-editor/ABCTextEditor'
import { PlaybackBar } from '../playback/PlaybackBar'
import { TuneInfoPanel } from '../panels/TuneInfoPanel'
import { PropertiesPanel } from '../panels/PropertiesPanel'
import { VoicePanel } from '../panels/VoicePanel'
import { NewTuneDialog } from '../dialogs/NewTuneDialog'
import { TransposeDialog } from '../dialogs/TransposeDialog'

export function EditorLayout() {
  const { layout, updateLayout } = useLayout()
  const inputMode = useEditorStore(s => s.inputMode)
  const setAbcNotation = useEditorStore(s => s.setAbcNotation)
  const abcNotation = useEditorStore(s => s.abcNotation)

  const scoreDisplayRef = useRef<ScoreDisplayHandle>(null)
  const textEditorFocused = useRef(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showTransposeDialog, setShowTransposeDialog] = useState(false)
  const [activeRightTab, setActiveRightTab] = useState<'info' | 'props' | 'voices'>('info')

  const getTune = (): TuneObject | null => scoreDisplayRef.current?.getTune() ?? null

  return (
    <div className="flex flex-col h-full select-none">
      {/* ── Menu bar ── */}
      <div className="flex items-center bg-toolbar text-white text-xs border-b border-gray-700">
        <MenuButton label="File" items={[
          { label: 'New Tune', onClick: () => setShowNewDialog(true) },
          { label: 'Open ABC...', onClick: () => openFile(setAbcNotation) },
          { label: 'Save ABC', onClick: () => downloadAbc(abcNotation) },
        ]} />
        <MenuButton label="Edit" items={[
          { label: 'Undo', onClick: () => useEditorStore.getState().undo() },
          { label: 'Redo', onClick: () => useEditorStore.getState().redo() },
        ]} />
        <MenuButton label="View" items={[
          {
            label: layout.showRightPanel ? 'Hide Right Panel' : 'Show Right Panel',
            onClick: () => updateLayout({ showRightPanel: !layout.showRightPanel }),
          },
          {
            label: layout.showABCEditor ? 'Hide ABC Editor' : 'Show ABC Editor',
            onClick: () => updateLayout({ showABCEditor: !layout.showABCEditor }),
          },
        ]} />
        <MenuButton label="Tools" items={[
          { label: 'Transpose...', onClick: () => setShowTransposeDialog(true) },
        ]} />
      </div>

      {/* ── Toolbars ── */}
      <ToolbarArea />

      {/* ── Main work area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: score + ABC editor */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div
            className={`flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-4 ${inputMode === 'note-input' ? 'cursor-crosshair' : ''}`}
          >
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded p-4 min-h-64">
              <ScoreDisplay ref={scoreDisplayRef} />
            </div>
          </div>

          {layout.showABCEditor && (
            <>
              <ResizeHandle
                direction="vertical"
                onResize={delta => updateLayout({ abcEditorHeight: Math.max(80, layout.abcEditorHeight - delta) })}
              />
              <ABCTextEditor onFocusChange={f => { textEditorFocused.current = f }} />
            </>
          )}
        </div>

        {/* Right panel */}
        {layout.showRightPanel && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={delta => updateLayout({ rightPanelWidth: Math.max(160, layout.rightPanelWidth - delta) })}
            />
            <div
              className="flex flex-col border-l border-panel-border bg-panel overflow-hidden"
              style={{ width: layout.rightPanelWidth }}
            >
              <div className="flex border-b border-panel-border text-xs">
                {(['info', 'props', 'voices'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`flex-1 py-1.5 ${activeRightTab === tab ? 'bg-white font-medium text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setActiveRightTab(tab)}
                  >
                    {tab === 'info' ? 'Info' : tab === 'props' ? 'Props' : 'Voices'}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeRightTab === 'info' && <TuneInfoPanel />}
                {activeRightTab === 'props' && <PropertiesPanel />}
                {activeRightTab === 'voices' && <VoicePanel />}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Playback bar ── */}
      <PlaybackBar getTune={getTune} />

      {/* ── Dialogs ── */}
      {showNewDialog && <NewTuneDialog onClose={() => setShowNewDialog(false)} />}
      {showTransposeDialog && <TransposeDialog onClose={() => setShowTransposeDialog(false)} />}
    </div>
  )
}

// ── Helpers ──

interface MenuItem { label: string; onClick: () => void }

function MenuButton({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="px-3 py-1.5 hover:bg-toolbar-hover text-white text-xs"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        {label}
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 shadow-lg rounded min-w-36 py-1">
          {items.map(item => (
            <button
              key={item.label}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => { item.onClick(); setOpen(false) }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function openFile(setAbcNotation: (abc: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.abc,.txt'
  input.onchange = e => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      if (text) setAbcNotation(text)
    }
    reader.readAsText(file)
  }
  input.click()
}

function downloadAbc(abcNotation: string) {
  const blob = new Blob([abcNotation], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tune.abc'
  a.click()
  URL.revokeObjectURL(url)
}
