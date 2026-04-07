'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Pencil, Upload, Type, Settings, Image, Trash2, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

export default function FiltersBar() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTool, setActiveTool] = useState('pencil');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="px-6 py-4">
        <div className="animate-pulse h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const tools = [
    { id: 'pencil', icon: <Pencil size={18} /> },
    { id: 'upload', icon: <Upload size={18} /> },
    { id: 'type', icon: <Type size={18} /> },
    { id: 'settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="px-6 py-4">
      <Card className={`flex items-center justify-between p-2 transition-colors duration-300
        ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-200'}`}>
        {/* Left Section */}
        <div className="flex items-center gap-6 pl-2">
          <Button variant="outline" className={`gap-3 ${isDark ? 'bg-[#1F2125] text-gray-300 hover:text-white' : 'bg-rose-100 text-gray-700 hover:text-gray-900'}`}>
            <SlidersHorizontal size={16} />
            <span className="text-sm font-medium">Filters</span>
            <Badge variant={isDark ? "default" : "default"} className={`${isDark ? 'bg-[#2C2E33] text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              6
            </Badge>
          </Button>

          <div className="flex items-center gap-3">
            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Color:</span>
            <div className="flex items-center gap-2">
              {['pink-500', 'yellow-400', 'blue-400', 'purple-500', 'green-500'].map((color, idx) => (
                <button
                  key={idx}
                  className={`w-6 h-6 rounded-full bg-${color} cursor-pointer hover:scale-110 transition-transform`}
                />
              ))}
              <Button variant="outline" size="icon" className={`w-6 h-6 rounded-full
                ${isDark ? 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500' : 'border-gray-400 text-gray-500 hover:text-gray-900 hover:border-gray-600'}`}>
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Center Section - Tools */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border transition-colors
          ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-rose-100 border-rose-200'}`}>
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon"
              onClick={() => setActiveTool(tool.id)}
              className={`rounded-lg transition-colors ${
                activeTool === tool.id
                  ? isDark
                    ? 'text-white bg-[#2C2E33] hover:bg-gray-700'
                    : 'text-gray-900 bg-rose-200 hover:bg-rose-300'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-[#2C2E33]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-rose-200'
              }`}
            >
              {tool.icon}
            </Button>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6 pr-4">
          <Button variant="ghost" size="sm" className={`gap-2
            ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
            <Image size={18} />
            <span className="text-sm">Add Image</span>
          </Button>

          <Separator orientation="vertical" className={`h-6 ${isDark ? 'bg-gray-800' : 'bg-rose-300'}`} />

          <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-red-500">
            <Trash2 size={18} />
            <span className="text-sm">Deleted</span>
            <Badge variant={isDark ? "destructive" : "destructive"} className={`ml-1
              ${isDark ? 'bg-[#2C2E33] text-red-400' : 'bg-red-100 text-red-600'}`}>
              4
            </Badge>
          </Button>
        </div>
      </Card>
    </div>
  );
}
