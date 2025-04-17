"use client";
import { useEffect, useRef, useState } from "react"

export default function LoginVoiceAfterMusic() {
  const [played, setPlayed] = useState(false)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const voiceRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const originalMusicVolume = useRef<number>(0.25)

  useEffect(() => {
    const music = document.getElementById("background-music-audio") as HTMLAudioElement | null
    if (!music) return
    musicRef.current = music
    originalMusicVolume.current = music.volume

    const playVoice = () => {
      if (voiceRef.current && musicRef.current) {
        // Lower music volume
        musicRef.current.volume = 0.08
        voiceRef.current.volume = 0.69
        voiceRef.current.play()
      }
    }

    // Restore music volume after voice ends
    const restoreMusic = () => {
      if (musicRef.current) {
        musicRef.current.volume = originalMusicVolume.current
      }
    }

    // If already playing, start timer immediately
    if (!played && !music.paused) {
      timerRef.current = setTimeout(playVoice, 9000)
      setPlayed(true)
    }

    // Otherwise, listen for play
    const onPlay = () => {
      if (!played) {
        timerRef.current = setTimeout(playVoice, 9000)
        setPlayed(true)
      }
    }
    music.addEventListener("play", onPlay)
    // Listen for voice end
    voiceRef.current?.addEventListener("ended", restoreMusic)

    return () => {
      music.removeEventListener("play", onPlay)
      voiceRef.current?.removeEventListener("ended", restoreMusic)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [played])

  return (
    <audio ref={voiceRef} src="/sounds/login_voice.mp3" preload="auto" />
  )
}
