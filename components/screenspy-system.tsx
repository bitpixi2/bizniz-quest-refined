"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Monitor } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  screen_sharing_enabled?: boolean;
}

interface SharedTask {
  id: string | number;
  task_name: string;
  completed: boolean;
  urgent?: boolean;
  optional?: boolean;
}

export default function ScreenspySystem() {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [coworkers, setCoworkers] = useState<Friend[]>([]);
  const [isLoadingCoworkers, setIsLoadingCoworkers] = useState(false);
  const [selectedCoworker, setSelectedCoworker] = useState<Friend | null>(null);

  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [sharingStatus, setSharingStatus] = useState<string | null>(null);

  // Sound refs for toggle
  const toggleOnRef = useRef<HTMLAudioElement | null>(null);
  const toggleOffRef = useRef<HTMLAudioElement | null>(null);

  // Set toggleOff volume to 0.4
  useEffect(() => {
    if (toggleOffRef.current) {
      toggleOffRef.current.volume = 0.4;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCoworkers = async () => {
      setIsLoadingCoworkers(true);
      setError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, screen_sharing_enabled")
          .neq("id", user.id); // Show all users except self, regardless of sharing status
        if (error) throw error;
        const friends = Array.isArray(data)
          ? data
              .filter((c) => c.username !== "testuser" && c.username !== "frienduser")
              .map((c) => ({
                id: String(c.id),
                username: String(c.username),
                screen_sharing_enabled: Boolean(c.screen_sharing_enabled),
              }))
          : [];
        setCoworkers(friends);
      } catch {
        setError("Failed to fetch coworkers.");
      } finally {
        setIsLoadingCoworkers(false);
      }
    };
    fetchCoworkers();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchSharing = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("screen_sharing_enabled")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setSharingEnabled(Boolean(data?.screen_sharing_enabled));
      } catch {
        setSharingEnabled(false);
      }
    };
    fetchSharing();
  }, [user]);

  const handleToggleSharing = async () => {
    if (!user) return;
    // Play the appropriate sound for the new state
    if (!sharingEnabled && toggleOnRef.current) {
      toggleOnRef.current.currentTime = 0;
      toggleOnRef.current.play();
    } else if (sharingEnabled && toggleOffRef.current) {
      toggleOffRef.current.currentTime = 0;
      toggleOffRef.current.play();
    }
    setSharingStatus(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({ screen_sharing_enabled: !sharingEnabled })
        .eq("id", user.id);
      if (error) throw error;
      setSharingEnabled(!sharingEnabled);
      setSharingStatus(null);
    } catch {
      setSharingStatus("Failed to update sharing preference.");
    }
  };

  const handleSelectCoworker = async (coworker: Friend) => {
    setSelectedCoworker(coworker);
    setIsLoadingTasks(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, task_name, completed, urgent, optional")
        .eq("profile_id", coworker.id)
        .order("id", { ascending: true });
      if (error) throw error;
      const tasks = Array.isArray(data)
        ? data.map((t) => ({
            id: t.id as string | number,
            task_name: String(t.task_name),
            completed: Boolean(t.completed),
            urgent: Boolean(t.urgent),
            optional: Boolean(t.optional),
          }))
        : [];
      setSharedTasks(tasks);
    } catch {
      setSharedTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const inviteCoworker = async () => {
    if (!user || !inviteEmail.trim()) return;
    setError(null);
    setSuccess(null);
    setIsInviting(true);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteEmail)) {
        setError("Please enter a valid email address");
        setIsInviting(false);
        return;
      }
      // simple invitation logic, replace per your schema
      await getSupabaseBrowserClient()
        .from("invitations")
        .insert([{ email: inviteEmail, inviter_id: user.id }]);
      setSuccess("Invitation sent successfully");
      setInviteEmail("");
    } catch {
      setError("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="p-6 bg-white border-4 border-[#6b5839] pixel-borders max-w-5xl mx-auto">
      {/* Audio elements for toggle sounds */}
      <audio ref={toggleOnRef} src="/sounds/toggle_on.mp3" preload="auto" />
      <audio ref={toggleOffRef} src="/sounds/toggle_off.mp3" preload="auto" />

      {/* Sharing Toggle */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-4 bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders px-6 py-4">
          <span className="font-pixel text-lg text-[#6b5839] pixel-text">Screen Sharing</span>
          <button
            onClick={handleToggleSharing}
            disabled={!!sharingStatus}
            className={`w-16 h-8 border-2 border-[#6b5839] pixel-borders bg-transparent flex items-center relative focus:outline-none transition-colors duration-200 ${
              sharingEnabled ? 'bg-[#7cb518]' : 'bg-[#d0c8b0]'
            }`}
            aria-pressed={sharingEnabled}
            style={{ borderRadius: 0, padding: 0 }}
          >
            <span
              className={`absolute left-1 w-5 h-5 border-2 border-[#6b5839] pixel-borders transition-transform duration-200 ${
                sharingEnabled ? 'translate-x-8 bg-[#7cb518]' : 'bg-[#e74c3c]'
              }`}
              style={{ borderRadius: 0, top: '50%', transform: `translateY(-50%) ${sharingEnabled ? 'translateX(32px)' : ''}` }}
            />
          </button>
        </div>
        <div className="mt-2 text-[#6b5839] font-pixel text-sm text-center max-w-lg">
          {sharingEnabled
            ? "When enabled, your To Do tasks are visible to anyone logged in."
            : "Your To Do tasks are private and not visible to others."}
        </div>

      </div>

      {/* Selected Coworker Monitor */}
      {selectedCoworker && (
        <div className="flex justify-center mb-8">
          <div className="bg-white border-4 border-[#6b5839] pixel-borders rounded-lg p-6 w-full max-w-3xl">
            {/* Monitor Outer Shell */}
            <div className="bg-[#f0e6d2] rounded-t-lg rounded-b-none p-4 pt-6 pb-8 relative overflow-hidden pixel-borders shadow-lg border-b-8 border-[#bca87c] flex flex-col items-center" style={{ boxShadow: '0 6px 16px #0002' }}>
  {/* Black background behind monitor */}
  <div className="absolute inset-0 w-full h-full bg-black rounded-lg z-0" />
              {/* Screen reflection lines */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.18) 50%)",
                  backgroundSize: "100% 4px",
                }}
              ></div>
              {/* Monitor screen content */}
              <div className="relative z-0 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar w-full bg-[#e4e4e4] border-4 border-[#a0956e] rounded-md flex flex-col items-center" style={{ minHeight: 160, minWidth: 220 }}>
                {isLoadingTasks ? (
                  <p className="font-pixel text-sm text-[#00ff41] text-center py-8">Loading tasks...</p>
                ) : error ? (
                  <p className="font-pixel text-sm text-[#00ff41] text-center py-8">Error: {error}</p>
                ) : sharedTasks.length === 0 ? (
                  <p className="font-pixel text-sm text-[#00ff41] text-center py-8">No tasks to display</p>
                ) : (
                  sharedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 mb-2 rounded-lg border-2 pixel-borders bg-white border-[#6b5839] w-full"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-pixel text-xs ${task.completed ? "line-through" : ""}`}>{task.task_name}</span>
                        {task.urgent && !task.completed && <span className="text-xs text-[#ff4100]">URGENT</span>}
                        {task.optional && <span className="text-xs text-[#00ff41]">OPTIONAL</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Thick bottom bezel */}
              <div className="w-full h-6 bg-[#d6c38a] border-t-4 border-[#bca87c] flex items-center justify-center relative">
                {/* Power button */}
                <div className="w-4 h-4 rounded-full bg-[#888] border-2 border-[#444] absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#6bff41]" />
                </div>
              </div>
            </div>
            {/* Monitor Stand - below monitor */}
            <div className="flex flex-col items-center -mt-2">
              <div className="h-4 bg-[#222222] w-16 rounded-b-lg mb-1"></div>
              <div className="h-2 w-8 bg-[#bca87c] rounded-b-lg"></div>
            </div>
          </div>
        </div>
      )}

      {/* Coworkers List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isLoadingCoworkers ? (
          <p className="font-pixel text-sm text-[#6b5839] text-center col-span-3">Loading coworkers...</p>
        ) : coworkers.length > 0 ? (
          coworkers.map((coworker) => (
            <div
              key={coworker.id}
              className="flex flex-col items-center bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders rounded-lg p-4 min-w-[180px] shadow-md"
            >
              <span className="font-pixel text-lg text-[#6b5839] mb-2">{coworker.username}</span>
              <Button
                onClick={() => handleSelectCoworker(coworker)}
                className="bg-[#7cb518] text-white border-2 border-[#6b5839] font-pixel text-xs pixel-borders"
              >
                Screenspy
              </Button>
            </div>
          ))
        ) : (
          <p className="font-pixel text-sm text-[#6b5839] text-center col-span-3">No coworkers yet</p>
        )}
      </div>

      {/* Invite Coworker */}
      <div className="flex justify-center">
        <div className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="font-pixel text-xl text-[#6b5839] mb-2">Invite Coworker</h3>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter coworker's email"
            className="w-full p-3 mb-3 rounded bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders"
          />
          <Button
            onClick={inviteCoworker}
            disabled={!inviteEmail.trim() || isInviting}
            className="bg-[#7cb518] text-white border-2 border-[#6b5839] font-pixel text-sm px-6 pixel-borders"
          >
            {isInviting ? "Inviting..." : "Send Invite"}
          </Button>
          {error && <p className="font-pixel text-xs text-red-600 mt-2">{error}</p>}
          {success && <p className="font-pixel text-xs text-green-700 mt-2">{success}</p>}
        </div>
      </div>
    </div>
  );
}
