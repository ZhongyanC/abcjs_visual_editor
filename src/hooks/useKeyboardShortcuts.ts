import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { Duration } from '../types/editor'
import { insertNoteAt, deleteElementAt, transposeNoteAt, autoBarlines } from '../utils/abcStringOps'

const DURATION_KEYS: Record<string, Duration> = {
  '1': 'whole',
  '2': 'half',
  '3': 'quarter',
  '4': 'eighth',
  '5': 'sixteenth',
  '6': 'thirty-second',
  '7': 'sixty-fourth',
}

const NOTE_KEYS = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g'])

export function useKeyboardShortcuts(
  _getTune: () => unknown,
  isTextEditorFocused: () => boolean
) {
  const guessOctave = useCallback((noteLetter: string): number => {
    const defaults: Record<string, number> = {
      c: 5, d: 5, e: 5, f: 5, g: 4, a: 4, b: 4,
    }
    return defaults[noteLetter.toLowerCase()] ?? 4
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    if (isTextEditorFocused()) return

    const {
      inputMode, inputDuration, inputDot, inputRest,
      abcNotation, cursorChar, selectedElement,
      undo, redo, canUndo, canRedo,
      setAbcNotation, setInputMode, setInputDuration,
      setInputDot, setInputRest,
    } = useEditorStore.getState()

    // Global shortcuts
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key === 'z') { e.preventDefault(); if (canUndo()) undo(); return }
      if (e.key === 'y') { e.preventDefault(); if (canRedo()) redo(); return }
      if (e.key === 's') { e.preventDefault(); return }
    }

    if (e.key === 'Escape') {
      setInputMode('select')
      return
    }

    if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) {
      setInputMode(inputMode === 'note-input' ? 'select' : 'note-input')
      e.preventDefault()
      return
    }

    if (DURATION_KEYS[e.key] && !e.ctrlKey && !e.metaKey) {
      setInputDuration(DURATION_KEYS[e.key])
      e.preventDefault()
      return
    }

    if (e.key === '.' && !e.ctrlKey) {
      setInputDot(!inputDot)
      e.preventDefault()
      return
    }

    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey) {
      setInputRest(!inputRest)
      e.preventDefault()
      return
    }

    if (e.key === 'ArrowUp' && e.altKey) {
      if (selectedElement && selectedElement.startChar >= 0) {
        setAbcNotation(transposeNoteAt(abcNotation, selectedElement.startChar, selectedElement.endChar, -7))
        e.preventDefault()
      }
      return
    }
    if (e.key === 'ArrowDown' && e.altKey) {
      if (selectedElement && selectedElement.startChar >= 0) {
        setAbcNotation(transposeNoteAt(abcNotation, selectedElement.startChar, selectedElement.endChar, 7))
        e.preventDefault()
      }
      return
    }
    if (e.key === 'ArrowUp') {
      if (selectedElement && selectedElement.startChar >= 0) {
        setAbcNotation(transposeNoteAt(abcNotation, selectedElement.startChar, selectedElement.endChar, -1))
        e.preventDefault()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      if (selectedElement && selectedElement.startChar >= 0) {
        setAbcNotation(transposeNoteAt(abcNotation, selectedElement.startChar, selectedElement.endChar, 1))
        e.preventDefault()
      }
      return
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey) {
      if (selectedElement && selectedElement.startChar >= 0) {
        setAbcNotation(deleteElementAt(abcNotation, selectedElement.startChar, selectedElement.endChar))
        e.preventDefault()
      }
      return
    }

    // Note pitch input
    if (inputMode === 'note-input' && NOTE_KEYS.has(e.key.toLowerCase())) {
      e.preventDefault()
      const note = e.key.toUpperCase()
      const octave = guessOctave(e.key)
      const insertPos = cursorChar >= 0 ? cursorChar : abcNotation.length
      setAbcNotation(autoBarlines(insertNoteAt(abcNotation, insertPos, note, octave, inputDuration, inputDot, null, inputRest)))
      return
    }

    // Rest input
    if (inputMode === 'note-input' && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      const insertPos = cursorChar >= 0 ? cursorChar : abcNotation.length
      setAbcNotation(autoBarlines(insertNoteAt(abcNotation, insertPos, 'C', 4, inputDuration, inputDot, null, true)))
      return
    }
  }, [guessOctave, isTextEditorFocused])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
