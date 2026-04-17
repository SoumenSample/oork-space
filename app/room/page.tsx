"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import { SiteHeader } from "@/components/site-header";


export default function Home() {
  const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
  const [meetingId, setMeetingId] = useState("");

  const createMeeting = () => {
    const roomId =
      Math.random().toString(36).substring(2, 6) +
      "-" +
      Math.random().toString(36).substring(2, 6);

    router.push(`/room/${roomId}`);
  };

  const joinMeeting = () => {
    const normalizedId = meetingId.trim();
    if (!normalizedId) return;
    router.push(`/room/${normalizedId}`);
  };

  return (
    <div className={`min-h-screen rounded-2xl border  ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <SiteHeader/>
    <div className={`min-h-screen rounded-2xl  ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"} text-white flex items-center justify-center p-6`}>
      
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Video Meeting App</h1>
        <p className="text-sm text-zinc-400">Create a new meeting or join with a meeting ID.</p>

        <button
          onClick={createMeeting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
        >
          New Meeting
        </button>

        <div className="space-y-2">
          <input
            value={meetingId}
            onChange={(event) => setMeetingId(event.target.value)}
            placeholder="Enter meeting ID"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 outline-none focus:border-blue-500"
          />
          <button
            onClick={joinMeeting}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded"
          >
            Join Meeting
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}