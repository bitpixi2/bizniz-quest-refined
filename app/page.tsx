import Link from "next/link"
import CalendarSystem from "@/components/calendar-system"
import { Button } from "@/components/ui/button"
import ProtectedRoute from "@/components/auth/protected-route"
import UserProfile from "@/components/user-profile"

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-pixel text-center mb-2 text-[#6b5839] pixel-text">Bizniz Quest</h1>
            <a
              href="https://x.com/bitpixi"
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-sm attribution-text hover:underline"
            >
              BY BITPIXI
            </a>
          </div>

          <div className="mb-6">
            <UserProfile />
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <Link href="/character">
              <Button className="bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders">
                Character
              </Button>
            </Link>

            <Link href="/screenspy">
              <Button className="bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders">
                Screenspy
              </Button>
            </Link>
          </div>

          <CalendarSystem />
        </div>
      </main>
    </ProtectedRoute>
  )
}
