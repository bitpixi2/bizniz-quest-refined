"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SetupSampleDataPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setupSampleData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/setup-sample-data")
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        setError(data.error || "Failed to set up sample data")
      }
    } catch (err) {
      console.error("Error setting up sample data:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-[#5a4a38]">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
          <CardHeader>
            <CardTitle className="text-2xl font-pixel text-[#6b5839] pixel-text">Setup Database</CardTitle>
            <CardDescription className="font-pixel text-sm text-[#6b5839]">
              Initialize your database with the required tables and schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-[#f0e6d2] p-4 rounded-lg border-2 border-[#6b5839] pixel-borders">
                <h3 className="font-pixel text-sm text-[#6b5839] mb-2">What This Will Do</h3>
                <ul className="space-y-2">
                  <li className="font-pixel text-xs text-[#6b5839]">✓ Create necessary database tables</li>
                  <li className="font-pixel text-xs text-[#6b5839]">✓ Set up task sharing functionality</li>
                  <li className="font-pixel text-xs text-[#6b5839]">✓ Initialize game data structure</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg font-pixel text-xs">
                  {error}
                </div>
              )}

              {results && (
                <div className="bg-[#f0e6d2] p-4 rounded-lg border-2 border-[#6b5839] pixel-borders max-h-60 overflow-y-auto">
                  <h3 className="font-pixel text-sm text-[#6b5839] mb-2">Results</h3>
                  <ul className="space-y-2">
                    {results.map((result, index) => (
                      <li key={index} className="font-pixel text-xs text-[#6b5839] flex items-start gap-2">
                        {result.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span>
                          {result.operation}: {result.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={setupSampleData}
              disabled={isLoading}
              className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up...
                </>
              ) : (
                "Initialize Database"
              )}
            </Button>
            <Link href="/social">
              <Button variant="outline" className="border-2 border-[#6b5839] text-[#6b5839] font-pixel pixel-borders">
                Go to Social Page
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
