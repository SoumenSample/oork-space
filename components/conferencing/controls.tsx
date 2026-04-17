"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

type LocalTracks = [IMicrophoneAudioTrack, ICameraVideoTrack] | [];

export default function Controls({ tracks }: { tracks: LocalTracks }) {
  const router = useRouter();

  const micTrack = tracks[0];
  const camTrack = tracks[1];

  const controlsDisabled = useMemo(
    () => !micTrack || !camTrack,
    [micTrack, camTrack]
  );

  const [micOverride, setMicOverride] = useState<boolean | null>(null);
  const [cameraOverride, setCameraOverride] = useState<boolean | null>(null);

  const isMicEnabled = micOverride ?? micTrack?.enabled ?? false;
  const isCameraEnabled = cameraOverride ?? camTrack?.enabled ?? false;

  // 🎤 Toggle Mic
  const toggleMic = async () => {
    if (!micTrack) return;

    const next = !isMicEnabled;
    await micTrack.setEnabled(next);

    setMicOverride(next);
  };

  // 📷 Toggle Camera
  const toggleCamera = async () => {
    if (!camTrack) return;

    const next = !isCameraEnabled;
    try {
      await camTrack.setEnabled(next);

      if (next) {
        // Re-attach local preview after enabling camera.
        camTrack.play("local-player");
      } else {
        // Stop rendering local preview while camera is off.
        camTrack.stop();
      }

      setCameraOverride(next);
    } catch (error) {
      console.error("Failed to toggle camera:", error);
    }
  };

  return (
    <div className="flex justify-center items-center gap-4 p-4 bg-gray-900">

      {/* Mic */}
      <button
        onClick={toggleMic}
        disabled={controlsDisabled}
        className={`px-4 py-2 rounded text-white ${
          isMicEnabled ? "bg-gray-600" : "bg-red-500"
        }`}
      >
        {isMicEnabled ? "🎤 Mute" : "🎤 Unmute"}
      </button>

      {/* Camera */}
      <button
        onClick={toggleCamera}
        disabled={controlsDisabled}
        className={`px-4 py-2 rounded text-white ${
          isCameraEnabled ? "bg-gray-600" : "bg-red-500"
        }`}
      >
        {isCameraEnabled ? "📷 Camera Off" : "📷 Camera On"}
      </button>

      {/* Leave */}
      <button
        onClick={() => router.push("/")}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        ❌ Leave
      </button>

    </div>
  );
}