"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { getArchivedTasks, getArchivedMessages } from "@/lib/actions"
import { Archive, MessageSquare, CheckCircle2, Calendar, User, Coffee, FileX } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface ArchivedTask {
  id: string
  month_name: string
  month_year: number
  task_name: string
  completed_at: string
  optional?: boolean
  urgent?: boolean
}

interface ArchivedMessage {
  id: number
  sender_username: string
  receiver_username: string
  message: string
  created_at: string
}

export default function ArchiveSystem() {
  const { user } = useAuth()
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([])
  const [archivedMessages, setArchivedMessages] = useState<ArchivedMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Load archived data
  useEffect(() => {
    if (!user) return

    const loadArchivedData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Load archived tasks with retry for mobile
        let tasksResult
        let retryCount = 0

        while (retryCount < 3) {
          tasksResult = await getArchivedTasks(user.id)
          if (!tasksResult.error) break
          retryCount++
          // Short delay before retry
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        if (tasksResult?.error) {
          console.error("Error loading archived tasks:", tasksResult.error)
          setError(`Error loading archived tasks: ${tasksResult.error}`)
        } else {
          // Filter out any Daily Tasks that might have been archived before this change
          const filteredTasks = (tasksResult?.tasks || []).filter((task: ArchivedTask) => task.month_name !== "Daily Tasks")
          setArchivedTasks(filteredTasks)

          // Save to localStorage for other components to access
          localStorage.setItem("bizniz-quest-archive", JSON.stringify({ tasks: filteredTasks }))
        }

        // Load archived messages with retry for mobile
        let messagesResult
        retryCount = 0

        while (retryCount < 3) {
          messagesResult = await getArchivedMessages(user.id)
          if (!messagesResult.error) break
          retryCount++
          // Short delay before retry
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        if (messagesResult?.error) {
          console.error("Error loading archived messages:", messagesResult.error)
          if (!error) {
            setError(`Error loading archived messages: ${messagesResult.error}`)
          }
        } else if (messagesResult?.messages) {
          setArchivedMessages(messagesResult.messages)
        }
      } catch (err) {
        console.error("Error loading archived data:", err)
        setError("Failed to load archived data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadArchivedData()
  }, [user])

  // Group tasks by month and year
  const groupedTasks = archivedTasks.reduce(
    (acc, task) => {
      const key = `${task.month_name} ${task.month_year}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(task)
      return acc
    },
    {} as Record<string, ArchivedTask[]>,
  )

  // Sort months in reverse chronological order
  const sortedMonths = Object.keys(groupedTasks).sort((a, b) => {
    const [aMonth, aYear] = a.split(" ")
    const [bMonth, bYear] = b.split(" ")

    // Compare years first
    if (Number(aYear) !== Number(bYear)) {
      return Number(bYear) - Number(aYear)
    }

    // If years are the same, compare months
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months.indexOf(bMonth) - months.indexOf(aMonth)
  })

  return (
    <div className="p-6 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-pixel text-[#6b5839]">Bizniz Quest Archive</h2>
        <Archive className="h-6 w-6 text-[#6b5839]" />
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 font-pixel text-xs">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b5839] mx-auto"></div>
          <p className="font-pixel text-sm text-[#6b5839] mt-4">Loading archives...</p>
        </div>
      ) : (
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#d0c8b0] rounded-lg border-2 border-[#6b5839] pixel-borders mb-6">
            <TabsTrigger
              value="tasks"
              className="font-pixel text-xs data-[state=active]:bg-[#ffe9b3] data-[state=active]:text-[#6b5839] flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Completed Tasks
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="font-pixel text-xs data-[state=active]:bg-[#ffe9b3] data-[state=active]:text-[#6b5839] flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Sent Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-0">
            <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-pixel text-[#6b5839]">Completed Tasks</CardTitle>
                <CardDescription className="font-pixel text-xs text-[#6b5839]">
                  Your past accomplishments, organized by month
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {sortedMonths.length > 0 ? (
                  <div className="space-y-6">
                    {sortedMonths.map((monthKey) => (
                      <div
                        key={monthKey}
                        className="bg-[#f0e6d2] p-4 rounded-lg border-2 border-[#6b5839] pixel-borders"
                      >
                        <div className="flex items-center mb-3">
                          <Calendar className="h-5 w-5 text-[#6b5839] mr-2" />
                          <h3 className="font-pixel text-sm text-[#6b5839]">{monthKey}</h3>
                        </div>
                        <div className="space-y-3">
                          {groupedTasks[monthKey].map((task) => (
                            <div
                              key={task.id}
                              className="p-3 bg-[#d4e09b] rounded-lg border-2 border-[#6b5839] pixel-borders"
                            >
                              <div className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-[#7cb518] mt-1 mr-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-pixel text-sm text-[#6b5839] line-through">{task.task_name}</p>
                                  <p className="font-pixel text-xs text-[#6b5839] opacity-70 mt-1">
                                    Completed on {new Date(task.completed_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {task.urgent && (
                                  <Badge className="bg-[#e11d48] text-white font-pixel text-xs ml-2">Urgent</Badge>
                                )}
                                {task.optional && (
                                  <Badge className="bg-[#f9c74f] text-[#6b5839] font-pixel text-xs ml-2">
                                    Optional
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileX className="h-12 w-12 text-[#6b5839] opacity-50 mx-auto mb-3" />
                    <p className="font-pixel text-sm text-[#6b5839] mb-2">Start completing tasks to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-pixel text-[#6b5839]">Sent Messages</CardTitle>
                <CardDescription className="font-pixel text-xs text-[#6b5839]">
                  Messages you've sent to coworkers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {archivedMessages.length > 0 ? (
                  <div className="space-y-3">
                    {archivedMessages.map((message) => (
                      <div
                        key={message.id}
                        className="p-3 bg-[#f0e6d2] rounded-lg border-2 border-[#6b5839] pixel-borders"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-[#6b5839] mr-2" />
                            <p className="font-pixel text-sm text-[#6b5839]">
                              To: <span className="font-bold">{message.receiver_username}</span>
                            </p>
                          </div>
                          <p className="font-pixel text-xs text-[#6b5839] opacity-70">
                            {new Date(message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-pixel text-sm text-[#6b5839] p-2 bg-white rounded-lg border border-[#d0c8b0]">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coffee className="h-12 w-12 text-[#6b5839] opacity-50 mx-auto mb-3" />
                    <p className="font-pixel text-sm text-[#6b5839] mb-2">
                      Your message history is as empty as the coffee pot you didn't refill
                    </p>
                    <p className="font-pixel text-xs text-[#6b5839] mt-1">
                      Send some encouragement to your coworkers (they need it after that 3-hour meeting about nothing)
                    </p>
                    <div className="mt-6 bg-[#f0e6d2] p-3 rounded-lg border-2 border-[#6b5839] max-w-md mx-auto">
                      <p className="font-pixel text-xs text-[#6b5839] italic">
                        "Per my last email... oh wait, you haven't sent any."
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
