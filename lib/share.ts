export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

export const generateLink = (pageId: string, mode: "view" | "edit") => {
  return `${getBaseUrl()}/page/${pageId}?mode=${mode}`;
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert("✅ Link copied!");
  } catch {
    alert("❌ Failed to copy");
  }
};

export const shareWhatsApp = (link: string) => {
  const url = `https://wa.me/?text=${encodeURIComponent(link)}`;
  window.open(url, "_blank");
};