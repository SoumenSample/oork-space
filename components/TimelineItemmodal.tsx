"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

export default function TimelineItemModal({
  isOpen,
  onClose,
  item,
  isDark,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  isDark: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    assignedTo: "",
    status: "Todo",
    comment: "",
  });

  useEffect(() => {
    if (!item) return;

    setForm({
      title: item.title || "",
      startDate: item.startDate?.slice(0, 10) || "",
      endDate: item.endDate?.slice(0, 10) || "",
      assignedTo: item.assignedTo || "",
      status: item.status || "Todo",
      comment: item.comment || "",
    });
  }, [item]);

  const save = async () => {
    const payload = {
      title: form.title,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      assignedTo: form.assignedTo,
      status: form.status,
      comment: form.comment,
    };

    console.log('=== SAVE DEBUG ===');
    console.log('Form state:', form);
    console.log('Saving item ID:', item._id);
    console.log('Payload being sent:', JSON.stringify(payload, null, 2));

    const res = await fetch(`/api/timeline/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to save:", errorText);
      alert("Failed to save changes: " + errorText);
      return;
    }

    const result = await res.json();
    console.log('Save result from API:', result);
    console.log('assignedTo in result:', result.assignedTo);
    console.log('comment in result:', result.comment);

    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!confirm("Delete this item?")) return;

    await fetch(`/api/timeline/${item._id}`, {
      method: "DELETE",
    });

    onSaved();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Timeline Card" isDark={isDark}>
      <div className="space-y-4 sm:space-y-5">
        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className={`w-full p-3 sm:p-4 rounded-xl border text-sm sm:text-base transition-colors ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-teal-500' 
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-rose-400'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-teal-500/20' : 'focus:ring-rose-400/20'}`}
          placeholder="Title"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
              onClick={(e) => {
                const target = e.target as HTMLInputElement;
                target.showPicker?.();
              }}
              className={`w-full p-3 sm:p-4 rounded-xl border cursor-pointer text-sm sm:text-base transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-rose-400'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-teal-500/20' : 'focus:ring-rose-400/20'}`}
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>End date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
              onClick={(e) => {
                const target = e.target as HTMLInputElement;
                target.showPicker?.();
              }}
              className={`w-full p-3 sm:p-4 rounded-xl border cursor-pointer text-sm sm:text-base transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-rose-400'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-teal-500/20' : 'focus:ring-rose-400/20'}`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>Assign</label>
          <input
            value={form.assignedTo}
            onChange={(e) =>
              setForm((p) => ({ ...p, assignedTo: e.target.value }))
            }
            className={`w-full p-3 sm:p-4 rounded-xl border text-sm sm:text-base transition-colors ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-teal-500' 
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-rose-400'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-teal-500/20' : 'focus:ring-rose-400/20'}`}
            placeholder="Ex: Abhijit"
          />
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            className={`w-full p-3 sm:p-4 rounded-xl border text-sm sm:text-base transition-colors cursor-pointer ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white focus:border-teal-500' 
                : 'bg-white border-gray-200 text-gray-900 focus:border-rose-400'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-teal-500/20' : 'focus:ring-rose-400/20'}`}
          >
            <option>Todo</option>
            <option>In Progress</option>
            <option>Done</option>
            <option>Blocked</option>
          </select>
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>Comment</label>
          <textarea
            value={form.comment}
            onChange={(e) =>
              setForm((p) => ({ ...p, comment: e.target.value }))
            }
            className={`w-full p-3 sm:p-4 rounded-xl border min-h-[100px] sm:min-h-[120px] text-sm sm:text-base transition-colors resize-none ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-teal-500' 
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-rose-400'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-teal-500/20' : 'focus:ring-rose-400/20'}`}
            placeholder="Write comment..."
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-3 pt-2">
          <button
            onClick={remove}
            className={`px-4 sm:px-5 py-3 sm:py-2.5 rounded-xl border text-sm sm:text-base font-medium transition-all ${
              isDark
                ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
            }`}
          >
            Delete
          </button>

          <button
            onClick={save}
            className={`px-5 sm:px-6 py-3 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg hover:shadow-xl ${
              isDark
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600'
                : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
