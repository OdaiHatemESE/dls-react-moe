// lib/swr.ts
// Centralized fetcher and default config helpers for SWR

export async function jsonFetcher<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let errorObj: any = { status: res.status, statusText: res.statusText };
    try {
      const text = await res.text();
      errorObj = JSON.parse(text);
    } catch {
      // fallback to status only
    }
    throw errorObj;
  }
  return (await res.json()) as T;
}

export const defaultSWRConfig = {
  fetcher: jsonFetcher,
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;
