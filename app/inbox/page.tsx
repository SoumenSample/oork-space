'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import AppShell from '@/components/AppShell';
import {
    Inbox,
    MessageSquare,
    CheckSquare,
    Archive,
    Trash2,
    Mail,
    Filter,
    User,
    Clock,
} from 'lucide-react';

// Mock Data
const mockMessages = [
    { id: 1, sender: 'Team Lead', subject: 'Urgent: Feedback needed on wireframes', time: '10:30 AM', isRead: false, type: 'Urgent', tagColor: 'bg-red-500' },
    { id: 2, sender: 'Design Bot', subject: 'You completed 5 tasks today!', time: 'Yesterday', isRead: false, type: 'System', tagColor: 'bg-teal-500' },
    { id: 3, sender: 'Mike Johnson', subject: 'Re: Website Landing Page Copy', time: '2 days ago', isRead: true, type: 'Comment', tagColor: 'bg-indigo-500' },
    { id: 4, sender: 'Anna Smith', subject: 'Invitation: Project Sync-Up Meeting', time: '3 days ago', isRead: true, type: 'Schedule', tagColor: 'bg-amber-500' },
];

const MessageItem: React.FC<any> = ({ message, isDark }) => {
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-500' : 'text-gray-600';
    const itemBg = isDark ? 'hover:bg-[#1F2125]' : 'hover:bg-rose-50';
    const unreadClass = message.isRead ? textMuted : 'font-bold ' + textPrimary;

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer ${itemBg} ${!message.isRead && (isDark ? 'bg-white/5' : 'bg-rose-100/50')}`}>
            <div className={`w-2 h-2 rounded-full ${message.tagColor}`}></div>

            <div className={`grow ${unreadClass}`}>
                <p className="text-sm font-semibold">{message.sender}</p>
                <p className={`text-xs truncate ${textMuted}`}>{message.subject}</p>
            </div>

            <span className={`text-xs font-medium w-16 sm:w-20 text-right ${textMuted}`}>{message.time}</span>
        </div>
    );
};

export function InboxView() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';

    return (
        <div className={`flex-1 p-4 md:p-6 lg:p-8 transition-colors ${isDark ? 'bg-slate-950' : 'bg-rose-50'} flex flex-col md:flex-row gap-4 md:gap-8`}>

            {/* Main Inbox List (60% width) */}
            <div className="w-full md:w-2/3">
                <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-6 md:mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Inbox size={28} className="md:size-8 text-teal-500" /> Inbox
                </h1>

                <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border ${cardBg}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b">
                        <div className={`flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <button className="text-teal-500 font-bold">Primary (2)</button>
                            <button className={isDark ? 'text-gray-500 hover:text-white' : 'text-gray-700 hover:text-gray-900'}>Archived</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><Filter size={18} /></button>
                            <button className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><Trash2 size={18} /></button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {mockMessages.map(msg => (
                            <MessageItem key={msg.id} message={msg} isDark={isDark} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Message Preview (40% width) */}
            <div className={`w-full md:w-1/3 p-4 md:p-6 rounded-2xl md:rounded-3xl border ${cardBg} h-fit sticky top-8 mb-4 md:mb-0`}>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Feedback needed on wireframes</h3>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mb-4 pb-4 border-b ${isDark ? 'border-gray-800' : 'border-rose-100'}`}>
                    <User size={14} />
                    <span>From: Team Lead</span>
                    <Clock size={14} className="ml-auto" />
                    <span>10:30 AM</span>
                </div>

                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hi Walter, could you please take a look at the latest wireframes for the new app onboarding flow? They are linked in the Project Board. We need to sign this off by the end of the day. Thanks!
                </p>

                <div className="mt-8 flex justify-between">
                    <button className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-teal-600 text-white hover:bg-teal-500' : 'bg-rose-600 text-white hover:bg-rose-500'}`}>
                        <MessageSquare size={16} /> Reply
                    </button>
                    <button className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <Archive size={18} /> Archive
                    </button>
                </div>
            </div>
        </div>
    );
}

// Default export for the /inbox route
export default function Page() {
    return (
        <AppShell defaultView="Inbox" activeMenu="inbox">
            <InboxView />
        </AppShell>
    );
}