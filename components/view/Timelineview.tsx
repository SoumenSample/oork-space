"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, ChevronDown, Plus } from "lucide-react";
import TimelineItemModal from "@/components/TimelineItemmodal";
import { useTheme } from "next-themes";

type TimelineItem = {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
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

export default function TimelineView({ databaseId }: { databaseId: string }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // 🔥 fixed route name: database-items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/database_items?databaseId=${databaseId}`
      );
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.log("Timeline fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [databaseId]);

  const handleItemClick = (item: TimelineItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaved = () => {
    fetchItems();
  };

  // ---- Determine timeline month (like Notion screenshot)
  const monthDate = useMemo(() => {
    if (items.length === 0) return new Date();
    return new Date(items[0].startDate);
  }, [items]);

  const monthStart = useMemo(() => startOfMonth(monthDate), [monthDate]);
  const monthEnd = useMemo(() => endOfMonth(monthDate), [monthDate]);

  // ---- Visible days range
  // Notion shows partial previous days too, so we show -3 days before monthStart
  const rangeStart = useMemo(() => addDays(monthStart, -3), [monthStart]);
  const rangeEnd = useMemo(() => addDays(monthEnd, 2), [monthEnd]);

  const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd) + 1);

  // Today position
  const today = new Date();
  const todayOffset = daysBetween(rangeStart, today);
  const todayPercent = (todayOffset / totalDays) * 100;

  // Layout
  const ROW_HEIGHT = 56;
  const DAY_COL_WIDTH = 70; // Notion-ish
  const GRID_WIDTH = totalDays * DAY_COL_WIDTH;

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading timeline...</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* ======= HEADER (like Notion) ======= */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-base">{formatMonthYear(monthStart)}</h2>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Button variant="outline" size="sm">
            Manage in Calendar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                Month
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Day</DropdownMenuItem>
              <DropdownMenuItem>Week</DropdownMenuItem>
              <DropdownMenuItem>Month</DropdownMenuItem>
              <DropdownMenuItem>Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* ======= GRID ======= */}
      <ScrollArea className="w-full">
        <div style={{ minWidth: GRID_WIDTH + 260 }}>
          {/* Top Day Row */}
          <div className="flex border-b">
            {/* left empty column like Notion */}
            <div className="w-[260px] shrink-0 bg-background" />

            <div
              className="relative"
              style={{ width: GRID_WIDTH, height: 44 }}
            >
              {/* alternating day columns background */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div
                    key={i}
                    className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    style={{ width: DAY_COL_WIDTH }}
                  />
                ))}
              </div>

              {/* day numbers */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalDays }).map((_, i) => {
                  const d = addDays(rangeStart, i);
                  const dayNum = d.getDate();

                  const isToday =
                    d.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center text-sm text-muted-foreground"
                      style={{ width: DAY_COL_WIDTH }}
                    >
                      <div
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                          isToday
                            ? "bg-red-500 text-white font-bold"
                            : "hover:bg-muted"
                        }`}
                      >
                        {dayNum}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* today red dot */}
              {todayOffset >= 0 && todayOffset <= totalDays && (
                <div
                  className="absolute top-[38px] w-3 h-3 rounded-full bg-red-500"
                  style={{
                    left: `calc(${todayPercent}% - 6px)`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Body rows */}
          <div className="relative flex">
            {/* left side column */}
            <div className="w-[260px] shrink-0 border-r bg-background">
              {/* empty spacing for items */}
              <div style={{ height: items.length * ROW_HEIGHT }} />

              {/* + New */}
              <Button variant="ghost" className="w-full justify-start gap-2 px-4 py-4">
                <Plus className="h-5 w-5" />
                <span>New</span>
              </Button>
            </div>

            {/* timeline canvas */}
            <div
              className="relative"
              style={{
                width: GRID_WIDTH,
                height: items.length * ROW_HEIGHT + 64,
              }}
            >
              {/* background columns */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div
                    key={i}
                    className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    style={{ width: DAY_COL_WIDTH }}
                  />
                ))}
              </div>

              {/* today red vertical line */}
              {todayOffset >= 0 && todayOffset <= totalDays && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500/70"
                  style={{
                    left: `calc(${todayPercent}% - 1px)`,
                  }}
                />
              )}

              {/* items */}
              <div className="relative">
                {items.map((it, rowIndex) => {
                  const s = new Date(it.startDate);
                  const e = new Date(it.endDate);

                  const startOffset = daysBetween(rangeStart, s);
                  const duration = Math.max(1, daysBetween(s, e) + 1);

                  const leftPx = startOffset * DAY_COL_WIDTH;
                  const widthPx = Math.max(duration * DAY_COL_WIDTH, 180);

                  return (
                    <div
                      key={it._id}
                      className="relative"
                      style={{
                        height: ROW_HEIGHT,
                      }}
                    >
                      <Button
                        variant="outline"
                        className="absolute top-2.5 h-11 justify-between font-semibold"
                        style={{
                          left: leftPx,
                          width: widthPx,
                        }}
                        onClick={() => handleItemClick(it)}
                      >
                        <span>{it.title}</span>

                        {/* small handle circle (like Notion) */}
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* bottom scrollbar fake bar look */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[120px] h-2 rounded-full bg-muted-foreground/20" />
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Timeline Item Modal */}
      {selectedItem && (
        <TimelineItemModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          item={selectedItem}
          isDark={isDark}
          onSaved={handleSaved}
        />
      )}
    </Card>
  );
}
