"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Tool = "pen" | "select" | "eraser" | "rectangle" | "circle" | "triangle" | "line" | "text" |"arrow" | "double-arrow" | "dashed-arrow" | "sticky" | "highlighter";

// ✅ Fixed default board dimensions
const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 800;

export default function WhiteboardView({ databaseId }: { databaseId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const fabricLibRef = useRef<any>(null);
  const drawingShapeRef = useRef<any>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const suppressUndoRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [activeColor, setActiveColor] = useState("#ffffff");
  const [fillColor, setFillColor] = useState("transparent");
  const [boardColor, setBoardColor] = useState("#1a1a2e");
  const [brushSize, setBrushSize] = useState(3);
  const [fontSize, setFontSize] = useState(18);
  const [opacity, setOpacity] = useState(100);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [boardWidth, setBoardWidth] = useState(DEFAULT_WIDTH);
  const [boardHeight, setBoardHeight] = useState(DEFAULT_HEIGHT);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<"stroke" | "fill" | "board" | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const sizeMenuRef = useRef<HTMLDivElement>(null);

const applyDotBackground = (canvas: any) => {
  // Keep Fabric canvas transparent.
  // Dot background is rendered by the container so erasing can reveal it cleanly.
  canvas.setBackgroundColor("rgba(0,0,0,0)", canvas.renderAll.bind(canvas));
};

  const normalizeShapeSelectionStyle = (canvas: any) => {
    canvas.getObjects().forEach((obj: any) => {
      const isText = obj?.type === "i-text" || obj?.type === "textbox";
      if (!isText) {
        obj.set({ hasControls: false, hasBorders: false, transparentCorners: true });
      }
    });
  };

  const getDotColorForBackground = (color: string) => {
    const hex = color.replace("#", "");
    const normalized = hex.length === 3
      ? hex.split("").map((ch) => ch + ch).join("")
      : hex;
    const r = parseInt(normalized.slice(0, 2), 16) || 0;
    const g = parseInt(normalized.slice(2, 4), 16) || 0;
    const b = parseInt(normalized.slice(4, 6), 16) || 0;
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    return luminance > 0.6 ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.35)";
  };

  const getContrastStrokeColor = (color: string) => {
    const hex = color.replace("#", "");
    const normalized = hex.length === 3
      ? hex.split("").map((ch) => ch + ch).join("")
      : hex;
    const r = parseInt(normalized.slice(0, 2), 16) || 0;
    const g = parseInt(normalized.slice(2, 4), 16) || 0;
    const b = parseInt(normalized.slice(4, 6), 16) || 0;
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    return luminance > 0.6 ? "#111111" : "#ffffff";
  };

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(null);
      }
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) {
        setShowSizeMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Apply board color ──
  // useEffect(() => {
  //   const canvas = fabricRef.current;
  //   if (!canvas) return;
  //   // canvas.setBackgroundColor(boardColor, () => canvas.renderAll());
  //   canvas.setBackgroundColor(boardColor, () => canvas.renderAll());
  // }, [boardColor]);

  useEffect(() => {
  const canvas = fabricRef.current;
  if (!canvas) return;

  applyDotBackground(canvas);
}, [boardColor]);

    useEffect(() => {
      setActiveColor(getContrastStrokeColor(boardColor));
    }, [boardColor]);
  // ── Resize board ──
  const resizeBoard = useCallback((w: number, h: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setBoardWidth(w);
    setBoardHeight(h);
    canvas.setWidth(w);
    canvas.setHeight(h);
    applyDotBackground(canvas);
    canvas.renderAll();
  }, [boardColor]);

  // ── Save to DB ──
  const saveToDatabase = useCallback(async (json: any) => {
    if (!databaseId) return;
    setSaving(true);
    try {
      await fetch(`/api/databases/${databaseId}/whiteboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas: json }),
      });
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [databaseId]);

  // ── Load from DB ──
  const loadFromDatabase = useCallback(async () => {
    if (!databaseId || !fabricRef.current) return;
    try {
      const res = await fetch(`/api/databases/${databaseId}/whiteboard`);
      const data = await res.json();
      if (data.canvas && fabricRef.current) {
        fabricRef.current.loadFromJSON(data.canvas, () => {
          normalizeShapeSelectionStyle(fabricRef.current);
          applyDotBackground(fabricRef.current);
          fabricRef.current.renderAll();
        });
      }
    } catch (err) {
      console.error("Load failed:", err);
    }
  }, [databaseId, boardColor]);

  // ── Push undo ──
  const pushUndo = useCallback(() => {
    if (suppressUndoRef.current) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = canvas.toJSON();
    setUndoStack((prev) => [...prev.slice(-29), json]);
    setRedoStack([]);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveToDatabase(json), 2000);
  }, [saveToDatabase]);

  // ── Init Fabric ──
  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;

    import("fabric").then((mod) => {
      if (disposed) return;
      const fabric = (mod.fabric ?? mod) as any;
      if (!fabric.EraserBrush && (mod as any).EraserBrush) {
        fabric.EraserBrush = (mod as any).EraserBrush;
      }
      fabricLibRef.current = fabric;

      // ✅ Fixed size canvas
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        backgroundColor: "#1a1a2e",
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        preserveObjectStacking: true,
        renderOnAddRemove: false,
      });

      const brush = new fabric.PencilBrush(canvas);
      brush.color = "#ffffff";
      brush.width = 3;
      canvas.freeDrawingBrush = brush;

      fabricRef.current = canvas;
      setIsReady(true);

      canvas.on("object:added",    () => { if (!suppressUndoRef.current) pushUndo(); });
      canvas.on("object:modified", () => { if (!suppressUndoRef.current) pushUndo(); });
      canvas.on("object:removed",  () => { if (!suppressUndoRef.current) pushUndo(); });

      setTimeout(() => loadFromDatabase(), 300);
    }).catch((err) => console.error("Fabric load failed:", err));

    return () => {
      disposed = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      fabricRef.current?.dispose();
    };
  }, []);

  // ── Tool sync ──
  useEffect(() => {
    const canvas = fabricRef.current;
    const fabric = fabricLibRef.current;
    if (!canvas || !fabric) return;

    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");
    canvas.off("path:created");

    if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      canvas.selection = true;
      canvas.defaultCursor = "crosshair";
      const brush = new fabric.PencilBrush(canvas);
      brush.color = activeColor;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "highlighter") {
      canvas.isDrawingMode = true;
      canvas.selection = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = activeColor + "66";
      brush.width = brushSize * 6;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "eraser") {
      canvas.selection = false;
      canvas.defaultCursor = "cell";

      const hasNativeEraser = typeof fabric.EraserBrush === "function";

      if (hasNativeEraser) {
        canvas.isDrawingMode = true;
        const brush = new fabric.EraserBrush(canvas);
        // Keep erasing precise while still usable.
        brush.width = Math.max(2, brushSize * 2.5);
        canvas.freeDrawingBrush = brush;

        let erasedSomething = false;

        const onMouseDown = () => {
          canvas.getObjects().forEach((obj: any) => {
            if (obj.erasable !== false) {
              obj.set("erasable", true);
            }
          });
          suppressUndoRef.current = true;
        };

        const onPathCreated = (opt: any) => {
          if (!opt?.path) return;
          erasedSomething = true;
          canvas.requestRenderAll();
        };

        const onMouseUp = () => {
          suppressUndoRef.current = false;
          if (erasedSomething) {
            pushUndo();
            erasedSomething = false;
          }
        };

        canvas.on("mouse:down", onMouseDown);
        canvas.on("path:created", onPathCreated);
        canvas.on("mouse:up", onMouseUp);

        return () => {
          canvas.off("mouse:down", onMouseDown);
          canvas.off("path:created", onPathCreated);
          canvas.off("mouse:up", onMouseUp);
          suppressUndoRef.current = false;
        };
      }

      // Fallback: transparent pixel erase for precise erasing when native
      // EraserBrush is unavailable in the current Fabric build.
      // Use object hit-delete fallback to avoid persisted erase-mask artifacts.
      canvas.isDrawingMode = false;

      let erasedSomething = false;
      let isErasing = false;

      const eraseAtPointer = (opt: any) => {
        const pointer = canvas.getPointer(opt.e);
        const radius = Math.max(4, brushSize * 4);
        const topLeft = new fabric.Point(pointer.x - radius, pointer.y - radius);
        const bottomRight = new fabric.Point(pointer.x + radius, pointer.y + radius);
        const hitPoint = new fabric.Point(pointer.x, pointer.y);

        const toRemove = canvas.getObjects().filter((obj: any) => {
          if (!obj || obj.evented === false) return false;
          return obj.intersectsWithRect(topLeft, bottomRight, true) || obj.containsPoint(hitPoint);
        });

        if (toRemove.length > 0) {
          toRemove.forEach((obj: any) => canvas.remove(obj));
          erasedSomething = true;
          canvas.requestRenderAll();
        }
      };

      const onMouseDown = (opt: any) => {
        isErasing = true;
        suppressUndoRef.current = true;
        eraseAtPointer(opt);
      };

      const onMouseMove = (opt: any) => {
        if (!isErasing) return;
        eraseAtPointer(opt);
      };

      const onMouseUp = () => {
        isErasing = false;
        suppressUndoRef.current = false;
        if (erasedSomething) {
          pushUndo();
          erasedSomething = false;
        }
      };

      canvas.on("mouse:down", onMouseDown);
      canvas.on("mouse:move", onMouseMove);
      canvas.on("mouse:up", onMouseUp);

      return () => {
        canvas.off("mouse:down", onMouseDown);
        canvas.off("mouse:move", onMouseMove);
        canvas.off("mouse:up", onMouseUp);
        suppressUndoRef.current = false;
      };
    } else if (activeTool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "default";
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";

      const setArrowHeadFromTip = (
        head: any,
        tipX: number,
        tipY: number,
        angleRad: number,
        width: number,
        height: number
      ) => {
        // Fabric triangle is positioned by its center. Move center behind the tip
        // so the arrow tip is exactly on the line endpoint.
        const cx = tipX - Math.cos(angleRad) * (height / 2);
        const cy = tipY - Math.sin(angleRad) * (height / 2);
        head.set({
          left: cx,
          top: cy,
          angle: angleRad * (180 / Math.PI) + 90,
          width,
          height,
        });
      };

      const onMouseDown = (opt: any) => {
        suppressUndoRef.current = true;
        const pointer = canvas.getPointer(opt.e);
        startPointRef.current = { x: pointer.x, y: pointer.y };
        isDrawingRef.current = true;

        const fill = fillColor === "transparent" ? "rgba(0,0,0,0)" : fillColor;
        let shape: any = null;

        if (activeTool === "rectangle") {
          shape = new fabric.Rect({
            left: pointer.x, top: pointer.y, width: 0, height: 0,
            fill, stroke: activeColor, strokeWidth: brushSize,
            opacity: opacity / 100, selectable: false, evented: false,
          });
        } else if (activeTool === "circle") {
          shape = new fabric.Ellipse({
            left: pointer.x, top: pointer.y, rx: 0, ry: 0,
            fill, stroke: activeColor, strokeWidth: brushSize,
            opacity: opacity / 100, selectable: false, evented: false,
          });
        } else if (activeTool === "triangle") {
          shape = new fabric.Triangle({
            left: pointer.x, top: pointer.y, width: 0, height: 0,
            fill, stroke: activeColor, strokeWidth: brushSize,
            opacity: opacity / 100, selectable: false, evented: false,
          });
        } else if (
          activeTool === "line" ||
          activeTool === "arrow" ||
          activeTool === "double-arrow" ||
          activeTool === "dashed-arrow"
        ) {
          shape = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: activeColor,
              strokeWidth: brushSize,
              opacity: opacity / 100,
              selectable: false,
              evented: false,
              ...(activeTool === "dashed-arrow" ? { strokeDashArray: [10, 8] } : {}),
            }
          );
        }

        if (shape) {
          if (
            activeTool === "arrow" ||
            activeTool === "double-arrow" ||
            activeTool === "dashed-arrow"
          ) {
            const lineStrokeWidth = Number(shape.strokeWidth ?? brushSize);
            const arrowHeadWidth = Math.max(12, lineStrokeWidth * 4);
            const arrowHeadHeight = Math.max(16, lineStrokeWidth * 5);

            const arrowHead = new fabric.Triangle({
              width: arrowHeadWidth,
              height: arrowHeadHeight,
              fill: activeColor,
              opacity: opacity / 100,
              left: pointer.x,
              top: pointer.y,
              originX: "center",
              originY: "center",
              selectable: false,
              evented: false,
            });

            shape.arrowHead = arrowHead;
            setArrowHeadFromTip(arrowHead, pointer.x, pointer.y, 0, arrowHeadWidth, arrowHeadHeight);

            if (activeTool === "double-arrow") {
              const startHead = new fabric.Triangle({
                width: arrowHeadWidth,
                height: arrowHeadHeight,
                fill: activeColor,
                opacity: opacity / 100,
                left: pointer.x,
                top: pointer.y,
                angle: 180,
                originX: "center",
                originY: "center",
                selectable: false,
                evented: false,
              });

              shape.startHead = startHead;
              setArrowHeadFromTip(startHead, pointer.x, pointer.y, Math.PI, arrowHeadWidth, arrowHeadHeight);
            }
          }

          canvas.add(shape);
          if (shape.startHead) {
            canvas.add(shape.startHead);
          }
          if (shape.arrowHead) {
            canvas.add(shape.arrowHead);
          }
          canvas.renderAll();
          drawingShapeRef.current = shape;
        }
      };

      const onMouseMove = (opt: any) => {
        if (!isDrawingRef.current || !startPointRef.current || !drawingShapeRef.current) return;
        const pointer = canvas.getPointer(opt.e);
        const sp = startPointRef.current;
        const shape = drawingShapeRef.current;

        if (activeTool === "rectangle" || activeTool === "triangle") {
          shape.set({
            left: Math.min(pointer.x, sp.x), top: Math.min(pointer.y, sp.y),
            width: Math.abs(pointer.x - sp.x) || 1, height: Math.abs(pointer.y - sp.y) || 1,
          });
          shape.setCoords();
        } else if (activeTool === "circle") {
          shape.set({
            left: Math.min(pointer.x, sp.x), top: Math.min(pointer.y, sp.y),
            rx: Math.abs(pointer.x - sp.x) / 2 || 1, ry: Math.abs(pointer.y - sp.y) / 2 || 1,
          });
          shape.setCoords();
        } else if (
  activeTool === "line" ||
  activeTool === "arrow" ||
  activeTool === "double-arrow" ||
  activeTool === "dashed-arrow"
) {
  shape.set({ x2: pointer.x, y2: pointer.y });

  const angleRad = Math.atan2(pointer.y - sp.y, pointer.x - sp.x);

  const lineStrokeWidth = Number(shape.strokeWidth ?? brushSize);
  const arrowHeadWidth = Math.max(12, lineStrokeWidth * 4);
  const arrowHeadHeight = Math.max(16, lineStrokeWidth * 5);

  // ✅ End arrow head
  if (shape.arrowHead) {
    setArrowHeadFromTip(shape.arrowHead, pointer.x, pointer.y, angleRad, arrowHeadWidth, arrowHeadHeight);
    shape.arrowHead.bringToFront?.();
  }

  // ✅ Start arrow head (for double arrow)
  if (shape.startHead) {
    setArrowHeadFromTip(shape.startHead, sp.x, sp.y, angleRad + Math.PI, arrowHeadWidth, arrowHeadHeight);
    shape.startHead.bringToFront?.();
  }
}
        
        canvas.requestRenderAll();
      };

      const onMouseUp = (opt: any) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const sp = startPointRef.current;
        const shape = drawingShapeRef.current;
        if (!shape) {
          startPointRef.current = null;
          suppressUndoRef.current = false;
          return;
        }

        const pointer = opt?.e ? canvas.getPointer(opt.e) : null;
        const drawDistance = sp && pointer
          ? Math.hypot(pointer.x - sp.x, pointer.y - sp.y)
          : 0;

        if (shape && activeTool.includes("arrow")) {
          if (drawDistance < 2) {
            canvas.remove(shape);
            if (shape.arrowHead) canvas.remove(shape.arrowHead);
            if (shape.startHead) canvas.remove(shape.startHead);
            drawingShapeRef.current = null;
            startPointRef.current = null;
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            suppressUndoRef.current = false;
            return;
          }

          const objects = [shape];
          if (shape.arrowHead) objects.push(shape.arrowHead);
          if (shape.startHead) objects.push(shape.startHead);

          const group = new fabric.Group(objects, {
            selectable: true,
            evented: true,
            hasControls: false,
            hasBorders: false,
            transparentCorners: true,
          });

          canvas.remove(shape);
          if (shape.arrowHead) canvas.remove(shape.arrowHead);
          if (shape.startHead) canvas.remove(shape.startHead);

          canvas.add(group);
          drawingShapeRef.current = null;
          startPointRef.current = null;
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          suppressUndoRef.current = false;
          pushUndo();
        } else {
          // Prevent accidental click artifacts (tiny 1x1 extra square).
          if (drawDistance < 2) {
            canvas.remove(shape);
          } else {
            shape.set({ selectable: true, evented: true, hasControls: false, hasBorders: false, transparentCorners: true });
            shape.setCoords();
          }

          drawingShapeRef.current = null;
          startPointRef.current = null;
          canvas.requestRenderAll();
          suppressUndoRef.current = false;
          pushUndo();
        }
      };
      

      canvas.on("mouse:down", onMouseDown);
      canvas.on("mouse:move", onMouseMove);
      canvas.on("mouse:up", onMouseUp);

      return () => {
        canvas.off("mouse:down", onMouseDown);
        canvas.off("mouse:move", onMouseMove);
        canvas.off("mouse:up", onMouseUp);
        canvas.selection = true;
        canvas.defaultCursor = "default";
      };
    }
  }, [activeTool, activeColor, fillColor, boardColor, brushSize, opacity, pushUndo]);

  // ── Add text ──
  const addText = async (sticky = false) => {
    const fabric = fabricLibRef.current;
    const canvas = fabricRef.current;
    if (!fabric || !canvas) return;

    if (sticky) {
      const rect = new fabric.Rect({ width: 170, height: 120, fill: "#fef08a", stroke: "#ca8a04", strokeWidth: 1, rx: 4 });
      const text = new fabric.IText("Sticky note", { left: 85, top: 60, fill: "#713f12", fontSize: 14, fontFamily: "sans-serif", originX: "center", originY: "center" });
      const group = new fabric.Group([rect, text], { left: 100, top: 100 });
      canvas.add(group);
    } else {
      const text = new fabric.IText("Type here...", {
        left: 120, top: 120, fill: activeColor, fontSize,
        fontFamily: "sans-serif",
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        opacity: opacity / 100,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
    }
    setActiveTool("select");
    pushUndo();
  };

  // ── Undo / Redo ──
  const handleUndo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || undoStack.length === 0) return;
    const current = canvas.toJSON();
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, current]);
    setUndoStack((u) => u.slice(0, -1));
    suppressUndoRef.current = true;
    canvas.loadFromJSON(prev, () => { canvas.renderAll(); suppressUndoRef.current = false; });
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || redoStack.length === 0) return;
    const current = canvas.toJSON();
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, current]);
    setRedoStack((r) => r.slice(0, -1));
    suppressUndoRef.current = true;
    canvas.loadFromJSON(next, () => { canvas.renderAll(); suppressUndoRef.current = false; });
  }, [redoStack]);

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj: any) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    pushUndo();
  };

  const handleClear = () => {
    if (!confirm("Clear the entire canvas?")) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    suppressUndoRef.current = true;
    canvas.clear();
    applyDotBackground(canvas);
    canvas.renderAll();
    suppressUndoRef.current = false;
    pushUndo();
  };

  const handleDownload = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `whiteboard-${Date.now()}.png`;
    a.click();
  };

  const handleZoom = (delta: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const newZoom = Math.min(Math.max(zoom + delta, 25), 400);
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  };

  const handleManualSave = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    saveToDatabase(canvas.toJSON());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}?whiteboard=${databaseId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); handleRedo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleManualSave(); }
      if ((e.key === "Delete" || e.key === "Backspace") && fabricRef.current?.getActiveObject()) {
        e.preventDefault(); deleteSelected();
      }
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === "v") setActiveTool("select");
        if (e.key === "p") setActiveTool("pen");
        if (e.key === "e") setActiveTool("eraser");
        if (e.key === "r") setActiveTool("rectangle");
        if (e.key === "c") setActiveTool("circle");
        if (e.key === "t") addText(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, activeTool]);

  const STROKE_COLORS = [
    "#ffffff","#000000","#ef4444","#f97316","#eab308",
    "#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4",
    "#a3a3a3","#fbbf24","#34d399","#60a5fa","#f472b6",
  ];

  const BOARD_COLORS = [
    "#1a1a2e","#0f0f13","#ffffff","#f8fafc","#1e293b",
    "#0f172a","#18181b","#fef9c3","#ecfdf5","#eff6ff",
  ];

  // ✅ Preset board sizes
  const BOARD_SIZES = [
    { label: "Small",       w: 800,  h: 500,  desc: "800×500" },
    { label: "Default",     w: 1400, h: 800,  desc: "1400×800" },
    { label: "Large",       w: 1920, h: 1080, desc: "1920×1080 (HD)" },
    { label: "A4 Portrait", w: 794,  h: 1123, desc: "A4 Portrait" },
    { label: "A4 Landscape",w: 1123, h: 794,  desc: "A4 Landscape" },
    { label: "Square",      w: 1000, h: 1000, desc: "1000×1000" },
    { label: "4K",          w: 3840, h: 2160, desc: "3840×2160 (4K)" },
  ];

  const ToolBtn = ({ tool, icon, title, shortcut, onClick }: {
    tool?: Tool; icon: React.ReactNode; title: string; shortcut?: string; onClick?: () => void;
  }) => (
    <button
      onClick={onClick ?? (() => tool && setActiveTool(tool))}
      title={`${title}${shortcut ? ` (${shortcut})` : ""}`}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all
        ${tool && activeTool === tool
          ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
        }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#0d0d0f] rounded-xl border border-white/6">

      <div className="absolute top-19 rounded-xl z-30 w-full pr-2">
      {/* ══ TOOLBAR ROW 1 ══ */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[#111114] border-b border-white/6 shrink-0 flex-wrap">

        {/* Title */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400 shrink-0">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
          <span className="text-white text-[11px] font-semibold tracking-tight">Whiteboard</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isReady ? "bg-emerald-400" : "bg-amber-400"}`} />
        </div>

        {/* File ops */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolBtn title="Save" shortcut="Ctrl+S" onClick={handleManualSave}
            icon={saving
              ? <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            }
          />
          <ToolBtn title="Download PNG" onClick={handleDownload}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
          />
          <ToolBtn title="Share" onClick={() => setShowShareModal(true)}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
          />
        </div>

        {/* Edit ops */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolBtn title="Undo" shortcut="Ctrl+Z" onClick={handleUndo}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>}
          />
          <ToolBtn title="Redo" shortcut="Ctrl+Y" onClick={handleRedo}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>}
          />
          <ToolBtn title="Delete selected" shortcut="Del" onClick={deleteSelected}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
          />
          <ToolBtn title="Clear canvas" onClick={handleClear}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6 11l4 4"/></svg>}
          />
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 px-2 border-r border-white/10">
          <button onClick={() => handleZoom(-10)} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 text-sm font-bold">−</button>
          <span className="text-[10px] text-gray-500 w-9 text-center">{zoom}%</span>
          <button onClick={() => handleZoom(10)} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 text-sm font-bold">+</button>
          <button onClick={() => { setZoom(100); fabricRef.current?.setZoom(1); fabricRef.current?.renderAll(); }}
            className="text-[9px] text-gray-500 hover:text-gray-300 px-1 transition">Reset</button>
        </div>

        {/* ✅ Board size picker */}
        <div className="relative px-2 border-r border-white/10" ref={sizeMenuRef}>
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="flex items-center gap-1.5 h-6 px-2 rounded-md text-[10px] text-gray-400 hover:text-white hover:bg-white/10 transition border border-white/10"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
            <span>{boardWidth}×{boardHeight}</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#111114] border border-white/10 rounded-xl shadow-2xl p-2 w-52">
              <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1.5">Board Size</p>
              <div className="space-y-0.5">
                {BOARD_SIZES.map((size) => (
                  <button
                    key={size.label}
                    onClick={() => { resizeBoard(size.w, size.h); setShowSizeMenu(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] transition ${
                      boardWidth === size.w && boardHeight === size.h
                        ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="font-medium">{size.label}</span>
                    <span className="text-gray-600">{size.desc}</span>
                  </button>
                ))}
              </div>

              {/* Custom size inputs */}
              <div className="mt-2 pt-2 border-t border-white/10 px-2">
                <p className="text-[9px] text-gray-500 mb-1.5">Custom</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={100} max={8000}
                    defaultValue={boardWidth}
                    onBlur={(e) => {
                      const w = Math.min(8000, Math.max(100, Number(e.target.value)));
                      resizeBoard(w, boardHeight);
                    }}
                    className="w-16 h-5 text-[9px] bg-[#1a1a24] border border-white/10 rounded px-1 text-gray-300 focus:outline-none focus:border-violet-500"
                    placeholder="W"
                  />
                  <span className="text-[9px] text-gray-600">×</span>
                  <input
                    type="number" min={100} max={8000}
                    defaultValue={boardHeight}
                    onBlur={(e) => {
                      const h = Math.min(8000, Math.max(100, Number(e.target.value)));
                      resizeBoard(boardWidth, h);
                    }}
                    className="w-16 h-5 text-[9px] bg-[#1a1a24] border border-white/10 rounded px-1 text-gray-300 focus:outline-none focus:border-violet-500"
                    placeholder="H"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="ml-auto flex items-center gap-2">
          {saving && <span className="text-[9px] text-amber-400 animate-pulse">● Saving…</span>}
          {!saving && savedAt && <span className="text-[9px] text-emerald-400">✓ {savedAt}</span>}
        </div>
      </div>

      {/* ══ TOOLBAR ROW 2 — Drawing Tools ══ */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[#0f0f12] border-b border-white/6 shrink-0 flex-wrap">

        {/* Selection & draw */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
          <ToolBtn tool="select" title="Select" shortcut="V"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 7z"/></svg>} />
          <ToolBtn tool="pen" title="Pen" shortcut="P"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>} />
          <ToolBtn tool="highlighter" title="Highlighter"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>} />
          <ToolBtn tool="eraser" title="Eraser" shortcut="E"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6 11l4 4"/></svg>} />
        </div>

        {/* Shapes */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolBtn tool="rectangle" title="Rectangle" shortcut="R"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>} />
          <ToolBtn tool="circle" title="Ellipse" shortcut="C"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="12" rx="10" ry="7"/></svg>} />
          <ToolBtn tool="triangle" title="Triangle"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L2 21h20z"/></svg>} />
          <ToolBtn tool="line" title="Line"
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="3"/></svg>} />
        </div>

        {/* Text */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <ToolBtn tool="text" title="Text" shortcut="T" onClick={() => addText(false)}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>} />
          <ToolBtn tool="sticky" title="Sticky Note" onClick={() => addText(true)}
            icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><polyline points="15 3 15 9 21 9"/></svg>} />
        </div>
        <ToolBtn tool="arrow" title="Arrow"
  icon={
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="19" y2="12"/>
      <polyline points="13 6 19 12 13 18"/>
    </svg>
  }
/>

<ToolBtn tool="double-arrow" title="Double Arrow"
  icon={
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <polyline points="15 6 21 12 15 18"/>
      <polyline points="9 6 3 12 9 18"/>
    </svg>
  }
/>

<ToolBtn tool="dashed-arrow" title="Dashed Arrow"
  icon={
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
      <line x1="3" y1="12" x2="19" y2="12"/>
      <polyline points="13 6 19 12 13 18"/>
    </svg>
  }
/>

        {/* Colors */}
        <div className="flex items-center gap-1.5 px-2 border-r border-white/10 relative" ref={colorPickerRef}>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-gray-500">Stroke</span>
            <button onClick={() => setShowColorPicker(showColorPicker === "stroke" ? null : "stroke")}
              className="w-5 h-5 rounded border border-white/20 hover:border-white/50 transition shadow-sm"
              style={{ backgroundColor: activeColor }} />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-gray-500">Fill</span>
            <button onClick={() => setShowColorPicker(showColorPicker === "fill" ? null : "fill")}
              className="w-5 h-5 rounded border border-white/20 hover:border-white/50 transition relative overflow-hidden"
              style={{ backgroundColor: fillColor === "transparent" ? "#0d0d0f" : fillColor }}>
              {fillColor === "transparent" && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-red-500 rotate-45" /></div>}
            </button>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-gray-500">Board</span>
            <button onClick={() => setShowColorPicker(showColorPicker === "board" ? null : "board")}
              className="w-5 h-5 rounded border-2 border-dashed border-white/30 hover:border-white/60 transition"
              style={{ backgroundColor: boardColor }} />
          </div>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#111114] border border-white/10 rounded-xl shadow-2xl p-3 w-52">
              <p className="text-[9px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                {showColorPicker === "stroke" ? "Stroke" : showColorPicker === "fill" ? "Fill" : "Board Background"}
              </p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {(showColorPicker === "board" ? BOARD_COLORS : STROKE_COLORS).map((c) => (
                  <button key={c} onClick={() => {
                    if (showColorPicker === "stroke") setActiveColor(c);
                    else if (showColorPicker === "fill") setFillColor(c);
                    else setBoardColor(c);
                    setShowColorPicker(null);
                  }}
                    className="w-7 h-7 rounded-md border-2 transition hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: (showColorPicker === "stroke" ? activeColor : showColorPicker === "fill" ? fillColor : boardColor) === c ? "#8b5cf6" : "transparent",
                      boxShadow: (c === "#ffffff" || c === "#f8fafc") ? "inset 0 0 0 1px rgba(255,255,255,0.2)" : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color"
                  value={showColorPicker === "stroke" ? activeColor : showColorPicker === "fill" ? (fillColor === "transparent" ? "#1a1a2e" : fillColor) : boardColor}
                  onChange={(e) => {
                    if (showColorPicker === "stroke") setActiveColor(e.target.value);
                    else if (showColorPicker === "fill") setFillColor(e.target.value);
                    else setBoardColor(e.target.value);
                  }}
                  className="w-6 h-6 rounded border border-white/10 cursor-pointer bg-transparent"
                />
                <span className="text-[9px] text-gray-500">Custom</span>
                {showColorPicker === "fill" && (
                  <button onClick={() => { setFillColor("transparent"); setShowColorPicker(null); }}
                    className="ml-auto text-[9px] text-red-400 hover:text-red-300 transition">None</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Size */}
        <div className="flex items-center gap-1 px-2 border-r border-white/10">
          <span className="text-[9px] text-gray-500">Size</span>
          <input type="range" min={1} max={30} value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16 h-1 accent-violet-500 cursor-pointer" />
          <span className="text-[9px] text-gray-500 w-4">{brushSize}</span>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-1 px-2 border-r border-white/10">
          <span className="text-[9px] text-gray-500">Opacity</span>
          <input type="range" min={10} max={100} value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-14 h-1 accent-violet-500 cursor-pointer" />
          <span className="text-[9px] text-gray-500 w-6">{opacity}%</span>
        </div>

        {/* Text format */}
        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
          <span className="text-[9px] text-gray-500 mr-1">Text:</span>
          <button onClick={() => setIsBold(!isBold)}
            className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition ${isBold ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>B</button>
          <button onClick={() => setIsItalic(!isItalic)}
            className={`w-6 h-6 flex items-center justify-center rounded text-xs italic transition ${isItalic ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>I</button>
          <input type="number" min={8} max={144} value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="h-5 w-11 text-[9px] border border-white/10 rounded px-1 bg-[#1a1a24] text-gray-300 focus:outline-none focus:border-violet-500 transition" />
        </div>

        <div className="ml-auto hidden sm:block">
          <span className="text-[8px] text-gray-600">V P E R C T · Ctrl+Z/Y/S</span>
        </div>
      </div>
      </div>

      {/* ══ CANVAS AREA — scrollable ══ */}
      <div className="flex-1 overflow-auto bg-[#0a0a0d]" style={{ minHeight: 0 }}>
        {/* ✅ Centered canvas with padding so user can see board edges */}
        <div className="flex items-start justify-start p-8 min-w-max min-h-max">
          {!isReady && (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-lg"
              style={{ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, backgroundColor: "#1a1a2e" }}
            >
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500 tracking-widest uppercase">Loading canvas</span>
            </div>
          )}
          {/* ✅ Shadow around canvas so board edges are clearly visible */}
          <div
            className="shadow-2xl shadow-black/60 rounded-sm"
            style={{
              width: boardWidth * (zoom / 100),
              height: boardHeight * (zoom / 100),
              backgroundColor: boardColor,
              backgroundImage: `radial-gradient(${getDotColorForBackground(boardColor)} 1.7px, transparent 1.7px)`,
              backgroundSize: "24px 24px",
              display: isReady ? "block" : "none",
            }}
          >
            <canvas ref={canvasRef} className="block rounded-sm" />
          </div>
        </div>
      </div>

      {/* ══ STATUS BAR ══ */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#111114] border-t border-white/6 shrink-0">
        <div className="flex items-center gap-3 text-[9px] text-gray-600">
          <span>Tool: <span className="text-gray-400">{activeTool}</span></span>
          <span>Board: {boardWidth}×{boardHeight}</span>
          <span>Zoom: {zoom}%</span>
          <span>Undo: {undoStack.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[9px] text-amber-400 animate-pulse">● Saving…</span>}
          {!saving && savedAt && <span className="text-[9px] text-emerald-400">✓ {savedAt}</span>}
          <span className="text-[9px] text-gray-600 font-mono">fabric.js</span>
        </div>
      </div>

      {/* ══ SHARE MODAL ══ */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}>
          <div className="bg-[#111114] rounded-2xl p-5 w-full max-w-xs border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Share whiteboard</h2>
              <button onClick={() => setShowShareModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Invite link</p>
            <div className="flex gap-2">
              <input readOnly value={`${window.location.origin}?whiteboard=${databaseId}`}
                className="flex-1 bg-[#0d0d0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-400 outline-none font-mono truncate" />
              <button onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                  copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-violet-600 hover:bg-violet-500 text-white"
                }`}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}