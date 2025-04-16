"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, GripVertical, Save, RefreshCw, RotateCcw, Lock as LockIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { saveMonths, loadUserData } from "@/lib/actions"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { getTodoTitles, setTodoTitle } from "@/lib/todo-title-actions"

interface MonthData {
  name: string
  year: number
  unlocked: boolean
  completed: boolean
  tasks: {
    id: string
    name: string
    completed: boolean
  }[]
}

export default function CalendarSystem() {
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  // Initialize state with empty months
  const [months, setMonths] = useState<MonthData[]>(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      const savedMonths = localStorage.getItem("bizquest-months") || localStorage.getItem("bizniz-quest-months")
      if (savedMonths) {
        return JSON.parse(savedMonths)
      }
    }

    // Default empty months (preserve backend mapping)
    return [
      {
        name: "April",
        year: 2025,
        unlocked: true,
        completed: false,
        tasks: [],
      },
      {
        name: "May",
        year: 2025,
        unlocked: true,
        completed: false,
        tasks: [],
      },
      {
        name: "June",
        year: 2025,
        unlocked: true,
        completed: false,
        tasks: [],
      },
      {
        name: "Daily Tasks",
        year: 2025,
        unlocked: true,
        completed: false,
        tasks: [],
      },
    ]
  })

  // Editable To Do titles (To Do 1-3)
  const [todoTitles, setTodoTitles] = useState<{ [key: number]: string }>({ 1: "To Do 1", 2: "To Do 2", 3: "To Do 3" });
  const [todoTitleInputs, setTodoTitleInputs] = useState<{ [key: number]: string }>({ 1: "To Do 1", 2: "To Do 2", 3: "To Do 3" });
  const [savingTitle, setSavingTitle] = useState<{ [key: number]: boolean }>({ 1: false, 2: false, 3: false });
  const [loadingTitles, setLoadingTitles] = useState(false);
  // Placeholder for paid logic (like characters to unlock)
  const isPaid = false; // TODO: Replace with real paid status

  // Helper to map month index to To Do number
  const getTodoNumber = (monthIndex: number) => monthIndex + 1;
  // Helper to get To Do display title
  const getTodoTitle = (todoNumber: number) => todoTitles[todoNumber] || `To Do ${todoNumber}`;

  // Save To Do title to backend
  const saveTodoTitle = async (todoNumber: number) => {
    if (!user) return;
    setSavingTitle((prev) => ({ ...prev, [todoNumber]: true }));
    await setTodoTitle(user.id, todoNumber, todoTitleInputs[todoNumber] || `To Do ${todoNumber}`);
    setTodoTitles((prev) => ({ ...prev, [todoNumber]: todoTitleInputs[todoNumber] || `To Do ${todoNumber}` }));
    setSavingTitle((prev) => ({ ...prev, [todoNumber]: false }));
  };

  // Handle To Do title input change
  const handleTodoTitleChange = (todoNumber: number, value: string) => {
    setTodoTitleInputs((prev) => ({ ...prev, [todoNumber]: value }));
  };


  const [selectedMonth, setSelectedMonth] = useState<MonthData>(() => {
    // Get the selected month from localStorage or default to the first month
    if (typeof window !== "undefined") {
      const savedSelectedMonth = localStorage.getItem("bizquest-selected-month")
      if (savedSelectedMonth) {
        const monthIndex = Number.parseInt(savedSelectedMonth)
        return months[monthIndex] || months[0]
      }
    }
    return months[0]
  })

  const [message, setMessage] = useState("")
  const [newTaskName, setNewTaskName] = useState("")
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [nextTaskId, setNextTaskId] = useState(() => {
    // Find the highest task ID and increment it
    let maxId = 0
    months.forEach((month) => {
      month.tasks.forEach((task) => {
        const idNum = Number.parseInt(task.id.replace("task_", ""))
        if (idNum > maxId) maxId = idNum
      })
    })
    return maxId + 1
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [actionHistory, setActionHistory] = useState<MonthData[][]>([])
  const [canUndo, setCanUndo] = useState(false)
  const isMobile = useIsMobile()
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [touchedTaskId, setTouchedTaskId] = useState<string | null>(null)

  // Load data from the database when the component mounts
  useEffect(() => {
    if (user) {
      loadDataFromDatabase();
      // Load To Do titles
      setLoadingTitles(true);
      getTodoTitles(user.id).then((result) => {
        if (result.titles) {
          setTodoTitles({ ...todoTitles, ...result.titles });
          setTodoTitleInputs({ ...todoTitleInputs, ...result.titles });
        }
        setLoadingTitles(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Function to load data from the database
  const loadDataFromDatabase = async () => {
    if (!user) return

    setIsLoading(true)
    setSyncMessage("Loading data from the database...")

    try {
      console.log("Attempting to load user data for:", user.id)
      const data = await loadUserData(user.id)

      if (data.error) {
        console.error("Error from loadUserData:", data.error)
        setSyncMessage(`Error loading data: ${data.error}`)
        return
      }

      console.log("Loaded months data:", data.months)

      if (data.months && data.months.length > 0) {
        console.log("Successfully loaded months:", data.months.length)

        // Create a map of default months for reference
        const defaultMonths = [
          {
            name: "April",
            year: 2025,
            unlocked: true,
            completed: false,
            tasks: [],
          },
          {
            name: "May",
            year: 2025,
            unlocked: true,
            completed: false,
          },
          {
            name: "June",
            year: 2025,
            unlocked: true,
            completed: false,
            tasks: [],
          },
          {
            name: "Daily Tasks",
            year: 2025,
            unlocked: true,
            completed: false,
            tasks: [],
          },
        ]

        // Create a map of month names to loaded months
        const loadedMonthsMap = new Map()
        data.months.forEach((month) => {
          loadedMonthsMap.set(`${month.name}-${month.year}`, month)
        })

        // Ensure all default months are present, using loaded data when available
        const completeMonths = defaultMonths.map((defaultMonth) => {
          const key = `${defaultMonth.name}-${defaultMonth.year}`
          return loadedMonthsMap.has(key) ? loadedMonthsMap.get(key) : defaultMonth
        })

        setMonths(completeMonths)
        setSelectedMonth(completeMonths[0])

        // Update localStorage
        localStorage.setItem("bizniz-quest-months", JSON.stringify(completeMonths))
        localStorage.setItem("bizniz-quest-selected-month", "0")

        setSyncMessage("Data loaded successfully!")
      } else {
        console.log("No months data found in database, using default empty months")
        // Use empty months
        const emptyMonths = [
          {
            name: "April",
            year: 2025,
            unlocked: true,
            completed: false,
            tasks: [],
          },
          {
            name: "May",
            year: 2025,
            unlocked: true,
            completed: false,
            tasks: [],
          },
          {
            name: "June",
            year: 2025,
            unlocked: true,
            completed: false,
            tasks: [],
          },
          {
            name: "Daily Tasks",
            year: 2025,
            unlocked: true,
            completed: false,
            tasks: [],
          },
        ]
        setMonths(emptyMonths)
        setSelectedMonth(emptyMonths[0])
        localStorage.setItem("bizniz-quest-months", JSON.stringify(emptyMonths))
        localStorage.setItem("bizniz-quest-selected-month", "0")
        setSyncMessage("Starting with empty task lists.")
      }
    } catch (error) {
      console.error("Error in loadDataFromDatabase:", error)
      setSyncMessage(`Error loading data: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  // Function to save data to the database
  const saveDataToDatabase = async () => {
    if (!user) return

    setIsSaving(true)
    setSyncMessage("Saving data to the database...")

    try {
      console.log("Saving all months to database:", months.length, "months")
      const result = await saveMonths(user.id, months)

      if (result.error) {
        console.error("Error saving months:", result.error)
        setSyncMessage(`Error saving data: ${result.error}`)
      } else {
        console.log("Successfully saved all months")
        setSyncMessage("Data saved successfully!")
      }
    } catch (error) {
      console.error("Error saving data:", error)
      setSyncMessage("Error saving data.")
    } finally {
      setIsSaving(false)
      // Clear message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  // Save months data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("bizniz-quest-months", JSON.stringify(months))

    // Also save the selected month index
    const monthIndex = months.findIndex((m) => m.name === selectedMonth.name && m.year === selectedMonth.year)
    if (monthIndex !== -1) {
      localStorage.setItem("bizniz-quest-selected-month", monthIndex.toString())
    }

    // Auto-save to database when on mobile to ensure changes are persisted
    if (user && isMobile) {
      // Use a debounce to avoid too many saves
      const timer = setTimeout(() => {
        saveDataToDatabase()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [months, selectedMonth, user, isMobile])

  // Update selected month when months change
  useEffect(() => {
    const monthIndex = months.findIndex((m) => m.name === selectedMonth.name && m.year === selectedMonth.year)
    if (monthIndex !== -1) {
      setSelectedMonth(months[monthIndex])
    }
  }, [months])

  const saveToHistory = (currentMonths: MonthData[]) => {
    // Keep only the last 10 actions
    const newHistory = [...actionHistory, JSON.parse(JSON.stringify(currentMonths))].slice(-10)
    setActionHistory(newHistory)
    setCanUndo(true)
  }

  // Add this function to handle undo
  const handleUndo = () => {
    if (actionHistory.length > 0) {
      const previousState = actionHistory[actionHistory.length - 1]
      setMonths(previousState)
      setActionHistory(actionHistory.slice(0, -1))
      setCanUndo(actionHistory.length > 1)
    }
  }

  const toggleTaskCompletion = (monthIndex: number, taskIndex: number) => {
    // Save current state to history
    saveToHistory([...months])

    const newMonths = [...months]
    newMonths[monthIndex].tasks[taskIndex].completed = !newMonths[monthIndex].tasks[taskIndex].completed

    // Check if all tasks are completed
    const allTasksCompleted = newMonths[monthIndex].tasks.every((task) => task.completed)

    // If all tasks are completed, mark the month as completed
    if (allTasksCompleted && newMonths[monthIndex].tasks.length > 0) {
      newMonths[monthIndex].completed = true
      setMessage(`You've completed all tasks for ${newMonths[monthIndex].name}!`)
    } else {
      // If not all tasks are completed, mark the month as not completed
      newMonths[monthIndex].completed = false
    }

    setMonths(newMonths)
  }

  const selectMonth = (month: MonthData) => {
    setSelectedMonth(month)
  }

  const addNewTask = () => {
    if (!newTaskName.trim()) return

    // Save current state to history
    saveToHistory([...months])

    const monthIndex = months.findIndex((m) => m.name === selectedMonth.name && m.year === selectedMonth.year)
    if (monthIndex === -1) return

    const newTask = {
      id: `task_${nextTaskId}`,
      name: newTaskName,
      completed: false,
    }

    const newMonths = [...months]
    newMonths[monthIndex].tasks.push(newTask)
    setMonths(newMonths)
    setNewTaskName("")
    setNextTaskId(nextTaskId + 1)
  }

  const deleteTask = (taskId: string) => {
    // Save current state to history
    saveToHistory([...months])

    const monthIndex = months.findIndex((m) => m.name === selectedMonth.name && m.year === selectedMonth.year)
    if (monthIndex === -1) return

    const newMonths = [...months]
    newMonths[monthIndex].tasks = newMonths[monthIndex].tasks.filter((task) => task.id !== taskId)
    setMonths(newMonths)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.currentTarget.classList.add("task-dragging")
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("task-dragging")
    setDraggedTaskId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("task-drag-over")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("task-drag-over")
  }

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove("task-drag-over")

    if (!draggedTaskId || draggedTaskId === targetTaskId) return

    // Save current state to history
    saveToHistory([...months])

    const monthIndex = months.findIndex((m) => m.name === selectedMonth.name && m.year === selectedMonth.year)
    if (monthIndex === -1) return

    const newMonths = [...months]
    const tasks = [...newMonths[monthIndex].tasks]

    const draggedTaskIndex = tasks.findIndex((task) => task.id === draggedTaskId)
    const targetTaskIndex = tasks.findIndex((task) => task.id === targetTaskId)

    if (draggedTaskIndex === -1 || targetTaskIndex === -1) return

    // Reorder the tasks
    const [draggedTask] = tasks.splice(draggedTaskIndex, 1)
    tasks.splice(targetTaskIndex, 0, draggedTask)

    newMonths[monthIndex].tasks = tasks
    setMonths(newMonths)
  }

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    setTouchedTaskId(taskId)
    setTouchStartY(e.touches[0].clientY)
    e.currentTarget.classList.add("task-dragging")
  }

  const handleTouchMove = (e: React.TouchEvent, taskId: string) => {
    if (!touchStartY || !touchedTaskId) return

    const touchY = e.touches[0].clientY
    const elements = document.querySelectorAll(".task-item")

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const middle = rect.top + rect.height / 2

      if (touchY > rect.top && touchY < rect.bottom) {
        el.classList.add("task-drag-over")
      } else {
        el.classList.remove("task-drag-over")
      }
    })
  }

  const handleTouchEnd = (e: React.TouchEvent, taskId: string) => {
    if (!touchedTaskId) return

    const elements = document.querySelectorAll(".task-item")
    let targetTaskId = null

    elements.forEach((el) => {
      if (el.classList.contains("task-drag-over")) {
        targetTaskId = el.getAttribute("data-task-id")
        el.classList.remove("task-drag-over")
      }
    })

    e.currentTarget.classList.remove("task-dragging")

    if (targetTaskId && touchedTaskId !== targetTaskId) {
      // Reorder tasks
      const monthIndex = months.findIndex((m) => m.name === selectedMonth.name && m.year === selectedMonth.year)
      if (monthIndex === -1) return

      // Save current state to history
      saveToHistory([...months])

      const newMonths = [...months]
      const tasks = [...newMonths[monthIndex].tasks]

      const draggedTaskIndex = tasks.findIndex((task) => task.id === touchedTaskId)
      const targetTaskIndex = tasks.findIndex((task) => task.id === targetTaskId)

      if (draggedTaskIndex === -1 || targetTaskIndex === -1) return

      // Reorder the tasks
      const [draggedTask] = tasks.splice(draggedTaskIndex, 1)
      tasks.splice(targetTaskIndex, 0, draggedTask)

      newMonths[monthIndex].tasks = tasks
      setMonths(newMonths)
    }

    setTouchedTaskId(null)
    setTouchStartY(null)
  }

  // Function to manually reset daily tasks
  const resetDailyTasks = () => {
    setMonths((prevMonths) =>
      prevMonths.map((month) => {
        if (month.name === "Daily Tasks") {
          return {
            ...month,
            completed: false,
            tasks: month.tasks.map((task) => ({
              ...task,
              completed: false,
            })),
          }
        }
        return month
      }),
    )

    // Clear any completion message
    setMessage("")

    // Update the last reset date
    localStorage.setItem("bizquest-daily-reset", new Date().toISOString().split("T")[0])
    setSyncMessage("Daily tasks have been reset!")
    setTimeout(() => setSyncMessage(null), 3000)
  }

  useEffect(() => {
    // Check if we need to reset now (if last reset was before today)
    const lastReset = localStorage.getItem("bizquest-daily-reset")
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    if (!lastReset || lastReset !== today) {
      resetDailyTasks()
    }

    // Set up interval to check for reset every minute
    const intervalId = setInterval(() => {
      const now = new Date()
      const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes()
      const today = now.toISOString().split("T")[0]
      const lastReset = localStorage.getItem("bizquest-daily-reset")

      // If it's midnight UTC (00:00) or if we haven't reset today
      if ((currentTime === 0 || !lastReset || lastReset !== today) && user) {
        resetDailyTasks()

        // Also save to database to ensure server has the reset state
        saveDataToDatabase()
      }
    }, 60000) // Check every minute

    return () => clearInterval(intervalId)
  }, [user])

  return (
    <div className="p-6 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839]">Bizniz Quest Calendar</h2>

        {user && (
          <div className="flex gap-4">
            <Button
              onClick={loadDataFromDatabase}
              disabled={isLoading}
              className="bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders flex items-center gap-1"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Load</span>
            </Button>
            <Button
              onClick={saveDataToDatabase}
              disabled={isSaving}
              className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders flex items-center gap-1"
              size="sm"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        )}
      </div>

      {syncMessage && (
        <div className="bg-[#f0e6d2] border-2 border-[#6b5839] text-[#6b5839] px-4 py-2 rounded mb-4 font-pixel text-center text-sm">
          {syncMessage}
        </div>
      )}

      {message && (
        <div className="bg-[#ffd700] border-2 border-[#6b5839] text-[#6b5839] px-4 py-3 rounded mb-6 font-pixel text-center">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {months.map((month, monthIndex) => (
          <Card
            key={`${month.name}-${month.year}`}
            className={`cursor-pointer transition-all pixel-borders month-card-mobile ${
              selectedMonth.name === month.name
                ? "bg-[#ffe9b3] border-[#6b5839]"
                : "bg-[#f0e6d2] border-[#d0c8b0] opacity-80"
            }`}
            onClick={() => selectMonth(month)}
          >
            <CardHeader className={`${isMobile ? "p-2 pb-1" : "p-4 pb-2"}`}>
              <div className="flex justify-between items-center">
                <CardTitle className={`${isMobile ? "text-sm" : "text-lg"} font-pixel text-[#6b5839]`}>
                  {month.name === "Daily Tasks"
                    ? isMobile
                      ? "Daily"
                      : month.name
                    : isMobile
                      ? month.name.substring(0, 3)
                      : `${month.name} ${month.year}`}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className={`${isMobile ? "p-2 pt-1" : "p-4 pt-2"}`}>
              <div className="h-6">
                <CardDescription className={`font-pixel ${isMobile ? "text-[10px]" : "text-xs"} text-[#6b5839]`}>
                  {`${month.tasks.filter((t) => t.completed).length}/${month.tasks.length} tasks`}
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Month Tasks */}
      <div className="bg-[#ffe9b3] p-5 rounded-lg border-4 border-[#6b5839] pixel-borders">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-pixel text-[#6b5839]">
            {selectedMonth.name === "Daily Tasks" ? "Daily Tasks" : `${selectedMonth.name} ${selectedMonth.year} Tasks`}
          </h3>
          <div className="flex gap-4">
            {selectedMonth.name === "Daily Tasks" && (
              <Button
                onClick={resetDailyTasks}
                className="bg-[#f9c74f] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders flex items-center gap-1"
                size="sm"
                title="Reset daily tasks"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
            <Button
              onClick={handleUndo}
              disabled={!canUndo}
              className="bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders flex items-center gap-1"
              size="sm"
              title="Undo last action"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 mb-6">
          {selectedMonth.tasks.map((task, taskIndex) => (
            <div
              key={task.id}
              data-task-id={task.id}
              className={`flex items-center p-3 sm:p-3 rounded ${
                task.completed ? "bg-[#d4e09b]" : "bg-[#f0e6d2]"
              } border-2 border-[#6b5839] pixel-borders task-mobile task-item`}
              onClick={(e) => {
                // Only toggle if not clicking on the delete button or drag handle
                if (!(e.target as HTMLElement).closest(".task-action")) {
                  toggleTaskCompletion(months.indexOf(selectedMonth), taskIndex)
                }
              }}
              role="checkbox"
              aria-checked={task.completed}
              tabIndex={0}
              draggable={!isMobile}
              onDragStart={!isMobile ? (e) => handleDragStart(e, task.id) : undefined}
              onDragEnd={!isMobile ? handleDragEnd : undefined}
              onDragOver={!isMobile ? handleDragOver : undefined}
              onDragLeave={!isMobile ? handleDragLeave : undefined}
              onDrop={!isMobile ? (e) => handleDrop(e, task.id) : undefined}
            >
              {!isMobile && (
                <div className="task-action mr-2 cursor-move" onClick={(e) => e.stopPropagation()}>
                  <GripVertical
                    className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-[#6b5839] opacity-50 mobile-icon`}
                  />
                </div>
              )}
              <div
                className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} mr-3 border-2 border-[#6b5839] ${
                  task.completed ? "bg-[#7cb518]" : "bg-white"
                } flex items-center justify-center cursor-pointer pixel-borders mobile-checkbox`}
              >
                {task.completed && <span className="text-white font-bold text-xs">✓</span>}
              </div>
              <span
                className={`font-pixel text-sm flex-1 task-text ${
                  task.completed ? "line-through text-[#6b5839]" : "text-[#6b5839]"
                }`}
              >
                {task.name}
              </span>
              <button
                className="task-action ml-2 text-[#6b5839] hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteTask(task.id)
                }}
                aria-label="Delete task"
              >
                <div className="pixel-x"></div>
              </button>
            </div>
          ))}
        </div>

        {/* To Do 1-4 Section (below tasks list on mobile) */}
        {isMobile && (
          <div className="mt-8 grid gap-4">
            {[0, 1, 2, 3].map((monthIdx) => {
              const todoNumber = getTodoNumber(monthIdx);
              const isLocked = todoNumber === 4 && !isPaid;
              return (
                <Card key={todoNumber} className="border-2 border-[#6b5839] pixel-borders">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      {todoNumber <= 3 ? (
                        <>
                          <input
                            type="text"
                            value={todoTitleInputs[todoNumber] ?? getTodoTitle(todoNumber)}
                            onChange={(e) => handleTodoTitleChange(todoNumber, e.target.value)}
                            className="font-pixel text-lg text-[#6b5839] bg-transparent border-b border-[#6b5839] focus:outline-none w-40"
                            disabled={savingTitle[todoNumber] || loadingTitles}
                          />
                          <Button
                            size="sm"
                            className="ml-2"
                            onClick={() => saveTodoTitle(todoNumber)}
                            disabled={savingTitle[todoNumber] || loadingTitles}
                          >
                            {savingTitle[todoNumber] ? "Saving..." : "Save"}
                          </Button>
                        </>
                      ) : (
                        <span className="font-pixel text-lg text-[#6b5839]">{getTodoTitle(todoNumber)}</span>
                      )}
                      {isLocked && (
                        <span className="ml-2 text-[#c0392b] font-pixel flex items-center">
                          <LockIcon className="w-4 h-4 mr-1" /> Unlock To Do 4
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5">
                      {months[monthIdx].tasks.map((task) => (
                        <li key={task.id} className="font-pixel text-sm text-[#6b5839]">
                          {task.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}


        {/* Add New Task */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder={isMobile ? "Write a new task..." : "Write a new task..."}
            className="flex-1 p-3 rounded bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders focus:outline-none w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") addNewTask()
            }}
          />
          <Button
            onClick={addNewTask}
            className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isMobile ? "Add" : "Add Task"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
