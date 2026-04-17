"use client";

import { useParams } from "next/navigation";
import VideoCall from "@/components/conferencing/videoRoom";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = typeof params?.id === "string" ? params.id : "";

  if (!roomId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading meeting...
      </div>
    );
  }

  return <VideoCall channel={roomId} />;
}