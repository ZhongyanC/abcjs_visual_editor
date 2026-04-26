import { useEditorStore } from '../../store/editorStore'
import { NoteInputToolbar } from './NoteInputToolbar'
import { AccidentalsToolbar } from './AccidentalsToolbar'
import { ArticulationsToolbar } from './ArticulationsToolbar'
import { DynamicsToolbar } from './DynamicsToolbar'
import { OrnamentsToolbar } from './OrnamentsToolbar'
import { LinesToolbar } from './LinesToolbar'
import { MeasuresToolbar } from './MeasuresToolbar'
import { VoicesToolbar } from './VoicesToolbar'
import { EditToolbar } from './EditToolbar'

export function ToolbarArea() {
  const layout = useEditorStore(s => s.layout)
  const te = layout.toolbarsEnabled

  return (
    <div className="bg-toolbar border-b border-gray-700 flex flex-col">
      {/* First row: Edit + NoteInput + Accidentals + Voices */}
      <div className="flex items-center h-9 border-b border-gray-700 overflow-x-auto">
        {te.edit && (
          <>
            <EditToolbar />
            <div className="tb-separator" />
          </>
        )}
        {te.noteInput && (
          <>
            <NoteInputToolbar />
            <div className="tb-separator" />
          </>
        )}
        {te.accidentals && (
          <>
            <AccidentalsToolbar />
            <div className="tb-separator" />
          </>
        )}
        {te.voices && <VoicesToolbar />}
      </div>

      {/* Second row: Articulations + Dynamics + Ornaments + Lines + Measures */}
      <div className="flex items-center h-9 overflow-x-auto">
        {te.articulations && (
          <>
            <ArticulationsToolbar />
            <div className="tb-separator" />
          </>
        )}
        {te.dynamics && (
          <>
            <DynamicsToolbar />
            <div className="tb-separator" />
          </>
        )}
        {te.ornaments && (
          <>
            <OrnamentsToolbar />
            <div className="tb-separator" />
          </>
        )}
        {te.lines && (
          <>
            <LinesToolbar />
            <div className="tb-separator" />
          </>
        )}
        {te.measures && <MeasuresToolbar />}
      </div>
    </div>
  )
}
