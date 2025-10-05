export function buildNoCacheUrl(url: string): string {
  if (!url) return url;
  const hasQuery = url.includes("?");
  const sep = hasQuery ? "&" : "?";
  return `${url}${sep}nocache=1`;
}
