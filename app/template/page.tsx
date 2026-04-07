'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import AppShell from '@/components/AppShell';
import { Layout, Search, Users, FileText, Plus, Zap, Star } from 'lucide-react';

import TemplateView from '@/components/TemplateView';

// Default export for the /template route
export default function Page() {
    return (
        <AppShell defaultView="Template" activeMenu="template">
            <TemplateView />
        </AppShell>
    );
}