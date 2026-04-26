import { useRef, useCallback } from 'react'

interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
}

export function ResizeHandle({ direction, onResize }: ResizablePanelProps) {
  const dragging = useRef(false)
  const startPos = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
    e.preventDefault()

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const pos = direction === 'horizontal' ? ev.clientX : ev.clientY
      const delta = pos - startPos.current
      startPos.current = pos
      onResize(delta)
    }
    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [direction, onResize])

  return (
    <div
      onMouseDown={onMouseDown}
      className={`${direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} bg-panel-border hover:bg-blue-400 transition-colors flex-shrink-0`}
      style={{ minWidth: direction === 'horizontal' ? 4 : undefined, minHeight: direction === 'vertical' ? 4 : undefined }}
    />
  )
}
