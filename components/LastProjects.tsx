'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, MoreHorizontal } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function LastProjects() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full max-w-3xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-[32px]"></div>
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`w-full max-w-3xl p-6 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold tracking-tight">Last Projects</h3>
          <Badge variant="outline" className={`
            ${isDark ? 'bg-[#1F2125] text-gray-400 border-white/10' : 'bg-rose-100 text-gray-600 border-rose-200'}`}>
            2
          </Badge>
        </div>
        <a href="#" className={`flex items-center gap-2 text-sm group
            ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}>
          <ExternalLink size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          <span>View on Figma</span>
        </a>
      </div>

      {/* Main Card */}
      <Card className={`rounded-[32px] p-6 transition-colors duration-300 shadow-sm 
        ${isDark ? 'bg-[#1F2125] border-white/5 shadow-none' : 'bg-white border-rose-200'}`}>

        {/* Card Header Info */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h4 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Smart Home UI Ux</h4>
            <div className="text-gray-500 text-sm font-medium">5 Member</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full border-[3px] flex items-center justify-center text-[10px] text-gray-500 overflow-hidden
                    ${isDark ? 'bg-zinc-800 border-[#0F1014]' : 'bg-zinc-100 border-white'}`}
                >
                  {/* Placeholder for avatar images */}
                  <div className={`w-full h-full opacity-80 bg-gradient-to-br 
                    ${isDark ? 'from-zinc-700 to-zinc-800' : 'from-gray-200 to-gray-300'}`} />
                </div>
              ))}
            </div>
            <Button variant="outline" size="icon" className={`w-9 h-9 rounded-full border-dashed
              ${isDark ? 'border-zinc-600 text-zinc-500 hover:text-white hover:border-zinc-400' : 'border-gray-300 text-gray-400 hover:text-gray-900 hover:border-gray-400'}`}>
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* Visual Content Grid */}
        <div className="grid grid-cols-2 gap-5 h-64">

          {/* LEFT BLOCK: Wireframe / Collaborative Mode */}
          <div className={`rounded-2xl relative overflow-hidden border group transition-colors
            ${isDark ? 'bg-[#15161A] border-white/5 hover:border-white/10' : 'bg-gray-50 border-rose-100 hover:border-rose-200'}`}>
            {/* Background UI Mockup */}
            <div className="absolute inset-0 p-4 opacity-50 flex gap-3">
              {/* Sidebar */}
              <div className={`w-16 h-full rounded-lg flex flex-col gap-2 p-2 ${isDark ? 'bg-[#25262B]' : 'bg-gray-200'}`}>
                <div className={`w-8 h-8 rounded-full mb-2 ${isDark ? 'bg-white/10' : 'bg-white/50'}`}></div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-white/50'}`}></div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-white/50'}`}></div>
              </div>
              {/* Main Content */}
              <div className="flex-1 flex flex-col gap-3">
                <div className={`w-full h-24 rounded-lg ${isDark ? 'bg-[#25262B]' : 'bg-gray-200'}`}></div>
                <div className="flex gap-3 h-full">
                  <div className={`flex-1 rounded-lg ${isDark ? 'bg-[#25262B]' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 rounded-lg ${isDark ? 'bg-[#25262B]' : 'bg-gray-200'}`}></div>
                </div>
              </div>
            </div>

            {/* Cursor: Sarah (Top Right - Yellow) */}
            <div className="absolute top-12 right-20 z-20">
              <CursorIcon color="#facc15" />
              <div className="absolute top-0 left-4 bg-[#facc15] text-black text-[10px] font-bold px-2 py-0.5 rounded-tr-lg rounded-br-lg rounded-bl-lg translate-y-2">
                Sarah
              </div>
            </div>

            {/* Cursor: Wilson (Middle Left - Pink) */}
            <div className="absolute top-28 left-16 z-20">
              <CursorIcon color="#f472b6" />
              <div className="absolute top-0 left-4 bg-[#f472b6] text-white text-[10px] font-bold px-2 py-0.5 rounded-tr-lg rounded-br-lg rounded-bl-lg translate-y-2">
                Wilson
              </div>
            </div>

            {/* Cursor: Jimmy (Bottom Right - Blue) */}
            <div className="absolute bottom-16 right-16 z-20">
              <CursorIcon color="#60a5fa" />
              <div className="absolute top-0 left-4 bg-[#60a5fa] text-white text-[10px] font-bold px-2 py-0.5 rounded-tr-lg rounded-br-lg rounded-bl-lg translate-y-2">
                Jimmy
              </div>
            </div>
          </div>

          {/* RIGHT BLOCK: Flowchart / Logic */}
          <div className={`rounded-2xl relative border overflow-hidden flex items-center justify-center transition-colors
            ${isDark ? 'bg-[#15161A] border-white/5' : 'bg-gray-50 border-rose-100'}`}>

            {/* SVG Lines for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              {/* Market to Session */}
              <line x1="30%" y1="50%" x2="50%" y2="40%" stroke="currentColor" className={isDark ? "text-gray-600" : "text-gray-400"} strokeWidth="1" />
              {/* Session to Start(green) */}
              <line x1="65%" y1="40%" x2="80%" y2="25%" stroke="currentColor" className={isDark ? "text-gray-600" : "text-gray-400"} strokeWidth="1" />
              {/* Session to End/IO */}
              <line x1="65%" y1="40%" x2="75%" y2="55%" stroke="currentColor" className={isDark ? "text-gray-600" : "text-gray-400"} strokeWidth="1" />
              {/* Another to Session */}
              <line x1="50%" y1="75%" x2="55%" y2="50%" stroke="currentColor" className={isDark ? "text-gray-600" : "text-gray-400"} strokeWidth="1" />
              {/* IO to Customer */}
              <line x1="80%" y1="55%" x2="85%" y2="65%" stroke="currentColor" className={isDark ? "text-gray-600" : "text-gray-400"} strokeWidth="1" />
              {/* Start(green) to Customer Top */}
              <line x1="85%" y1="25%" x2="88%" y2="15%" stroke="currentColor" className={isDark ? "text-gray-600" : "text-gray-400"} strokeWidth="1" />
            </svg>

            {/* Nodes */}
            <div className="absolute inset-0">
              {/* Alert Node (Purple) */}
              <div className="absolute top-[55%] left-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <div className={`text-[9px] px-2 py-0.5 rounded border 
                    ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-100 text-indigo-600 border-indigo-200'}`}>ALERT</div>
              </div>

              {/* Market Node */}
              <div className={`absolute top-[45%] left-[20%] -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] shadow-sm 
                 ${isDark ? 'bg-[#1F2125] border border-white/10 text-gray-300 shadow-xl' : 'bg-white border border-gray-200 text-gray-700'}`}>
                Market <span className={`text-[8px] ml-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>x</span>
              </div>

              {/* Session Node (Center) */}
              <div className={`absolute top-[35%] left-[50%] -translate-x-1/2 text-[10px] font-mono tracking-widest
                 ${isDark ? 'text-zinc-600' : 'text-gray-500'}`}>
                Session
              </div>

              {/* Another Node (Bottom) */}
              <div className={`absolute bottom-[20%] left-[50%] -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] shadow-sm
                 ${isDark ? 'bg-[#1F2125] border border-white/10 text-gray-300 shadow-xl' : 'bg-white border border-gray-200 text-gray-700'}`}>
                Another
              </div>

              {/* Start Node (Green Dot) */}
              <div className={`absolute top-[22%] right-[18%] flex items-center gap-2 px-2 py-1 rounded-full shadow-sm
                 ${isDark ? 'bg-[#1F2125] border border-white/10 shadow-xl' : 'bg-white border border-gray-200'}`}>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Start</span>
              </div>

              {/* IO Node */}
              <div className={`absolute top-[52%] right-[22%] px-2 py-1 rounded-lg text-[9px] shadow-sm
                 ${isDark ? 'bg-[#1F2125] border border-white/10 text-gray-400' : 'bg-white border border-gray-200 text-gray-500'}`}>
                I/O
              </div>

              {/* Customer Node (Top Right) */}
              <div className={`absolute top-[10%] right-[5%] border px-2 py-1 rounded-full text-[9px]
                 ${isDark ? 'border-white/5 text-gray-600' : 'border-gray-200 text-gray-500'}`}>
                Customer
              </div>

              {/* Customer Node (Bottom Right) */}
              <div className={`absolute bottom-[30%] right-[5%] border px-2 py-1 rounded-full text-[9px]
                 ${isDark ? 'border-white/5 text-gray-600' : 'border-gray-200 text-gray-500'}`}>
                Customer
              </div>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
}

// Helper component for the mouse cursor arrow
function CursorIcon({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md"
    >
      <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19169L11.7841 12.3673H5.65376Z" stroke="white" strokeWidth="1" />
    </svg>
  );
}