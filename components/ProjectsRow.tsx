// "use client";

// import { useEffect, useState } from "react";
// import { Plus, GripVertical } from "lucide-react";
// import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
// import { useRouter } from "next/navigation";
// import ViewPickerCard from "./ViewpickerCard";
// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// export default function ProjectRow({
//   project,
//   isDark,
//   pathname,
//   onSelectDatabase,
//   sortableId,
// }: {
//   project: any;
//   isDark?: boolean;
//   pathname?: string;
//   onSelectDatabase?: (db: any) => void;
//   sortableId?: string;
// }) {
//   const router = useRouter();
//   const [showCreateDbModal, setShowCreateDbModal] = useState(false);

//   const isProjectActive = pathname?.startsWith(`/projects/${project._id}`);

//   const {
//     databasesByProject,
//     fetchDatabases,
//     setActiveProject,
//     setActiveDatabase,
//   } = useWorkspaceStore();

//   const dbs = databasesByProject[project._id] || [];

//   useEffect(() => {
//     fetchDatabases(project._id);
//   }, [project._id]);

//   // ── DnD sortable ──
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id: sortableId ?? project._id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.4 : 1,
//     zIndex: isDragging ? 999 : undefined,
//   };

//   return (
//     <div ref={setNodeRef} style={style} className="space-y-1">

//       {/* ── PROJECT ROW ── */}
//       <div
//         onClick={() => {
//           setActiveProject(project._id);
//           router.push(`/projects/${project._id}`);
//         }}
//         className="relative cursor-pointer group"
//       >
//         <div
//           className={`absolute inset-0 bg-gradient-to-r from-teal-600 to-rose-600 rounded-xl ${
//             isProjectActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
//           }`}
//         />
//         <div
//           className={`relative flex items-center justify-between px-3 py-2 rounded-xl transition ${
//             isProjectActive
//               ? "text-white"
//               : isDark
//               ? "text-gray-300"
//               : "text-gray-700"
//           }`}
//         >
//           {/* ✅ Drag handle — only this triggers drag, not the whole row */}
//           <div
//             {...attributes}
//             {...listeners}
//             onClick={(e) => e.stopPropagation()}
//             className={`p-0.5 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-1 ${
//               isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
//             }`}
//             title="Drag to reorder"
//           >
//             <GripVertical size={14} />
//           </div>

//           <div className="flex items-center gap-2 min-w-0 flex-1">
//             <span className="text-lg shrink-0">{project.emoji}</span>
//             <span className="text-sm font-semibold truncate">{project.name}</span>
//           </div>

//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setShowCreateDbModal(true);
//             }}
//             className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${
//               isDark ? "hover:bg-white/10" : "hover:bg-white/20"
//             }`}
//             title="Add view"
//           >
//             <Plus size={16} />
//           </button>
//         </div>
//       </div>

//       {/* ── DATABASES ── */}
//       {!isDragging && (
//         <div className="pl-8 space-y-1 relative">
//           {dbs.length > 0 && (
//             <div
//               className={`absolute left-[8px] top-0 bottom-0 w-[2px] ${
//                 isDark ? "bg-gray-600" : "bg-gray-400"
//               }`}
//             />
//           )}

//           {dbs.map((db: any) => {
//             const isDatabaseActive = pathname?.includes(`db=${db._id}`);

//             return (
//               <div key={db._id} className="relative">
//                 <div
//                   className={`absolute -ml-6 top-2 w-[24px] h-[12px] border-l-2 border-b-2 rounded-bl-lg ${
//                     isDark ? "border-gray-600" : "border-gray-400"
//                   }`}
//                 />
//                 <div
//                   onClick={() => {
//                     setActiveDatabase(db);
//                     onSelectDatabase?.(db);
//                     router.push(`/projects/${project._id}?db=${db._id}`);
//                   }}
//                   className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
//                     isDatabaseActive
//                       ? "bg-gradient-to-r from-teal-600/20 to-rose-600/20 font-semibold"
//                       : isDark
//                       ? "hover:bg-white/5"
//                       : "hover:bg-gray-100"
//                   }`}
//                 >
//                   <span className="text-base -ml-8">{db.icon}</span>
//                   <span className="truncate flex-1">{db.name}</span>
//                   <span
//                     className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
//                       isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"
//                     }`}
//                   >
//                     {db.viewType}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}

