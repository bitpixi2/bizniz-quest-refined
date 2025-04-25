"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, GripVertical, Save, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { getTodoTitles, setTodoTitle } from "@/lib/todo-title-actions"

interface TodoList {
  id: number; // 1-4
  title: string;
  tasks: {
    id: string;
    name: string;
    completed: boolean;
    position: number;
    optional?: boolean;
  }[];
  newTaskName?: string; // For temporary input only, not persisted
}

export default function CalendarSystem() {
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [todoTitles, setTodoTitles] = useState<{ [key: number]: string }>({ 1: "To Do 1", 2: "To Do 2", 3: "To Do 3" });
  const [todoTitleInputs, setTodoTitleInputs] = useState<{ [key: number]: string }>({ 1: "To Do 1", 2: "To Do 2", 3: "To Do 3" });
  const [savingTitle, setSavingTitle] = useState<{ [key: number]: boolean }>({ 1: false, 2: false, 3: false });
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const isMobile = useIsMobile()
  // Placeholder for paid logic (replace with real logic)
  const isPaid = false;

  // Helper to get To Do display title
  const getTodoTitle = (todoNumber: number) => todoTitles[todoNumber] || `To Do ${todoNumber}`;

  // Save To Do title to backend (and update todoLists)
  const saveTodoTitle = async (todoNumber: number) => {
    if (!user) return;
    setSavingTitle((prev) => ({ ...prev, [todoNumber]: true }));
    await setTodoTitle(user.id, todoNumber, todoTitleInputs[todoNumber] || `To Do ${todoNumber}`);
    setTodoTitles((prev) => ({ ...prev, [todoNumber]: todoTitleInputs[todoNumber] || `To Do ${todoNumber}` }));
    setTodoLists((prev) => prev.map(list => list.id === todoNumber ? { ...list, title: todoTitleInputs[todoNumber] || `To Do ${todoNumber}` } : list));
    setSavingTitle((prev) => ({ ...prev, [todoNumber]: false }));
  };

  // Handle To Do title input change
  const handleTodoTitleChange = (todoNumber: number, value: string) => {
    setTodoTitleInputs((prev) => ({ ...prev, [todoNumber]: value }));
  };

  // Load todoLists from Supabase
  const loadTodoListsFromDatabase = async () => {
    if (!user) return;
    setIsLoading(true);
    setSyncMessage("Loading tasks from the database...");
    try {
      // MIGRATION: Check for legacy localStorage data and migrate if present
      if (typeof window !== "undefined") {
        const legacy = localStorage.getItem("bizniz-quest-todolists") || localStorage.getItem("bizquest-todolists");
        if (legacy) {
          try {
            const migrated = JSON.parse(legacy);
            if (Array.isArray(migrated) && migrated.length === 4) {
              // Save to Supabase
              await supabase
                .from("todo_lists")
                .upsert({ user_id: user.id, lists: migrated }, { onConflict: "user_id" });
              setTodoLists(migrated);
              localStorage.removeItem("bizniz-quest-todolists");
              localStorage.removeItem("bizquest-todolists");
              setSyncMessage("Migrated legacy tasks to Supabase!");
              setIsLoading(false);
              return;
            }
          } catch (e) { /* ignore parse errors */ }
        }
      }
      const { data, error } = await supabase
        .from("todo_lists")
        .select("lists")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
        setSyncMessage(`Error loading tasks: ${error.message}`);
        setIsLoading(false);
        return;
      }
      if (data && data.lists) {
        setTodoLists(data.lists);
      } else {
        // No data yet, initialize
        const defaultLists = [
          { id: 1, title: "To Do 1", tasks: [] },
          { id: 2, title: "To Do 2", tasks: [] },
          { id: 3, title: "To Do 3", tasks: [] },
          { id: 4, title: "To Do 4", tasks: [] },
        ];
        setTodoLists(defaultLists);
      }
      setSyncMessage(null);
    } catch (error) {
      setSyncMessage("Error loading tasks from database.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save todoLists to Supabase (debounced)
  const saveTodoListsToDatabase = (() => {
    let timeout: NodeJS.Timeout | null = null;
    return (lists: TodoList[]) => {
      if (!user) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        setIsSaving(true);
        setSyncMessage("Saving tasks to the database...");
        const { error } = await supabase
          .from("todo_lists")
          .upsert({ user_id: user.id, lists }, { onConflict: "user_id" });
        if (error) {
          setSyncMessage(`Error saving tasks: ${error.message}`);
        } else {
          setSyncMessage("Tasks saved!");
          setTimeout(() => setSyncMessage(null), 1500);
        }
        setIsSaving(false);
      }, 1000);
    };
  })();

  // Load on mount
  useEffect(() => {
    loadTodoListsFromDatabase();
    // Load titles as well (for legacy compatibility)
    const fetchTitles = async () => {
      if (!user) return;
      setLoadingTitles(true);
      const { titles } = await getTodoTitles(user.id);
      if (titles) setTodoTitles(titles);
      setLoadingTitles(false);
    };
    fetchTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save to Supabase on any todoLists change
  useEffect(() => {
    if (todoLists.length > 0 && user) {
      saveTodoListsToDatabase(todoLists);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoLists, user]);

  // Task operations
  const addTask = (listId: number, taskName: string) => {
    setTodoLists(prev => prev.map(list =>
      list.id === listId
        ? { ...list, tasks: [...list.tasks, { id: `task_${Date.now()}`, name: taskName, completed: false, position: list.tasks.length }] }
        : list
    ));
  };

  const toggleTaskCompletion = (listId: number, taskId: string) => {
    setTodoLists(prev => prev.map(list =>
      list.id === listId
        ? { ...list, tasks: list.tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task) }
        : list
    ));
  };

  const deleteTask = (listId: number, taskId: string) => {
    setTodoLists(prev => prev.map(list =>
      list.id === listId
        ? { ...list, tasks: list.tasks.filter(task => task.id !== taskId) }
        : list
    ));
  };
  // UI Rendering
  return (
    <div className="p-6 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <h2 className="text-2xl font-pixel text-[#6b5839] mb-4">Bizniz Quest To Do</h2>
      {message && (
        <div className="bg-[#ffd700] border-2 border-[#6b5839] text-[#6b5839] px-4 py-3 rounded mb-6 font-pixel text-center">
          {message}
        </div>
      )}
      {/* Responsive To Do grid for all devices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {todoLists.map((list: TodoList, todoListIndex: number) => (
          <Card key={todoListIndex} className="cursor-pointer transition-all pixel-borders month-card-mobile bg-[#f0e6d2] border-[#d0c8b0] opacity-80">
            <CardHeader className={`${isMobile ? "p-2 pb-1" : "p-4 pb-2"}`}>
              {list.id === 4 && !isPaid ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="font-pixel text-lg text-[#6b5839]">To Do 4</span>
                  <span className="mt-2 flex flex-col items-center">
                    <span className="block text-xs text-[#c0392b] font-pixel">Locked (Paid)</span>
                    <span className="pixel-lock mt-1" style={{ filter: "drop-shadow(0 0 2px #c0392b)" }}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="14" width="24" height="12" rx="3" fill="#c0392b" stroke="#6b5839" strokeWidth="2" />
                        <rect x="11" y="8" width="10" height="8" rx="5" fill="#ffe9b3" stroke="#6b5839" strokeWidth="2" />
                        <rect x="15" y="20" width="2" height="4" rx="1" fill="#6b5839" />
                      </svg>
                    </span>
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={todoTitleInputs[todoListIndex + 1] ?? getTodoTitle(todoListIndex + 1)}
                  onChange={(e) => handleTodoTitleChange(todoListIndex + 1, e.target.value)}
                  className="font-pixel text-lg text-[#6b5839] bg-transparent border-b border-[#6b5839] focus:outline-none w-40"
                  disabled={savingTitle[todoListIndex + 1] || loadingTitles}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTodoTitle(todoListIndex + 1);
                  }}
                />
              )}
            </CardHeader>
            <CardContent className={`${isMobile ? "p-2 pt-1" : "p-4 pt-2"}`}>
              <div className="h-6">
                <CardDescription className={`font-pixel ${isMobile ? "text-[10px]" : "text-xs"} text-[#6b5839]`}>
                  {`${list.tasks.filter((t: typeof list.tasks[number]) => t.completed).length}/${list.tasks.length} tasks`}
                </CardDescription>
                {/* Add new task input, but only if unlocked */}
                {!(list.id === 4 && !isPaid) && (
                  <div className="flex mt-2">
                    <input
                      type="text"
                      placeholder="Add task..."
                      className="font-pixel text-sm border rounded px-2 py-1 mr-2 flex-1"
                      value={list.newTaskName || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setTodoLists(prev => prev.map(l => l.id === list.id ? { ...l, newTaskName: value } : l));
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && list.newTaskName?.trim()) {
                          addTask(list.id, list.newTaskName.trim());
                          setTodoLists(prev => prev.map(l => l.id === list.id ? { ...l, newTaskName: '' } : l));
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (list.newTaskName?.trim()) {
                          addTask(list.id, list.newTaskName.trim());
                          setTodoLists(prev => prev.map(l => l.id === list.id ? { ...l, newTaskName: '' } : l));
                        }
                      }}
                    >
                      <PlusCircle className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

        <div className="grid gap-3 mb-6">
          {todoLists[3]?.tasks.map((task: TodoList["tasks"][number], taskIndex: number) => (
            <div
              key={task.id}
              data-task-id={task.id}
              className={`flex items-center p-3 sm:p-3 rounded ${
                task.completed ? "bg-[#d4e09b]" : "bg-[#f0e6d2]"
              } border-2 border-[#6b5839] pixel-borders task-mobile task-item`}
              onClick={() => toggleTaskCompletion(4, task.id)}
              role="checkbox"
              aria-checked={task.completed}
              tabIndex={0}
              draggable={!isMobile}
            >
              {!isMobile && (
                <div className="task-action mr-2 cursor-move">
                  <GripVertical className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-[#6b5839] opacity-50 mobile-icon`} />
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
                onClick={e => {
                  e.stopPropagation();
                  deleteTask(4, task.id);
                }}
                aria-label="Delete task"
              >
                <div className="pixel-x"></div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
