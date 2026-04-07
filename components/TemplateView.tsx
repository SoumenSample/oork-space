'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Layout, Search, Users, FileText, Plus, Star, Columns, X, Monitor, Video, PenTool } from 'lucide-react';
import { SpinnerFullscreen } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

const mockTemplates = [
  {
    id: 1,
    name: 'SaaS Launch Checklist',
    description: 'Everything you need to launch a software product.',
    type: 'table',
    users: 5,
    rating: 4.8,
    themeColor: '#008f7a',
    icon: Layout,
    category: 'Project',
  },
  {
    id: 2,
    name: 'Daily Standup Agenda',
    description: 'Simple template for daily team meetings.',
    type: 'todo',
    users: 12,
    rating: 4.5,
    themeColor: '#4f46e5',
    icon: FileText,
    category: 'Task',
  },
  {
    id: 3,
    name: 'Marketing Campaign Planner',
    description: 'Kanban board template for managing campaigns.',
    type: 'board',
    users: 8,
    rating: 4.9,
    themeColor: '#f59e0b',
    icon: Columns,
    category: 'Project',
  },
  {
    id: 4,
    name: 'Presentation Deck',
    description: 'Create and collaborate on presentations with slides.',
    type: 'presentation',
    users: 15,
    rating: 4.7,
    themeColor: '#8b5cf6',
    icon: Monitor,
    category: 'Media',
  },
  {
    id: 5,
    name: 'Video Project',
    description: 'Edit and manage video projects collaboratively.',
    type: 'video',
    users: 8,
    rating: 4.5,
    themeColor: '#ef4444',
    icon: Video,
    category: 'Media',
  },
  {
    id: 6,
    name: 'Collaborative Whiteboard',
    description: 'Brainstorm and collaborate on a flexible whiteboard.',
    type: 'whiteboard',
    users: 12,
    rating: 4.8,
    themeColor: '#10b981',
    icon: PenTool,
    category: 'Collaboration',
  },
];

