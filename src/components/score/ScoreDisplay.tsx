import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import type { TuneObject } from 'abcjs'
import { useAbcRenderer } from '../../hooks/useAbcRenderer'
import { useEditorStore } from '../../store/editorStore'
import { ScoreOverlay } from './ScoreOverlay'
import type { PositionedElement, StaffGeometry } from '../../types/abc'
import { extractStaffGeometryFromSVG, extractStaffGeometryFromTune } from '../../utils/staffMapper'

export interface ScoreDisplayHandle {
  getTune: () => TuneObject | null
}

interface ScoreDisplayProps {
  onTuneReady?: (tune: TuneObject, positions: PositionedElement[], staves: StaffGeometry[]) => void
}

// Stored as state so ScoreOverlay always re-renders with a live SVG reference.
interface OverlayData {
  svgEl: SVGSVGElement
  staves: StaffGeometry[]
  positions: PositionedElement[]
}

export const ScoreDisplay = forwardRef<ScoreDisplayHandle, ScoreDisplayProps>(
  function ScoreDisplay({ onTuneReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [overlay, setOverlay] = useState<OverlayData | null>(null)

    const inputMode = useEditorStore(s => s.inputMode)

    const { getTune } = useAbcRenderer(containerRef, {
      onTuneReady: (tune, positions) => {
        // abcjs has just finished writing a fresh SVG into containerRef.
        // Query it now so we always hold a live DOM reference.
        const svg = containerRef.current?.querySelector('svg') as SVGSVGElement | null
        if (!svg) return

        const staves = extractStaffGeometryFromSVG(svg, tune)
        const finalStaves = staves.length > 0 ? staves : extractStaffGeometryFromTune(tune)

        // Updating state triggers a React re-render, propagating the fresh
        // svgEl / staves / positions down to ScoreOverlay.
        setOverlay({ svgEl: svg, staves: finalStaves, positions })
        onTuneReady?.(tune, positions, finalStaves)
      },
    })

    useImperativeHandle(ref, () => ({ getTune }), [getTune])

    return (
      <div className="relative w-full">
        <div
          ref={containerRef}
          className="score-container w-full"
          style={{ minHeight: 200 }}
        />

        {inputMode === 'note-input' && overlay && (
          <ScoreOverlay
            svgEl={overlay.svgEl}
            positions={overlay.positions}
            staves={overlay.staves}
          />
        )}
      </div>
    )
  }
)
