'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, FileText, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import BoardView from '@/components/BoardView';
import TimelineView from '@/components/TimelineView';
// import TableView from '@/components/TableView';
import TableView from './gallery/TableView';
import DashboardView from '@/components/DashboardView';
import ActivitiesView from '@/components/ActivitiesView';
import InboxView from '@/components/InboxView';
import MarketPlacesView from '@/components/MarketPlacesView';
import TemplateView from '@/components/TemplateView';

// 💡 DND Imports
import {
    DndContext,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    UniqueIdentifier,
    DragOverlay,
    closestCenter,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
// import TableView from './gallery/TableView';

// --- Type Definitions for Calendar Tasks ---
interface CalendarTask {
    id: UniqueIdentifier;
    title: string;
    color: 'yellow' | 'blue' | 'purple' | 'pink';
    startDayIndex: number; // 0=Mon, 1=Tue, etc.
    startTimeIndex: number; // 0=10:00, 1=11:00, etc.
    durationSlots: number; // How many time slots the task spans (e.g., 2 slots for 2 hours)
    details: any; // Simplified details for the example
}

interface CalendarViewProps {
    view: string;
    setView: (view: string) => void;
}

// --- Initial Calendar Tasks Data ---
const initialCalendarTasks: CalendarTask[] = [
    { id: 'cal-1', title: 'Design System Team Meeting', color: 'yellow', startDayIndex: 0, startTimeIndex: 0, durationSlots: 1, details: { attendees: 3, meetingId: 'meet._wrc-pgg-xx', timeRange: '10:15-12:15' } },
    { id: 'cal-2', title: 'Wireframe SmartHome App', color: 'blue', startDayIndex: 0, startTimeIndex: 2, durationSlots: 2, details: { doc: 'Project Brief Doc', assigned: 'Monica Rose', timeRange: '12:00-14:00' } },
    { id: 'cal-3', title: '3d Design Orzano Cotton', color: 'purple', startDayIndex: 1, startTimeIndex: 0, durationSlots: 3, details: { image: true, attendees: 5, timeRange: '10:45-14:15' } },
    { id: 'cal-4', title: 'Redesign Edu Web', color: 'pink', startDayIndex: 3, startTimeIndex: 0, durationSlots: 2, details: { progress: 60, checklist: 5, timeRange: '10:00-12:00' } },
];

const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00'];
const days = [
    { name: 'Mon', date: '26', full: 'Monday' },
    { name: 'Tue', date: '27', full: 'Tuesday' },
    { name: 'Wed', date: '28', full: 'Wednesday' },
    { name: 'Thu', date: '29', full: 'Thursday' },
];
const slotHeight = 96; // h-24 = 6rem = 96px

// --- Droppable Slot Component (The Calendar Cell) ---
function DroppableSlot({ dayIndex, timeIndex, isDark, children }: { dayIndex: number, timeIndex: number, isDark: boolean, children: React.ReactNode }) {
    const id = `slot-${dayIndex}-${timeIndex}`;
    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: {
            dayIndex,
            timeIndex,
            type: 'Slot',
        },
    });

    const isCurrentTimeSlot = new Date().getHours() === timeIndex + 10 && new Date().getDay() - 1 === dayIndex; // Basic current time check

    return (
        <div
            ref={setNodeRef}
            className={`h-${slotHeight / 4} border-b relative transition-colors duration-300
                ${isDark ? 'border-[color-mix(in_oklab,var(--background),black_70%)]' : 'border-rose-200'}
                ${isOver ? (isDark ? 'bg-white/10' : 'bg-gray-100') : ''}
            `}
        >
            {isCurrentTimeSlot && <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 z-10 animate-pulse"></div>}
            {children}
        </div>
    );
}


