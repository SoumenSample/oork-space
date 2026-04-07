let previewEl: HTMLDivElement | null = null;

export function showPreview(e: MouseEvent, url: string) {
  if (!previewEl) {
    previewEl = document.createElement("div");
    previewEl.className = "preview-modal";
    document.body.appendChild(previewEl);
  }

  previewEl.innerHTML = `
    <div>
      <strong>Page Preview</strong>
      <p>${url}</p>
    </div>
  `;

  const rect = (e.target as HTMLElement).getBoundingClientRect();

  previewEl.style.top = rect.bottom + 10 + "px";
  previewEl.style.left = rect.left + "px";
  previewEl.style.display = "block";
}

export function hidePreview() {
  if (previewEl) {
    previewEl.style.display = "none";
  }
}