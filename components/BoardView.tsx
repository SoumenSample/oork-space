'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Plus, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// --- Type Definitions ---
interface Tag {
    label: string;
    color: string;
}

interface Task {
    id: UniqueIdentifier;
    title: string;
    tags: Tag[];
    date: string;
    avatars: string[];
}

interface Column {
    id: UniqueIdentifier;
    title: string;
    color: string;
    tasks: Task[];
}

// --- Initial Data ---
const initialColumns: Column[] = [
    {
        id: 'todo',
        title: 'To Do',
        color: 'indigo',
        tasks: [
            { id: 1, title: "Logo Idea's visualizations from brainstorming session.", tags: [{ label: 'Important', color: 'pink' }, { label: 'Visualization', color: 'yellow' }], date: 'Jan 20 - 25', avatars: ['bg-purple-500', 'bg-blue-500', 'bg-green-500'] },
            { id: 2, title: 'Generate proposed colours for initiating proposal.', tags: [{ label: 'Important', color: 'pink' }, { label: 'Conceptualization', color: 'cyan' }], date: 'Feb 21 - 25', avatars: ['bg-blue-500', 'bg-purple-500'] },
            { id: 3, title: 'Make a budget proposal ASAP', tags: [{ label: 'Finance', color: 'gray' }, { label: 'Budget', color: 'lime' }], date: 'Mar 01 - 25', avatars: ['bg-green-500', 'bg-blue-500'] },
            { id: 4, title: 'Generate proposed colours for initiating proposal.', tags: [{ label: 'Important', color: 'pink' }, { label: 'Conceptualization', color: 'cyan' }], date: 'Feb 21 - 25', avatars: ['bg-purple-500', 'bg-blue-500', 'bg-green-500'] }
        ]
    },
    {
        id: 'working',
        title: 'Working in progress',
        color: 'amber',
        tasks: [
            { id: 5, title: 'Define brand tone and messaging guidelines', tags: [{ label: 'High', color: 'red' }, { label: 'UI design', color: 'yellow' }], date: 'Mar 20 - 25', avatars: ['bg-blue-500', 'bg-purple-500'] },
            { id: 6, title: 'Outline a marketing plan for the Super Bowl launch', tags: [{ label: 'Medium', color: 'orange' }, { label: 'Off track', color: 'red' }], date: 'Jan 16 - 25', avatars: ['bg-green-500', 'bg-blue-500'] },
            { id: 7, title: 'Outline a marketing plan for the Super Bowl launch', tags: [{ label: 'Medium', color: 'orange' }, { label: 'Off track', color: 'red' }], date: 'Jan 16 - 25', avatars: ['bg-purple-500', 'bg-blue-500'] }
        ]
    },
    {
        id: 'inprogress',
        title: 'In Progress',
        color: 'blue',
        tasks: [
            { id: 8, title: 'Draft a press release for the brand relaunch', tags: [{ label: 'Low', color: 'cyan' }, { label: 'Visualization', color: 'yellow' }], date: 'Mar 25 - 25', avatars: ['bg-purple-500', 'bg-blue-500'] },
            { id: 9, title: 'Coordinate with vendors for production materials', tags: [{ label: 'High', color: 'red' }, { label: 'Visualization', color: 'yellow' }], date: 'Mar 25 - 25', avatars: ['bg-green-500', 'bg-blue-500'] }
        ]
    },
    {
        id: 'done',
        title: 'Done',
        color: 'emerald',
        tasks: [
            { id: 10, title: "Logo Idea's visualizations from brainstorming session.", tags: [{ label: 'Important', color: 'pink' }, { label: 'Visualization', color: 'yellow' }], date: 'Jan 20 - 25', avatars: ['bg-purple-500', 'bg-blue-500', 'bg-green-500'] },
            { id: 11, title: 'Define brand tone and messaging guidelines', tags: [{ label: 'High', color: 'red' }, { label: 'UI design', color: 'yellow' }], date: 'Mar 20 - 25', avatars: ['bg-blue-500', 'bg-purple-500'] },
            { id: 12, title: 'Coordinate with vendors for production materials', tags: [{ label: 'High', color: 'red' }, { label: 'Visualization', color: 'yellow' }], date: 'Mar 25 - 25', avatars: ['bg-green-500', 'bg-blue-500'] },
            { id: 13, title: 'Outline a marketing plan for the Super Bowl launch', tags: [{ label: 'Medium', color: 'orange' }, { label: 'Off track', color: 'red' }], date: 'Jan 16 - 25', avatars: ['bg-purple-500', 'bg-blue-500'] },
            { id: 14, title: 'Generate proposed colours for initiating proposal.', tags: [{ label: 'Important', color: 'pink' }, { label: 'Conceptualization', color: 'cyan' }], date: 'Feb 21 - 25', avatars: ['bg-blue-500', 'bg-purple-500', 'bg-green-500'] }
        ]
    }
];

// --- Utility Functions ---

const findColumn = (columns: Column[], id: UniqueIdentifier) => {
    const column = columns.find(c => c.id === id);
    if (column) return column;
    const taskColumn = columns.find(c => c.tasks.some(t => t.id === id));
    return taskColumn;
};



