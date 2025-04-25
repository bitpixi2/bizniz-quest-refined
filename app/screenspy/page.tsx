import BackArrow from "@/components/back-arrow"
import ProtectedRoute from "@/components/auth/protected-route"
import ScreenspySystem from "@/components/screenspy-system"
import BackgroundMusic from "@/components/background-music"

export default function ScreenspyPage() {
  return (
    <ProtectedRoute>
      <BackgroundMusic src="/sounds/doing_music.mp3" volume={0.3} />
      <main className="min-h-screen p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <BackArrow href="/" />
            <h1 className="text-4xl font-pixel text-center text-[#6b5839] pixel-text">Screenspy</h1>
            <div className="w-[70px]"></div> {/* Spacer for alignment */}
          </div>
          <ScreenspySystem />
        </div>
      </main>
    </ProtectedRoute>
  )
}
