// lib/swr.ts
// Centralized fetcher and default config helpers for SWR

export async function jsonFetcher<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ` - ${detail}` : ""}`);
  }
  return (await res.json()) as T;
}

export const defaultSWRConfig = {
  fetcher: jsonFetcher,
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;
