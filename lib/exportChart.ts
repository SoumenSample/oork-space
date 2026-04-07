import html2canvas from "html2canvas";
import { RefObject } from "react";

export const exportChart = async (chartRef: RefObject<HTMLDivElement | null>, title = "chart") => {
  if (!chartRef?.current) return;

  const canvas = await html2canvas(chartRef.current, {
    scale: 2,
  });

  const dataURL = canvas.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = dataURL;
  a.download = `${title}.png`;
  a.click();
};