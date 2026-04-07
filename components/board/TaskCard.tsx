export type MilestonePoint = {
  text: string;
  done: boolean;
};

export type Milestone = {
  title: string;
  points: MilestonePoint[];
};

type TaskItem = {
  _id: string;
  values: {
    title?: string;
    description?: string;
    milestones?: Milestone[];
    [key: string]: unknown;
  };
};

type TaskCardProps = {
  item: TaskItem;
};

export default function TaskCard({ item }: TaskCardProps) {
  const togglePoint = async (mIndex: number, pIndex: number) => {
    const milestones = item.values.milestones ?? [];
    const updated = milestones.map((m, mi) => {
      if (mi !== mIndex) return m;
      return {
        ...m,
        points: m.points.map((p, pi) => (pi === pIndex ? { ...p, done: !p.done } : p)),
      };
    });

    const isCompleted = updated.every((m) => m.points.every((p) => p.done));

    const newValues = {
      ...item.values,
      milestones: updated,
      Status: isCompleted ? "Done" : "In Progress",
    };

    await fetch(`/api/items/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: newValues }),
    });
  };

  return (
    <div className="border p-3 rounded bg-white">
      <h3 className="font-bold">{item.values.title}</h3>
      <p>{item.values.description}</p>

      {item.values.milestones?.map((m: Milestone, i: number) => (
        <div key={i} className="mt-2">
          <h4 className="font-semibold">{m.title}</h4>

          {m.points.map((p: MilestonePoint, j: number) => (
            <div key={j} className="flex gap-2">
              <input type="checkbox" checked={p.done} onChange={() => togglePoint(i, j)} />
              <span className={p.done ? "line-through" : ""}>{p.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
