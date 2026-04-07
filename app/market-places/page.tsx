'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import AppShell from '@/components/AppShell';
import {
    Store,
    Link,
    Settings,
    DollarSign,
    Lock,
    Zap,
    Users
} from 'lucide-react';

// Mock Data
const mockIntegrations = [
    { id: 1, name: 'Slack Integration', description: 'Get notifications directly in Slack channels.', status: 'Installed', type: 'Free', icon: Users, color: 'bg-rose-500' },
    { id: 2, name: 'GitHub Sync', description: 'Connect tasks to code branches and commits.', status: 'Available', type: 'Free', icon: Link, color: 'bg-teal-500' },
    { id: 3, name: 'Advanced Reporting', description: 'Unlock detailed analytics and export features.', status: 'Premium', type: 'Paid', icon: DollarSign, color: 'bg-amber-500' },
    { id: 4, name: 'Google Calendar Sync', description: 'Two-way sync with your Google Calendar.', status: 'Available', type: 'Free', icon: Settings, color: 'bg-indigo-500' },
];

const IntegrationCard: React.FC<any> = ({ integration, isDark }) => {
    const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
    const statusColor = integration.status === 'Installed' ? 'text-green-500' : integration.status === 'Premium' ? 'text-amber-500' : 'text-gray-500';
    const buttonText = integration.status === 'Installed' ? 'Manage' : integration.status === 'Premium' ? 'Upgrade' : 'Connect';

    return (
        <div className={`p-5 rounded-3xl border transition-all hover:shadow-xl ${cardBg}`}>
            <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${integration.color}`}>
                    <integration.icon size={20} />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor} ${integration.color.replace('500', '100').replace('bg-', 'bg-')}`}>
                    {integration.status}
                </span>
            </div>
            <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{integration.name}</h4>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{integration.description}</p>
            
            <div className="flex items-center justify-between pt-2 border-t">
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-600'} flex items-center gap-1`}>
                    {integration.type === 'Paid' && <Lock size={12} />}
                    {integration.type}
                </span>
                <button className={`text-sm font-bold px-4 py-2 rounded-xl text-white ${integration.color} hover:opacity-90 transition-opacity`}>
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export function MarketPlacesView() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    return (
        <div className={`flex-1 p-8 transition-colors ${isDark ? 'bg-slate-950' : 'bg-teal-50'}`}>
            <h1 className={`text-3xl font-bold flex items-center gap-3 mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Store size={32} className="text-teal-500" /> Market Places
            </h1>

            {/* Categories & Search */}
            <div className="flex justify-between items-center mb-6">
                <div className={`flex items-center gap-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <button className="text-teal-500 font-bold border-b-2 border-teal-500 pb-1">Integrations</button>
                    <button className={isDark ? 'text-gray-500 hover:text-white' : 'text-gray-700 hover:text-gray-900'}>Add-ons</button>
                    <button className={isDark ? 'text-gray-500 hover:text-white' : 'text-gray-700 hover:text-gray-900'}>Premium</button>
                </div>
                <div className="flex items-center gap-2">
                    <button className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-rose-600 text-white hover:bg-rose-500'}`}>
                        <Zap size={16} /> Premium
                    </button>
                </div>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockIntegrations.map(integration => (
                    <IntegrationCard key={integration.id} integration={integration} isDark={isDark} />
                ))}
            </div>
        </div>
    );
}

// Default export for the /market-places route
export default function Page() {
    return (
        <AppShell defaultView="Market Places" activeMenu="market-places">
            <MarketPlacesView />
        </AppShell>
    );
}