'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import AppShell from '@/components/AppShell';
import {
    ListChecks,
    Plus,
    Calendar,
    MessageSquare,
    Clock,
    User,
    MoreVertical,
    Zap, // For High Priority
    ChevronDown
} from 'lucide-react';
import { SpinnerFullscreen } from '@/components/ui/spinner';

// --- Mock Data ---
const mockTasks = [
    { id: 1, title: 'Finalize Daily Notes format', tag: 'Personal', dueDate: 'Today', status: 'Todo', priority: 'High', color: 'bg-red-500', comments: 1 },
    { id: 2, title: 'Refactor Auth logic in Sidebar component', tag: 'Work', dueDate: 'Tomorrow', status: 'Doing', priority: 'Medium', color: 'bg-blue-500', comments: 3 },
    { id: 3, title: 'Review last week’s activity report', tag: 'Work', dueDate: 'Fri', status: 'Doing', priority: 'High', color: 'bg-red-500', comments: 0 },
    { id: 4, title: 'Schedule sync-up with team lead', tag: 'Personal', dueDate: 'Next Week', status: 'Done', priority: 'Low', color: 'bg-green-500', comments: 0 },
    { id: 5, title: 'Draft client email for V2 launch', tag: 'Work', dueDate: 'Today', status: 'Todo', priority: 'Medium', color: 'bg-blue-500', comments: 2 },
    { id: 6, title: 'Update dependencies in package.json', tag: 'System', dueDate: 'EOD', status: 'Done', priority: 'Medium', color: 'bg-purple-500', comments: 1 },
];

// --- Task Card Component ---
const TaskCard: React.FC<any> = ({ task, isDark }) => {
    const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';

    // Style the badge based on priority
    let priorityClass = '';
    let priorityIcon = null;
    if (task.priority === 'High') {
        priorityClass = isDark ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-100';
        priorityIcon = <Zap size={14} />;
    } else if (task.priority === 'Medium') {
        priorityClass = isDark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-700 bg-amber-100';
        priorityIcon = <Clock size={14} />;
    } else {
        priorityClass = isDark ? 'text-gray-400 bg-gray-700/10' : 'text-gray-600 bg-gray-100';
        priorityIcon = <ChevronDown size={14} />;
    }

    return (
        <div className={`p-4 rounded-xl shadow-md transition-shadow hover:shadow-lg cursor-grab border ${cardBg}`}>
            <div className={`flex items-center justify-between text-xs font-bold mb-2`}>
                <span className={`px-2 py-0.5 rounded-full text-white`} style={{ backgroundColor: task.color.replace('bg-', '') }}>
                    {task.tag}
                </span>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${priorityClass}`}>
                    {priorityIcon}
                    {task.priority}
                </span>
            </div>

            <h4 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-950'}`}>{task.title}</h4>

            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} pt-2 border-t ${isDark ? 'border-gray-800' : 'border-rose-100'}`}>
                <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="font-medium">{task.dueDate}</span>
                </div>
                <div className="flex items-center gap-3">
                    {task.comments > 0 && (
                        <div className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            <span>{task.comments}</span>
                        </div>
                    )}
                    <button className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Kanban Column Component ---
const TaskColumn: React.FC<any> = ({ title, status, tasks, isDark }) => {
    const primaryBg = isDark ? 'bg-[#18191d]' : 'bg-rose-100/50';
    const countClass = isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700';

    return (
        <div className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 min-w-[300px] shrink-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${countClass}`}>{tasks.length}</span>
            </div>
            {/* The main scrollable task area */}
            <div className={`space-y-4 p-4 rounded-2xl h-full max-h-[calc(100vh-200px)] overflow-y-auto ${primaryBg}`}>
                {tasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} isDark={isDark} />
                ))}

                {/* Add New Task Button */}
                <button className={`w-full py-3 border-2 border-dashed rounded-xl font-medium transition-colors 
                    ${isDark ? 'border-gray-700 text-gray-500 hover:bg-gray-800' : 'border-rose-300 text-rose-500 hover:bg-rose-100'}`}>
                    <Plus size={18} className="mx-auto" />
                </button>
            </div>
        </div>
    );
};

// --- Main Task Board View Component ---
export function TaskBoardView() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading tasks
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className={`flex-1 transition-colors ${isDark ? 'bg-slate-950' : 'bg-rose-50'}`}>
                <SpinnerFullscreen text="Loading task board..." />
            </div>
        );
    }

    // Group tasks by status
    const tasksByStatus: { [key: string]: typeof mockTasks } = {
        Todo: mockTasks.filter(t => t.status === 'Todo'),
        Doing: mockTasks.filter(t => t.status === 'Doing'),
        Done: mockTasks.filter(t => t.status === 'Done'),
    };

    // Fallback/Default color based on theme
    const primaryButtonColor = isDark ? 'bg-teal-600 hover:bg-teal-500' : 'bg-rose-600 hover:bg-rose-500';

    return (
        <div className={`flex-1 overflow-x-auto p-8 transition-colors ${isDark ? 'bg-slate-950' : 'bg-rose-50'}`}>
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <ListChecks size={32} className="text-teal-500" /> My Task Board
                </h1>
                <div className="flex items-center gap-3">
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold shadow-lg transition-all hover:scale-[1.03] ${primaryButtonColor}`}>
                        <Plus size={20} />
                        New Task
                    </button>
                </div>
            </div>

            {/* Kanban Columns Container */}
            <div className="flex gap-6 overflow-x-auto pb-4">
                <TaskColumn title="To Do" status="Todo" tasks={tasksByStatus.Todo} isDark={isDark} />
                <TaskColumn title="In Progress" status="Doing" tasks={tasksByStatus.Doing} isDark={isDark} />
                <TaskColumn title="Completed" status="Done" tasks={tasksByStatus.Done} isDark={isDark} />
            </div>
        </div>
    );
}

// Default export for the /task-board route, wrapped in the main app shell
export default function Page() {
    return (
        <AppShell defaultView="Board" activeMenu="task-board">
            <TaskBoardView />
        </AppShell>
    );
}