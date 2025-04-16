import ArchiveSystem from "@/components/archive-system"
import BackArrow from "@/components/back-arrow"
import ProtectedRoute from "@/components/auth/protected-route"

export default function ArchivePage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <BackArrow href="/" />
            <h1 className="text-4xl font-pixel text-center text-[#6b5839] pixel-text">Archive</h1>
            <div className="w-[70px]"></div> {/* Spacer for alignment */}
          </div>
          <ArchiveSystem />
        </div>
      </main>
    </ProtectedRoute>
  )
}
