"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Download, Volume2, VolumeX, Maximize,
  Type, RotateCcw, FastForward, Rewind, Play, Pause,
  SkipBack, SkipForward, Film, Palette, Sliders, Music,
  Upload, Scissors, Copy, MoveVertical, Sun, Contrast,
  FlipHorizontal, FlipVertical, RotateCw, ZoomIn,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
interface TextOverlay {
  id: string; text: string; startTime: number; endTime: number;
  x: number; y: number; fontSize: number; color: string; bgColor: string;
  bold: boolean; italic: boolean; fontFamily: string;
}

interface Clip {
  id: string; title: string; url: string; localFile?: boolean;
  startTrim: number; endTrim: number | null;
  audioUrl?: string | null;
  audioTitle?: string | null;
  muteOriginalAudio?: boolean;
  audioVolume?: number;
  volume: number; playbackRate: number;
  brightness: number; contrast: number; saturation: number;
  hue: number; blur: number; sepia: number; grayscale: number;
  sharpness: number; vignette: number; temperature: number;
  flipH: boolean; flipV: boolean; rotate: number; opacity: number;
  textOverlays: TextOverlay[]; addedAt: string;
}

const makeClip = (o: Partial<Clip> & { url: string; title: string }): Clip => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  startTrim: 0, endTrim: null, volume: 1, playbackRate: 1,
  audioUrl: null, audioTitle: null, muteOriginalAudio: false, audioVolume: 1,
  brightness: 100, contrast: 100, saturation: 100, hue: 0,
  blur: 0, sepia: 0, grayscale: 0, sharpness: 0, vignette: 0, temperature: 0,
  flipH: false, flipV: false, rotate: 0, opacity: 100,
  textOverlays: [], addedAt: new Date().toISOString(), ...o,
});

// ── Constants ──────────────────────────────────────────────────────
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4];

const FILTER_PRESETS = [
  { name:"None",      brightness:100,contrast:100,saturation:100,hue:0,  sepia:0, grayscale:0  },
  { name:"Vivid",     brightness:110,contrast:120,saturation:150,hue:0,  sepia:0, grayscale:0  },
  { name:"Muted",     brightness:95, contrast:90, saturation:60, hue:0,  sepia:0, grayscale:0  },
  { name:"Vintage",   brightness:100,contrast:90, saturation:80, hue:0,  sepia:40,grayscale:0  },
  { name:"B&W",       brightness:100,contrast:110,saturation:0,  hue:0,  sepia:0, grayscale:100},
  { name:"Warm",      brightness:105,contrast:100,saturation:110,hue:10, sepia:20,grayscale:0  },
  { name:"Cool",      brightness:95, contrast:100,saturation:90, hue:200,sepia:0, grayscale:0  },
  { name:"Dramatic",  brightness:90, contrast:150,saturation:80, hue:0,  sepia:0, grayscale:0  },
  { name:"Fade",      brightness:110,contrast:80, saturation:70, hue:0,  sepia:10,grayscale:0  },
  { name:"Cinematic", brightness:95, contrast:130,saturation:85, hue:5,  sepia:15,grayscale:0  },
  { name:"Summer",    brightness:110,contrast:105,saturation:130,hue:15, sepia:10,grayscale:0  },
  { name:"Noir",      brightness:85, contrast:140,saturation:0,  hue:0,  sepia:30,grayscale:80 },
];

