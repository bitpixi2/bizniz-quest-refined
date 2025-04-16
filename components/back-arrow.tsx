import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface BackArrowProps {
  href: string
}

export default function BackArrow({ href }: BackArrowProps) {
  return (
    <Link href={href}>
      <div className="w-12 h-12 bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders flex items-center justify-center cursor-pointer transition-colors">
        <ArrowLeft className="h-6 w-6" />
      </div>
    </Link>
  )
}
