'use client';

import React, { useEffect } from 'react';
import { useLayout } from '@/components/ClientLayout';
import CalendarView from '@/components/CalendarView';

type MenuName = 'dashboard' | 'project-board' | 'task-board' | 'schedule' | 'activities' | 'inbox' | 'template' | 'market-places' | null;

interface AppShellProps {
  defaultView?: string;
  activeMenu?: MenuName;
  children?: React.ReactNode;
}

export default function AppShell({
  defaultView = 'Dashboard',
  children,
}: AppShellProps) {
  const { view, setView } = useLayout();

  useEffect(() => {
    if (defaultView) {
      setView(defaultView);
    }
  }, [defaultView, setView]);

  return (
    <>
      {children ?? (
        <CalendarView view={view} setView={setView} />
      )}
    </>
  );
}

