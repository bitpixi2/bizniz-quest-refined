import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "@/components/pixel-styles.css"
import { AuthProvider } from "@/lib/auth-context"
import GlobalLoading from "@/components/global-loading"
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Bizniz Quest",
  description: "A cozy business simulator to get things done"
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
        {/* Vercel Analytics */}
        {process.env.NODE_ENV === "production" && (
          <Analytics />
        )}
      </body>
    </html>
  )
}


import './globals.css'