import SignupForm from "@/components/auth/signup-form"
import FloatingItems from "@/components/floating-items"
import BackgroundMusic from "@/components/background-music"
import { Suspense } from "react"

// Simple loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-xl font-pixel text-[#ffe9b3] pixel-text">Loading...</h2>
    </div>
  </div>
)

export default function SignupPage() {
  return (
    <main className="min-h-screen p-6 md:p-8 flex items-center justify-center relative">
      <FloatingItems />
      <BackgroundMusic />
      <div className="w-full max-w-md z-10">
        <h1 className="text-4xl font-pixel text-center mb-8 text-[#d75e38] pixel-text">Bizniz Quest</h1>
        <Suspense fallback={<Loading />}>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  )
}
