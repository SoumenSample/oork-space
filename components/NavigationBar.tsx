'use client';

import Link from 'next/link';
import React from 'react';
import { ChevronDown, Menu, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/ThemeToggle';

const menuHighlights = [
  {
    title: 'Smart Home UI',
    description: 'End-to-end wireframe, research, and motion tests.',
    badge: 'In Review',
  },
  {
    title: 'Edu Platform',
    description: 'Funnels, onboarding, and classroom dashboards.',
    badge: 'Due July 08',
  },
  {
    title: 'Wellness App',
    description: 'Adaptive notifications with AI writing assist.',
    badge: 'Live',
  },
];

export default function NavigationBar() {
  return (
    <header className="border-b border-[color-mix(in_oklab,var(--background),black_70%)] bg-gradient-to-r from-teal-600/10 via-transparent to-rose-600/10 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-rose-600 text-white shadow-lg shadow-rose-600/30">
            <Sparkles size={20} />
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Walter
            </p>
            <p>Design System</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="#"
            className="text-sm text-foreground/80 transition hover:text-foreground"
          >
            Dashboard
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="nav-trigger inline-flex items-center gap-1 text-sm text-foreground/80 transition hover:text-foreground">
                Projects
                <ChevronDown
                  size={16}
                  className="nav-trigger-icon transition duration-200"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[22rem]" align="start">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500">
                Recent Boards
              </DropdownMenuLabel>
              <div className="space-y-3">
                {menuHighlights.map((item) => (
                  <DropdownMenuItem
                    key={item.title}
                    className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-[color-mix(in_oklab,var(--background),black_78%)]/60 p-4 shadow-inner shadow-black/10 hover:border-white/15"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold">
                      {item.title}
                      <span className="rounded-full bg-gradient-to-r from-teal-600/80 to-rose-600/80 px-3 py-1 text-xs text-white shadow-lg shadow-rose-600/30">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl text-sm font-medium">
                View all projects
                <DropdownMenuShortcut>⌘+K</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="#"
            className="text-sm text-foreground/80 transition hover:text-foreground"
          >
            Analytics
          </Link>
          <Link
            href="#"
            className="text-sm text-foreground/80 transition hover:text-foreground"
          >
            Teams
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden md:inline-flex">
            Invite
          </Button>
          <Button variant="secondary" className="hidden md:inline-flex">
            New Project
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden border border-white/10"
              >
                <Menu size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Dashboard</DropdownMenuItem>
              <DropdownMenuItem>Projects</DropdownMenuItem>
              <DropdownMenuItem>Analytics</DropdownMenuItem>
              <DropdownMenuItem>Teams</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Invite teammates</DropdownMenuItem>
              <DropdownMenuItem>New project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