const arrayMove = (array: any[], fromIndex: number, toIndex: number) => {
    const newArray = [...array];
    const [element] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, element);
    return newArray;
};


// --- KanbanTask Component (Draggable Item) ---
function KanbanTask({ task, isDark, getTagColor }: { task: Task, isDark: boolean, getTagColor: (color: string) => string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-grab
                ${isDark ? 'bg-[#1F2125] border-gray-800 hover:border-gray-700' : 'bg-white border-rose-100 hover:border-rose-200'}`}
        >
            <h3 className={`font-medium text-sm mb-3 leading-snug ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {task.title}
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
                {task.tags.map((tag, idx) => (
                    <span key={idx} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getTagColor(tag.color)}`}>
                        {tag.label}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <CalendarIcon size={12} />
                    <span>{task.date}</span>
                </div>

                <div className="flex -space-x-1.5">
                    {task.avatars.map((avatarClass, idx) => (
                        <div key={idx} className={`w-5 h-5 rounded-full border ${avatarClass} ${isDark ? 'border-[#1F2125]' : 'border-white'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- KanbanColumn Component (Droppable Container) ---
function KanbanColumn({ column, isDark, getTagColor }: { column: Column, isDark: boolean, getTagColor: (color: string) => string }) {
    const {
        setNodeRef,
        isOver,
    } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
        },
    });

    const taskIds = useMemo(() => column.tasks.map(task => task.id), [column.tasks]);

    return (
        <div ref={setNodeRef} className="w-80 flex-shrink-0">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{column.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>{column.tasks.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Plus size={16} />
                    </button>
                    <button className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Tasks List (Droppable Area) */}
            <div className={`space-y-3 p-1 rounded-xl ${isOver ? (isDark ? 'bg-gray-800/50' : 'bg-rose-50') : ''}`}>
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {column.tasks.map((task) => (
                        <KanbanTask key={task.id} task={task} isDark={isDark} getTagColor={getTagColor} />
                    ))}
                </SortableContext>
                
                {/* Add New Button at bottom of column */}
                <button className={`w-full py-2 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs transition-colors
                    ${isDark
                        ? 'border-gray-800 text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                        : 'border-rose-200 text-gray-500 hover:bg-rose-50 hover:text-gray-700'}`}>
                    <Plus size={14} />
                    <span>Add New</span>
                </button>
            </div>
        </div>
    );
}

// --- Main BoardView Component ---
export default function BoardView() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [columns, setColumns] = useState<Column[]>(initialColumns);
    
    // Setup DND sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getTagColor = (color: string) => {
        const colors: Record<string, string> = {
            pink: isDark ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700',
            yellow: isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
            cyan: isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700',
            gray: isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700',
            lime: isDark ? 'bg-lime-500/20 text-lime-300' : 'bg-lime-100 text-lime-700',
            red: isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700',
            orange: isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700',
        };
        return colors[color] || (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the columns where the task started and ended
        const activeColumn = findColumn(columns, activeId);
        const overColumn = findColumn(columns, overId);

        if (!activeColumn || !overColumn) return;

        const isSameColumn = activeColumn.id === overColumn.id;
        const activeTasks = activeColumn.tasks;
        const overTasks = overColumn.tasks;

        const activeIndex = activeTasks.findIndex(t => t.id === activeId);
        let overIndex = overTasks.findIndex(t => t.id === overId);

        // Handle dropping onto an empty column or the column header/footer
        if (overIndex === -1) {
            // When dropping on the column itself, drop to the end of the list
            overIndex = overTasks.length;
        }

        if (isSameColumn) {
            // 1. Move task within the same column
            if (activeIndex !== overIndex) {
                setColumns(prevColumns => {
                    const newColumns = prevColumns.map(col => {
                        if (col.id === activeColumn.id) {
                            return {
                                ...col,
                                tasks: arrayMove(activeTasks, activeIndex, overIndex),
                            };
                        }
                        return col;
                    });
                    return newColumns;
                });
            }
        } else {
            // 2. Move task to a different column
            setColumns(prevColumns => {
                const activeTask = activeTasks[activeIndex];
                
                // Remove task from active column
                const newActiveTasks = activeTasks.filter(t => t.id !== activeId);

                // Add task to over column
                const newOverTasks = [...overTasks];
                newOverTasks.splice(overIndex, 0, activeTask);

                return prevColumns.map(col => {
                    if (col.id === activeColumn.id) {
                        return { ...col, tasks: newActiveTasks };
                    }
                    if (col.id === overColumn.id) {
                        return { ...col, tasks: newOverTasks };
                    }
                    return col;
                });
            });
        }
    };

    const columnIds = useMemo(() => columns.map(column => column.id), [columns]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 overflow-x-auto p-6">
                <div className="flex gap-6 min-w-max">
                    {/* Columns Context: Allows sorting columns (optional, but good practice) */}
                    <SortableContext items={columnIds} strategy={verticalListSortingStrategy}> 
                        {columns.map((column) => (
                            <KanbanColumn 
                                key={column.id} 
                                column={column} 
                                isDark={isDark} 
                                getTagColor={getTagColor} 
                            />
                        ))}
                    </SortableContext>
                </div>
            </div>
        </DndContext>
    );
}