//           {dbs.length === 0 && (
//             <p className={`text-[10px] px-3 py-1 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
//               No views yet
//             </p>
//           )}
//         </div>
//       )}

//       {/* ── CREATE DATABASE MODAL ── */}
//       {showCreateDbModal && (
//         <ViewPickerCard
//           projectId={project._id}
//           isDark={isDark}
//           onDone={async () => {
//             setShowCreateDbModal(false);
//             await fetchDatabases(project._id);
//           }}
//         />
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
import { useRouter } from "next/navigation";
import ViewPickerCard from "./ViewpickerCard";


export default function ProjectRow({ project, isDark, pathname }: any) {
  const router = useRouter();
  const [showCreateDbModal, setShowCreateDbModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [insertAfterDatabaseId, setInsertAfterDatabaseId] = useState<string | null>(null);

  // Check if this project is active
  const isProjectActive = pathname?.startsWith(`/projects/${project._id}`);

  const {
    databasesByProject,
    fetchDatabases,
    setActiveProject,
    setActiveDatabase,
  } = useWorkspaceStore();

  const dbs = databasesByProject[project._id] || [];

  const openCreateModalForProject = (afterDbId?: string) => {
    setActiveProject(project._id);
    setTargetProjectId(project._id);
    setInsertAfterDatabaseId(afterDbId ?? null);
    setShowCreateDbModal(true);
  };

  useEffect(() => {
    fetchDatabases(project._id);
  }, []);

  return (
    <div className="space-y-1">
      {/* PROJECT */}
      <div
        onClick={() => {
          setActiveProject(project._id);
          router.push(`/projects/${project._id}`);
        }}
        className="relative cursor-pointer group"
      >
        {/* Gradient background */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-teal-600 to-rose-600 rounded-xl ${
            isProjectActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
          }`}
        />
        
        <div className={`relative flex items-center justify-between px-3 py-2 rounded-xl transition ${
          isProjectActive ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"
        }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{project.emoji}</span>
          <span className="text-sm font-semibold truncate">{project.name}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            openCreateModalForProject();
          }}
          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? "hover:bg-white/10" : "hover:bg-white/20"
          }`}
          aria-label="Add dataset"
          title="Add dataset"
        >
          <Plus size={16} />
        </button>
        </div>
      </div>

      {/* DATABASES */}
      <div className="pl-8 space-y-1 relative">
        {dbs.length > 0 && (
          <div
            className={`absolute left-[8px] top-0 bottom-0 w-[2px] ${
              isDark ? "bg-gray-600" : "bg-gray-400"
            }`}
          />
        )}
        {dbs.map((db: any) => {
          // Check if this database is active
          const isDatabaseActive = pathname?.includes(`db=${db._id}`);
          
          return (
          <div key={db._id} className="relative">
            <div
              className={`absolute -ml-6 top-2 w-[24px] h-[12px] border-l-2 border-b-2 rounded-bl-lg ${
                isDark ? "border-gray-600" : "border-gray-400"
              }`}
            />
            <div
              onClick={() => {
                setActiveDatabase(db._id);
                router.push(`/projects/${project._id}?db=${db._id}`);
              }}
              className={`group flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer ml-[28px] transition ${
                isDatabaseActive 
                  ? "bg-gradient-to-r from-teal-600/20 to-rose-600/20 font-semibold" 
                  : isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-base -ml-8">{db.icon}</span>
                <span className="truncate">{db.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModalForProject(db._id);
                }}
                className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                }`}
                aria-label="Add dataset"
                title="Add dataset"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* CREATE DATABASE MODAL */}
      {showCreateDbModal && targetProjectId && (
        <ViewPickerCard
          key={targetProjectId}
          projectId={targetProjectId}
          insertAfterDatabaseId={insertAfterDatabaseId}
          isDark={isDark}
          onDone={() => {
            setShowCreateDbModal(false);
            fetchDatabases(targetProjectId);
            setTargetProjectId(null);
            setInsertAfterDatabaseId(null);
          }}
        />
      )}
    </div>
  );
}
