"use client";

import { useEffect, useState } from "react";

export default function HoverTooltip({ target }: any) {
  const [style, setStyle] = useState<any>(null);

  useEffect(() => {
    if (!target) return;

    const rect = target.getBoundingClientRect();

    setStyle({
      top: rect.top + window.scrollY + rect.height / 2,
      left: rect.right + 10,
    });
  }, [target]);

  if (!target || !style) return null;

  return (
    <div
      className="notion-tooltip"
      style={{
        position: "absolute",
        top: style.top,
        left: style.left,
      }}
    >
      <div className="tooltip-title">Table view</div>
      <div className="tooltip-desc">
        Add a table view for a new or existing data source
      </div>
    </div>
  );
}