// --- Draggable Task Component ---
function DraggableTask({ task, isDark, getTaskStyles, isDragging }: { task: CalendarTask, isDark: boolean, getTaskStyles: (color: string) => { bg: string, border: string, shadow: string, text: string }, isDragging: boolean }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
        data: {
            task,
            type: 'Task',
        },
    });

    const { bg, border, shadow, text } = getTaskStyles(task.color);

    // Apply DND transform, ensuring the card is lifted when dragging
    const style = transform
        ? {
            transform: CSS.Transform.toString(transform),
            zIndex: isDragging ? 50 : 30, // Higher z-index for the dragged overlay
        }
        : { zIndex: 30 };

    const taskHeight = task.durationSlots * slotHeight;

    // Helper to render task content
    const TaskContent = () => {
        if (task.color === 'yellow') {
            return (
                <>
                    <div className={`font-semibold mb-1 transition-colors ${isDark ? 'text-white group-hover:text-yellow-400' : 'text-gray-900 group-hover:text-yellow-700'}`}>{task.title}</div>
                    <div className="flex items-center gap-1 mb-2">
                        <div className="flex -space-x-1">
                            {['bg-purple-500', 'bg-blue-500', 'bg-green-500'].map((cls, i) => (
                                <div key={i} className={`w-4 h-4 rounded-full border ${cls} ${isDark ? 'border-[#1F2125]' : 'border-white'}`}></div>
                            ))}
                        </div>
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.details.meetingId}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                        <button className={`text-[10px] px-2 py-0.5 rounded transition-colors
                            ${isDark ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black' : 'bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900'}`}>Join</button>
                        <div className="text-gray-500 text-[10px]">{task.details.timeRange}</div>
                    </div>
                </>
            );
        }
        if (task.color === 'blue') {
            return (
                <>
                    <div className={`font-semibold mb-2 transition-colors ${isDark ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-700'}`}>{task.title}</div>
                    <div className={`flex items-center gap-2 mb-2 p-1.5 rounded-lg border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-100 border-blue-200'}`}>
                        <FileText size={12} className={isDark ? "text-blue-400" : "text-blue-500"} />
                        <span className={`text-[10px] ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{task.details.doc}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                        <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.details.assigned}</div>
                    </div>
                    <div className="text-gray-500 text-[10px] mt-2">{task.details.timeRange}</div>
                </>
            );
        }
        if (task.color === 'purple') {
            return (
                <>
                    <div className={`font-semibold mb-2 transition-colors ${isDark ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-700'}`}>{task.title}</div>
                    <div className="w-full h-24 bg-gradient-to-br from-teal-400 via-purple-500 to-rose-500 rounded-lg mb-3 shadow-inner"></div>
                    <div className="flex -space-x-1 mb-3">
                        {['bg-purple-500', 'bg-blue-500', 'bg-green-500'].map((cls, i) => (
                            <div key={i} className={`w-5 h-5 rounded-full border ${cls} ${isDark ? 'border-[#1F2125]' : 'border-white'}`}></div>
                        ))}
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] ${isDark ? 'bg-[#2C2E33] border-[#1F2125] text-gray-400' : 'bg-gray-200 border-white text-gray-500'}`}>+2</div>
                    </div>
                    <button className="bg-purple-500 text-white text-[10px] px-2 py-1.5 rounded-lg w-full hover:bg-purple-600 transition-colors mt-auto shadow-lg shadow-purple-500/20">Final Edit CAD</button>
                    <div className="text-gray-500 text-[10px] mt-2">{task.details.timeRange}</div>
                </>
            );
        }
        if (task.color === 'pink') {
            return (
                <>
                    <div className={`font-semibold mb-2 transition-colors ${isDark ? 'text-white group-hover:text-pink-400' : 'text-gray-900 group-hover:text-pink-700'}`}>{task.title}</div>
                    <div className={`flex justify-between text-[10px] mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>Complete: 3/5</span>
                        <span className={isDark ? "text-pink-400" : "text-pink-500"}>60%</span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 mb-3 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: '60%' }}></div>
                    </div>
                    <div className={`text-[10px] mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Deadline: July, 08</div>
                    <div className="space-y-1.5 text-[10px]">
                        {['Research', 'Wireframe', 'Ui Design'].map((item, i) => (
                            <div key={i} className={`flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                <div className={`p-0.5 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}><Check size={8} /></div>
                                <span>{item}</span>
                            </div>
                        ))}
                        {['Prototype', 'A/B Test'].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-gray-500">
                                <div className={`border p-0.5 rounded-full w-3 h-3 ${isDark ? 'border-gray-600' : 'border-gray-400'}`}></div>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-gray-500 text-[10px] mt-auto">{task.details.timeRange}</div>
                </>
            );
        }
        return null;
    };


    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                top: 0,
                left: 0,
                right: 0,
                height: `${taskHeight}px`,
            }}
            {...listeners}
            {...attributes}
            className={`absolute border backdrop-blur-md shadow-sm transition-all duration-300 rounded-xl p-3 text-xs group flex flex-col cursor-grab
                ${bg} ${border} ${shadow} 
                ${isDragging ? 'opacity-50' : ''}`}
        >
            <TaskContent />
        </div>
    );
}


// --- Main CalendarView Component ---
export default function CalendarView({ view, setView }: CalendarViewProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [tasks, setTasks] = useState<CalendarTask[]>(initialCalendarTasks);
    const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);

    // 💡 DND Sensors
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="flex-1 overflow-x-auto p-6"><div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div></div>;
    }

    const isDark = resolvedTheme === 'dark';

    // 💡 Task Styling Utility
    const getTaskStyles = (color: string) => {
        const styles = {
            yellow: {
                bg: isDark ? 'bg-yellow-500/10' : 'bg-gradient-to-br from-yellow-50 to-yellow-100',
                border: isDark ? 'border-yellow-500/30' : 'border-yellow-200',
                shadow: isDark ? 'shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:border-yellow-500/50' : 'hover:shadow-md hover:border-yellow-300',
                text: isDark ? 'text-yellow-400' : 'text-yellow-700'
            },
            blue: {
                bg: isDark ? 'bg-blue-500/10' : 'bg-gradient-to-br from-blue-50 to-blue-100',
                border: isDark ? 'border-blue-500/30' : 'border-blue-200',
                shadow: isDark ? 'shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-500/50' : 'hover:shadow-md hover:border-blue-300',
                text: isDark ? 'text-blue-400' : 'text-blue-700'
            },
            purple: {
                bg: isDark ? 'bg-purple-500/10' : 'bg-gradient-to-br from-purple-50 to-purple-100',
                border: isDark ? 'border-purple-500/30' : 'border-purple-200',
                shadow: isDark ? 'shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:border-purple-500/50' : 'hover:shadow-md hover:border-purple-300',
                text: isDark ? 'text-purple-400' : 'text-purple-700'
            },
            pink: {
                bg: isDark ? 'bg-pink-500/10' : 'bg-gradient-to-br from-pink-50 to-pink-100',
                border: isDark ? 'border-pink-500/30' : 'border-pink-200',
                shadow: isDark ? 'shadow-[0_0_15px_rgba(236,72,153,0.1)] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:border-pink-500/50' : 'hover:shadow-md hover:border-pink-300',
                text: isDark ? 'text-pink-400' : 'text-pink-700'
            },
        };
        return (styles as any)[color] || styles.yellow;
    };

    // 💡 DND Handlers
    const handleDragStart = (event: any) => {
        if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
        }
    };

    const handleDragCancel = () => {
        setActiveTask(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;

        if (!over || active.id === over.id || over.data.current?.type !== 'Slot') return;

        const activeTask = active.data.current?.task as CalendarTask;
        const targetSlot = over.data.current as { dayIndex: number, timeIndex: number };

        // Update the task's position
        setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === activeTask.id) {
                // Prevent dropping where the task would exceed the calendar bounds
                if (targetSlot.timeIndex + task.durationSlots > timeSlots.length) {
                    return task;
                }
                return {
                    ...task,
                    startDayIndex: targetSlot.dayIndex,
                    startTimeIndex: targetSlot.timeIndex,
                };
            }
            return task;
        }));
    };

    // 💡 Render tasks grouped by slot for positioning calculation
    const renderedTasks = useMemo(() => {
        const taskMap: Record<string, CalendarTask[]> = {};
        tasks.forEach(task => {
            const key = `${task.startDayIndex}-${task.startTimeIndex}`;
            if (!taskMap[key]) taskMap[key] = [];
            taskMap[key].push(task);
        });
        return taskMap;
    }, [tasks]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex-1 overflow-x-auto">
                {view === 'Dashboard' ? (
                    <DashboardView />
                ) : (
                    <>
                        <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300
                    ${isDark ? 'border-[color-mix(in_oklab,var(--background),black_70%)] text-foreground' : 'border-rose-200 text-gray-900'}`}>
                            <div className={`flex items-center gap-1 p-1 rounded-xl border transition-colors
                        ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-200'}`}>
                                <button
                                    className={`px-6 py-2 text-sm rounded-xl shadow-sm font-medium transition-colors
                            ${view === 'Card' ? isDark ? 'bg-[#2C2E33] text-white' : 'bg-rose-100 text-gray-900' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                    onClick={() => setView('Card')}
                                >
                                    Card
                                </button>
                                <button
                                    className={`px-6 py-2 text-sm transition-colors rounded-xl
                            ${view === 'Timeline' ? isDark ? 'text-white bg-[#2C2E33]' : 'text-gray-900 bg-rose-100' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                    onClick={() => setView('Timeline')}
                                >
                                    Timeline
                                </button>
                                <button
                                    className={`px-6 py-2 text-sm transition-colors rounded-xl
                            ${view === 'Board' ? isDark ? 'text-white bg-[#2C2E33]' : 'text-gray-900 bg-rose-100' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                    onClick={() => setView('Board')}
                                >
                                    Board
                                </button>
                                <button
                                    className={`px-6 py-2 text-sm transition-colors rounded-xl
                            ${view === 'Table' ? isDark ? 'text-white bg-[#2C2E33]' : 'text-gray-900 bg-rose-100' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                    onClick={() => setView('Table')}
                                >
                                    Table
                                </button>
                            </div>

                            <div className="flex items-center gap-6">
                                <select className={`text-sm px-4 py-2.5 rounded-xl border outline-none cursor-pointer transition-colors
                            ${isDark ? 'bg-[#1F2125] text-gray-300 border-gray-800 hover:border-gray-700' : 'bg-white text-gray-700 border-rose-200 hover:border-rose-300'}`}>
                                    <option>1 Weeks</option>
                                </select>

                                <div className="flex flex-col items-end gap-1">
                                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
                                        <Pencil size={12} />
                                        <span>30 minutes ago</span>
                                        <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <div className={`w-5 h-5 rounded-full bg-pink-500 border ${isDark ? 'border-[#0F1014]' : 'border-white'}`}></div>
                                            <span>Sarah</span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-4 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                        <button className={`cursor-pointer transition ${isDark ? 'hover:text-white' : 'hover:text-gray-600'}`}><ChevronLeft size={20} /></button>
                                        <span className="text-xl font-semibold">June, 2023</span>
                                        <button className={`cursor-pointer transition ${isDark ? 'hover:text-white' : 'hover:text-gray-600'}`}><ChevronRight size={20} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {view === 'Board' || view === 'task-board' ? (
                            <BoardView />
                        ) : view === 'Timeline' ? (
                            <TimelineView databaseId="" />
                        ) : view === 'Table' ? (
                            <TableView databaseId="" />
                        ) : view === 'activities' ? (
                            <ActivitiesView />
                        ) : view === 'inbox' ? (
                            <InboxView />
                        ) : view === 'market-places' ? (
                            <MarketPlacesView />
                        ) : view === 'template' ? (
                            <TemplateView />
                        ) : (
                            <div className="p-6">
                                <div className="flex gap-4">
                                    {/* Time Column */}
                                    <div className="w-20 flex flex-col pt-8">
                                        {timeSlots.map((time) => (
                                            <div key={time} className={`h-24 text-xs border-b transition-colors
                                        ${isDark ? 'text-gray-500 border-gray-800' : 'text-gray-500 border-rose-200'}`}>
                                                {time}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Days Columns */}
                                    {days.map((day, dayIndex) => (
                                        <div key={day.name} className="flex-1 min-w-[200px]">
                                            <div className={`text-center mb-4 pb-2 border-b transition-colors
                                        ${isDark ? 'border-[color-mix(in_oklab,var(--background),black_70%)]' : 'border-rose-200'}`}>
                                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{day.full}</div>
                                                <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{day.date}/{day.name}</div>
                                            </div>

                                            <div className="relative">
                                                {/* Time Grid (Droppable Slots) */}
                                                {timeSlots.map((time, timeIndex) => (
                                                    <DroppableSlot key={time} dayIndex={dayIndex} timeIndex={timeIndex} isDark={isDark}>
                                                        {/* Render Draggable Tasks for this specific slot */}
                                                        {renderedTasks[`${dayIndex}-${timeIndex}`]?.map((task) => (
                                                            <DraggableTask
                                                                key={task.id}
                                                                task={task}
                                                                isDark={isDark}
                                                                getTaskStyles={getTaskStyles}
                                                                isDragging={activeTask?.id === task.id}
                                                            />
                                                        ))}

                                                        {/* Add New Task Placeholder (Unchanged) - Added unique key and repositioning */}
                                                        {dayIndex === 1 && timeIndex === 3 && tasks.filter(t => t.startDayIndex === dayIndex && t.startTimeIndex === timeIndex).length === 0 && (
                                                            <div className={`absolute top-0 left-0 right-0 border-2 border-dashed rounded-xl p-2 h-24 flex items-center justify-center cursor-pointer transition-all duration-300 group
                                                        ${isDark ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/60 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 hover:shadow-sm'}`}>
                                                                <div className="text-center">
                                                                    <div className="flex justify-center mb-1"><Plus size={24} className={`transition-all duration-300 group-hover:scale-110 ${isDark ? 'text-green-500/50 group-hover:text-green-400' : 'text-green-500 group-hover:text-green-600'}`} /></div>
                                                                    <div className={`text-xs transition-colors ${isDark ? 'text-green-500/50 group-hover:text-green-400' : 'text-green-600 group-hover:text-green-700'}`}>Add New Task</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {dayIndex === 2 && timeIndex === 2 && tasks.filter(t => t.startDayIndex === dayIndex && t.startTimeIndex === timeIndex).length === 0 && (
                                                            <div className={`absolute top-0 left-0 right-0 border-2 border-dashed rounded-xl p-2 h-24 flex items-center justify-center cursor-pointer transition-all duration-300 group
                                                        ${isDark ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/60 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 hover:shadow-sm'}`}>
                                                                <div className="text-center">
                                                                    <div className="flex justify-center mb-1"><Plus size={24} className={`transition-all duration-300 group-hover:scale-110 ${isDark ? 'text-green-500/50 group-hover:text-green-400' : 'text-green-500 group-hover:text-green-600'}`} /></div>
                                                                    <div className={`text-xs transition-colors ${isDark ? 'text-green-500/50 group-hover:text-green-400' : 'text-green-600 group-hover:text-green-700'}`}>Add New Task</div>
                                                                </div>
                                                            </div>
                                                        )}

                                                    </DroppableSlot>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 💡 DRAG OVERLAY PORTAL for smooth, elevated dragging animation */}
            {typeof document !== 'undefined' && createPortal(
                <DragOverlay dropAnimation={null}>
                    {activeTask ? (
                        <div style={{ width: '200px' }} className="rounded-xl">
                            <DraggableTask
                                task={activeTask}
                                isDark={isDark}
                                getTaskStyles={getTaskStyles}
                                isDragging={true}
                            />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
