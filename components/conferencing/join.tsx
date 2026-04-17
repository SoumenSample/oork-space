"use client";

import { useState } from "react";

export default function Join({ onJoin }: any) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("test");

  return (
    <div className="p-4 flex flex-col gap-2">
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2"
      />

      <input
        placeholder="Room name"
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        className="border p-2"
      />

      <button
        onClick={() => onJoin(name, channel)}
        className="bg-blue-500 text-white p-2"
      >
        Join Meeting
      </button>
    </div>
  );
}