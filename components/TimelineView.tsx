
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import TimelineItemModal from "@/components/TimelineItemmodal";
import type { DbView } from "@/components/DatabaseViewtabs";

type TimelineItem = {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
  assignedTo?: string;
  status?: string;
  comment?: string;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonthYear(d: Date) {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function TimelineView({ databaseId,activeView }: { databaseId: string,activeView?: DbView }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const navigateToSchedule = () => {
    if (typeof window === "undefined") return;
    const nextUrl = `/schedule?databaseId=${encodeURIComponent(databaseId)}`;
    window.location.assign(nextUrl);
  };

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [ghostPosition, setGhostPosition] = useState({ left: 0, top: 0 });

  const [draggingCard, setDraggingCard] = useState<TimelineItem | null>(null);
  const [draggedCardDuration, setDraggedCardDuration] = useState(0);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
    const modeKey = `${activeView?.type || ""} ${activeView?.label || ""}`.toLowerCase();
  const isshowData = modeKey.includes("show-data") || modeKey.includes("my-tasks");

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch(`/api/timeline?databaseId=${databaseId}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (databaseId) {
      (async () => {
        setLoading(true);
        const res = await fetch(`/api/timeline?databaseId=${databaseId}`);
        const data = await res.json();
        console.log("timeline items", data);  
        setItems(data);
        setLoading(false);
      })();
    }
  }, [databaseId]);

  const monthDate = useMemo(() => currentMonth, [currentMonth]);
  const monthStart = useMemo(() => startOfMonth(monthDate), [monthDate]);
  const monthEnd = useMemo(() => endOfMonth(monthDate), [monthDate]);
  const rangeStart = useMemo(() => addDays(monthStart, -3), [monthStart]);
  const rangeEnd = useMemo(() => addDays(monthEnd, 2), [monthEnd]);

  const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd) + 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(rangeStart, today);
  const todayPercent = (todayOffset / totalDays) * 100;

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const ROW_HEIGHT = 56;
  // Responsive column width: smaller on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const DAY_COL_WIDTH = isMobile ? 50 : 70;
  const SIDEBAR_WIDTH = isMobile ? 180 : 260;
  const GRID_WIDTH = totalDays * DAY_COL_WIDTH;

  const handleNewButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingNew(true);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleNewButtonTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDraggingNew(true);
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleCardMouseDown = (e: React.MouseEvent, item: TimelineItem) => {
    e.preventDefault();
    e.stopPropagation();

    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);

    const s = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    const duration = Math.max(1, daysBetween(s, endDate) + 1);

    setDraggingCard(item);
    setDraggedCardDuration(duration);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCardTouchStart = (e: React.TouchEvent, item: TimelineItem) => {
    const touch = e.touches[0];
    
    setMouseDownPos({ x: touch.clientX, y: touch.clientY });
    setHasMoved(false);

    const s = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    const duration = Math.max(1, daysBetween(s, endDate) + 1);

    setDraggingCard(item);
    setDraggedCardDuration(duration);
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    if (!isDraggingNew && !draggingCard) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      
      if (dx > 5 || dy > 5) {
        setHasMoved(true);
      }

      setDragPosition({ x: e.clientX, y: e.clientY });

      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dayIndex = Math.max(0, Math.floor(x / DAY_COL_WIDTH));
        const rowIndex = Math.max(0, Math.floor(y / ROW_HEIGHT));

        const leftPx = dayIndex * DAY_COL_WIDTH;
        const topPx = rowIndex * ROW_HEIGHT + 10;

        setGhostPosition({ left: leftPx, top: topPx });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - mouseDownPos.x);
      const dy = Math.abs(touch.clientY - mouseDownPos.y);
      
      if (dx > 5 || dy > 5) {
        setHasMoved(true);
      }

      setDragPosition({ x: touch.clientX, y: touch.clientY });

      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const dayIndex = Math.max(0, Math.floor(x / DAY_COL_WIDTH));
        const rowIndex = Math.max(0, Math.floor(y / ROW_HEIGHT));

        const leftPx = dayIndex * DAY_COL_WIDTH;
        const topPx = rowIndex * ROW_HEIGHT + 10;

        setGhostPosition({ left: leftPx, top: topPx });
      }
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (gridRef.current && hasMoved) {
        const rect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x >= 0 && x <= GRID_WIDTH) {
          const dayIndex = Math.max(0, Math.floor(x / DAY_COL_WIDTH));
          const start = addDays(rangeStart, dayIndex);

          if (isDraggingNew) {
            const end = addDays(start, 3);

            const res = await fetch("/api/timeline", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId,
                title: "New",
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                status: "Todo",
                assignedTo: "",
                comment: "",
              }),
            });

            const created = await res.json();
            await fetchItems();
            setSelectedItem(created);
            setModalOpen(true);
          } else if (draggingCard) {
            const end = addDays(start, draggedCardDuration - 1);

            await fetch("/api/timeline", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                _id: draggingCard._id,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
              }),
            });

            await fetchItems();
          }
        }
      }

      setIsDraggingNew(false);
      setDraggingCard(null);
      setHasMoved(false);
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (gridRef.current && hasMoved && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        const rect = gridRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;

        if (x >= 0 && x <= GRID_WIDTH) {
          const dayIndex = Math.max(0, Math.floor(x / DAY_COL_WIDTH));
          const start = addDays(rangeStart, dayIndex);

          if (isDraggingNew) {
            const end = addDays(start, 3);

            const res = await fetch("/api/timeline", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId,
                title: "New",
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                status: "Todo",
                assignedTo: "",
                comment: "",
              }),
            });

            const created = await res.json();
            await fetchItems();
            setSelectedItem(created);
            setModalOpen(true);
          } else if (draggingCard) {
            const end = addDays(start, draggedCardDuration - 1);

            await fetch("/api/timeline", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                _id: draggingCard._id,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
              }),
            });

            await fetchItems();
          }
        }
      }

      setIsDraggingNew(false);
      setDraggingCard(null);
      setHasMoved(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingNew, draggingCard, draggedCardDuration, databaseId, rangeStart, GRID_WIDTH, DAY_COL_WIDTH, ROW_HEIGHT, hasMoved, mouseDownPos]);

  const createByClick = async (e: React.MouseEvent) => {
    if (!gridRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest("[data-timeline-card]")) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const dayIndex = Math.max(0, Math.floor(x / DAY_COL_WIDTH));
    const start = addDays(rangeStart, dayIndex);
    const end = addDays(start, 3);

    const res = await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        title: "New",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: "Todo",
        assignedTo: "",
        comment: "",
      }),
    });
    

    const created = await res.json();
    await fetchItems();
    setSelectedItem(created);
    setModalOpen(true);
  };
    useEffect(() => {
      if (loading || !scrollRef.current) return;

      const container = scrollRef.current;

      // Wait one frame so widths are measured after the timeline mounts.
      const id = requestAnimationFrame(() => {
        const scrollX = (todayOffset * DAY_COL_WIDTH) - container.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, scrollX),
          behavior: "auto",
        });
      });

      return () => cancelAnimationFrame(id);
    }, [loading, todayOffset, DAY_COL_WIDTH, currentMonth]);

  const createFromNewButton = async () => {
    console.log("hi");
    const start = new Date();
    const end = addDays(start, 3);

    const res = await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        title: "New",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: "Todo",
        assignedTo: "",
        comment: "",
      }),
    });

    const created = await res.json();
    await fetchItems();
    setSelectedItem(created);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className={`p-6 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Loading timeline...
      </div>
    );
  }
  function formatDate(date?: string | Date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
  if(isshowData){
    return (
      <div className={`w-full overflow-x-auto ${isDark ? "text-white" : "text-black"}`} onClick={() => console.log("show data",items)}>
        <table className="min-w-250 w-full border border-gray-300 rounded">
          <thead className="">
            <tr>
              <th className="border p-2 text-center text-blue-400">Title</th>
              <th className="border p-2 text-center text-blue-400">Status</th>
              <th className="border p-2 text-center text-blue-400">StartDate</th>
              <th className="border p-2 text-center text-blue-400">EndDate</th>
              <th className="border p-2 text-center text-blue-400">Assign</th>
              <th className="border p-2 text-center text-blue-400">CreatedAt</th>
            </tr>
          </thead>
        
        <tbody>
            {items.map((it) => (
              <tr key={it._id} className="">
                <td className="border p-2 ">{it.title}</td>
                <td className="border p-2 ">{it.status}</td>
                <td className="border p-2 ">{formatDate(it.startDate)}</td>
                <td className="border p-2 ">{formatDate(it.endDate)}</td>
                <td className="border p-2 ">{it.assignedTo||"Unassigned"}</td>
                <td className="border p-2 ">{formatDate(it.createdAt)}</td>
              </tr>
            ))}
          </tbody>  
          </table>    
        
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#18191d] border-gray-800" : "bg-white border-gray-200"}`}>
        {/* header */}
        <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0 px-3 sm:px-4 py-3 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <button className={`p-2 lg:p-0 ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"}`}>»</button>
            <div className={`font-semibold text-base sm:text-lg ${isDark ? "text-gray-100" : "text-gray-900"}`}>
              {formatMonthYear(monthStart)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full lg:w-auto text-xs sm:text-sm">
            <button
              onClick={navigateToSchedule}
              className={`px-3 py-2 rounded-lg border font-semibold whitespace-nowrap touch-manipulation ${isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              Manage in Calendar
            </button>

            <div className={`hidden sm:flex items-center gap-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <span>Month</span>
              <span>▾</span>
            </div>

            <div className={`flex items-center gap-1 sm:gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <button onClick={goToPrevMonth} className={`px-3 py-2 touch-manipulation ${isDark ? "hover:text-gray-200" : "hover:text-gray-800"}`}>‹</button>
              <button onClick={goToToday} className={`px-3 py-2 rounded whitespace-nowrap touch-manipulation ${isDark ? "hover:text-gray-200 hover:bg-gray-800" : "hover:text-gray-800 hover:bg-gray-100"}`}>Today</button>
              <button onClick={goToNextMonth} className={`px-3 py-2 touch-manipulation ${isDark ? "hover:text-gray-200" : "hover:text-gray-800"}`}>›</button>
            </div>
          </div>
        </div>

        {/* grid */}
        <div ref={scrollRef} className="relative overflow-x-auto overflow-y-hidden">
          <div style={{ minWidth: GRID_WIDTH + SIDEBAR_WIDTH }}>
            {/* Top Day Row */}
            <div className={`flex border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <div className={`shrink-0 ${isDark ? "bg-[#18191d]" : "bg-white"}`} style={{ width: SIDEBAR_WIDTH }} />

              <div className="relative" style={{ width: GRID_WIDTH, height: 44 }}>
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: totalDays }).map((_, i) => (
                    <div
                      key={i}
                      className={isDark ? (i % 2 === 0 ? "bg-[#18191d]" : "bg-[#1a1b1f]") : (i % 2 === 0 ? "bg-white" : "bg-gray-50")}
                      style={{ width: DAY_COL_WIDTH }}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const d = addDays(rangeStart, i);
                    const isToday = d.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-center text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        style={{ width: DAY_COL_WIDTH }}
                      >
                        <div
                          className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-xs sm:text-base ${
                            isToday
                              ? "border-2 border-red-500 text-red-500 bg-transparent font-bold"
                              : isDark
                              ? "hover:bg-gray-800"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {d.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {todayOffset >= 0 && todayOffset <= totalDays && (
                  <div
                    className="absolute top-[38px] w-3 h-3 rounded-full bg-red-500"
                    style={{ left: `calc(${todayPercent}% - 6px)` }}
                  />
                )}
              </div>
            </div>

            {/* Body */}
            <div className="relative flex">
              {/* left */}
              <div className={`shrink-0 border-r ${isDark ? "bg-[#18191d] border-gray-800" : "bg-white border-gray-200"}`} style={{ width: SIDEBAR_WIDTH }}>
                <div style={{ height: items.length * ROW_HEIGHT }} />

                <button
                  onMouseDown={handleNewButtonMouseDown}
                  onTouchStart={handleNewButtonTouchStart}
                  onClick={!isDraggingNew ? createFromNewButton : undefined}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 w-full touch-manipulation cursor-grab active:cursor-grabbing ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <span className="text-lg sm:text-xl">+</span>
                  <span className="text-sm sm:text-base">New</span>
                </button>
              </div>

              {/* canvas */}
              <div
                ref={gridRef}
                onClick={createByClick}
                className="relative cursor-crosshair"
                style={{ width: GRID_WIDTH, height: items.length * ROW_HEIGHT + 64 }}
              >
                <div className="absolute inset-0 flex">
                  {Array.from({ length: totalDays }).map((_, i) => (
                    <div
                      key={i}
                      className={isDark ? (i % 2 === 0 ? "bg-[#18191d]" : "bg-[#1a1b1f]") : (i % 2 === 0 ? "bg-white" : "bg-gray-50")}
                      style={{ width: DAY_COL_WIDTH }}
                    />
                  ))}
                </div>

                {todayOffset >= 0 && todayOffset <= totalDays && (
                  <div
                    className="absolute top-0 bottom-0 w-[3px] bg-red-500 shadow-lg"
                    style={{
                      left: `calc(${todayPercent}% - 1.5px)`,
                      boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)",
                      zIndex: 20,
                    }}
                  />
                )}

                {/* Ghost preview while dragging new button */}
                {isDraggingNew && (
                  <div
                    className={`absolute h-10 sm:h-11 rounded-lg sm:rounded-xl border-2 border-dashed flex items-center px-3 sm:px-4 text-sm sm:text-base font-semibold pointer-events-none ${isDark ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-blue-400 bg-blue-50/50 text-blue-600"}`}
                    style={{
                      left: ghostPosition.left,
                      top: ghostPosition.top,
                      width: 4 * DAY_COL_WIDTH,
                      zIndex: 30,
                    }}
                  >
                    New
                    <div className="ml-auto flex items-center">
                      <div className={`w-2 h-2 rounded-full ${isDark ? "bg-blue-500" : "bg-blue-400"}`} />
                    </div>
                  </div>
                )}

                {/* Ghost preview while dragging existing card */}
                {draggingCard && (
                  <div
                    className={`absolute h-10 sm:h-11 rounded-lg sm:rounded-xl border-2 border-dashed flex items-center px-3 sm:px-4 text-sm sm:text-base font-semibold pointer-events-none ${isDark ? "border-green-500 bg-green-500/20 text-green-400" : "border-green-400 bg-green-50/50 text-green-600"}`}
                    style={{
                      left: ghostPosition.left,
                      top: ghostPosition.top,
                      width: Math.max(draggedCardDuration * DAY_COL_WIDTH, isMobile ? 140 : 180),
                      zIndex: 30,
                    }}
                  >
                    {draggingCard.title}
                    <div className="ml-auto flex items-center">
                      <div className={`w-2 h-2 rounded-full ${isDark ? "bg-green-500" : "bg-green-400"}`} />
                    </div>
                  </div>
                )}

                <div className="relative">
                  {items.map((it) => {
                    const s = new Date(it.startDate);
                    const e = new Date(it.endDate);

                    const startOffset = daysBetween(rangeStart, s);
                    const duration = Math.max(1, daysBetween(s, e) + 1);

                    const leftPx = startOffset * DAY_COL_WIDTH;
                    const widthPx = Math.max(duration * DAY_COL_WIDTH, isMobile ? 140 : 180);

                    const isBeingDragged = draggingCard?._id === it._id;

                    return (
                      <div key={it._id} className="relative" style={{ height: ROW_HEIGHT }}>
                        <div
                          data-timeline-card
                          onMouseDown={(e) => handleCardMouseDown(e, it)}
                          onTouchStart={(e) => handleCardTouchStart(e, it)}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (!hasMoved) {
                              setSelectedItem(it);
                              setModalOpen(true);
                            }
                          }}
                          className={`absolute top-2.5 h-10 sm:h-11 rounded-lg sm:rounded-xl border shadow-md flex items-center px-3 sm:px-4 text-sm sm:text-base font-semibold cursor-pointer touch-manipulation transition-all hover:shadow-lg ${
                            isBeingDragged ? "opacity-30" : "opacity-100"
                          } ${isDark ? "bg-gradient-to-r from-teal-500 to-rose-500 border-gray-700 text-white hover:shadow-teal-500/20" : "bg-gradient-to-r from-teal-500 to-rose-500 border-gray-300 text-white hover:shadow-rose-500/20"}`}
                          style={{ left: leftPx, width: widthPx }}
                        >
                          <span className="truncate">{it.title}</span>
                          <div className="ml-auto flex items-center shrink-0">
                            <div className={`w-2 h-2 rounded-full ${isDark ? "bg-white/60" : "bg-white/80"}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[120px] h-2 rounded-full ${isDark ? "bg-gray-700/60" : "bg-gray-300/60"}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating cursor preview while dragging +New */}
      {isDraggingNew && (
        <div
          className={`fixed pointer-events-none z-50 border-2 rounded-lg sm:rounded-xl shadow-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold ${isDark ? "bg-[#1e1f23] border-blue-500 text-blue-400" : "bg-white border-blue-400 text-blue-600"}`}
          style={{ left: dragPosition.x + 10, top: dragPosition.y + 10 }}
        >
          + New Task
        </div>
      )}

      {/* Floating cursor preview while dragging existing card */}
      {draggingCard && (
        <div
          className={`fixed pointer-events-none z-50 border-2 rounded-lg sm:rounded-xl shadow-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold ${isDark ? "bg-[#1e1f23] border-green-500 text-green-400" : "bg-white border-green-400 text-green-600"}`}
          style={{ left: dragPosition.x + 10, top: dragPosition.y + 10 }}
        >
          📅 {draggingCard.title}
        </div>
      )}

      {/* modal */}
      {selectedItem && (
        <TimelineItemModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          item={selectedItem}
          isDark={isDark}
          onSaved={fetchItems}
        />
      )}
    </>
  );
}