import { useRef, useCallback, useEffect } from 'react'
import * as abcjs from 'abcjs'
import type { TuneObject } from 'abcjs'
import { useEditorStore } from '../store/editorStore'

export function usePlayback() {
  const synthRef = useRef<InstanceType<typeof abcjs.synth.CreateSynth> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const isPlaying = useEditorStore(s => s.isPlaying)
  const isPaused = useEditorStore(s => s.isPaused)
  const tempo = useEditorStore(s => s.tempo)
  const setIsPlaying = useEditorStore(s => s.setIsPlaying)
  const setIsPaused = useEditorStore(s => s.setIsPaused)

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
      abcjs.synth.registerAudioContext(audioCtxRef.current)
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const play = useCallback(async (tune: TuneObject) => {
    try {
      const ctx = initAudioContext()

      if (synthRef.current) {
        synthRef.current.stop()
      }

      const synth = new abcjs.synth.CreateSynth()
      synthRef.current = synth

      await synth.init({
        audioContext: ctx,
        visualObj: tune,
        options: {
          ...(tempo ? { qpm: tempo } : {}),
        },
      })

      await synth.prime()
      synth.start()
      setIsPlaying(true)
      setIsPaused(false)
    } catch (err) {
      console.error('Playback error:', err)
      setIsPlaying(false)
    }
  }, [tempo, initAudioContext, setIsPlaying, setIsPaused])

  const pause = useCallback(() => {
    if (synthRef.current) {
      if (isPaused) {
        (synthRef.current as unknown as { resume?: () => void }).resume?.()
        setIsPaused(false)
      } else {
        (synthRef.current as unknown as { pause?: () => void }).pause?.()
        setIsPaused(true)
      }
    }
  }, [isPaused, setIsPaused])

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.stop()
      synthRef.current = null
    }
    setIsPlaying(false)
    setIsPaused(false)
  }, [setIsPlaying, setIsPaused])

  const getMidiFile = useCallback((abc: string) => {
    return abcjs.synth.getMidiFile(abc, { midiOutputType: 'encoded' })
  }, [])

  useEffect(() => {
    return () => {
      synthRef.current?.stop()
    }
  }, [])

  return { play, pause, stop, isPlaying, isPaused, getMidiFile }
}
