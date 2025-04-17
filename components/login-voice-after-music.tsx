import { useEffect, useRef, useState } from "react"

export default function LoginVoiceAfterMusic() {
  const [played, setPlayed] = useState(false)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const voiceRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Listen for music start
  useEffect(() => {
    const music = document.getElementById("background-music-audio") as HTMLAudioElement | null
    if (!music) return
    musicRef.current = music
    // If already playing, start timer immediately
    if (!played && !music.paused) {
      timerRef.current = setTimeout(() => {
        if (voiceRef.current) {
          voiceRef.current.volume = 0.69
          voiceRef.current.play()
        }
      }, 9000)
      setPlayed(true)
    }
    // Otherwise, listen for play
    const onPlay = () => {
      if (!played) {
        timerRef.current = setTimeout(() => {
          if (voiceRef.current) {
            voiceRef.current.volume = 0.69
            voiceRef.current.play()
          }
        }, 9000)
        setPlayed(true)
      }
    }
    music.addEventListener("play", onPlay)
    return () => {
      music.removeEventListener("play", onPlay)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [played])

  return (
    <audio ref={voiceRef} src="/sounds/login_voice.mp3" preload="auto" />
  )
}
