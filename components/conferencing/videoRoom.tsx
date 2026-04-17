"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { useTheme } from "next-themes";

type VideoRoomProps = {
  channel: string;
};

type OfferPayload = {
  offer: RTCSessionDescriptionInit;
  from: string;
};

type AnswerPayload = {
  answer: RTCSessionDescriptionInit;
  from: string;
};

type IcePayload = {
  candidate: RTCIceCandidateInit;
  from: string;
};

type RemoteStreamItem = {
  id: string;
  stream: MediaStream;
};

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL ?? "http://localhost:5000";

function RemoteVideoTile({ id, stream }: { id: string; stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement) {
      videoElement.srcObject = stream;
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
      <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-800">User {id.slice(0, 6)}</div>
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
    </div>
  );
}

export default function VideoRoom({ channel }: VideoRoomProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const activeVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamItem[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);
  const [status, setStatus] = useState("Connecting...");
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const syncVideoTrackForPeers = (nextVideoTrack: MediaStreamTrack | null) => {
    activeVideoTrackRef.current = nextVideoTrack;

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer.getSenders().find((s) => s.track?.kind === "video");
      if (sender && nextVideoTrack) {
        void sender.replaceTrack(nextVideoTrack);
      }
    });
  };

  const stopScreenShare = () => {
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    if (!cameraTrack) return;

    syncVideoTrackForPeers(cameraTrack);

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    screenTrackRef.current?.stop();
    screenTrackRef.current = null;

    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenTrackRef.current = screenTrack;
      syncVideoTrackForPeers(screenTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("Screen share error:", error);
    }
  };

  useEffect(() => {
    let disposed = false;
    const localVideoElement = localVideoRef.current;

    const upsertRemoteStream = (id: string, stream: MediaStream) => {
      setRemoteStreams((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === id);
        if (existingIndex === -1) {
          return [...prev, { id, stream }];
        }

        const next = [...prev];
        next[existingIndex] = { id, stream };
        return next;
      });
    };
    const removeRemotePeer = (id: string) => {
      const peer = peersRef.current[id];
      if (peer) {
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.onconnectionstatechange = null;
        peer.close();
        delete peersRef.current[id];
      }

      setRemoteStreams((prev) => prev.filter((item) => item.id !== id));
    };

    const getOrCreatePeer = (remoteId: string) => {
      if (peersRef.current[remoteId]) {
        return peersRef.current[remoteId];
      }

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      const localStream = localStreamRef.current;
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach((track) => peer.addTrack(track, localStream));

        const videoTrack = activeVideoTrackRef.current ?? localStream.getVideoTracks()[0] ?? null;
        if (videoTrack) {
          peer.addTrack(videoTrack, localStream);
        }
      }

      peer.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          upsertRemoteStream(remoteId, stream);
          setStatus("Connected");
        }
      };

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socketRef.current) {
          return;
        }

        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteId,
        });
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "closed" || peer.connectionState === "disconnected") {
          removeRemotePeer(remoteId);
        }
      };

      peersRef.current[remoteId] = peer;
      return peer;
    };

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        activeVideoTrackRef.current = stream.getVideoTracks()[0] ?? null;
        if (localVideoElement) {
          localVideoElement.srcObject = stream;
        }

        const socket = io(SIGNALING_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-room", channel);
          setStatus("Waiting for others to join...");
        });

        socket.on("user-joined", async (socketId: string) => {
          if (socketId === socket.id) return;

          const peer = getOrCreatePeer(socketId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);

          socket.emit("offer", {
            offer,
            to: socketId,
          });
        });

        socket.on("offer", async ({ offer, from }: OfferPayload) => {
          const peer = getOrCreatePeer(from);

          await peer.setRemoteDescription(new RTCSessionDescription(offer));

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("answer", {
            answer,
            to: from,
          });
        });

        socket.on("answer", async ({ answer, from }: AnswerPayload) => {
          const peer = peersRef.current[from];
          if (!peer) return;

          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", async ({ candidate, from }: IcePayload) => {
          const peer = getOrCreatePeer(from);

          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error("Failed to add ICE candidate", error);
          }
        });

        socket.on("user-left", (socketId: string) => {
          removeRemotePeer(socketId);

          setStatus((prev) => {
            if (prev === "Could not access camera/microphone.") return prev;
            return "A participant left. Waiting for others...";
          });
        });
      } catch (error) {
        setStatus("Could not access camera/microphone.");
        console.error("Video room init failed", error);
      }
    };

    init();

    return () => {
      disposed = true;

      socketRef.current?.disconnect();
      socketRef.current = null;

      Object.values(peersRef.current).forEach((peer) => {
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.onconnectionstatechange = null;
        peer.close();
      });
      peersRef.current = {};

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      activeVideoTrackRef.current = null;
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;

      if (localVideoElement) {
        localVideoElement.srcObject = null;
      }

      setRemoteStreams([]);
    };
  }, [channel]);

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const next = !audioTrack.enabled;
    audioTrack.enabled = next;
    setIsMicEnabled(next);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const next = !videoTrack.enabled;
    videoTrack.enabled = next;
    setIsCamEnabled(next);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-black" : "bg-white"} rounded-2xl text-white flex flex-col`}>
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-300">Meeting ID: {channel}</p>
          <p className="text-xs text-zinc-500">{status}</p>
          <p className="text-xs text-zinc-500">Participants: {remoteStreams.length + 1}</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded text-sm"
        >
          Copy Meeting Link
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
          <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-800">You</div>
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>

        {remoteStreams.map((item) => (
          <RemoteVideoTile key={item.id} id={item.id} stream={item.stream} />
        ))}
      </div>

      <div className="border-t border-zinc-800 p-4 flex justify-center gap-3 flex-wrap">
        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded ${isMicEnabled ? "bg-zinc-700" : "bg-rose-600"}`}
        >
          {isMicEnabled ? "Mute" : "Unmute"}
        </button>
        <button
  onClick={toggleScreenShare}
  className={`px-4 py-2 rounded ${
    isScreenSharing ? "bg-yellow-600" : "bg-zinc-700"
  }`}
>
  {isScreenSharing ? "Stop Share" : "Share Screen"}
</button>

        <button
          onClick={toggleCamera}
          className={`px-4 py-2 rounded ${isCamEnabled ? "bg-zinc-700" : "bg-rose-600"}`}
        >
          {isCamEnabled ? "Camera Off" : "Camera On"}
        </button>

        <button
          onClick={() => router.push("/room")}
          className="px-4 py-2 rounded bg-rose-700"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
