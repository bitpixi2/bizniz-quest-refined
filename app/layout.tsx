import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "@/components/pixel-styles.css"
import { AuthProvider } from "@/lib/auth-context"
import GlobalLoading from "@/components/global-loading"

export const metadata: Metadata = {
  title: "Bizniz Quest",
  description: "A cozy business simulation game",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
  body {
    background-color: #5a4a38; /* Brown fallback color */
    background-image: url('/images/browntiles.png');
    background-repeat: repeat;
    background-attachment: fixed;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
  
  /* Ensure the background isn't covered by other elements */
  #__next, main {
    background-color: transparent;
  }
`}</style>
      </head>
      <body>
        <AuthProvider>
          <GlobalLoading />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}


import './globals.css'