const FONTS = ["Arial","Georgia","Impact","Courier New","Trebuchet MS","Comic Sans MS","Verdana","Helvetica"];
const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm,video/ogg,video/mov,video/avi,video/mkv,video/*";
const ACCEPTED_AUDIO_TYPES = "audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/*";

function toYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/")[2] || "";
      } else if (url.pathname.startsWith("/live/")) {
        videoId = url.pathname.split("/")[2] || "";
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/")[2] || "";
      }
    }

    if (!videoId) return null;

    const start = url.searchParams.get("t") || url.searchParams.get("start") || "";
    const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
    if (start) {
      const sec = Number(start.replace(/[^0-9]/g, ""));
      if (!Number.isNaN(sec) && sec > 0) {
        embed.searchParams.set("start", String(sec));
      }
    }
    return embed.toString();
  } catch {
    return null;
  }
}

function isYouTubeEmbedUrl(url: string): boolean {
  return /^https:\/\/www\.youtube\.com\/embed\//.test(url);
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getClipAccent(clip: Clip) {
  const hue = hashString(`${clip.id}:${clip.title}`) % 360;
  return {
    hue,
    border: `hsla(${hue}, 85%, 62%, 0.9)`,
    glow: `hsla(${hue}, 90%, 60%, 0.22)`,
    soft: `hsla(${hue}, 90%, 60%, 0.14)`,
    strong: `hsla(${hue}, 90%, 60%, 0.8)`,
  };
}

function getClipTimelineLabel(clip: Clip): string {
  if (clip.localFile) return "Local";
  if (clip.audioUrl) return "Audio";
  try {
    const host = new URL(clip.url).hostname.replace(/^www\./, "");
    if (host.includes("youtube")) return "YouTube";
    if (host) return host.split(".")[0].slice(0, 8);
  } catch {
    // Ignore invalid URLs and fall through to the title-based label.
  }
  return clip.title.trim().split(/\s+/)[0]?.slice(0, 8) || "Clip";
}

function getAudioDisplayName(clip: Clip): string {
  if (clip.audioTitle?.trim()) return clip.audioTitle.trim();

  if (clip.audioUrl) {
    try {
      const url = new URL(clip.audioUrl, window.location.origin);
      const pathName = url.pathname.split("/").filter(Boolean).pop() || "";
      const cleaned = decodeURIComponent(pathName).replace(/\.[^.]+$/, "");
      if (cleaned) return cleaned;
    } catch {
      const fallback = clip.audioUrl.split("/").filter(Boolean).pop() || "";
      const cleaned = decodeURIComponent(fallback.split("?")[0].split("#")[0]).replace(/\.[^.]+$/, "");
      if (cleaned) return cleaned;
    }
  }

  return "Audio";
}

function getExportMediaUrl(rawUrl: string): string {
  try {
    if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) {
      return rawUrl;
    }

    const url = new URL(rawUrl, window.location.origin);
    if (url.protocol === "blob:" || url.protocol === "data:") {
      return rawUrl;
    }

    if (url.origin === window.location.origin) {
      return url.toString();
    }
    return `/api/media-proxy?u=${encodeURIComponent(url.toString())}`;
  } catch {
    return rawUrl;
  }
}

function getExportMediaCandidates(rawUrl: string): string[] {
  const direct = rawUrl;
  const proxied = getExportMediaUrl(rawUrl);
  if (proxied === direct) return [direct];
  return [proxied, direct];
}

function getClipPattern(clip: Clip): string {
  const hue = hashString(`${clip.title}:${clip.id}`) % 360;
  const stripeWidth = 8 + (hashString(clip.id) % 6);
  return `repeating-linear-gradient(135deg, hsla(${hue}, 85%, 62%, 0.18) 0 ${stripeWidth}px, transparent ${stripeWidth}px ${stripeWidth * 2}px)`;
}

// ── Main Component ─────────────────────────────────────────────────
export default function VideoView({ databaseId }: { databaseId: string }) {
  const [clips, setClips]               = useState<Clip[]>([makeClip({ title:"Sample Video", url:"https://www.w3schools.com/html/mov_bbb.mp4" })]);
  const [selectedClip, setSelectedClip] = useState<Clip>(clips[0]);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [activePanel, setActivePanel]   = useState<"clips"|"filter"|"adjust"|"text"|"audio"|"speed"|"transform"|"crop">("clips");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab]             = useState<"url"|"upload">("upload");
  const [newUrl, setNewUrl]             = useState("");
  const [newTitle, setNewTitle]         = useState("");
  const [urlError, setUrlError]         = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Text overlay state
  const [overlayText, setOverlayText]   = useState("");
  const [overlayColor, setOverlayColor] = useState("#ffffff");
  const [overlayBg, setOverlayBg]       = useState("transparent");
  const [overlayFontSize, setOverlayFontSize] = useState(24);
  const [overlayFont, setOverlayFont]   = useState("Arial");
  const [overlayBold, setOverlayBold]   = useState(false);
  const [overlayItalic, setOverlayItalic] = useState(false);
  const [overlayX, setOverlayX]         = useState(50);
  const [overlayY, setOverlayY]         = useState(80);
  const [editingOverlayId, setEditingOverlayId] = useState<string|null>(null);

  // Crop state
  const [cropMode, setCropMode]         = useState(false);
  const [cropAspect, setCropAspect]     = useState("free");

  // Save state
  const [loadedOnce, setLoadedOnce]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [savedAt, setSavedAt]           = useState<string|null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const videoRef     = useRef<HTMLVideoElement>(null);
  const replacementAudioRef = useRef<HTMLAudioElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDropRef = useRef<HTMLDivElement>(null);
  const draggingOverlayIdRef = useRef<string | null>(null);
  const draggingTimelineLayerRef = useRef<{
    id: string;
    durationSeconds: number;
    pointerOffsetSeconds: number;
  } | null>(null);
  const draggingTimelineResizeRef = useRef<{
    id: string;
    edge: "start" | "end";
  } | null>(null);
  const draggingTimelineRectRef = useRef<{ left: number; width: number } | null>(null);
  const draggingClipResizeRef = useRef<{
    id: string;
    edge: "start" | "end";
  } | null>(null);
  const draggingClipResizeRectRef = useRef<{ left: number; width: number } | null>(null);
  const autoPlayNextRef = useRef(false);
  const lastLocalEditAtRef = useRef<number>(Date.now());
  const lastAppliedRemoteSnapshotRef = useRef<string>("");
  const sel = selectedClip;
  const isYouTubeClip = isYouTubeEmbedUrl(sel.url);

  const sourceDuration = duration > 0
    ? duration
    : Math.max(sel.endTrim ?? sel.startTrim + 0.1, sel.startTrim + 0.1);
  const trimStart = Math.max(0, Math.min(sel.startTrim, Math.max(sourceDuration - 0.1, 0)));
  const trimEnd = Math.max(trimStart + 0.1, Math.min(sel.endTrim ?? sourceDuration, sourceDuration));
  const effectiveDuration = Math.max(trimEnd - trimStart, 0.1);

  // ── Load from DB ──
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/databases/${databaseId}/video`);
        const json = await res.json();
        if (json.clips?.length) {
          // Filter out any local blob URLs (they won't survive refresh)
          const restored: Clip[] = json.clips.map((c: Clip) => ({
            ...c,
            url: c.localFile ? "" : c.url,
            audioUrl: c.audioUrl ?? null,
            audioTitle: c.audioTitle ?? null,
            muteOriginalAudio: c.muteOriginalAudio ?? false,
            audioVolume: c.audioVolume ?? 1,
          }));
          lastAppliedRemoteSnapshotRef.current = JSON.stringify(restored);
          setClips(restored);
          setSelectedClip(restored[0]);
        }
      } catch (e) { console.error("Load failed:", e); }
      finally { setLoadedOnce(true); }
    };
    load();
  }, [databaseId]);

  // ── Auto-save ──
  useEffect(() => {
    if (!loadedOnce) return;
    const t = setTimeout(async () => {
      setSaving(true);
      try {
        // Don't save blob URLs (they're session-only)
        const saveable = clips.map(c => ({
          ...c,
          url: c.localFile ? "" : c.url,
        }));
        await fetch(`/api/databases/${databaseId}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clips: saveable }),
        });
        lastAppliedRemoteSnapshotRef.current = JSON.stringify(saveable);
        setSavedAt(new Date().toLocaleTimeString());
      } catch {}
      finally { setSaving(false); }
    }, 3000);
    return () => clearTimeout(t);
  }, [clips, databaseId, loadedOnce]);

  useEffect(() => {
    if (!loadedOnce) return;
    lastLocalEditAtRef.current = Date.now();
  }, [clips, loadedOnce]);

  useEffect(() => {
    if (!databaseId || !loadedOnce) return;

    let cancelled = false;
    const poll = async () => {
      if (Date.now() - lastLocalEditAtRef.current < 1200) return;
      if (editingOverlayId) return;

      try {
        const res = await fetch(`/api/databases/${databaseId}/video`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !Array.isArray(json?.clips)) return;

        const restored: Clip[] = json.clips.map((c: Clip) => ({
          ...c,
          url: c.localFile ? "" : c.url,
          audioUrl: c.audioUrl ?? null,
          audioTitle: c.audioTitle ?? null,
          muteOriginalAudio: c.muteOriginalAudio ?? false,
          audioVolume: c.audioVolume ?? 1,
        }));
        const snapshot = JSON.stringify(restored);
        if (snapshot === lastAppliedRemoteSnapshotRef.current) return;

        lastAppliedRemoteSnapshotRef.current = snapshot;
        setClips(restored);
        setSelectedClip((prev) => restored.find((c) => c.id === prev.id) || restored[0]);
      } catch {
        // Ignore transient collaborator polling errors.
      }
    };

    const t = setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [databaseId, loadedOnce, editingOverlayId]);

  // ── Sync video props ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = sel.muteOriginalAudio ? 0 : sel.volume;
    v.playbackRate = sel.playbackRate;
  }, [sel.volume, sel.playbackRate, sel.muteOriginalAudio, selectedClip.id]);

  useEffect(() => {
    const a = replacementAudioRef.current;
    if (!a) return;
    a.playbackRate = sel.playbackRate;
    a.volume = sel.audioVolume ?? 1;
  }, [sel.playbackRate, sel.audioVolume, selectedClip.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || isYouTubeClip || duration <= 0) return;

    const needsClamp = v.currentTime < trimStart || v.currentTime > trimEnd;
    const nextTime = needsClamp ? trimStart : v.currentTime;

    if (needsClamp) {
      v.currentTime = nextTime;
    }

    setCurrentTime(nextTime);
    setProgress(((nextTime - trimStart) / effectiveDuration) * 100 || 0);
  }, [selectedClip.id, sel.startTrim, sel.endTrim, duration, isYouTubeClip, trimStart, trimEnd, effectiveDuration]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || isYouTubeClip) return;
    if (!autoPlayNextRef.current) return;
    if (v.readyState < 1) return;

    const playFromTrimStart = async () => {
      try {
        if (Math.abs(v.currentTime - trimStart) > 0.03) {
          v.currentTime = trimStart;
          await new Promise<void>((resolve) => {
            const onSeeked = () => resolve();
            v.addEventListener("seeked", onSeeked, { once: true });
            setTimeout(resolve, 120);
          });
        }

        await v.play();
        const a = replacementAudioRef.current;
        if (a && sel.audioUrl) {
          if (Math.abs(a.currentTime - v.currentTime) > 0.12) {
            a.currentTime = v.currentTime;
          }
          await a.play().catch(() => {});
        }
        setIsPlaying(true);
        autoPlayNextRef.current = false;
      } catch {
        setIsPlaying(false);
      }
    };

    void playFromTrimStart();
  }, [selectedClip.id, isYouTubeClip, trimStart, sel.audioUrl]);

  // ── Handlers ──
  const updateClip = useCallback((updates: Partial<Clip>) => {
    setClips(prev => prev.map(c => c.id === sel.id ? { ...c, ...updates } : c));
    setSelectedClip(prev => ({ ...prev, ...updates }));
  }, [sel.id]);

  const playReplacementAudioAt = useCallback(async (time: number) => {
    const a = replacementAudioRef.current;
    if (!a || !sel.audioUrl) return;
    try {
      if (Math.abs(a.currentTime - time) > 0.12) {
        a.currentTime = time;
      }
      await a.play();
    } catch {
      // Ignore autoplay/decoder restrictions.
    }
  }, [sel.audioUrl]);

  const pauseReplacementAudio = useCallback(() => {
    const a = replacementAudioRef.current;
    if (!a) return;
    a.pause();
  }, []);

  const addAudioToSelectedClip = useCallback(async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      alert("Please choose an audio file.");
      return;
    }

    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        throw new Error("Audio upload failed");
      }
      const uploaded = await uploadRes.json();
      updateClip({ audioUrl: uploaded.url, audioTitle: uploaded.name || file.name.replace(/\.[^/.]+$/, "") });
    } catch (error) {
      console.error("Audio upload failed:", error);
      alert("Audio upload failed. Please try again.");
    } finally {
      setUploadingAudio(false);
    }
  }, [updateClip]);

  const playNextClip = useCallback(() => {
    const idx = clips.findIndex(c => c.id === sel.id);
    if (idx < 0 || idx >= clips.length - 1) {
      setIsPlaying(false);
      return false;
    }
    const next = clips[idx + 1];
    autoPlayNextRef.current = true;
    setSelectedClip(next);
    setCurrentTime(next.startTrim);
    setProgress(0);
    return true;
  }, [clips, sel.id]);

  const getClipTimelineDuration = useCallback((clip: Clip) => {
    const fallbackEnd = clip.id === sel.id ? duration : clip.startTrim + 10;
    const end = clip.endTrim ?? fallbackEnd;
    return Math.max(end - clip.startTrim, 0.1);
  }, [duration, sel.id]);

  const playTimelineFromStart = () => {
    if (clips.length === 0) return;
    const first = clips[0];
    if (first.id === sel.id && videoRef.current) {
      videoRef.current.currentTime = first.startTrim;
      void videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      return;
    }

    autoPlayNextRef.current = true;
    setSelectedClip(first);
    setCurrentTime(first.startTrim);
    setProgress(0);
  };

  const cutSelectedClipAtPlayhead = () => {
    const sourceEnd = sel.endTrim ?? duration;
    const cutAt = Number(currentTime.toFixed(2));
    if (cutAt <= sel.startTrim + 0.05 || cutAt >= sourceEnd - 0.05) {
      alert("Move playhead inside the trimmed range to cut.");
      return;
    }

    const first: Clip = {
      ...sel,
      id: Date.now().toString() + "-a",
      endTrim: cutAt,
      title: `${sel.title} (Part 1)`,
    };

    const second: Clip = {
      ...sel,
      id: Date.now().toString() + "-b",
      startTrim: cutAt,
      title: `${sel.title} (Part 2)`,
    };

    setClips(prev => {
      const idx = prev.findIndex(c => c.id === sel.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1, first, second);
      return next;
    });

    setSelectedClip(second);
    setCurrentTime(second.startTrim);
    setProgress(0);
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;

    const current = Math.min(Math.max(v.currentTime, trimStart), trimEnd);
    setCurrentTime(current);
    setProgress(((current - trimStart) / effectiveDuration) * 100 || 0);

    const a = replacementAudioRef.current;
    if (a && sel.audioUrl && Math.abs(a.currentTime - current) > 0.18) {
      a.currentTime = current;
    }

    if (current >= trimEnd - 0.02) {
      v.pause();
      pauseReplacementAudio();
      playNextClip();
    }
  };

  const handleLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    const sourceDuration = v.duration || 0;
    const boundedStart = Math.max(0, Math.min(sel.startTrim, Math.max(sourceDuration - 0.1, 0)));
    const boundedEnd = Math.max(boundedStart + 0.1, Math.min(sel.endTrim ?? sourceDuration, sourceDuration));

    if (boundedStart !== sel.startTrim || (sel.endTrim != null && boundedEnd !== sel.endTrim)) {
      updateClip({
        startTrim: boundedStart,
        endTrim: sel.endTrim == null ? null : boundedEnd,
      });
    }

    if (boundedStart > 0) v.currentTime = boundedStart;
    const a = replacementAudioRef.current;
    if (a && sel.audioUrl) {
      a.currentTime = boundedStart;
    }

    if (autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      void v.play().catch(() => setIsPlaying(false));
      void playReplacementAudioAt(v.currentTime);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !sel.url) return;

    if (isPlaying) {
      v.pause();
      pauseReplacementAudio();
    } else {
      if (v.currentTime < trimStart || v.currentTime >= trimEnd) {
        v.currentTime = trimStart;
      }
      v.play().catch(() => {});
      void playReplacementAudioAt(v.currentTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const nextProgress = Number(e.target.value);
    const nextTime = trimStart + (nextProgress / 100) * effectiveDuration;
    v.currentTime = nextTime;
    const a = replacementAudioRef.current;
    if (a && sel.audioUrl) a.currentTime = nextTime;
    setCurrentTime(nextTime);
    setProgress(nextProgress);
  };

  useEffect(() => {
    const a = replacementAudioRef.current;
    if (!a) return;
    a.pause();
    if (sel.audioUrl) {
      a.currentTime = trimStart;
    }
  }, [selectedClip.id, sel.audioUrl, trimStart]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const getFilter = (c: Clip) =>
    `brightness(${c.brightness}%) contrast(${c.contrast}%) saturate(${c.saturation}%) hue-rotate(${c.hue}deg) blur(${c.blur}px) sepia(${c.sepia}%) grayscale(${c.grayscale}%)`;

  const getTransform = (c: Clip) =>
    `scaleX(${c.flipH ? -1 : 1}) scaleY(${c.flipV ? -1 : 1}) rotate(${c.rotate}deg)`;

  // ── Add from URL ──
  const addFromUrl = () => {
    if (!newUrl.trim()) { setUrlError("Enter a URL"); return; }
    const rawUrl = newUrl.trim();
    const ytEmbedUrl = toYouTubeEmbedUrl(rawUrl);
    const normalizedUrl = ytEmbedUrl || rawUrl;
    const c = makeClip({ title: newTitle || "Untitled", url: normalizedUrl });
    setClips(p => [...p, c]);
    setSelectedClip(c);
    setNewUrl(""); setNewTitle(""); setUrlError(""); setShowAddModal(false);
    setIsPlaying(false);
  };

  // ── Add from desktop file ──
  const addFromFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) { alert("Please select a video file."); return; }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const uploaded = await uploadRes.json();
      const title = file.name.replace(/\.[^/.]+$/, "");
      const c = makeClip({ title, url: uploaded.url, localFile: false });
      setClips(p => [...p, c]);
      setSelectedClip(c);
      setShowAddModal(false);
      setIsPlaying(false);
    } catch (error) {
      console.error("Video upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingVideo(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void addFromFile(file);
    }
    e.target.value = "";
  };

  // ── Drag & drop file onto modal ──
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void addFromFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => setIsDraggingFile(false);

  // ── Clip ops ──
  const deleteClip = (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (clip?.localFile && clip.url) URL.revokeObjectURL(clip.url); // free memory
    const remaining = clips.filter(c => c.id !== id);
    setClips(remaining);
    if (selectedClip.id === id && remaining.length > 0) setSelectedClip(remaining[0]);
  };

  const duplicateClip = (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (!clip) return;
    const newClip = { ...clip, id: Date.now().toString(), title: clip.title + " (copy)" };
    setClips(p => [...p, newClip]);
  };

  const reorderClip = (id: string, dir: "up" | "down") => {
    const idx = clips.findIndex(c => c.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === clips.length - 1) return;
    const arr = [...clips];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setClips(arr);
  };

  // ── Text overlays ──
  const addTextOverlay = () => {
    if (!overlayText.trim()) return;
    const ov: TextOverlay = {
      id: Date.now().toString(), text: overlayText,
      startTime: currentTime, endTime: currentTime + 5,
      x: overlayX, y: overlayY, fontSize: overlayFontSize,
      color: overlayColor, bgColor: overlayBg,
      bold: overlayBold, italic: overlayItalic, fontFamily: overlayFont,
    };
    updateClip({ textOverlays: [...sel.textOverlays, ov] });
    setOverlayText("");
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    updateClip({
      textOverlays: sel.textOverlays.map(o => o.id === id ? { ...o, ...updates } : o),
    });
  };

  const moveOverlay = useCallback((id: string, x: number, y: number) => {
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setClips(prev => prev.map(c => {
      if (c.id !== sel.id) return c;
      return {
        ...c,
        textOverlays: c.textOverlays.map(o =>
          o.id === id ? { ...o, x: clampedX, y: clampedY } : o
        ),
      };
    }));

    setSelectedClip(prev => {
      if (prev.id !== sel.id) return prev;
      return {
        ...prev,
        textOverlays: prev.textOverlays.map(o =>
          o.id === id ? { ...o, x: clampedX, y: clampedY } : o
        ),
      };
    });

    if (editingOverlayId === id) {
      setOverlayX(Math.round(clampedX));
      setOverlayY(Math.round(clampedY));
    }
  }, [editingOverlayId, sel.id]);

  const startOverlayDrag = (e: React.MouseEvent<HTMLDivElement>, overlayId: string) => {
    e.preventDefault();
    e.stopPropagation();
    draggingOverlayIdRef.current = overlayId;
    setEditingOverlayId(overlayId);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const draggingId = draggingOverlayIdRef.current;
      const preview = previewAreaRef.current;
      if (!draggingId || !preview) return;

      const rect = preview.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nextX = ((e.clientX - rect.left) / rect.width) * 100;
      const nextY = ((e.clientY - rect.top) / rect.height) * 100;
      moveOverlay(draggingId, nextX, nextY);
    };

    const onMouseUp = () => {
      draggingOverlayIdRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [moveOverlay]);

  const removeOverlay = (id: string) =>
    updateClip({ textOverlays: sel.textOverlays.filter(o => o.id !== id) });

  const setOverlayLayerTiming = useCallback((id: string, startTime: number, endTime: number) => {
    const maxTimeline = duration > 0 ? duration : 1;
    const boundedStart = Math.max(0, startTime);
    const boundedEnd = Math.max(boundedStart + 0.2, Math.min(endTime, maxTimeline));

    setClips(prev => prev.map(c => {
      if (c.id !== sel.id) return c;
      return {
        ...c,
        textOverlays: c.textOverlays.map(o =>
          o.id === id
            ? {
                ...o,
                startTime: Number(boundedStart.toFixed(2)),
                endTime: Number(boundedEnd.toFixed(2)),
              }
            : o
        ),
      };
    }));

    setSelectedClip(prev => {
      if (prev.id !== sel.id) return prev;
      return {
        ...prev,
        textOverlays: prev.textOverlays.map(o =>
          o.id === id
            ? {
                ...o,
                startTime: Number(boundedStart.toFixed(2)),
                endTime: Number(boundedEnd.toFixed(2)),
              }
            : o
        ),
      };
    });
  }, [sel.id, duration]);

  const moveOverlayLayerInTimeline = useCallback((id: string, startTime: number, endTime: number) => {
    setOverlayLayerTiming(id, startTime, endTime);
  }, [setOverlayLayerTiming]);

  const setClipTimelineEnd = useCallback((id: string, endTrim: number | null) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, endTrim } : c));
    setSelectedClip(prev => prev.id === id ? { ...prev, endTrim } : prev);
  }, []);

  const setClipTimelineStart = useCallback((id: string, startTrim: number) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, startTrim, endTrim: c.endTrim != null ? Math.max(startTrim + 0.1, c.endTrim) : c.endTrim } : c));
    setSelectedClip(prev => prev.id === id ? { ...prev, startTrim, endTrim: prev.endTrim != null ? Math.max(startTrim + 0.1, prev.endTrim) : prev.endTrim } : prev);
  }, []);

  const startClipResize = (e: React.MouseEvent<HTMLSpanElement>, clip: Clip, edge: "start" | "end") => {
    e.preventDefault();
    e.stopPropagation();

    const buttonEl = e.currentTarget.parentElement as HTMLButtonElement | null;
    const rowRect = buttonEl?.getBoundingClientRect();
    if (!rowRect || !rowRect.width) return;

    draggingTimelineLayerRef.current = null;
    draggingTimelineResizeRef.current = null;
    draggingClipResizeRectRef.current = { left: rowRect.left, width: rowRect.width };
    draggingClipResizeRef.current = { id: clip.id, edge };
  };

  const startTimelineLayerResize = (
    e: React.MouseEvent<HTMLSpanElement>,
    overlayId: string,
    edge: "start" | "end"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const buttonEl = e.currentTarget.parentElement as HTMLButtonElement | null;
    const rowRect = (buttonEl?.parentElement as HTMLDivElement | null)?.getBoundingClientRect();
    if (!rowRect || !rowRect.width) return;

    draggingTimelineLayerRef.current = null;
    draggingTimelineRectRef.current = { left: rowRect.left, width: rowRect.width };
    draggingTimelineResizeRef.current = { id: overlayId, edge };
    setEditingOverlayId(overlayId);
  };

  const startTimelineLayerDrag = (e: React.MouseEvent<HTMLButtonElement>, overlay: TextOverlay) => {
    e.preventDefault();
    e.stopPropagation();

    const rowRect = (e.currentTarget.parentElement as HTMLDivElement | null)?.getBoundingClientRect();
    if (!rowRect || !rowRect.width) return;

    const pointerSeconds = ((e.clientX - rowRect.left) / rowRect.width) * timelineDuration;
    const overlayDuration = Math.max(overlay.endTime - overlay.startTime, 0.2);

    draggingTimelineRectRef.current = { left: rowRect.left, width: rowRect.width };
    draggingTimelineLayerRef.current = {
      id: overlay.id,
      durationSeconds: overlayDuration,
      pointerOffsetSeconds: pointerSeconds - overlay.startTime,
    };
    setEditingOverlayId(overlay.id);
  };

  const activeOverlays = sel.textOverlays.filter(
    o => currentTime >= o.startTime && currentTime <= o.endTime
  );

  const timelineDuration = duration > 0 ? duration : 1;

  const timelineParts = clips.map((clip) => {
    const clipDuration = getClipTimelineDuration(clip);
    return { clip, clipDuration };
  });
  const timelineTotalDuration = timelineParts.reduce((sum, item) => sum + item.clipDuration, 0) || 1;

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const resizing = draggingTimelineResizeRef.current;
      const dragging = draggingTimelineLayerRef.current;
      const clipResizing = draggingClipResizeRef.current;
      const rect = draggingTimelineRectRef.current;
      const clipRect = draggingClipResizeRectRef.current;
      const activeRect = rect || clipRect;
      if (!activeRect || !activeRect.width) return;

      const pointerSeconds = ((e.clientX - activeRect.left) / activeRect.width) * timelineDuration;

      if (resizing) {
        const overlay = sel.textOverlays.find((o) => o.id === resizing.id);
        if (!overlay) return;

        if (resizing.edge === "start") {
          const nextStart = Math.min(Math.max(pointerSeconds, 0), overlay.endTime - 0.2);
          setOverlayLayerTiming(overlay.id, nextStart, overlay.endTime);
        } else {
          const nextEnd = Math.max(overlay.startTime + 0.2, Math.min(pointerSeconds, timelineDuration));
          setOverlayLayerTiming(overlay.id, overlay.startTime, nextEnd);
        }
        return;
      }

      if (clipResizing) {
        const clip = clips.find((c) => c.id === clipResizing.id);
        if (!clip) return;

        if (clipResizing.edge === "start") {
          const maxStart = Math.max(0, clip.endTrim ? clip.endTrim - 0.1 : timelineDuration - 0.1);
          const nextStart = Math.min(Math.max(pointerSeconds, 0), maxStart);
          setClipTimelineStart(clip.id, Number(nextStart.toFixed(2)));
        } else {
          const minEnd = clip.startTrim + 0.1;
          const maxEnd = Math.max(minEnd, timelineDuration);
          const nextEnd = Math.max(minEnd, Math.min(pointerSeconds, maxEnd));
          setClipTimelineEnd(clip.id, Number(nextEnd.toFixed(2)));
        }
        return;
      }

      if (!dragging) return;

      const unclampedStart = pointerSeconds - dragging.pointerOffsetSeconds;
      const maxStart = Math.max(timelineDuration - dragging.durationSeconds, 0);
      const nextStart = Math.min(Math.max(unclampedStart, 0), maxStart);
      const nextEnd = nextStart + dragging.durationSeconds;

      moveOverlayLayerInTimeline(dragging.id, nextStart, nextEnd);

      return;
    };

    const onMouseUp = () => {
      draggingTimelineLayerRef.current = null;
      draggingTimelineResizeRef.current = null;
      draggingTimelineRectRef.current = null;
      draggingClipResizeRef.current = null;
      draggingClipResizeRectRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [clips, timelineDuration, moveOverlayLayerInTimeline, sel.textOverlays, setClipTimelineEnd, setClipTimelineStart, setOverlayLayerTiming]);

  // ── Export ──
  const handleExport = async () => {
    if (isExporting) return;
    if (clips.length === 0) {
      alert("No clips to export.");
      return;
    }

    if (clips.some((c) => isYouTubeEmbedUrl(c.url))) {
      alert("Export does not support YouTube embed clips. Remove YouTube clips or replace with uploaded/direct video files.");
      return;
    }

    const exportableClips = clips.filter((c) => typeof c.url === "string" && c.url.trim().length > 0);
    if (exportableClips.length === 0) {
      alert("No exportable clips found. Add uploaded/direct video clips first.");
      return;
    }

    const pickMimeType = () => {
      const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
    };

    const waitFor = (target: EventTarget, event: string, timeoutMs = 15000) => new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        target.removeEventListener(event, onOk as EventListener);
        target.removeEventListener("error", onErr as EventListener);
        reject(new Error(`Timed out waiting for ${event}`));
      }, timeoutMs);

      const onOk = () => {
        window.clearTimeout(timeout);
        target.removeEventListener(event, onOk as EventListener);
        target.removeEventListener("error", onErr as EventListener);
        resolve();
      };
      const onErr = () => {
        window.clearTimeout(timeout);
        target.removeEventListener(event, onOk as EventListener);
        target.removeEventListener("error", onErr as EventListener);
        reject(new Error(`Failed while waiting for ${event}`));
      };
      target.addEventListener(event, onOk as EventListener, { once: true });
      target.addEventListener("error", onErr as EventListener, { once: true });
    });

    const loadMediaWithFallback = async (media: HTMLMediaElement, candidates: string[]) => {
      let lastError: unknown = null;

      for (const src of candidates) {
        try {
          media.src = src;
          media.load();
          await waitFor(media, "loadedmetadata", 12000);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error("Failed to load media source");
    };

    const drawFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, clip: Clip, video: HTMLVideoElement, videoTime: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sourceW = Math.max(video.videoWidth || canvas.width, 1);
      const sourceH = Math.max(video.videoHeight || canvas.height, 1);
      const scale = Math.min(canvas.width / sourceW, canvas.height / sourceH);
      const drawW = sourceW * scale;
      const drawH = sourceH * scale;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((clip.rotate * Math.PI) / 180);
      ctx.scale(clip.flipH ? -1 : 1, clip.flipV ? -1 : 1);
      ctx.globalAlpha = clip.opacity / 100;
      ctx.filter = `brightness(${clip.brightness}%) contrast(${clip.contrast}%) saturate(${clip.saturation}%) hue-rotate(${clip.hue}deg) blur(${clip.blur}px) sepia(${clip.sepia}%) grayscale(${clip.grayscale}%)`;
      ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      if (clip.vignette > 0) {
        const vignette = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          Math.min(canvas.width, canvas.height) * 0.2,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) * 0.6
        );
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, `rgba(0,0,0,${Math.min(clip.vignette / 30, 0.9)})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      clip.textOverlays
        .filter((o) => videoTime >= o.startTime && videoTime <= o.endTime)
        .forEach((o) => {
          const x = (o.x / 100) * canvas.width;
          const y = (o.y / 100) * canvas.height;
          const fontWeight = o.bold ? "bold" : "normal";
          const fontStyle = o.italic ? "italic" : "normal";
          const font = `${fontStyle} ${fontWeight} ${Math.max(10, o.fontSize)}px ${o.fontFamily || "Arial"}`;
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const padX = 8;
          const padY = 6;
          const textW = ctx.measureText(o.text).width;
          const boxW = textW + padX * 2;
          const boxH = Math.max(20, o.fontSize + padY * 2);

          if (o.bgColor && o.bgColor !== "transparent") {
            ctx.fillStyle = o.bgColor;
            ctx.fillRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
          }

          ctx.fillStyle = o.color || "#ffffff";
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.fillText(o.text, x, y);
          ctx.shadowBlur = 0;
        });
    };

    const waitForNextVideoFrame = (video: HTMLVideoElement) =>
      new Promise<void>((resolve) => {
        const videoWithFrameCallback = video as HTMLVideoElement & {
          requestVideoFrameCallback?: (cb: () => void) => number;
        };

        if (typeof videoWithFrameCallback.requestVideoFrameCallback === "function") {
          videoWithFrameCallback.requestVideoFrameCallback(() => resolve());
        } else {
          setTimeout(resolve, 16);
        }
      });

    try {
      setIsExporting(true);
      setExportProgress(0);

      const probeVideo = document.createElement("video");
      probeVideo.crossOrigin = "anonymous";
      probeVideo.preload = "metadata";
      await loadMediaWithFallback(probeVideo, getExportMediaCandidates(exportableClips[0].url));

      const width = Math.max(640, probeVideo.videoWidth || 1280);
      const height = Math.max(360, probeVideo.videoHeight || 720);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("Export failed: canvas context unavailable.");
        return;
      }

      const canvasStream = canvas.captureStream(30);
      const audioContext = new AudioContext();
      await audioContext.resume();
      const audioDestination = audioContext.createMediaStreamDestination();
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);
      const recorder = new MediaRecorder(combinedStream, { mimeType: pickMimeType() });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.start(250);

      for (let i = 0; i < exportableClips.length; i += 1) {
        const clip = exportableClips[i];
        if (!clip.url) continue;

        const v = document.createElement("video");
        v.crossOrigin = "anonymous";
        v.preload = "auto";
        v.muted = false;
        v.volume = Math.max(0, Math.min(1, clip.volume));
        v.playsInline = true;
        v.playbackRate = clip.playbackRate || 1;

        let sourceNode: MediaElementAudioSourceNode | null = null;
        let clipGain: GainNode | null = null;
        if (!clip.muteOriginalAudio) {
          sourceNode = audioContext.createMediaElementSource(v);
          clipGain = audioContext.createGain();
          clipGain.gain.value = Math.max(0, clip.volume);
          sourceNode.connect(clipGain);
          clipGain.connect(audioDestination);
        }

        let replacementAudio: HTMLAudioElement | null = null;
        let replacementSourceNode: MediaElementAudioSourceNode | null = null;
        let replacementGain: GainNode | null = null;
        if (clip.audioUrl) {
          replacementAudio = document.createElement("audio");
          replacementAudio.crossOrigin = "anonymous";
          replacementAudio.preload = "auto";
          replacementAudio.playbackRate = clip.playbackRate || 1;
          replacementAudio.volume = Math.max(0, Math.min(1, clip.audioVolume ?? 1));

          try {
            await loadMediaWithFallback(replacementAudio, getExportMediaCandidates(clip.audioUrl));
            replacementSourceNode = audioContext.createMediaElementSource(replacementAudio);
            replacementGain = audioContext.createGain();
            replacementGain.gain.value = Math.max(0, clip.audioVolume ?? 1);
            replacementSourceNode.connect(replacementGain);
            replacementGain.connect(audioDestination);
          } catch {
            replacementAudio = null;
          }
        }

        await loadMediaWithFallback(v, getExportMediaCandidates(clip.url));

        const sourceDur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : (clip.endTrim ?? clip.startTrim + 0.1);
        const clipStart = Math.max(0, Math.min(clip.startTrim, Math.max(sourceDur - 0.1, 0)));
        const clipEnd = Math.max(clipStart + 0.1, Math.min(clip.endTrim ?? sourceDur, sourceDur));

        v.currentTime = clipStart;
        await waitFor(v, "seeked");
        await v.play();
        if (replacementAudio) {
          replacementAudio.currentTime = clipStart;
          await replacementAudio.play().catch(() => {});
        }

        let previousTime = v.currentTime;
        let lastAdvancedAt = performance.now();
        let staleFrameCount = 0;

        while (v.currentTime < clipEnd && !v.ended) {
          drawFrame(ctx, canvas, clip, v, v.currentTime);
          await waitForNextVideoFrame(v);

          if (replacementAudio && Math.abs(replacementAudio.currentTime - v.currentTime) > 0.25) {
            replacementAudio.currentTime = v.currentTime;
          }

          if (Math.abs(v.currentTime - previousTime) < 0.0005) {
            staleFrameCount += 1;
            if (staleFrameCount > 8) {
              await new Promise<void>((resolve) => setTimeout(resolve, 16));
              staleFrameCount = 0;
            }

            if (performance.now() - lastAdvancedAt > 3500) {
              throw new Error(`Playback stalled while exporting clip: ${clip.title}`);
            }
          } else {
            staleFrameCount = 0;
            lastAdvancedAt = performance.now();
          }
          previousTime = v.currentTime;
        }

        v.pause();
        if (replacementAudio) replacementAudio.pause();
        if (sourceNode) sourceNode.disconnect();
        if (clipGain) clipGain.disconnect();
        if (replacementSourceNode) replacementSourceNode.disconnect();
        if (replacementGain) replacementGain.disconnect();
        if (v.currentTime < clipEnd) {
          try {
            v.currentTime = clipEnd;
            await waitFor(v, "seeked");
          } catch {
            // Keep best effort final frame.
          }
        }
        drawFrame(ctx, canvas, clip, v, Math.min(v.currentTime, clipEnd));
        setExportProgress(Math.round(((i + 1) / exportableClips.length) * 100));
      }

      const recorderStopPromise = waitFor(recorder, "stop", 10000);
      recorder.stop();
      await recorderStopPromise;

      const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
      const outUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = outUrl;
      a.download = `video-project-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(outUrl);
      await audioContext.close();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. This can happen with blocked cross-origin videos. Use uploaded/local project videos and try again.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleSnapshot = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = getFilter(sel);
    ctx.drawImage(v, 0, 0);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `snapshot-${Date.now()}.png`;
    a.click();
  };

  // ── Components ──
  const PanelBtn = ({ id, icon, label }: { id: typeof activePanel; icon: React.ReactNode; label: string }) => (
    <button onClick={() => setActivePanel(id)}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium transition whitespace-nowrap ${activePanel === id ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
      {icon}{label}
    </button>
  );

  const Slider = ({ label, value, min, max, step = 1, onChange, onReset, unit = "" }:
    { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onReset?: () => void; unit?: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-400 w-18 shrink-0 leading-tight">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-indigo-500 cursor-pointer"/>
      <span className="text-[9px] text-gray-400 w-10 text-right">{value}{unit}</span>
      {onReset && (
        <button onClick={onReset} title="Reset" className="text-gray-600 hover:text-gray-400 transition shrink-0">
          <RotateCcw size={9}/>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden rounded-2xl">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">🎥 Video Editor</span>
          {saving && <span className="text-[9px] text-amber-400 animate-pulse">● Saving</span>}
          {!saving && savedAt && <span className="text-[9px] text-emerald-400">✓ {savedAt}</span>}
          {isExporting && <span className="text-[9px] text-cyan-400 animate-pulse">Exporting {exportProgress}%</span>}
          {sel.localFile && <span className="text-[9px] text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">Local file</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleSnapshot} title="Snapshot current frame"
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
            📸 Snapshot
          </button>
          <button onClick={() => { void handleExport(); }} disabled={isExporting}
            className={`flex items-center gap-1 px-2 py-1 text-white text-xs rounded-lg transition ${isExporting ? "bg-gray-600 cursor-not-allowed opacity-70" : "bg-gray-700 hover:bg-gray-600"}`}>
            <Download size={12}/> {isExporting ? "Exporting..." : "Export"}
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition">
            <Plus size={12}/> Add Clip
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: Clip list ══ */}
        <div className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Clips ({clips.length})</p>
            {/* Quick upload button */}
            <label title="Upload from desktop" className="cursor-pointer p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition">
              <Upload size={12}/>
              <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {clips.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-600">
                <Film size={20}/>
                <p className="text-[10px] text-center px-4">No clips yet.<br/>Click + Add Clip</p>
              </div>
            )}
            {clips.map((c) => (
              <div key={c.id}
                onClick={() => { setSelectedClip(c); setIsPlaying(false); }}
                className={`flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-gray-800 transition border-b border-gray-800 group ${selectedClip.id === c.id ? "bg-gray-800 border-l-2 border-l-indigo-500" : ""}`}>
                <div className="w-10 h-8 bg-gray-700 rounded flex items-center justify-center text-sm shrink-0 relative">
                  🎬
                  {c.localFile && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <Upload size={7}/>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{c.title}</p>
                  <p className="text-[9px] text-gray-500">{fmt(c.startTrim)} → {c.endTrim ? fmt(c.endTrim) : "end"}</p>
                </div>
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button onClick={e => { e.stopPropagation(); duplicateClip(c.id); }} className="p-0.5 bg-blue-600 rounded text-white" title="Duplicate"><Copy size={8}/></button>
                  <button onClick={e => { e.stopPropagation(); deleteClip(c.id); }} className="p-0.5 bg-red-600 rounded text-white" title="Delete"><Trash2 size={8}/></button>
                </div>
              </div>
            ))}
          </div>

          {/* Drop zone in sidebar */}
          <div
            className="m-2 rounded-xl border-2 border-dashed border-gray-700 hover:border-indigo-500 transition cursor-pointer p-3 text-center"
            onClick={() => fileInputRef.current?.click()}
            onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) { void addFromFile(f); } }}
            onDragOver={e => e.preventDefault()}
          >
            <Upload size={14} className="mx-auto mb-1 text-gray-500"/>
            <p className="text-[9px] text-gray-500 leading-tight">Drop video here<br/>or click to browse</p>
            <input ref={fileInputRef} type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
          </div>
        </div>

        {/* ══ CENTER: Video preview ══ */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Video */}
          <div ref={previewAreaRef} className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {sel.url ? (
              <>
                {isYouTubeClip ? (
                  <iframe
                    src={sel.url}
                    className="h-full w-full"
                    title={sel.title || "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video ref={videoRef} src={sel.url} crossOrigin="anonymous"
    className="max-h-full max-w-full"
    style={{
      filter: getFilter(sel),
      transform: getTransform(sel),
      opacity: sel.opacity / 100,
    }}
    onTimeUpdate={handleTimeUpdate}
    onLoadedMetadata={handleLoaded}
    onEnded={() => {
      pauseReplacementAudio();
      playNextClip();
    }}
    onClick={togglePlay}
  />
                )}

                {sel.audioUrl && (
                  <audio
                    ref={replacementAudioRef}
                    src={sel.audioUrl}
                    preload="auto"
                    className="hidden"
                  />
                )}

                {/* Vignette overlay */}
                {sel.vignette > 0 && (
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 ${sel.vignette * 3}px ${sel.vignette * 2}px rgba(0,0,0,0.8)` }}/>
                )}

                {/* Text overlays */}
                {activeOverlays.map(o => (
                  <div
                    key={o.id}
                    onMouseDown={(e) => startOverlayDrag(e, o.id)}
                    className={`absolute px-2 py-1 rounded select-none pointer-events-auto cursor-move ${editingOverlayId === o.id ? "ring-1 ring-indigo-400" : ""}`}
                    style={{
                      left: `${o.x}%`, top: `${o.y}%`, transform: "translate(-50%,-50%)",
                      fontSize: o.fontSize, color: o.color,
                      backgroundColor: o.bgColor === "transparent" ? "rgba(0,0,0,0)" : o.bgColor,
                      fontFamily: o.fontFamily,
                      fontWeight: o.bold ? "bold" : "normal",
                      fontStyle: o.italic ? "italic" : "normal",
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    }}>
                    {o.text}
                  </div>
                ))}

                {/* Play overlay */}
                {!isYouTubeClip && !isPlaying && (
                  <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center cursor-pointer">
                    <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition">
                      <Play size={24} className="ml-0.5"/>
                    </div>
                  </div>
                )}

                {/* Crop overlay hint */}
                {cropMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-dashed border-yellow-400 w-3/4 h-3/4 rounded"/>
                    <div className="absolute bg-yellow-400/20 inset-0"/>
                  </div>
                )}
              </>
            ) : (
              // Empty state — drop target
              <div
                className="flex flex-col items-center justify-center gap-3 text-gray-600 w-full h-full"
                onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) { void addFromFile(f); } }}
                onDragOver={e => e.preventDefault()}
              >
                <Film size={40} className="opacity-30"/>
                <p className="text-sm text-gray-500">No video loaded</p>
                <p className="text-[11px] text-gray-600">Drop a video file here, or use the sidebar</p>
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg cursor-pointer transition flex items-center gap-2">
                  <Upload size={14}/> Upload Video
                  <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
                </label>
              </div>
            )}
          </div>

          {/* ── Timeline + Controls ── */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 shrink-0">
            {/* Progress / timeline */}
            <div className="relative mb-2">
              {isYouTubeClip ? (
                <div className="mb-1 rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 text-[10px] text-yellow-200">
                  YouTube embeds use player controls from YouTube. Timeline trim/filter playback controls apply to direct video files.
                </div>
              ) : null}
              <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden cursor-pointer">
                {/* Trim zone */}
                <div className="absolute h-full bg-indigo-900/40 border-x-2 border-indigo-500"
                  style={{
                    left: `${(trimStart / duration) * 100 || 0}%`,
                    right: `${100 - ((trimEnd || duration) / duration) * 100 || 0}%`,
                  }}/>
                {/* Progress fill */}
                <div className="absolute left-0 top-0 h-full bg-indigo-600/20 transition-all"
                  style={{ width: `${progress}%` }}/>
                {/* Playhead */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
                  style={{ left: `${progress}%` }}/>
                {/* Text overlay markers */}
                {sel.textOverlays.map(o => (
                  <div key={o.id} className="absolute top-0 h-1.5 bg-yellow-400 opacity-70 rounded-sm"
                    style={{
                      left: `${(o.startTime / duration) * 100}%`,
                      width: `${((o.endTime - o.startTime) / duration) * 100}%`,
                    }}/>
                ))}
                <input type="range" min={0} max={100} step={0.1} value={progress}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"/>
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mt-0.5 px-0.5">
                <span>{fmt(currentTime)}</span>
                <span className="text-gray-600">{trimStart > 0 || sel.endTrim ? `Trim: ${fmt(trimStart)} → ${fmt(trimEnd)}` : ""}</span>
                <span>{fmt(effectiveDuration)}</span>
              </div>
            </div>

            {/* Full project timeline (all clips in sequence) */}
            <div className="mb-2.5 rounded-lg border border-gray-800 bg-gray-950/70 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Video Layer Timeline</p>
                <button
                  onClick={playTimelineFromStart}
                  className="rounded bg-indigo-600 px-2 py-0.5 text-[9px] font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Play Timeline
                </button>
              </div>
              <div className="space-y-1.5">
                {timelineParts.map(({ clip, clipDuration }, idx) => (
                  <div
                    key={clip.id}
                    className={`relative h-12 rounded border border-gray-800 text-left transition ${
                      clip.id === sel.id ? "text-white" : "bg-gray-900 text-gray-300 hover:bg-gray-800"
                    }`}
                    style={{
                      width: `${(clipDuration / timelineTotalDuration) * 100}%`,
                      backgroundImage: `${getClipPattern(clip)}, linear-gradient(180deg, ${getClipAccent(clip).soft} 0%, rgba(17,24,39,0.96) 52%, rgba(17,24,39,0.98) 100%)`,
                      borderTop: `3px solid ${getClipAccent(clip).border}`,
                      boxShadow: clip.id === sel.id ? `inset 0 0 0 1px ${getClipAccent(clip).strong}, 0 0 0 1px ${getClipAccent(clip).glow}` : undefined,
                    }}
                    title={`${clip.title} (${fmt(clipDuration)})`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClip(clip);
                        setIsPlaying(false);
                        setCurrentTime(clip.startTrim);
                        setProgress(0);
                        if (videoRef.current && clip.id === sel.id) {
                          videoRef.current.currentTime = clip.startTrim;
                        }
                      }}
                      className="absolute inset-0 w-full px-2 pt-0 text-left"
                      title={`${clip.title} (${fmt(clipDuration)})`}
                    >
                      <span className="absolute left-1 top-0.5 rounded bg-black/30 px-1 text-[8px] text-gray-100">
                        {idx + 1}
                      </span>
                      <span className="absolute left-6 top-0.5 rounded bg-black/30 px-1 text-[7px] uppercase tracking-wider text-gray-200">
                        {getClipTimelineLabel(clip)}
                      </span>
                      <span className="absolute right-1 top-0.5 flex items-center gap-1">
                        {clip.audioUrl && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-cyan-500/20 px-1 py-0.5 text-[7px] text-cyan-200" title="Added audio track">
                            <Music size={8}/> Add
                          </span>
                        )}
                        {clip.muteOriginalAudio && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-red-500/20 px-1 py-0.5 text-[7px] text-red-200" title="Original audio muted">
                            <VolumeX size={8}/> Mute
                          </span>
                        )}
                      </span>
                      <div className="mt-2.5 truncate text-[9px] font-medium">{clip.title}</div>
                      <div className="flex items-center gap-1 truncate text-[8px] text-gray-400">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getClipAccent(clip).border }} />
                        <span className="truncate">{fmt(clipDuration)}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800/60">
                        {clip.audioUrl ? (
                          <div className="h-full w-full bg-cyan-400/80" title="Added audio present"/>
                        ) : !clip.muteOriginalAudio ? (
                          <div className="h-full w-full bg-gray-500/70" title="Using original clip audio"/>
                        ) : null}
                      </div>
                    </button>
                    <span
                      onMouseDown={(e) => startClipResize(e, clip, "start")}
                      className="absolute left-0 top-0 h-full w-3 cursor-ew-resize bg-white/0 hover:bg-white/10"
                      title="Drag to move clip start"
                    >
                      <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded bg-white/60" />
                    </span>
                    <span
                      onMouseDown={(e) => startClipResize(e, clip, "end")}
                      className="absolute right-0 top-0 h-full w-3 cursor-ew-resize bg-white/0 hover:bg-white/10"
                      title="Drag to increase or decrease clip length"
                    >
                      <span className="absolute right-0.5 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded bg-white/60" />
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[8px] text-gray-500">Each block is one video clip in playback order. Drag the left or right edge to change the clip timing.</p>

              <div className="mt-1.5 rounded border border-gray-800 bg-gray-900/70 px-1.5 py-1">
                <div className="mb-1 flex items-center justify-between text-[8px] text-gray-500">
                  <span className="uppercase tracking-wider">Audio Layer Timeline</span>
                  <span>{clips.filter((c) => !!c.audioUrl).length} added track(s)</span>
                </div>

                {clips.some((c) => c.audioUrl || !c.muteOriginalAudio) ? (
                  <div className="space-y-1.5">
                    {timelineParts.map(({ clip, clipDuration }, idx) => {
                      const accent = getClipAccent(clip);
                      const audioState = clip.audioUrl ? "Added audio" : clip.muteOriginalAudio ? "Muted" : "Original audio";

                      return (
                        <div
                          key={`${clip.id}-audio-layer`}
                          className="relative h-9 overflow-hidden rounded border border-gray-800 bg-gray-950"
                          style={{
                            width: `${(clipDuration / timelineTotalDuration) * 100}%`,
                            backgroundImage: `${getClipPattern(clip)}, linear-gradient(180deg, ${accent.soft} 0%, rgba(17,24,39,0.95) 100%)`,
                          }}
                          title={audioState}
                        >
                          <div className="absolute inset-0">
                            <div className="absolute left-1 top-0.5 rounded bg-black/30 px-1 text-[8px] text-gray-100">
                              {idx + 1}
                            </div>
                            <div className="absolute left-6 top-0.5 rounded bg-black/30 px-1 text-[7px] uppercase tracking-wider text-gray-200">
                              {getClipTimelineLabel(clip)}
                            </div>
                            <div className="absolute right-1 top-0.5 flex items-center gap-1">
                              {clip.audioUrl ? (
                                <span className="inline-flex items-center gap-0.5 rounded bg-cyan-500/20 px-1 py-0.5 text-[7px] text-cyan-200" title="Added audio track">
                                  <Music size={8}/> Add
                                </span>
                              ) : !clip.muteOriginalAudio ? (
                                <span className="inline-flex items-center gap-0.5 rounded bg-gray-500/20 px-1 py-0.5 text-[7px] text-gray-200" title="Original audio">
                                  <Volume2 size={8}/> Orig
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 rounded bg-red-500/20 px-1 py-0.5 text-[7px] text-red-200" title="Muted audio">
                                  <VolumeX size={8}/> Mute
                                </span>
                              )}
                            </div>

                            <div className="mt-2.5 truncate px-2 text-[9px] font-medium text-white">
                              {clip.audioUrl ? getAudioDisplayName(clip) : clip.muteOriginalAudio ? "Muted" : "Original audio"}
                            </div>
                            <div className="flex items-center gap-1 px-2 text-[8px] text-gray-400">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent.border }} />
                              <span className="truncate">{fmt(clipDuration)}</span>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800/60">
                              {clip.audioUrl ? (
                                <div className="h-full w-full bg-cyan-400/80" title="Added audio present" />
                              ) : !clip.muteOriginalAudio ? (
                                <div className="h-full w-full bg-gray-500/70" title="Using original clip audio" />
                              ) : (
                                <div className="h-full w-full bg-transparent" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-500">No audio layers yet. Add audio from the Audio panel.</p>
                )}

                <div className="mt-1 flex items-center gap-2 text-[8px] text-gray-500">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-cyan-500/80"/>Added</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-gray-500/70"/>Original</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-gray-700 bg-transparent"/>Muted</span>
                </div>
              </div>
            </div>

            {/* Text layer timeline */}
            <div className="mb-2.5 rounded-lg border border-gray-800 bg-gray-950/70 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Text Layer Timeline</p>
                <span className="text-[8px] text-gray-500">{sel.textOverlays.length} layer(s)</span>
              </div>

              {sel.textOverlays.length === 0 ? (
                <p className="text-[9px] text-gray-500">No text layers yet. Add text from the Text panel.</p>
              ) : (
                <div className="space-y-1.5">
                  {sel.textOverlays.map((o) => {
                    const layerWidth = Math.max(((o.endTime - o.startTime) / timelineDuration) * 100, 4);
                    const layerLeft = Math.max((o.startTime / timelineDuration) * 100, 0);

                    return (
                      <div key={o.id} className="relative h-9 rounded border border-gray-800 bg-gray-900">
                        <button
                          onMouseDown={(e) => startTimelineLayerDrag(e, o)}
                          onClick={() => {
                            setEditingOverlayId(o.id);
                            if (videoRef.current) videoRef.current.currentTime = o.startTime;
                          }}
                          className={`absolute top-1/2 -translate-y-1/2 h-7 rounded px-2 text-left text-[9px] transition cursor-grab active:cursor-grabbing ${editingOverlayId === o.id ? "bg-amber-500/40 border border-amber-400 text-white" : "bg-yellow-500/25 border border-yellow-400/40 text-yellow-100 hover:bg-yellow-500/35"}`}
                          style={{ left: `${layerLeft}%`, width: `${layerWidth}%` }}
                          title={`${o.text} (${fmt(o.startTime)} → ${fmt(o.endTime)})`}
                        >
                          <span
                            onMouseDown={(e) => startTimelineLayerResize(e, o.id, "start")}
                            className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize rounded-l bg-black/30 hover:bg-black/50"
                            title="Drag to change layer start"
                          />
                          <div className="truncate px-2">{o.text || "Text"}</div>
                          <span
                            onMouseDown={(e) => startTimelineLayerResize(e, o.id, "end")}
                            className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize rounded-r bg-black/30 hover:bg-black/50"
                            title="Drag to change layer end"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = trimStart; }}
                  className="text-gray-400 hover:text-white transition" title="Go to start"><SkipBack size={14}/></button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(trimStart, currentTime - 5); }}
                  className="text-gray-400 hover:text-white transition" title="Back 5s"><Rewind size={14}/></button>
                <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}
                  className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition">
                  {isPlaying ? <Pause size={14}/> : <Play size={14} className="ml-0.5"/>}
                </button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(trimEnd, currentTime + 5); }}
                  className="text-gray-400 hover:text-white transition" title="Forward 5s"><FastForward size={14}/></button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = trimEnd; }}
                  className="text-gray-400 hover:text-white transition" title="Go to end"><SkipForward size={14}/></button>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume */}
                <button onClick={() => updateClip({ volume: sel.volume > 0 ? 0 : 1 })}
                  className="text-gray-400 hover:text-white transition">
                  {sel.volume === 0 ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={sel.volume}
                  onChange={e => updateClip({ volume: Number(e.target.value) })}
                  className="w-16 h-1 accent-indigo-500 cursor-pointer"/>
                <span className="text-[9px] text-gray-400 w-6">{Math.round(sel.volume * 100)}%</span>

                {/* Speed */}
                <select value={sel.playbackRate}
                  onChange={e => updateClip({ playbackRate: Number(e.target.value) })}
                  className="h-5 text-[9px] bg-gray-800 border border-gray-700 text-white rounded px-1 focus:outline-none">
                  {PLAYBACK_RATES.map(r => <option key={r} value={r}>{r}x</option>)}
                </select>

                {/* Fullscreen */}
                <button onClick={() => videoRef.current?.requestFullscreen()}
                  className="text-gray-400 hover:text-white transition"><Maximize size={14}/></button>
              </div>
            </div>
          </div>

          {/* ── Panel Tabs ── */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-900 border-t border-gray-800 shrink-0 overflow-x-auto">
            <PanelBtn id="clips"     icon={<Film size={12}/>}            label="Clips"/>
            <PanelBtn id="filter"    icon={<Palette size={12}/>}         label="Filter"/>
            <PanelBtn id="adjust"    icon={<Sliders size={12}/>}         label="Adjust"/>
            <PanelBtn id="transform" icon={<FlipHorizontal size={12}/>}  label="Transform"/>
            <PanelBtn id="text"      icon={<Type size={12}/>}            label="Text"/>
            <PanelBtn id="audio"     icon={<Music size={12}/>}           label="Audio"/>
            <PanelBtn id="speed"     icon={<FastForward size={12}/>}     label="Speed"/>
            <PanelBtn id="crop"      icon={<Scissors size={12}/>}        label="Trim"/>
          </div>
        </div>

        {/* ══ RIGHT: Tool Panels ══ */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 overflow-y-auto shrink-0 p-3 space-y-4">

          {/* ─ CLIPS ─ */}
          {activePanel === "clips" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Clip Settings</p>

              {/* Selected clip info */}
              <div className="bg-gray-800 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-white truncate">{sel.title}</p>
                <p className="text-[9px] text-gray-500">Duration: {fmt(effectiveDuration)}</p>
                {sel.localFile && <p className="text-[9px] text-blue-400">📁 Local file (not saved to cloud)</p>}
                {uploadingVideo && <p className="text-[9px] text-amber-400">Uploading video...</p>}
              </div>

              {/* Re-upload if local */}
              {sel.localFile && (
                <label className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs cursor-pointer transition">
                  <Upload size={12}/> Re-upload this clip
                  <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void (async () => {
                      setUploadingVideo(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                        if (!uploadRes.ok) throw new Error("Upload failed");
                        const uploaded = await uploadRes.json();
                        updateClip({
                          url: uploaded.url,
                          title: file.name.replace(/\.[^/.]+$/, ""),
                          localFile: false,
                        });
                      } catch (error) {
                        console.error("Re-upload failed:", error);
                        alert("Re-upload failed. Please try again.");
                      } finally {
                        setUploadingVideo(false);
                      }
                    })();
                    e.target.value = "";
                  }}/>
                </label>
              )}

              {/* Duplicate / Delete */}
              <div className="flex gap-2">
                <button onClick={() => duplicateClip(sel.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg transition">
                  <Copy size={11}/> Duplicate
                </button>
                {clips.length > 1 && (
                  <button onClick={() => deleteClip(sel.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] rounded-lg transition">
                    <Trash2 size={11}/> Delete
                  </button>
                )}
              </div>

              {/* Reorder */}
              <div className="flex gap-2">
                <button onClick={() => reorderClip(sel.id, "up")}
                  className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg transition">↑ Move Up</button>
                <button onClick={() => reorderClip(sel.id, "down")}
                  className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg transition">↓ Move Down</button>
              </div>

              <Slider label="Opacity" value={sel.opacity} min={0} max={100}
                onChange={v => updateClip({ opacity: v })}
                onReset={() => updateClip({ opacity: 100 })} unit="%"/>
            </div>
          )}

          {/* ─ FILTER ─ */}
          {activePanel === "filter" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Filter Presets</p>
              <div className="grid grid-cols-2 gap-1.5">
                {FILTER_PRESETS.map(f => (
                  <button key={f.name} onClick={() => updateClip({ brightness:f.brightness, contrast:f.contrast, saturation:f.saturation, hue:f.hue, sepia:f.sepia, grayscale:f.grayscale })}
                    className="flex flex-col items-center py-2 px-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition border border-gray-700 hover:border-indigo-500">
                    <div className="w-full h-8 rounded mb-1 overflow-hidden">
                      <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-500"
                        style={{ filter:`brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) sepia(${f.sepia}%) grayscale(${f.grayscale}%)` }}/>
                    </div>
                    <span className="text-[8px] text-gray-300">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ ADJUST ─ */}
          {activePanel === "adjust" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Adjustments</p>
                <button onClick={() => updateClip({ brightness:100,contrast:100,saturation:100,hue:0,blur:0,sepia:0,grayscale:0,vignette:0,temperature:0,sharpness:0 })}
                  className="flex items-center gap-1 text-[9px] text-gray-500 hover:text-gray-300 transition">
                  <RotateCcw size={9}/> Reset
                </button>
              </div>
              <Slider label="Brightness" value={sel.brightness} min={0}   max={200} onChange={v=>updateClip({brightness:v})}  onReset={()=>updateClip({brightness:100})} unit="%"/>
              <Slider label="Contrast"   value={sel.contrast}   min={0}   max={200} onChange={v=>updateClip({contrast:v})}    onReset={()=>updateClip({contrast:100})}   unit="%"/>
              <Slider label="Saturation" value={sel.saturation} min={0}   max={200} onChange={v=>updateClip({saturation:v})}  onReset={()=>updateClip({saturation:100})} unit="%"/>
              <Slider label="Hue"        value={sel.hue}        min={0}   max={360} onChange={v=>updateClip({hue:v})}         onReset={()=>updateClip({hue:0})}          unit="°"/>
              <Slider label="Blur"       value={sel.blur}       min={0}   max={20}  step={0.5} onChange={v=>updateClip({blur:v})} onReset={()=>updateClip({blur:0})}     unit="px"/>
              <Slider label="Sepia"      value={sel.sepia}      min={0}   max={100} onChange={v=>updateClip({sepia:v})}       onReset={()=>updateClip({sepia:0})}        unit="%"/>
              <Slider label="Grayscale"  value={sel.grayscale}  min={0}   max={100} onChange={v=>updateClip({grayscale:v})}  onReset={()=>updateClip({grayscale:0})}    unit="%"/>
              <Slider label="Vignette"   value={sel.vignette}   min={0}   max={30}  onChange={v=>updateClip({vignette:v})}   onReset={()=>updateClip({vignette:0})}     unit=""/>
            </div>
          )}

          {/* ─ TRANSFORM ─ */}
          {activePanel === "transform" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Transform</p>

              {/* Flip */}
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Flip</p>
                <div className="flex gap-2">
                  <button onClick={() => updateClip({ flipH: !sel.flipH })}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition ${sel.flipH ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}>
                    <FlipHorizontal size={12}/> Horizontal
                  </button>
                  <button onClick={() => updateClip({ flipV: !sel.flipV })}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition ${sel.flipV ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}>
                    <FlipVertical size={12}/> Vertical
                  </button>
                </div>
              </div>

              {/* Rotate */}
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Rotation</p>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[0, 90, 180, 270].map(deg => (
                    <button key={deg} onClick={() => updateClip({ rotate: deg })}
                      className={`py-2 rounded text-[9px] font-medium transition ${sel.rotate === deg ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
                      {deg}°
                    </button>
                  ))}
                </div>
                <Slider label="Custom" value={sel.rotate} min={-180} max={180}
                  onChange={v => updateClip({ rotate: v })}
                  onReset={() => updateClip({ rotate: 0 })} unit="°"/>
              </div>

              {/* Aspect ratio resize helper */}
              <div>
                <p className="text-[9px] text-gray-500 mb-1.5">Aspect Ratio Info</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["16:9 (Landscape)","9:16 (Portrait)","1:1 (Square)","4:3 (Classic)"].map(r => (
                    <div key={r} className="py-1.5 px-2 bg-gray-800 rounded text-[9px] text-gray-400 text-center">{r}</div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-600 mt-1">Video aspect is controlled by the source file. Use rotate/flip to adjust display.</p>
              </div>
            </div>
          )}

          {/* ─ TEXT ─ */}
          {activePanel === "text" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Text Overlays</p>

              {/* Add new */}
              <div className="space-y-2">
                <textarea value={overlayText} onChange={e => setOverlayText(e.target.value)} rows={2}
                  placeholder="Overlay text…"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-indigo-500"/>

                <div className="grid grid-cols-2 gap-1.5">
                  <select value={overlayFont} onChange={e => setOverlayFont(e.target.value)}
                    className="h-6 text-[9px] bg-gray-800 border border-gray-700 text-white rounded px-1 focus:outline-none">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input type="number" value={overlayFontSize} onChange={e => setOverlayFontSize(Number(e.target.value))}
                    className="h-6 text-[9px] bg-gray-800 border border-gray-700 text-white rounded px-1 focus:outline-none"
                    placeholder="Size" min={8} max={120}/>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 w-10">Color</span>
                  <input type="color" value={overlayColor} onChange={e => setOverlayColor(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-700 cursor-pointer bg-transparent"/>
                  <span className="text-[9px] text-gray-500 w-6">BG</span>
                  <input type="color" value={overlayBg === "transparent" ? "#000000" : overlayBg}
                    onChange={e => setOverlayBg(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-700 cursor-pointer bg-transparent"/>
                  <button onClick={() => setOverlayBg("transparent")}
                    className="text-[8px] text-red-400 hover:text-red-300">None</button>
                </div>

                <div className="flex gap-1">
                  <button onClick={() => setOverlayBold(!overlayBold)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition ${overlayBold ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400"}`}>B</button>
                  <button onClick={() => setOverlayItalic(!overlayItalic)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs italic transition ${overlayItalic ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400"}`}>I</button>
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-500">Position</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 w-3">X</span>
                    <input type="range" min={5} max={95} value={overlayX} onChange={e => setOverlayX(Number(e.target.value))} className="flex-1 h-1 accent-indigo-500"/>
                    <span className="text-[9px] text-gray-500 w-6">{overlayX}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 w-3">Y</span>
                    <input type="range" min={5} max={95} value={overlayY} onChange={e => setOverlayY(Number(e.target.value))} className="flex-1 h-1 accent-indigo-500"/>
                    <span className="text-[9px] text-gray-500 w-6">{overlayY}%</span>
                  </div>
                </div>

                <p className="text-[9px] text-gray-600">Appears: {fmt(currentTime)} → {fmt(currentTime + 5)}</p>
                <button onClick={addTextOverlay}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition font-medium">
                  + Add at {fmt(currentTime)}
                </button>
              </div>

              {/* Existing overlays */}
              {sel.textOverlays.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-500 mb-1.5">Added ({sel.textOverlays.length})</p>
                  <div className="space-y-1">
                    {sel.textOverlays.map(o => (
                      <div key={o.id}
                        className={`bg-gray-800 rounded-lg px-2 py-1.5 group cursor-pointer border-2 transition ${editingOverlayId === o.id ? "border-indigo-500" : "border-transparent hover:border-gray-600"}`}
                        onClick={() => setEditingOverlayId(editingOverlayId === o.id ? null : o.id)}>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-white truncate flex-1">{o.text}</p>
                          <div className="flex gap-1 shrink-0 ml-1">
                            <button onClick={e => { e.stopPropagation(); if(videoRef.current)videoRef.current.currentTime=o.startTime; }}
                              className="text-[8px] text-gray-500 hover:text-white p-0.5"><Play size={8}/></button>
                            <button onClick={e => { e.stopPropagation(); removeOverlay(o.id); }}
                              className="text-[8px] text-red-500 p-0.5"><Trash2 size={8}/></button>
                          </div>
                        </div>
                        <p className="text-[8px] text-gray-600">{fmt(o.startTime)} → {fmt(o.endTime)}</p>

                        {/* Inline edit */}
                        {editingOverlayId === o.id && (
                          <div className="mt-2 space-y-1 pt-2 border-t border-gray-700">
                            <input value={o.text} onChange={e => updateOverlay(o.id, { text: e.target.value })}
                              className="w-full bg-gray-700 text-white text-[9px] rounded px-2 py-1 focus:outline-none"/>
                            <div className="flex gap-1">
                              <input type="number" value={o.startTime} step={0.5} onChange={e => updateOverlay(o.id, { startTime: Number(e.target.value) })}
                                className="flex-1 bg-gray-700 text-white text-[9px] rounded px-1 py-0.5 focus:outline-none" placeholder="Start"/>
                              <input type="number" value={o.endTime} step={0.5} onChange={e => updateOverlay(o.id, { endTime: Number(e.target.value) })}
                                className="flex-1 bg-gray-700 text-white text-[9px] rounded px-1 py-0.5 focus:outline-none" placeholder="End"/>
                            </div>
                            <div className="flex gap-1">
                              <input type="color" value={o.color} onChange={e => updateOverlay(o.id, { color: e.target.value })}
                                className="w-6 h-5 rounded cursor-pointer border-0"/>
                              <input type="number" value={o.fontSize} onChange={e => updateOverlay(o.id, { fontSize: Number(e.target.value) })}
                                className="flex-1 bg-gray-700 text-white text-[9px] rounded px-1 py-0.5 focus:outline-none" placeholder="Size"/>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─ AUDIO ─ */}
          {activePanel === "audio" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Audio</p>

              <label className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs cursor-pointer transition">
                <Upload size={12}/> {sel.audioUrl ? "Replace Audio Track" : "Add Audio Track"}
                <input
                  type="file"
                  accept={ACCEPTED_AUDIO_TYPES}
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void addAudioToSelectedClip(file);
                    e.target.value = "";
                  }}
                />
              </label>

              {uploadingAudio && <p className="text-[9px] text-amber-400">Uploading audio...</p>}

              {sel.audioUrl && (
                <div className="space-y-2 bg-gray-800 rounded-lg p-2.5">
                  <audio controls src={sel.audioUrl} className="w-full h-8" />
                  <Slider label="New Track Vol" value={Math.round((sel.audioVolume ?? 1) * 100)} min={0} max={150}
                    onChange={v => updateClip({ audioVolume: v / 100 })}
                    onReset={() => updateClip({ audioVolume: 1 })} unit="%"/>
                  <button
                    onClick={() => updateClip({ audioUrl: null })}
                    className="w-full py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-[10px] rounded-lg transition"
                  >
                    Remove Added Audio
                  </button>
                </div>
              )}

              <label className="flex items-center gap-2 text-[10px] text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(sel.muteOriginalAudio)}
                  onChange={e => updateClip({ muteOriginalAudio: e.target.checked })}
                  className="accent-indigo-500"
                />
                Mute original video audio
              </label>

              <Slider label="Volume" value={Math.round(sel.volume * 100)} min={0} max={150}
                onChange={v => updateClip({ volume: v / 100 })}
                onReset={() => updateClip({ volume: 1 })} unit="%"/>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[{label:"Mute",v:0},{label:"50%",v:50},{label:"100%",v:100},{label:"125%",v:125},{label:"150%",v:150}].map(p => (
                  <button key={p.label} onClick={() => updateClip({ volume: p.v / 100 })}
                    className={`py-1.5 text-[9px] rounded-lg transition font-medium ${Math.round(sel.volume*100)===p.v ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="bg-gray-800 rounded-lg p-2.5 text-[9px] text-gray-400 space-y-1">
                <p className="font-semibold text-gray-300 mb-1">Note</p>
                <p>🔇 Mute: Remove all audio from clip</p>
                <p>📢 &gt;100%: Boost audio beyond original</p>
                <p className="text-gray-600 mt-1">Full audio mixing requires server-side processing tools like FFmpeg.</p>
              </div>
            </div>
          )}

          {/* ─ SPEED ─ */}
          {activePanel === "speed" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Playback Speed</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PLAYBACK_RATES.map(r => (
                  <button key={r} onClick={() => updateClip({ playbackRate: r })}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition ${sel.playbackRate === r ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
                    {r}x
                    {r === 1 && <span className="text-[8px] block opacity-60">Normal</span>}
                    {r < 1  && <span className="text-[8px] block opacity-60">Slow</span>}
                    {r > 1  && <span className="text-[8px] block opacity-60">Fast</span>}
                  </button>
                ))}
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-[9px] text-gray-400 space-y-1">
                <p>🐢 0.25x — 0.5x: Slow motion</p>
                <p>⚡ 1x: Normal speed</p>
                <p>🚀 1.5x — 2x: Fast forward</p>
                <p>💨 3x — 4x: Time-lapse</p>
              </div>
            </div>
          )}

          {/* ─ TRIM / CROP ─ */}
          {activePanel === "crop" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Trim & Cut</p>

              {/* Trim sliders */}
              <div>
                <p className="text-[9px] text-gray-500 mb-2">Set In / Out Points</p>
                <Slider label="Start (In)"
                  value={Number(trimStart.toFixed(1))}
                  min={0} max={Math.max(duration - 0.1, 0)} step={0.1}
                  onChange={v => {
                    const boundedStart = Math.max(0, Math.min(v, Math.max(duration - 0.1, 0)));
                    const endCandidate = sel.endTrim ?? duration;
                    const boundedEnd = Math.max(boundedStart + 0.1, Math.min(endCandidate, duration || boundedStart + 0.1));
                    updateClip({
                      startTrim: boundedStart,
                      endTrim: sel.endTrim == null ? null : boundedEnd,
                    });
                    if (videoRef.current) videoRef.current.currentTime = boundedStart;
                  }}
                  onReset={() => updateClip({ startTrim: 0 })} unit="s"/>
                <div className="mt-2"/>
                <Slider label="End (Out)"
                  value={Number(trimEnd.toFixed(1))}
                  min={trimStart + 0.1} max={duration} step={0.1}
                  onChange={v => {
                    const boundedEnd = Math.max(trimStart + 0.1, Math.min(v, duration || trimStart + 0.1));
                    updateClip({ endTrim: boundedEnd });
                    if (videoRef.current && videoRef.current.currentTime > boundedEnd) {
                      videoRef.current.currentTime = trimStart;
                    }
                  }}
                  onReset={() => updateClip({ endTrim: null })} unit="s"/>
              </div>

              {/* Quick trim buttons */}
              <div className="space-y-1.5">
                <button onClick={() => {
                  const boundedStart = Math.max(0, Math.min(currentTime, Math.max(duration - 0.1, 0)));
                  const endCandidate = sel.endTrim ?? duration;
                  const boundedEnd = Math.max(boundedStart + 0.1, Math.min(endCandidate, duration || boundedStart + 0.1));
                  updateClip({
                    startTrim: boundedStart,
                    endTrim: sel.endTrim == null ? null : boundedEnd,
                  });
                  if (videoRef.current) videoRef.current.currentTime = boundedStart;
                }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[10px] rounded-lg transition font-medium">
                  <Scissors size={11}/> Set In Point at {fmt(currentTime)}
                </button>
                <button onClick={() => {
                  const boundedEnd = Math.max(trimStart + 0.1, Math.min(currentTime, duration || trimStart + 0.1));
                  updateClip({ endTrim: boundedEnd });
                }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-[10px] rounded-lg transition font-medium">
                  <Scissors size={11}/> Set Out Point at {fmt(currentTime)}
                </button>
                <button onClick={() => updateClip({ startTrim: 0, endTrim: null })}
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[9px] rounded-lg transition">
                  <RotateCcw size={9}/> Reset Trim
                </button>
                <button onClick={cutSelectedClipAtPlayhead}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-[10px] rounded-lg transition font-medium">
                  <Scissors size={11}/> Cut at {fmt(currentTime)}
                </button>
              </div>

              {/* Trim summary */}
              {(sel.startTrim > 0 || sel.endTrim) && (
                <div className="bg-gray-800 rounded-lg p-2.5 text-[9px] space-y-1">
                  <p className="text-gray-400">Active trim:</p>
                  <p className="text-white font-mono">{fmt(trimStart)} → {fmt(trimEnd)}</p>
                  <p className="text-gray-500">Duration: {fmt(effectiveDuration)}</p>
                </div>
              )}

              <div className="bg-gray-800 rounded-xl p-3 text-[9px] text-gray-500 space-y-1">
                <p className="font-semibold text-gray-400">Tip</p>
                <p>Seek to a point in the video, then click &quot;Set In/Out Point&quot; to trim to that position.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ADD CLIP MODAL ══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}>
          <div className="bg-gray-900 rounded-2xl p-5 w-96 border border-gray-700 shadow-2xl"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">Add Video Clip</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-800 rounded-xl p-1">
              {(["upload","url"] as const).map(tab => (
                <button key={tab} onClick={() => setAddTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${addTab===tab?"bg-indigo-600 text-white":"text-gray-400 hover:text-white"}`}>
                  {tab === "upload" ? "📁 From Desktop" : "🔗 From URL"}
                </button>
              ))}
            </div>

            {/* Upload Tab */}
            {addTab === "upload" && (
              <div className="space-y-3">
                <div
                  ref={uploadDropRef}
                  onDrop={e => { e.preventDefault(); setIsDraggingFile(false); const f=e.dataTransfer.files[0]; if(f)addFromFile(f); }}
                  onDragOver={e => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  className={`flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed transition cursor-pointer ${isDraggingFile ? "border-indigo-400 bg-indigo-500/10" : "border-gray-600 hover:border-gray-500"}`}
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload size={28} className={isDraggingFile ? "text-indigo-400" : "text-gray-500"}/>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-300">
                      {isDraggingFile ? "Drop to add!" : "Drop video here"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">or click to browse from your computer</p>
                    <p className="text-[10px] text-gray-600 mt-1">MP4, WebM, MOV, AVI, MKV supported</p>
                  </div>
                  <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition">
                    Browse Files
                    <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={handleFileInput}/>
                  </label>
                </div>
                <p className="text-[9px] text-gray-600 text-center">
                  📝 Files are uploaded and saved to database URL for reload persistence.
                </p>
              </div>
            )}

            {/* URL Tab */}
            {addTab === "url" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block font-semibold">Title</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="My video"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 text-white"/>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block font-semibold">Video URL</label>
                  <input value={newUrl} onChange={e => { setNewUrl(e.target.value); setUrlError(""); }}
                    onKeyDown={e => e.key === "Enter" && addFromUrl()}
                    placeholder="https://example.com/video.mp4" autoFocus
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 text-white font-mono"/>
                  {urlError && <p className="text-red-400 text-[10px] mt-1">{urlError}</p>}
                  <p className="text-[9px] text-gray-600 mt-1">Direct link to .mp4, .webm, or .ogg file</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={addFromUrl} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-semibold transition">Add Video</button>
                  <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useState, useRef, useEffect, useCallback, useMemo } from "react";
// import {
//   Plus, Trash2, Download, Volume2, VolumeX, Maximize,
//   Type, RotateCcw, FastForward, Rewind, Play, Pause,
//   SkipBack, SkipForward, Film, Palette, Sliders, Music,
//   Upload, Scissors, Copy, MoveVertical, FlipHorizontal,
//   FlipVertical, RotateCw, ZoomIn, GripVertical,
// } from "lucide-react";

// // ── Types ──────────────────────────────────────────────────────────
// interface TextOverlay {
//   id: string; text: string; startTime: number; endTime: number;
//   x: number; y: number; fontSize: number; color: string; bgColor: string;
//   bold: boolean; italic: boolean; fontFamily: string;
// }

// interface Clip {
//   id: string; title: string; url: string; localFile?: boolean;
//   startTrim: number; endTrim: number | null;
//   volume: number; playbackRate: number;
//   brightness: number; contrast: number; saturation: number;
//   hue: number; blur: number; sepia: number; grayscale: number;
//   sharpness: number; vignette: number; temperature: number;
//   flipH: boolean; flipV: boolean; rotate: number; opacity: number;
//   textOverlays: TextOverlay[]; addedAt: string;
//   timelineOrder: number; // For ordering in timeline
// }

// interface TimelineClipEntry {
//   clip: Clip;
//   timelineStart: number;
//   timelineEnd: number;
//   sourceDuration: number;
//   clipIn: number;
//   clipOut: number;
// }

// const makeClip = (o: Partial<Clip> & { url: string; title: string }): Clip => ({
//   id: Date.now().toString() + Math.random().toString(36).slice(2),
//   startTrim: 0, endTrim: null, volume: 1, playbackRate: 1,
//   brightness: 100, contrast: 100, saturation: 100, hue: 0,
//   blur: 0, sepia: 0, grayscale: 0, sharpness: 0, vignette: 0, temperature: 0,
//   flipH: false, flipV: false, rotate: 0, opacity: 100,
//   textOverlays: [], addedAt: new Date().toISOString(),
//   timelineOrder: Date.now(),
//   ...o,
// });

// const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4];
// const FONTS = ["Arial", "Georgia", "Impact", "Courier New", "Trebuchet MS", "Comic Sans MS", "Verdana", "Helvetica"];
// const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm,video/ogg,video/mov,video/avi,video/mkv,video/*";

// const readFileAsDataUrl = (file: File) =>
//   new Promise<string>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(String(reader.result || ""));
//     reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
//     reader.readAsDataURL(file);
//   });

// function toYouTubeEmbedUrl(rawUrl: string): string | null {
//   try {
//     const url = new URL(rawUrl);
//     const host = url.hostname.toLowerCase();
//     let videoId = "";
//     if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || "";
//     else if (host.includes("youtube.com")) {
//       if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
//       else if (url.pathname.startsWith("/shorts/")) videoId = url.pathname.split("/")[2] || "";
//       else if (url.pathname.startsWith("/embed/")) videoId = url.pathname.split("/")[2] || "";
//     }
//     if (!videoId) return null;
//     const start = url.searchParams.get("t") || url.searchParams.get("start") || "";
//     const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
//     if (start) {
//       const sec = Number(start.replace(/[^0-9]/g, ""));
//       if (!Number.isNaN(sec) && sec > 0) embed.searchParams.set("start", String(sec));
//     }
//     return embed.toString();
//   } catch { return null; }
// }

// function isYouTubeEmbedUrl(url: string): boolean {
//   return /^https:\/\/www\.youtube\.com\/embed\//.test(url);
// }

// function buildTimelineEntries(clips: Clip[], videoDurationMap: Map<string, number>) {
//   const sorted = [...clips].sort((a, b) => a.timelineOrder - b.timelineOrder);
//   let cursor = 0;

//   const entries: TimelineClipEntry[] = sorted.map((clip) => {
//     const sourceDuration = videoDurationMap.get(clip.id) ?? 10;
//     const clipIn = Math.max(0, clip.startTrim);
//     const clipOut = Math.max(clipIn + 0.1, Math.min(clip.endTrim ?? sourceDuration, sourceDuration));
//     const timelineStart = cursor;
//     const timelineEnd = timelineStart + (clipOut - clipIn);
//     cursor = timelineEnd;

//     return {
//       clip,
//       timelineStart,
//       timelineEnd,
//       sourceDuration,
//       clipIn,
//       clipOut,
//     };
//   });

//   return {
//     entries,
//     totalDuration: Math.max(cursor, 0.1),
//   };
// }

// // ── Video Timeline Track Component ──────────────────────────────────────
// interface VideoTimelineTrackProps {
//   duration: number;
//   currentTime: number;
//   entries: TimelineClipEntry[];
//   selectedClipId: string;
//   onSeek: (time: number) => void;
//   onSelectClip: (clipId: string) => void;
//   onTrimClip: (clipId: string, startTrim: number, endTrim: number | null) => void;
//   onReorderClip: (clipId: string, direction: "up" | "down") => void;
// }

// function VideoTimelineTrack({
//   duration,
//   currentTime,
//   entries,
//   selectedClipId,
//   onSeek,
//   onSelectClip,
//   onTrimClip,
//   onReorderClip,
// }: VideoTimelineTrackProps) {
//   const timelineRef = useRef<HTMLDivElement>(null);
//   const [draggingPlayhead, setDraggingPlayhead] = useState(false);
//   const [draggingTrim, setDraggingTrim] = useState<{ clipId: string; edge: "start" | "end" } | null>(null);
//   const globalDuration = Math.max(duration, 0.1);

//   const getPixelFromTime = (time: number) => {
//     const width = timelineRef.current?.clientWidth || 600;
//     return (time / globalDuration) * width;
//   };

//   const getTimeFromPixel = (clientX: number) => {
//     const rect = timelineRef.current?.getBoundingClientRect();
//     if (!rect) return 0;
//     const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
//     return (x / rect.width) * globalDuration;
//   };

//   const handleTimelineClick = (e: React.MouseEvent) => {
//     if (draggingTrim) return;
//     const newTime = getTimeFromPixel(e.clientX);
//     onSeek(Math.min(Math.max(0, newTime), globalDuration));
//   };

//   const handlePlayheadDrag = (e: React.MouseEvent) => {
//     e.preventDefault();
//     setDraggingPlayhead(true);
//     const onMove = (moveEvent: MouseEvent) => {
//       const newTime = getTimeFromPixel(moveEvent.clientX);
//       onSeek(Math.min(Math.max(0, newTime), globalDuration));
//     };
//     const onUp = () => {
//       setDraggingPlayhead(false);
//       document.removeEventListener("mousemove", onMove);
//       document.removeEventListener("mouseup", onUp);
//     };
//     document.addEventListener("mousemove", onMove);
//     document.addEventListener("mouseup", onUp);
//   };

//   const handleTrimDragStart = (e: React.MouseEvent, clipId: string, edge: "start" | "end") => {
//     e.stopPropagation();
//     setDraggingTrim({ clipId, edge });
//     const onMove = (moveEvent: MouseEvent) => {
//       const newAbsTime = getTimeFromPixel(moveEvent.clientX);
//       const entry = entries.find((e) => e.clip.id === clipId);
//       if (!entry) return;

//       if (edge === "start") {
//         const clampedAbs = Math.min(Math.max(entry.timelineStart, newAbsTime), entry.timelineEnd - 0.1);
//         const delta = clampedAbs - entry.timelineStart;
//         const newStartTrim = Math.min(entry.clipOut - 0.1, Math.max(0, entry.clipIn + delta));
//         onTrimClip(clipId, newStartTrim, entry.clip.endTrim);
//       } else {
//         const clampedAbs = Math.min(Math.max(entry.timelineStart + 0.1, newAbsTime), entry.timelineStart + entry.sourceDuration - entry.clipIn);
//         const delta = clampedAbs - entry.timelineEnd;
//         const newEndTrim = Math.max(entry.clipIn + 0.1, Math.min(entry.sourceDuration, entry.clipOut + delta));
//         onTrimClip(clipId, entry.clip.startTrim, newEndTrim);
//       }
//     };
//     const onUp = () => {
//       setDraggingTrim(null);
//       document.removeEventListener("mousemove", onMove);
//       document.removeEventListener("mouseup", onUp);
//     };
//     document.addEventListener("mousemove", onMove);
//     document.addEventListener("mouseup", onUp);
//   };

//   const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;

//   return (
//     <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
//       <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700 text-[10px] text-gray-400">
//         <div className="flex items-center gap-2">
//           <Film size={10} />
//           <span>Video Track</span>
//           <span className="text-gray-500">| {entries.length} clip(s)</span>
//         </div>
//         <span>{formatTime(currentTime)} / {formatTime(globalDuration)}</span>
//       </div>

//       <div
//         ref={timelineRef}
//         className="relative h-32 bg-gray-950 cursor-pointer overflow-hidden"
//         onClick={handleTimelineClick}
//       >
//         {/* Time Ruler */}
//         <div className="absolute top-0 left-0 right-0 h-4 bg-gray-900/50 border-b border-gray-800">
//           {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
//             <div
//               key={frac}
//               className="absolute text-[8px] text-gray-500"
//               style={{ left: `${frac * 100}%`, transform: "translateX(-50%)" }}
//             >
//               {formatTime(globalDuration * frac)}
//             </div>
//           ))}
//         </div>

//         {/* Video Clip Items */}
//         {entries.map((entry, index) => {
//           const clip = entry.clip;
//           const left = getPixelFromTime(entry.timelineStart);
//           const width = getPixelFromTime(entry.timelineEnd) - left;
//           const isSelected = selectedClipId === clip.id;
          
//           return (
//             <div
//               key={clip.id}
//               className={`absolute top-6 h-20 rounded-md cursor-pointer transition-all group ${
//                 isSelected ? "ring-2 ring-indigo-400" : "hover:ring-1 hover:ring-indigo-500"
//               }`}
//               style={{
//                 left: `${left}px`,
//                 width: `${width}px`,
//                 backgroundColor: isSelected ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.3)",
//                 border: "1px solid rgba(255,255,255,0.2)",
//                 top: `${12 + (index % 3) * 24}px`, // Stack clips with slight offset
//               }}
//               onClick={() => onSelectClip(clip.id)}
//             >
//               {/* Trim Handles */}
//               <div
//                 className="absolute left-0 top-0 w-2 h-full bg-yellow-400/70 cursor-ew-resize rounded-l hover:bg-yellow-400"
//                 onMouseDown={(e) => handleTrimDragStart(e, clip.id, "start")}
//               />
//               <div
//                 className="absolute right-0 top-0 w-2 h-full bg-yellow-400/70 cursor-ew-resize rounded-r hover:bg-yellow-400"
//                 onMouseDown={(e) => handleTrimDragStart(e, clip.id, "end")}
//               />

//               {/* Clip Content */}
//               <div className="flex flex-col justify-center h-full px-2 text-[9px] text-white truncate">
//                 <span className="font-semibold truncate">{clip.title}</span>
//                 <span className="text-[8px] text-gray-300">
//                   {formatTime(entry.timelineEnd - entry.timelineStart)}
//                 </span>
//               </div>

//               {/* Reorder Buttons */}
//               <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition">
//                 {index > 0 && (
//                   <button
//                     onClick={(e) => { e.stopPropagation(); onReorderClip(clip.id, "up"); }}
//                     className="p-0.5 bg-gray-700 rounded hover:bg-gray-600"
//                     title="Move Up"
//                   >
//                     ↑
//                   </button>
//                 )}
//                 {index < entries.length - 1 && (
//                   <button
//                     onClick={(e) => { e.stopPropagation(); onReorderClip(clip.id, "down"); }}
//                     className="p-0.5 bg-gray-700 rounded hover:bg-gray-600"
//                     title="Move Down"
//                   >
//                     ↓
//                   </button>
//                 )}
//               </div>
//             </div>
//           );
//         })}

//         {/* Playhead */}
//         <div
//           className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg cursor-ew-resize z-10"
//           style={{ left: `${getPixelFromTime(currentTime)}px` }}
//           onMouseDown={handlePlayheadDrag}
//         >
//           <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
//         </div>

//         {/* Background grid */}
//         <div className="absolute inset-0 pointer-events-none">
//           {[...Array(20)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute top-0 bottom-0 w-px bg-gray-800"
//               style={{ left: `${(i / 20) * 100}%` }}
//             />
//           ))}
//         </div>
//       </div>

//       <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-t border-gray-700 text-[9px]">
//         <div className="flex items-center gap-2">
//           <GripVertical size={10} className="text-gray-500" />
//           <span className="text-gray-400">Drag handles to trim | Click clip to select</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Text Timeline Track Component ──────────────────────────────────────
// interface TextTimelineTrackProps {
//   duration: number;
//   currentTime: number;
//   textOverlays: TextOverlay[];
//   onSeek: (time: number) => void;
//   onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
//   onCutOverlay: (id: string) => void;
//   onDeleteOverlay: (id: string) => void;
//   onSelectOverlay?: (id: string | null) => void;
//   selectedOverlayId?: string | null;
// }

// function TextTimelineTrack({
//   duration,
//   currentTime,
//   textOverlays,
//   onSeek,
//   onUpdateOverlay,
//   onCutOverlay,
//   onDeleteOverlay,
//   onSelectOverlay,
//   selectedOverlayId,
// }: TextTimelineTrackProps) {
//   const timelineRef = useRef<HTMLDivElement>(null);
//   const [draggingOverlay, setDraggingOverlay] = useState<string | null>(null);
//   const [dragEdge, setDragEdge] = useState<"start" | "end" | null>(null);
//   const [draggingPlayhead, setDraggingPlayhead] = useState(false);

//   const getPixelFromTime = (time: number) => {
//     const width = timelineRef.current?.clientWidth || 600;
//     return (time / duration) * width;
//   };

//   const getTimeFromPixel = (clientX: number) => {
//     const rect = timelineRef.current?.getBoundingClientRect();
//     if (!rect) return 0;
//     const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
//     return (x / rect.width) * duration;
//   };

//   const handleTimelineClick = (e: React.MouseEvent) => {
//     if (draggingOverlay) return;
//     const newTime = getTimeFromPixel(e.clientX);
//     onSeek(Math.min(Math.max(0, newTime), duration));
//   };

//   const handlePlayheadDrag = (e: React.MouseEvent) => {
//     e.preventDefault();
//     setDraggingPlayhead(true);
//     const onMove = (moveEvent: MouseEvent) => {
//       const newTime = getTimeFromPixel(moveEvent.clientX);
//       onSeek(Math.min(Math.max(0, newTime), duration));
//     };
//     const onUp = () => {
//       setDraggingPlayhead(false);
//       document.removeEventListener("mousemove", onMove);
//       document.removeEventListener("mouseup", onUp);
//     };
//     document.addEventListener("mousemove", onMove);
//     document.addEventListener("mouseup", onUp);
//   };

//   const handleOverlayDragStart = (e: React.MouseEvent, id: string, edge: "start" | "end") => {
//     e.stopPropagation();
//     setDraggingOverlay(id);
//     setDragEdge(edge);
//     const onMove = (moveEvent: MouseEvent) => {
//       const newTime = getTimeFromPixel(moveEvent.clientX);
//       const overlay = textOverlays.find(o => o.id === id);
//       if (!overlay) return;
//       if (edge === "start") {
//         const newStart = Math.min(Math.max(0, newTime), overlay.endTime - 0.1);
//         onUpdateOverlay(id, { startTime: newStart });
//       } else {
//         const newEnd = Math.min(Math.max(overlay.startTime + 0.1, newTime), duration);
//         onUpdateOverlay(id, { endTime: newEnd });
//       }
//     };
//     const onUp = () => {
//       setDraggingOverlay(null);
//       setDragEdge(null);
//       document.removeEventListener("mousemove", onMove);
//       document.removeEventListener("mouseup", onUp);
//     };
//     document.addEventListener("mousemove", onMove);
//     document.addEventListener("mouseup", onUp);
//   };

//   const handleOverlayDragMove = (e: React.MouseEvent, id: string) => {
//     e.stopPropagation();
//     const startX = e.clientX;
//     const overlay = textOverlays.find(o => o.id === id);
//     if (!overlay) return;
//     const onMove = (moveEvent: MouseEvent) => {
//       const deltaX = moveEvent.clientX - startX;
//       const deltaTime = (deltaX / (timelineRef.current?.clientWidth || 600)) * duration;
//       let newStart = overlay.startTime + deltaTime;
//       let newEnd = overlay.endTime + deltaTime;
//       if (newStart < 0) {
//         newEnd -= newStart;
//         newStart = 0;
//       }
//       if (newEnd > duration) {
//         newStart -= newEnd - duration;
//         newEnd = duration;
//       }
//       if (newStart >= 0 && newEnd <= duration) {
//         onUpdateOverlay(id, { startTime: newStart, endTime: newEnd });
//       }
//     };
//     const onUp = () => {
//       document.removeEventListener("mousemove", onMove);
//       document.removeEventListener("mouseup", onUp);
//     };
//     document.addEventListener("mousemove", onMove);
//     document.addEventListener("mouseup", onUp);
//   };

//   const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;

//   return (
//     <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
//       <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700 text-[10px] text-gray-400">
//         <div className="flex items-center gap-2">
//           <Type size={10} />
//           <span>Text Track</span>
//           <span className="text-gray-500">| {textOverlays.length} overlay(s)</span>
//         </div>
//         <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
//       </div>

//       <div
//         ref={timelineRef}
//         className="relative h-20 bg-gray-950 cursor-pointer overflow-hidden"
//         onClick={handleTimelineClick}
//       >
//         <div className="absolute top-0 left-0 right-0 h-4 bg-gray-900/50 border-b border-gray-800">
//           {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
//             <div
//               key={frac}
//               className="absolute text-[8px] text-gray-500"
//               style={{ left: `${frac * 100}%`, transform: "translateX(-50%)" }}
//             >
//               {formatTime(duration * frac)}
//             </div>
//           ))}
//         </div>

//         {textOverlays.map((overlay) => {
//           const left = getPixelFromTime(overlay.startTime);
//           const width = getPixelFromTime(overlay.endTime) - left;
//           const isSelected = selectedOverlayId === overlay.id;
//           return (
//             <div
//               key={overlay.id}
//               className={`absolute top-6 h-8 rounded-md cursor-move transition-all group ${
//                 isSelected ? "ring-2 ring-yellow-400" : "hover:ring-1 hover:ring-indigo-500"
//               }`}
//               style={{
//                 left: `${left}px`,
//                 width: `${width}px`,
//                 backgroundColor: isSelected ? "rgba(234, 179, 8, 0.3)" : "rgba(99, 102, 241, 0.4)",
//                 border: "1px solid rgba(255,255,255,0.2)",
//               }}
//               onMouseDown={(e) => handleOverlayDragMove(e, overlay.id)}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onSelectOverlay?.(overlay.id);
//               }}
//             >
//               <div
//                 className="absolute left-0 top-0 w-1.5 h-full bg-yellow-400/70 cursor-ew-resize rounded-l"
//                 onMouseDown={(e) => handleOverlayDragStart(e, overlay.id, "start")}
//               />
//               <div
//                 className="absolute right-0 top-0 w-1.5 h-full bg-yellow-400/70 cursor-ew-resize rounded-r"
//                 onMouseDown={(e) => handleOverlayDragStart(e, overlay.id, "end")}
//               />

//               <div className="flex items-center justify-between h-full px-2 text-[9px] text-white truncate">
//                 <span className="truncate flex-1">{overlay.text}</span>
//                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
//                   <button
//                     onClick={(e) => { e.stopPropagation(); onCutOverlay(overlay.id); }}
//                     className="p-0.5 bg-orange-600 rounded hover:bg-orange-500"
//                     title="Cut at playhead"
//                   >
//                     <Scissors size={8} />
//                   </button>
//                   <button
//                     onClick={(e) => { e.stopPropagation(); onDeleteOverlay(overlay.id); }}
//                     className="p-0.5 bg-red-600 rounded hover:bg-red-500"
//                     title="Delete"
//                   >
//                     <Trash2 size={8} />
//                   </button>
//                 </div>
//               </div>

//               <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-[7px] bg-gray-800 px-1 rounded">
//                 {formatTime(overlay.endTime - overlay.startTime)}
//               </div>
//             </div>
//           );
//         })}

//         <div
//           className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg cursor-ew-resize z-10"
//           style={{ left: `${getPixelFromTime(currentTime)}px` }}
//           onMouseDown={handlePlayheadDrag}
//         >
//           <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
//         </div>

//         <div className="absolute inset-0 pointer-events-none">
//           {[...Array(10)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute top-0 bottom-0 w-px bg-gray-800"
//               style={{ left: `${(i / 10) * 100}%` }}
//             />
//           ))}
//         </div>
//       </div>

//       <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-t border-gray-700 text-[9px]">
//         <div className="flex items-center gap-2">
//           <GripVertical size={10} className="text-gray-500" />
//           <span className="text-gray-400">Drag to move/resize | Click to select</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Main Component ─────────────────────────────────────────────────
// export default function VideoEditor({ databaseId }: { databaseId?: string }) {
//   const [clips, setClips] = useState<Clip[]>([
//     makeClip({ title: "Sample Video 1", url: "https://www.w3schools.com/html/mov_bbb.mp4", timelineOrder: 1 }),
//   ]);
//   const [selectedClip, setSelectedClip] = useState<Clip>(clips[0]);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [timelineCurrentTime, setTimelineCurrentTime] = useState(0);
//   const [activePanel, setActivePanel] = useState<"clips" | "text" | "adjust">("clips");
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [addTab, setAddTab] = useState<"url" | "upload">("upload");
//   const [newUrl, setNewUrl] = useState("");
//   const [newTitle, setNewTitle] = useState("");
//   const [urlError, setUrlError] = useState("");
//   const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
//   const [videoDurations, setVideoDurations] = useState<Map<string, number>>(new Map());

//   // Text overlay creation state
//   const [overlayText, setOverlayText] = useState("");
//   const [overlayColor, setOverlayColor] = useState("#ffffff");
//   const [overlayBg, setOverlayBg] = useState("rgba(0,0,0,0.6)");
//   const [overlayFontSize, setOverlayFontSize] = useState(24);
//   const [overlayFont, setOverlayFont] = useState("Arial");
//   const [overlayBold, setOverlayBold] = useState(false);
//   const [overlayItalic, setOverlayItalic] = useState(false);
//   const [overlayX, setOverlayX] = useState(50);
//   const [overlayY, setOverlayY] = useState(80);
//   const [loadedOnce, setLoadedOnce] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [savedAt, setSavedAt] = useState<string | null>(null);

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const pendingSeekRef = useRef<number | null>(null);
//   const autoPlayNextClipRef = useRef(false);
//   const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const latestClipsRef = useRef<Clip[]>(clips);

//   useEffect(() => {
//     latestClipsRef.current = clips;
//   }, [clips]);

//   const sel = selectedClip;
//   const isYouTubeClip = isYouTubeEmbedUrl(sel?.url);
//   const { entries: timelineEntries, totalDuration: timelineDuration } = useMemo(
//     () => buildTimelineEntries(clips, videoDurations),
//     [clips, videoDurations]
//   );

//   const syncTimelineCurrentTime = useCallback(
//     (clipId: string, localTime: number) => {
//       const entry = timelineEntries.find((e) => e.clip.id === clipId);
//       if (!entry) return;
//       const absolute = entry.timelineStart + Math.max(0, localTime - entry.clipIn);
//       setTimelineCurrentTime(Math.min(Math.max(absolute, 0), timelineDuration));
//     },
//     [timelineEntries, timelineDuration]
//   );

//   // Load from database
//   useEffect(() => {
//     let cancelled = false;

//     const load = async () => {
//       if (!databaseId) {
//         setLoadedOnce(true);
//         return;
//       }

//       try {
//         const response = await fetch(`/api/databases/${databaseId}/video`);
//         if (!response.ok) return;
//         const json = await response.json();
//         if (cancelled) return;

//         if (Array.isArray(json?.clips) && json.clips.length > 0) {
//           const restored: Clip[] = json.clips.map((clip: Clip) => ({
//             ...clip,
//             url: clip.localFile ? clip.url || "" : clip.url,
//           }));
//           setClips(restored);
//           setSelectedClip(restored[0]);
//         }
//       } catch (error) {
//         console.error("Failed to load video data:", error);
//       } finally {
//         if (!cancelled) setLoadedOnce(true);
//       }
//     };

//     void load();

//     return () => {
//       cancelled = true;
//     };
//   }, [databaseId]);

//   // Auto-save
//   useEffect(() => {
//     if (!databaseId || !loadedOnce) return;

//     if (saveTimerRef.current) {
//       clearTimeout(saveTimerRef.current);
//     }

//     const saveClips = async (nextClips: Clip[], keepalive = false) => {
//       setSaving(true);
//       try {
//         const saveableClips = nextClips.map((clip) => ({
//           ...clip,
//           url: clip.localFile && clip.url.startsWith("blob:") ? "" : clip.url,
//         }));

//         const response = await fetch(`/api/databases/${databaseId}/video`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           keepalive,
//           body: JSON.stringify({ clips: saveableClips }),
//         });

//         if (!response.ok) {
//           const data = await response.json().catch(() => null);
//           throw new Error(data?.error || "Failed to save video data");
//         }

//         setSavedAt(new Date().toLocaleTimeString());
//       } catch (error) {
//         console.error("Failed to save video data:", error);
//       } finally {
//         setSaving(false);
//       }
//     };

//     saveTimerRef.current = setTimeout(() => {
//       void saveClips(clips);
//     }, 250);

//     return () => {
//       if (saveTimerRef.current) {
//         clearTimeout(saveTimerRef.current);
//       }
//     };
//   }, [clips, databaseId, loadedOnce]);

//   // Update clip helper
//   const updateClip = useCallback(
//     (updates: Partial<Clip>) => {
//       setClips((prev) => prev.map((c) => (c.id === sel.id ? { ...c, ...updates } : c)));
//       setSelectedClip((prev) => ({ ...prev, ...updates }));
//     },
//     [sel.id]
//   );

//   // Video event handlers
//   const moveToNextClip = useCallback((currentClipId: string, shouldAutoPlay = true) => {
//     const currentIndex = timelineEntries.findIndex((entry) => entry.clip.id === currentClipId);
//     if (currentIndex < 0) return false;

//     const nextEntry = timelineEntries[currentIndex + 1];
//     if (!nextEntry) return false;

//     setSelectedClip(nextEntry.clip);
//     pendingSeekRef.current = nextEntry.clip.startTrim;
//     autoPlayNextClipRef.current = shouldAutoPlay;
//     setCurrentTime(nextEntry.clip.startTrim);
//     setProgress(0);
//     setTimelineCurrentTime(nextEntry.timelineStart);
//     return true;
//   }, [timelineEntries]);

//   const handleTimeUpdate = () => {
//     const v = videoRef.current;
//     if (!v) return;

//     const clipStart = sel.startTrim;
//     const clipEnd = sel.endTrim ?? v.duration;
//     const clippedTime = Math.min(Math.max(v.currentTime, clipStart), clipEnd);
//     const effectiveDuration = Math.max(clipEnd - clipStart, 0.1);

//     setCurrentTime(clippedTime);
//     setProgress(((clippedTime - clipStart) / effectiveDuration) * 100 || 0);
//     syncTimelineCurrentTime(sel.id, clippedTime);

//     if (clippedTime >= clipEnd - 0.02) {
//       v.pause();
//       const moved = moveToNextClip(sel.id, true);
//       if (!moved) {
//         setIsPlaying(false);
//       }
//     }
//   };

//   const handleLoadedMetadata = () => {
//     const v = videoRef.current;
//     if (!v) return;
//     setDuration(v.duration);
//     setVideoDurations(prev => new Map(prev).set(sel.id, v.duration));
//     if (pendingSeekRef.current != null) {
//       v.currentTime = pendingSeekRef.current;
//       pendingSeekRef.current = null;
//     } else if (sel.startTrim > 0) {
//       v.currentTime = sel.startTrim;
//     }

//     if (autoPlayNextClipRef.current) {
//       void v.play()
//         .then(() => {
//           setIsPlaying(true);
//         })
//         .catch(() => {
//           setIsPlaying(false);
//         })
//         .finally(() => {
//           autoPlayNextClipRef.current = false;
//         });
//     }

//     syncTimelineCurrentTime(sel.id, v.currentTime);
//   };

//   const handleLocalSeek = (time: number) => {
//     const v = videoRef.current;
//     if (!v) return;

//     const clipStart = sel.startTrim;
//     const clipEnd = sel.endTrim ?? duration;
//     const clamped = Math.min(Math.max(clipStart, time), clipEnd);
//     const effectiveDuration = Math.max(clipEnd - clipStart, 0.1);

//     v.currentTime = clamped;
//     setCurrentTime(clamped);
//     setProgress(((clamped - clipStart) / effectiveDuration) * 100 || 0);
//     syncTimelineCurrentTime(sel.id, clamped);
//   };

//   const handleTimelineSeek = (absoluteTime: number) => {
//     const clamped = Math.min(Math.max(0, absoluteTime), timelineDuration);
//     const target = timelineEntries.find(
//       (entry) => clamped >= entry.timelineStart && clamped <= entry.timelineEnd
//     ) ?? timelineEntries[timelineEntries.length - 1];

//     if (!target) return;

//     const localTime = Math.min(
//       target.clipOut,
//       Math.max(target.clipIn, target.clipIn + (clamped - target.timelineStart))
//     );

//     setTimelineCurrentTime(clamped);
//     setCurrentTime(localTime);

//     if (sel.id !== target.clip.id) {
//       setSelectedClip(target.clip);
//       pendingSeekRef.current = localTime;
//       setIsPlaying(false);
//       return;
//     }

//     const v = videoRef.current;
//     if (!v) return;
//     v.currentTime = localTime;
//     setProgress((localTime / duration) * 100);
//   };

//   const togglePlay = () => {
//     const v = videoRef.current;
//     if (!v || !sel.url) return;
//     if (isPlaying) v.pause();
//     else {
//       const clipStart = sel.startTrim;
//       const clipEnd = sel.endTrim ?? duration;
//       if (v.currentTime < clipStart || v.currentTime > clipEnd) {
//         v.currentTime = clipStart;
//       }
//       v.play().catch(() => {});
//     }
//     setIsPlaying(!isPlaying);
//   };

//   // Text overlay operations
//   const addTextOverlay = () => {
//     if (!overlayText.trim()) return;
//     const newOverlay: TextOverlay = {
//       id: Date.now().toString(),
//       text: overlayText,
//       startTime: currentTime,
//       endTime: Math.min(currentTime + 5, duration),
//       x: overlayX,
//       y: overlayY,
//       fontSize: overlayFontSize,
//       color: overlayColor,
//       bgColor: overlayBg,
//       bold: overlayBold,
//       italic: overlayItalic,
//       fontFamily: overlayFont,
//     };
//     updateClip({ textOverlays: [...sel.textOverlays, newOverlay] });
//     setOverlayText("");
//     setSelectedOverlayId(newOverlay.id);
//   };

//   const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
//     updateClip({
//       textOverlays: sel.textOverlays.map((o) => (o.id === id ? { ...o, ...updates } : o)),
//     });
//   };

//   const deleteOverlay = (id: string) => {
//     updateClip({ textOverlays: sel.textOverlays.filter((o) => o.id !== id) });
//     if (selectedOverlayId === id) setSelectedOverlayId(null);
//   };

//   const cutOverlayAtPlayhead = (id: string) => {
//     const overlay = sel.textOverlays.find((o) => o.id === id);
//     if (!overlay) return;
//     if (currentTime <= overlay.startTime || currentTime >= overlay.endTime) {
//       alert("Move playhead inside the text duration to cut");
//       return;
//     }
//     const firstPart = { ...overlay, id: Date.now().toString() + "_1", endTime: currentTime };
//     const secondPart = { ...overlay, id: Date.now().toString() + "_2", startTime: currentTime };
//     const newOverlays = sel.textOverlays.filter((o) => o.id !== id);
//     newOverlays.push(firstPart, secondPart);
//     newOverlays.sort((a, b) => a.startTime - b.startTime);
//     updateClip({ textOverlays: newOverlays });
//     setSelectedOverlayId(null);
//   };

//   // Clip management
//   const addFromFile = useCallback(async (file: File) => {
//     if (!file.type.startsWith("video/")) {
//       alert("Please select a video file.");
//       return;
//     }
//     const url = await readFileAsDataUrl(file);
//     const title = file.name.replace(/\.[^/.]+$/, "");
//     const newClip = makeClip({ title, url, localFile: true, timelineOrder: Date.now() });
//     setClips((prev) => [...prev, newClip]);
//     setSelectedClip(newClip);
//     setShowAddModal(false);
//     setIsPlaying(false);
//   }, []);

//   const addFromUrl = () => {
//     if (!newUrl.trim()) {
//       setUrlError("Enter a URL");
//       return;
//     }
//     const ytEmbed = toYouTubeEmbedUrl(newUrl);
//     const normalized = ytEmbed || newUrl;
//     const newClip = makeClip({ title: newTitle || "Untitled", url: normalized, timelineOrder: Date.now() });
//     setClips((prev) => [...prev, newClip]);
//     setSelectedClip(newClip);
//     setNewUrl("");
//     setNewTitle("");
//     setUrlError("");
//     setShowAddModal(false);
//     setIsPlaying(false);
//   };

//   const deleteClip = (id: string) => {
//     const clip = clips.find((c) => c.id === id);
//     if (clip?.localFile && clip.url.startsWith("blob:")) URL.revokeObjectURL(clip.url);
//     const remaining = clips.filter((c) => c.id !== id);
//     setClips(remaining);
//     if (selectedClip.id === id && remaining.length > 0) {
//       setSelectedClip(remaining[0]);
//       pendingSeekRef.current = remaining[0].startTrim;
//       setCurrentTime(remaining[0].startTrim);
//       syncTimelineCurrentTime(remaining[0].id, remaining[0].startTrim);
//     }
//   };

//   const duplicateClip = (id: string) => {
//     const clip = clips.find((c) => c.id === id);
//     if (!clip) return;
//     const newClip = { ...clip, id: Date.now().toString(), title: clip.title + " (copy)", timelineOrder: Date.now() };
//     setClips((prev) => [...prev, newClip]);
//   };

//   const reorderClip = (id: string, direction: "up" | "down") => {
//     const sortedClips = [...clips].sort((a, b) => a.timelineOrder - b.timelineOrder);
//     const index = sortedClips.findIndex(c => c.id === id);
//     if (direction === "up" && index === 0) return;
//     if (direction === "down" && index === sortedClips.length - 1) return;
    
//     const newOrder = [...sortedClips];
//     const swapIndex = direction === "up" ? index - 1 : index + 1;
//     [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    
//     // Update timelineOrder values
//     newOrder.forEach((clip, idx) => {
//       clip.timelineOrder = idx;
//     });
    
//     setClips(newOrder);
//   };

//   const trimClip = (clipId: string, startTrim: number, endTrim: number | null) => {
//     setClips(prev => prev.map(c => 
//       c.id === clipId ? { ...c, startTrim, endTrim } : c
//     ));
//     if (selectedClip.id === clipId) {
//       setSelectedClip(prev => ({ ...prev, startTrim, endTrim }));
//     }
//   };

//   // Filter styles
//   const getFilter = (c: Clip) =>
//     `brightness(${c.brightness}%) contrast(${c.contrast}%) saturate(${c.saturation}%) hue-rotate(${c.hue}deg) blur(${c.blur}px) sepia(${c.sepia}%) grayscale(${c.grayscale}%)`;

//   const getTransform = (c: Clip) =>
//     `scaleX(${c.flipH ? -1 : 1}) scaleY(${c.flipV ? -1 : 1}) rotate(${c.rotate}deg)`;

//   const activeOverlays = sel.textOverlays.filter(
//     (o) => currentTime >= o.startTime && currentTime <= o.endTime
//   );

//   const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;

//   return (
//     <div className="flex h-full min-h-0 flex-col bg-gray-950 text-white overflow-hidden">
//       {/* Top Bar */}
//       <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
//         <div className="flex items-center gap-3">
//           <span className="text-sm font-semibold">🎥 Multi-Track Video Editor</span>
//           {sel.localFile && (
//             <span className="text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
//               Local file
//             </span>
//           )}
//           {saving && <span className="text-[10px] text-amber-400 animate-pulse">Saving...</span>}
//           {!saving && savedAt && <span className="text-[10px] text-emerald-400">Saved {savedAt}</span>}
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
//           >
//             <Plus size={14} /> Add Clip
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-1 min-h-0 overflow-hidden">
//         {/* Left Sidebar - Clips */}
//         <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
//           <div className="px-3 py-2 border-b border-gray-800">
//             <p className="text-[10px] font-semibold text-gray-400 uppercase">Clips ({clips.length})</p>
//           </div>
//           <div className="flex-1 overflow-y-auto">
//             {clips.map((clip) => (
//               <div
//                 key={clip.id}
//                 onClick={() => {
//                   setSelectedClip(clip);
//                   setIsPlaying(false);
//                   setSelectedOverlayId(null);
//                 }}
//                 className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-800 transition border-b border-gray-800 group ${
//                   selectedClip.id === clip.id ? "bg-gray-800 border-l-2 border-l-indigo-500" : ""
//                 }`}
//               >
//                 <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-sm shrink-0">🎬</div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs font-medium truncate">{clip.title}</p>
//                   <p className="text-[9px] text-gray-500">
//                     {formatTime(clip.startTrim)} → {clip.endTrim ? formatTime(clip.endTrim) : "end"}
//                   </p>
//                 </div>
//                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       duplicateClip(clip.id);
//                     }}
//                     className="p-1 bg-blue-600 rounded text-white"
//                     title="Duplicate"
//                   >
//                     <Copy size={10} />
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       deleteClip(clip.id);
//                     }}
//                     className="p-1 bg-red-600 rounded text-white"
//                     title="Delete"
//                   >
//                     <Trash2 size={10} />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Upload Zone */}
//           <div
//             className="m-3 rounded-xl border-2 border-dashed border-gray-700 hover:border-indigo-500 transition cursor-pointer p-3 text-center"
//             onClick={() => fileInputRef.current?.click()}
//             onDrop={(e) => {
//               e.preventDefault();
//               const file = e.dataTransfer.files[0];
//               if (file) void addFromFile(file);
//             }}
//             onDragOver={(e) => e.preventDefault()}
//           >
//             <Upload size={16} className="mx-auto mb-1 text-gray-500" />
//             <p className="text-[9px] text-gray-500">Drop video here</p>
//             <input ref={fileInputRef} type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={(e) => e.target.files?.[0] && void addFromFile(e.target.files[0])} />
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
//           {/* Video Preview */}
//           <div className="h-64 bg-black flex items-center justify-center relative shrink-0">
//             {sel.url ? (
//               <>
//                 {isYouTubeClip ? (
//                   <iframe src={sel.url} className="h-full w-full" title={sel.title} allowFullScreen />
//                 ) : (
//                   <video
//                     ref={videoRef}
//                     src={sel.url}
//                     className="max-h-full max-w-full"
//                     style={{
//                       filter: getFilter(sel),
//                       transform: getTransform(sel),
//                       opacity: sel.opacity / 100,
//                     }}
//                     onTimeUpdate={handleTimeUpdate}
//                     onLoadedMetadata={handleLoadedMetadata}
//                     onEnded={() => {
//                       const moved = moveToNextClip(sel.id, true);
//                       if (!moved) {
//                         setIsPlaying(false);
//                       }
//                     }}
//                     onClick={togglePlay}
//                   />
//                 )}

//                 {/* Text Overlays */}
//                 {activeOverlays.map((o) => (
//                   <div
//                     key={o.id}
//                     className="absolute pointer-events-none px-3 py-1.5 rounded select-none"
//                     style={{
//                       left: `${o.x}%`,
//                       top: `${o.y}%`,
//                       transform: "translate(-50%, -50%)",
//                       fontSize: o.fontSize,
//                       color: o.color,
//                       backgroundColor: o.bgColor,
//                       fontFamily: o.fontFamily,
//                       fontWeight: o.bold ? "bold" : "normal",
//                       fontStyle: o.italic ? "italic" : "normal",
//                       textShadow: "0 2px 6px rgba(0,0,0,0.8)",
//                     }}
//                   >
//                     {o.text}
//                   </div>
//                 ))}

//                 {/* Play Overlay */}
//                 {!isYouTubeClip && !isPlaying && (
//                   <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center cursor-pointer">
//                     <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition">
//                       <Play size={24} className="ml-0.5" />
//                     </div>
//                   </div>
//                 )}
//               </>
//             ) : (
//               <div className="text-center text-gray-500">Select a clip to preview</div>
//             )}
//           </div>

//           {/* Timeline Section - Shows ALL clips */}
//           <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-gray-900 border-t border-gray-800">
//             <VideoTimelineTrack
//               duration={timelineDuration}
//               currentTime={timelineCurrentTime}
//               entries={timelineEntries}
//               selectedClipId={selectedClip.id}
//               onSeek={handleTimelineSeek}
//               onSelectClip={(clipId) => {
//                 const clip = clips.find(c => c.id === clipId);
//                 if (clip) {
//                   setSelectedClip(clip);
//                   pendingSeekRef.current = clip.startTrim;
//                   setCurrentTime(clip.startTrim);
//                   syncTimelineCurrentTime(clip.id, clip.startTrim);
//                   setIsPlaying(false);
//                 }
//               }}
//               onTrimClip={trimClip}
//               onReorderClip={reorderClip}
//             />

//             <TextTimelineTrack
//               duration={duration}
//               currentTime={currentTime}
//               textOverlays={sel.textOverlays}
//               onSeek={handleLocalSeek}
//               onUpdateOverlay={updateOverlay}
//               onCutOverlay={cutOverlayAtPlayhead}
//               onDeleteOverlay={deleteOverlay}
//               onSelectOverlay={setSelectedOverlayId}
//               selectedOverlayId={selectedOverlayId}
//             />

//             {/* Transport Controls */}
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <button onClick={() => handleLocalSeek(sel.startTrim)} className="text-gray-400 hover:text-white">
//                   <SkipBack size={14} />
//                 </button>
//                 <button onClick={() => handleLocalSeek(Math.max(0, currentTime - 5))} className="text-gray-400 hover:text-white">
//                   <Rewind size={14} />
//                 </button>
//                 <button
//                   onClick={togglePlay}
//                   className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center"
//                 >
//                   {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
//                 </button>
//                 <button onClick={() => handleLocalSeek(Math.min(duration, currentTime + 5))} className="text-gray-400 hover:text-white">
//                   <FastForward size={14} />
//                 </button>
//                 <button onClick={() => handleLocalSeek(sel.endTrim || duration)} className="text-gray-400 hover:text-white">
//                   <SkipForward size={14} />
//                 </button>
//               </div>

//               <div className="flex items-center gap-3">
//                 <button onClick={() => updateClip({ volume: sel.volume > 0 ? 0 : 1 })} className="text-gray-400 hover:text-white">
//                   {sel.volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
//                 </button>
//                 <input
//                   type="range"
//                   min={0}
//                   max={1}
//                   step={0.05}
//                   value={sel.volume}
//                   onChange={(e) => updateClip({ volume: Number(e.target.value) })}
//                   className="w-20 h-1 accent-indigo-500"
//                 />
//                 <select
//                   value={sel.playbackRate}
//                   onChange={(e) => updateClip({ playbackRate: Number(e.target.value) })}
//                   className="text-xs bg-gray-800 border border-gray-700 rounded px-1 py-0.5"
//                 >
//                   {PLAYBACK_RATES.map((r) => (
//                     <option key={r} value={r}>
//                       {r}x
//                     </option>
//                   ))}
//                 </select>
//                 <button onClick={() => videoRef.current?.requestFullscreen()} className="text-gray-400 hover:text-white">
//                   <Maximize size={14} />
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Panel Tabs */}
//           <div className="flex gap-1 px-3 py-1.5 bg-gray-900 border-t border-gray-800 shrink-0">
//             {[
//               { id: "clips" as const, icon: <Film size={12} />, label: "Clip Settings" },
//               { id: "text" as const, icon: <Type size={12} />, label: "Add Text" },
//               { id: "adjust" as const, icon: <Sliders size={12} />, label: "Adjust" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActivePanel(tab.id)}
//                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
//                   activePanel === tab.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
//                 }`}
//               >
//                 {tab.icon}
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           {/* Active Panel Content */}
//           <div className="h-48 bg-gray-900 border-t border-gray-800 overflow-y-auto p-3 shrink-0">
//             {activePanel === "clips" && (
//               <div className="space-y-2">
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => updateClip({ startTrim: currentTime })}
//                     className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs rounded"
//                   >
//                     Set In @ {formatTime(currentTime)}
//                   </button>
//                   <button
//                     onClick={() => updateClip({ endTrim: currentTime })}
//                     className="flex-1 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 text-xs rounded"
//                   >
//                     Set Out @ {formatTime(currentTime)}
//                   </button>
//                 </div>
//                 <button onClick={() => updateClip({ startTrim: 0, endTrim: null })} className="w-full py-1 bg-gray-700 text-gray-300 text-xs rounded">
//                   Reset Trim
//                 </button>
//                 <div className="text-[10px] text-gray-500">
//                   Trim: {formatTime(sel.startTrim)} → {formatTime(sel.endTrim || duration)} (Duration: {formatTime((sel.endTrim || duration) - sel.startTrim)})
//                 </div>
//                 <div className="text-[10px] text-gray-500 mt-2">
//                   💡 Tip: Drag clips in the timeline to reorder them
//                 </div>
//               </div>
//             )}

//             {activePanel === "text" && (
//               <div className="space-y-2">
//                 <textarea
//                   value={overlayText}
//                   onChange={(e) => setOverlayText(e.target.value)}
//                   placeholder="Enter text..."
//                   className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
//                   rows={2}
//                 />
//                 <div className="grid grid-cols-3 gap-2">
//                   <input
//                     type="color"
//                     value={overlayColor}
//                     onChange={(e) => setOverlayColor(e.target.value)}
//                     className="h-8 rounded"
//                   />
//                   <input
//                     type="number"
//                     value={overlayFontSize}
//                     onChange={(e) => setOverlayFontSize(Number(e.target.value))}
//                     className="bg-gray-800 rounded px-2 py-1 text-xs"
//                     placeholder="Size"
//                   />
//                   <select
//                     value={overlayFont}
//                     onChange={(e) => setOverlayFont(e.target.value)}
//                     className="bg-gray-800 rounded px-1 py-1 text-xs"
//                   >
//                     {FONTS.map((f) => (
//                       <option key={f}>{f}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setOverlayBold(!overlayBold)}
//                     className={`px-3 py-1 rounded text-xs font-bold ${overlayBold ? "bg-indigo-600" : "bg-gray-700"}`}
//                   >
//                     B
//                   </button>
//                   <button
//                     onClick={() => setOverlayItalic(!overlayItalic)}
//                     className={`px-3 py-1 rounded text-xs italic ${overlayItalic ? "bg-indigo-600" : "bg-gray-700"}`}
//                   >
//                     I
//                   </button>
//                 </div>
//                 <button onClick={addTextOverlay} className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-sm rounded">
//                   + Add Text at {formatTime(currentTime)}
//                 </button>
//               </div>
//             )}

//             {activePanel === "adjust" && (
//               <div className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   <span className="text-xs w-20">Brightness</span>
//                   <input
//                     type="range"
//                     min={0}
//                     max={200}
//                     value={sel.brightness}
//                     onChange={(e) => updateClip({ brightness: Number(e.target.value) })}
//                     className="flex-1"
//                   />
//                   <span className="text-xs w-10">{sel.brightness}%</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-xs w-20">Contrast</span>
//                   <input
//                     type="range"
//                     min={0}
//                     max={200}
//                     value={sel.contrast}
//                     onChange={(e) => updateClip({ contrast: Number(e.target.value) })}
//                     className="flex-1"
//                   />
//                   <span className="text-xs w-10">{sel.contrast}%</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-xs w-20">Saturation</span>
//                   <input
//                     type="range"
//                     min={0}
//                     max={200}
//                     value={sel.saturation}
//                     onChange={(e) => updateClip({ saturation: Number(e.target.value) })}
//                     className="flex-1"
//                   />
//                   <span className="text-xs w-10">{sel.saturation}%</span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Add Modal */}
//       {showAddModal && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
//           <div className="bg-gray-900 rounded-xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
//             <h2 className="text-lg font-bold mb-4">Add Video to Timeline</h2>
//             <div className="flex gap-2 mb-4">
//               <button
//                 onClick={() => setAddTab("upload")}
//                 className={`flex-1 py-2 rounded ${addTab === "upload" ? "bg-indigo-600" : "bg-gray-800"}`}
//               >
//                 Upload
//               </button>
//               <button
//                 onClick={() => setAddTab("url")}
//                 className={`flex-1 py-2 rounded ${addTab === "url" ? "bg-indigo-600" : "bg-gray-800"}`}
//               >
//                 URL
//               </button>
//             </div>
//             {addTab === "upload" && (
//               <div
//                 className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer"
//                 onClick={() => fileInputRef.current?.click()}
//                 onDrop={(e) => {
//                   e.preventDefault();
//                   const file = e.dataTransfer.files[0];
//                   if (file) void addFromFile(file);
//                 }}
//                 onDragOver={(e) => e.preventDefault()}
//               >
//                 <Upload className="mx-auto mb-2 text-gray-400" size={32} />
//                 <p className="text-sm">Drop video or click to browse</p>
//                 <p className="text-xs text-gray-500 mt-1">New clip will appear in timeline</p>
//                 <input type="file" accept={ACCEPTED_VIDEO_TYPES} className="hidden" onChange={(e) => e.target.files?.[0] && void addFromFile(e.target.files[0])} />
//               </div>
//             )}
//             {addTab === "url" && (
//               <div className="space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Video title"
//                   value={newTitle}
//                   onChange={(e) => setNewTitle(e.target.value)}
//                   className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Video URL (mp4 or YouTube link)"
//                   value={newUrl}
//                   onChange={(e) => setNewUrl(e.target.value)}
//                   className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
//                 />
//                 {urlError && <p className="text-red-400 text-xs">{urlError}</p>}
//                 <button onClick={addFromUrl} className="w-full py-2 bg-indigo-600 rounded">
//                   Add to Timeline
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }