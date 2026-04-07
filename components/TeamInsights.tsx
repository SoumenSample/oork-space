'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function TeamInsights() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 rounded-3xl p-6 border border-transparent">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`flex-1 rounded-3xl p-6 border transition-colors duration-300
      ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Team Insights</h3>
          <div className="flex items-center text-[#4ade80] text-sm font-medium gap-1">
            <TrendingUp size={16} />
            <span>+19,24</span>
          </div>
        </div>
        <a href="#" className="text-[#6366f1] text-sm hover:text-[#818cf8] transition-colors">View all</a>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column: Stats */}
        <div className="space-y-6">
          {/* Time Spent */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Time Spent</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>9h</span>
              <span className="bg-[#6366f1]/20 text-[#818cf8] text-xs px-2 py-0.5 rounded-full">78%</span>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasks</span>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>10</span>
              <span className="bg-[#6366f1]/20 text-[#818cf8] text-xs px-2 py-0.5 rounded-full">68%</span>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6366f1]"></div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Doing</span>
                <span className={`text-sm ml-auto ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f472b6]"></div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Proggres</span>
                <span className={`text-sm ml-auto ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed</span>
                <span className={`text-sm ml-auto ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="relative">
          <div className="flex justify-end mb-4">
            <button className={`flex items-center gap-1 text-sm transition-colors
              ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              Days
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex items-end justify-between h-40 gap-2">
            {/* M */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className={`w-1.5 h-12 rounded-full relative overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-rose-200'}`}>
                <div className="absolute bottom-0 w-full h-1/3 bg-[#6366f1]"></div>
              </div>
              <span className="text-gray-500 text-xs">M</span>
            </div>
            {/* T */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className={`w-1.5 h-20 rounded-full relative overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="absolute bottom-0 w-full h-1/2 bg-[#f472b6]"></div>
                <div className="absolute bottom-1/2 w-full h-1/4 bg-[#10b981]"></div>
              </div>
              <span className="text-gray-500 text-xs">T</span>
            </div>
            {/* W (Today) */}
            <div className="flex flex-col items-center gap-2 w-full relative">
              <div className="absolute -top-8 bg-[#6366f1] text-white text-[10px] px-2 py-0.5 rounded-md">
                Today
              </div>
              <div className={`w-1.5 h-32 rounded-full relative overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="absolute bottom-0 w-full h-1/3 bg-[#6366f1]"></div>
                <div className="absolute bottom-1/3 w-full h-1/3 bg-[#10b981]"></div>
                <div className="absolute bottom-2/3 w-full h-1/6 bg-[#f472b6]"></div>
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>W</span>
            </div>
            {/* T */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className={`w-1.5 h-16 rounded-full relative overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="absolute bottom-0 w-full h-1/2 bg-[#10b981]"></div>
              </div>
              <span className="text-gray-500 text-xs">T</span>
            </div>
            {/* F */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className={`w-1.5 h-24 rounded-full relative overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="absolute bottom-0 w-full h-1/4 bg-[#f472b6]"></div>
                <div className="absolute bottom-1/4 w-full h-1/4 bg-[#6366f1]"></div>
              </div>
              <span className="text-gray-500 text-xs">F</span>
            </div>
            {/* S */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className={`w-1.5 h-10 rounded-full relative overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="absolute bottom-0 w-full h-1/2 bg-[#f472b6]"></div>
              </div>
              <span className="text-gray-500 text-xs">S</span>
            </div>
            {/* S */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className={`w-1.5 h-14 rounded-full relative overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="absolute bottom-0 w-full h-1/3 bg-[#10b981]"></div>
              </div>
              <span className="text-gray-500 text-xs">S</span>
            </div>
          </div>

          {/* Y-Axis Labels (Simplified) */}
          <div className="absolute left-0 top-0 bottom-8 -ml-6 flex flex-col justify-between text-[10px] text-gray-600">
            <span>10</span>
            <span>8</span>
            <span>6</span>
            <span>4</span>
            <span>2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
