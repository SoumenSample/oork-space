// "use client";
import { useState } from "react";

type MilestonePoint = {
  text: string;
  done: boolean;
};

type Milestone = {
  title: string;
  points: MilestonePoint[];
};

type TaskForm = {
  title: string;
  description: string;
  fromDate: string;
  toDate: string;
  email:string;
  milestones: Milestone[];
};

type CreateTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  databaseId: string;
  onSaved: () => void | Promise<void>;
};

export default function CreateTaskModal({ isOpen, onClose, databaseId, onSaved }: CreateTaskModalProps) {
  const [form, setForm] = useState<TaskForm>({
    title: "",
    description: "",
    fromDate: "",
    toDate: "",
    email:"",
    milestones: [],
  });

  const addMilestone = () => {
    setForm((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", points: [] }],
    }));
  };

  const addPoint = (mIndex: number) => {
    const updated = [...form.milestones];
    const milestone = updated[mIndex];
    if (!milestone) return;

    updated[mIndex] = {
      ...milestone,
      points: [...milestone.points, { text: "", done: false }],
    };

    setForm({ ...form, milestones: updated });
  };

  const handleSave = async () => {
    await fetch("/api/board_items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        values: {
          ...form,
          Status: "Not Complete",
        },
      }),
    });

    await onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white p-6 w-[500px] rounded-lg">
        <h2 className="text-xl font-bold mb-4">Create Task</h2>

        <input placeholder="Title" onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <textarea placeholder="Description" onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input type="date" onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />

        <input type="date" onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
        <input
  type="email"
  placeholder="Email"
  className="border p-2 w-full mb-2"
  value={form.email}
  onChange={(e) => setForm({ ...form, email: e.target.value })}
/>

        {form.milestones.map((m, i) => (
          <div key={i} className="border p-2 mt-2">
            <input
              placeholder="Milestone title"
              onChange={(e) => {
                const updated = [...form.milestones];
                updated[i] = { ...updated[i], title: e.target.value };
                setForm({ ...form, milestones: updated });
              }}
            />

            {m.points.map((p: MilestonePoint, j: number) => (
              <input
                key={j}
                placeholder="Point"
                onChange={(e) => {
                  const updated = [...form.milestones];
                  const currentMilestone = updated[i];
                  if (!currentMilestone) return;
                  const points = [...currentMilestone.points];
                  points[j] = { ...points[j], text: e.target.value };
                  updated[i] = { ...currentMilestone, points };
                  setForm({ ...form, milestones: updated });
                }}
              />
            ))}

            <button onClick={() => addPoint(i)}>+ Add Point</button>
          </div>
        ))}

        <button onClick={addMilestone}>+ Add Milestone</button>

        <div className="flex gap-2 mt-4">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