// ── Use Template Modal ──
function UseTemplateModal({
  template,
  isDark,
  onClose,
}: {
  template: any;
  isDark: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [name, setName] = useState(template.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    if (!projectId) { setError('No project selected. Open a project first.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          viewType: template.type,
          projectId,
          icon: '📄',
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      const db = await res.json();
      onClose();
      router.push(`?projectId=${projectId}&dbId=${db._id}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-gray-200';
  const inputClass = isDark
    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#008f7a]'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-teal-500';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: template.themeColor }}
            >
              <template.icon size={18} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Use Template
              </h3>
              <p className="text-[11px] text-gray-500">{template.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Type badge */}
        <div className="mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
            style={{ backgroundColor: template.themeColor }}
          >
            {template.category} · {template.type}
          </span>
        </div>

        {/* Name input */}
        <div className="mb-4">
          <label className={`text-xs font-semibold mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Name your workspace
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Enter a name..."
            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition ${inputClass}`}
            autoFocus
          />
          {error && <p className="text-red-400 text-[11px] mt-1.5">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: template.themeColor }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={15} />
                Create & Open
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Create Template Modal ──
function CreateTemplateModal({
  isDark,
  onClose,
}: {
  isDark: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('table');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const viewTypes = [
    { type: 'table', label: 'Table', icon: Layout, color: '#008f7a' },
    { type: 'board', label: 'Board', icon: Columns, color: '#4f46e5' },
    { type: 'todo', label: 'Todo', icon: FileText, color: '#f59e0b' },
    { type: 'presentation', label: 'Presentation', icon: Monitor, color: '#8b5cf6' },
    { type: 'video', label: 'Video', icon: Video, color: '#ef4444' },
    { type: 'whiteboard', label: 'Whiteboard', icon: PenTool, color: '#10b981' },
  ];

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    if (!projectId) { setError('No project selected. Open a project first.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          viewType: selectedType,
          projectId,
          icon: '📄',
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      const db = await res.json();
      onClose();
      router.push(`?projectId=${projectId}&dbId=${db._id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-gray-200';
  const inputClass = isDark
    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#008f7a]'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-teal-500';

  const selectedMeta = viewTypes.find((v) => v.type === selectedType)!;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create New Workspace
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Choose a type and give it a name</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Type selector */}
        <div className="mb-4">
          <label className={`text-xs font-semibold mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            View Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {viewTypes.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-[11px] font-semibold transition ${
                  selectedType === type
                    ? 'border-current'
                    : isDark
                    ? 'border-gray-700 text-gray-400 hover:border-gray-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                style={selectedType === type ? { borderColor: color, color } : {}}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedType === type ? color : '#6b7280' }}
                >
                  <Icon size={13} />
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mb-5">
          <label className={`text-xs font-semibold mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={`My ${selectedMeta.label}...`}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition ${inputClass}`}
            autoFocus
          />
          {error && <p className="text-red-400 text-[11px] mt-1.5">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: selectedMeta.color }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={15} />
                Create & Open
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Template Card ──
const TemplateCard: React.FC<{
  template: any;
  isDark: boolean;
  onUse: (template: any) => void;
}> = ({ template, isDark, onUse }) => {
  const Icon = template.icon;
  const themeColor = template.themeColor;

  const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const descColor = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`p-8 rounded-[32px] border transition-all hover:shadow-2xl group cursor-pointer flex flex-col h-full ${cardBg}`}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 text-white" style={{ backgroundColor: themeColor }}>
        <Icon size={24} />
      </div>

      <h4 className={`text-[22px] font-bold mb-3 leading-tight ${textColor}`}>{template.name}</h4>
      <p className={`text-[14px] leading-relaxed mb-8 flex-grow font-medium ${descColor}`}>
        {template.description}
      </p>

      <div className={`space-y-6 pt-6 border-t border-dotted ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-5">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
            style={{ backgroundColor: themeColor }}
          >
            <Users size={14} />
            <span>{template.users} Used</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[13px]">
            <Star size={16} className="fill-amber-500" />
            <span>{template.rating}</span>
          </div>
          <span
            className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: themeColor + '55' , color: themeColor }}
          >
            {template.category}
          </span>
        </div>

        <button
          onClick={() => onUse(template)}
          className="w-full py-3.5 rounded-2xl text-[13px] font-bold transition-all transform active:scale-[0.98] text-white hover:opacity-90"
          style={{ backgroundColor: themeColor }}
        >
          Use Template
        </button>
      </div>
    </div>
  );
};

// ── Main TemplateView ──
export default function TemplateView() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const pageBg = isDark ? 'bg-slate-950' : 'bg-rose-50';

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredTemplates = mockTemplates.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Popular' && t.rating >= 4.8) ||
      (activeFilter === 'Recent' && t.id >= 4);
    return matchSearch && matchFilter;
  });

  if (isLoading) {
    return (
      <div className={`flex-1 min-h-screen transition-colors duration-700 ${pageBg}`}>
        <SpinnerFullscreen text="Loading templates..." />
      </div>
    );
  }

  return (
    <div className={`flex-1 p-10 min-h-screen transition-colors duration-700 ${pageBg}`}>

      {/* Title */}
      <div className="flex items-center justify-between mb-10">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#008f7a] flex items-center justify-center">
            <Layout size={24} className="text-white" />
          </div>
          Template Library
        </motion.h1>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008f7a] text-white font-bold text-sm shadow-lg shadow-teal-900/20 hover:opacity-90 transition-all"
        >
          <Plus size={18} />
          Create Template
        </motion.button>
      </div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-5 rounded-2xl mb-12 flex items-center gap-4 border ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100'}`}
      >
        <div className="relative flex-grow">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project or task templates..."
            className={`w-full text-sm pl-12 pr-4 py-3 rounded-xl outline-none transition-all ${
              isDark
                ? 'bg-gray-800/50 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-[#008f7a]'
                : 'bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-teal-500'
            }`}
          />
        </div>
        <div className="flex gap-2">
          {['Recent', 'Popular', 'All'].map((filter, i) => (
            <motion.button
              key={filter}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === filter
                  ? 'bg-[#008f7a] text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-400 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredTemplates.length === 0 ? (
          <div className={`col-span-3 text-center py-20 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No templates found for "{search}"</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isDark={isDark}
              onUse={setSelectedTemplate}
            />
          ))
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {selectedTemplate && (
          <UseTemplateModal
            template={selectedTemplate}
            isDark={isDark}
            onClose={() => setSelectedTemplate(null)}
          />
        )}
        {showCreateModal && (
          <CreateTemplateModal
            isDark={isDark}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
