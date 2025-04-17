"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Monitor } from "lucide-react";
import "./pixel-styles.css";

interface Friend {
  id: string;
  username: string;
  screen_sharing_enabled?: boolean;
}

export default function ScreenspySystem2() {
  const { user } = useAuth();
  const [coworkers, setCoworkers] = useState<Friend[]>([]);
  const [selectedCoworker, setSelectedCoworker] = useState<Friend | null>(null);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Fetch coworkers
  useEffect(() => {
    if (!user) return;
    const fetchCoworkers = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, screen_sharing_enabled")
        .eq("screen_sharing_enabled", true)
        .neq("id", user.id);
      if (!error && data) {
        setCoworkers(
          data.map((item: any) => ({
            id: String(item.id),
            username: String(item.username),
            screen_sharing_enabled: typeof item.screen_sharing_enabled === "boolean" ? item.screen_sharing_enabled : undefined,
          }))
        );
      }
    };
    fetchCoworkers();
  }, [user]);

  // Fetch own sharing preference
  useEffect(() => {
    if (!user) return;
    const fetchSharing = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("screen_sharing_enabled")
        .eq("id", user.id)
        .single();
      setSharingEnabled(
        typeof data?.screen_sharing_enabled === "boolean"
          ? data.screen_sharing_enabled
          : false
      );
    };
    fetchSharing();
  }, [user]);

  // Toggle sharing
  const handleToggleSharing = async () => {
    if (!user) return;
    setStatus(sharingEnabled ? "Disabling sharing..." : "Enabling sharing...");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({ screen_sharing_enabled: !sharingEnabled })
      .eq("id", user.id);
    if (!error) setSharingEnabled((prev) => !prev);
    setStatus(null);
  };

  // Invite coworker (stub, replace with real logic as needed)
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Invite sent (stub, implement real invite logic)");
    setInviteEmail("");
  };

  return (
    <div className="screenspy-system pixel-bg" style={{ maxWidth: 600, margin: "0 auto", padding: 24, borderRadius: 16 }}>
      {/* Screen sharing toggle at top */}
      <div className="pixel-box" style={{ marginBottom: 24, textAlign: "center" }}>
        <button
          className={`pixel-btn ${sharingEnabled ? "pixel-btn-on" : "pixel-btn-off"}`}
          onClick={handleToggleSharing}
          style={{ fontSize: 18, padding: "8px 24px" }}
        >
          {sharingEnabled ? "Screen Sharing: ON" : "Screen Sharing: OFF"}
        </button>
        {status && <div className="pixel-status" style={{ marginTop: 8 }}>{status}</div>}
      </div>

      {/* Monitor appears when coworker selected */}
      {selectedCoworker && (
        <div className="pixel-monitor" style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Monitor size={72} style={{ color: "#222", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0002" }} />
          <div style={{ marginLeft: 16, alignSelf: "center" }}>
            <div className="pixel-label">Watching: <b>{selectedCoworker.username}</b></div>
          </div>
        </div>
      )}

      {/* Coworkers horizontal row */}
      <div className="pixel-coworkers" style={{ display: "flex", gap: 12, overflowX: "auto", marginBottom: 24, justifyContent: "center" }}>
        {coworkers.length === 0 && <div className="pixel-label">No coworkers online</div>}
        {coworkers.map((c) => (
          <div
            key={c.id}
            className={`pixel-coworker pixel-box${selectedCoworker?.id === c.id ? " pixel-coworker-selected" : ""}`}
            style={{ minWidth: 100, padding: 12, cursor: "pointer", textAlign: "center" }}
            onClick={() => setSelectedCoworker(c)}
          >
            <div className="pixel-label" style={{ marginBottom: 4 }}>{c.username}</div>
            <Monitor size={36} style={{ margin: "0 auto", color: c.screen_sharing_enabled ? "#3a0" : "#aaa" }} />
          </div>
        ))}
      </div>

      {/* Invite coworker box centered below */}
      <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <input
          className="pixel-input"
          type="email"
          placeholder="Invite coworker by email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
          style={{ padding: 8, borderRadius: 6, width: 260, fontSize: 16 }}
        />
        <button className="pixel-btn" type="submit" style={{ fontSize: 16, padding: "6px 20px" }}>
          Invite Coworker
        </button>
      </form>
    </div>
  );
}
