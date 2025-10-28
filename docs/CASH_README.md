## Caching + Refresh mechanism (OneRoster + Redis + SWR)

This project ships with a simple, consistent client–server caching model:

- Server-side: OneRoster API responses are cached in Redis with short TTLs. Routes support `?nocache=1` to bypass Redis and fetch fresh data.
- Client-side: SWR fetches the API, displays a shared refresh bar, and updates the UI immediately after a forced refresh.

You can plug this pattern into any new API route in minutes.

---

## High-level flow

1) Client requests an API route. The route tries Redis first.
2) If there’s no hit (or client sent `?nocache=1`), the route fetches from OneRoster, stores the result in Redis, and returns it.
3) Every response includes cache metadata so the UI can show a timestamp and an “outdated” hint.
4) On the client, a shared `<RefreshBar />` calls the same API with `?nocache=1`, then updates SWR with the fresh response.

---

## Server-side building blocks

Files:

- `lib/cache.ts`
	- `cacheGetJSON<T>(key)` / `cacheSetJSON(key, value, { ttlSeconds })`
	- `makeKey([...parts])` to create stable Redis keys

- `lib/oneroster.ts`
	- `orFetch<T>(path, kind?, init?)` to call OneRoster with token management

- API Routes under `app/api/oneroster/*`
	- Example: `app/api/oneroster/schoolenrollments/route.ts`
	- Example: `app/api/oneroster/basic-info-full/route.ts`

Conventions for Redis values:

- When caching fresh data, store a wrapper: `{ data, fetchedAt }`
- Continue reading legacy array-only values for backward compatibility.
- Include this meta in the HTTP response:

```json
{
	"meta": {
		"cache": {
			"source": "cache" | "upstream",
			"lastUpdated": "2025-10-05T12:34:56.000Z" | null
		}
	}
}
```

By default, routes read from Redis unless the query `nocache=1|true|yes` is present.

---

## Client-side building blocks

Files:

- `lib/swr.ts`
	- `jsonFetcher` and default SWR config
	- Provided globally via `app/components/SWRProvider.tsx`

- `lib/time.ts`
	- `timeAgo(iso)` helper to display relative time

- `lib/refresh.ts`
	- `buildNoCacheUrl(url)` to append `nocache=1` correctly

- `components/RefreshBar.tsx`
	- Shared UI that shows last updated, a warning if from cache, and a refresh action that bypasses Redis and updates SWR.

Props:

- `swrKey: string | null` — the SWR key/URL used to fetch data.
- `meta?: { cache?: { source?: "cache" | "upstream"; lastUpdated?: string | null } }`
- `labels?` — optional localization overrides.
- `onAfterFetch?` — optional transform of the fetched JSON before writing to SWR.
- `className?` — styling hook.

Usage:

```tsx
import useSWR from 'swr';
import RefreshBar from '@/components/RefreshBar';
import { jsonFetcher } from '@/lib/swr';

type MyResponse = {
	items: any[];
	meta?: { cache?: { source?: 'cache' | 'upstream'; lastUpdated?: string | null } };
};

export default function MyView() {
	const key = '/api/oneroster/my-endpoint?x=1';
	const { data } = useSWR<MyResponse>(key, jsonFetcher);
	return (
		<div>
			<RefreshBar swrKey={key} meta={data?.meta} />
			{/* render data */}
		</div>
	);
}
```

---

## Example: route with caching + refresh

Below is the core pattern used by `schoolenrollments` and `basic-info-full` routes.

Key points:

- Parse `nocache` flag from the query string.
- Try Redis (read legacy arrays or `{ data, fetchedAt }`).
- If a miss or `nocache`, fetch from OneRoster, store `{ data, fetchedAt }`.
- Return your payload plus `meta.cache`.

```ts
// Inside an app/api route handler
import { NextResponse } from 'next/server';
import { cacheGetJSON, cacheSetJSON, makeKey } from '@/lib/cache';

type Wrapped<T> = { data: T; fetchedAt: string };

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const noCache = ['1', 'true', 'yes'].includes((searchParams.get('nocache') || '').toLowerCase());

	const key = makeKey(['or', 'my', 'entity', 'id', '123']);

	let data: any[] = [];
	let fetchedAt: string | null = null;
	let source: 'cache' | 'upstream' = 'cache';

	if (!noCache) {
		const cachedAny = await cacheGetJSON<unknown>(key);
		if (Array.isArray(cachedAny)) {
			data = cachedAny;
		} else if (cachedAny && typeof cachedAny === 'object' && Array.isArray((cachedAny as Wrapped<any[]>).data)) {
			const w = cachedAny as Wrapped<any[]>;
			data = w.data;
			fetchedAt = w.fetchedAt ?? null;
		}
	}

	if (!data.length) {
		const fresh = await fetchUpstream(); // your OneRoster call
		data = fresh;
		fetchedAt = new Date().toISOString();
		source = 'upstream';
		await cacheSetJSON<Wrapped<any[]>>(key, { data: fresh, fetchedAt }, { ttlSeconds: 10 * 60 });
	}

	return NextResponse.json({
		data,
		meta: { cache: { source, lastUpdated: fetchedAt } },
	});
}
```

---

## Add nocache/meta to a new API route

1) Decide your Redis key structure
	 - Use `makeKey(["or", <entity>, <parts...>])` for consistency.

2) Parse the `nocache` flag
	 - `const noCache = ['1','true','yes'].includes((searchParams.get('nocache')||'').toLowerCase())`.

3) Read Redis
	 - If value is array → use it (legacy cache).
	 - If value is object with `data` → use `data` and `fetchedAt`.

4) Fetch upstream if needed
	 - Call OneRoster with `orFetch`.
	 - Set `{ data, fetchedAt: new Date().toISOString() }` into Redis with a TTL.

5) Return `meta.cache`
	 - Include `source: 'cache' | 'upstream'` and `lastUpdated: fetchedAt | null`.

6) Client-side
	 - Use SWR with your URL as the key.
	 - Drop `<RefreshBar swrKey={key} meta={data?.meta} />` near your view header.

---

## End-to-end example

Server route: `app/api/oneroster/schoolenrollments/route.ts`

- Accepts: `studentId`, optional `schoolYear`, optional `nocache`.
- Caches enrollments as `{ data, fetchedAt }` with a 10-minute TTL.
- Returns `meta.cache` block.

Client view: `app/child/[id]/SchoolInfo.tsx`

- Builds SWR key based on student id and year.
- Renders `<RefreshBar swrKey={key} meta={data.meta} />`.
- Clicking refresh forces `?nocache=1`, updates SWR cache, and the timestamp.

---

## Tips

- TTLs: keep short (5–30 minutes) unless you know the upstream changes very infrequently.
- Backward compatibility: read both legacy arrays and `{ data, fetchedAt }` to avoid stale Redis formats.
- Partial cache: if a route composes multiple cached entities, compute `meta.cache.source` as `"upstream"` if any piece was fetched fresh, and set `lastUpdated` to the most recent `fetchedAt` among them.
- Security: don’t expose OneRoster credentials; all `orFetch` calls must happen server-side.

---

## Dev quickstart

- Install deps: `npm install`
- Run dev: `npm run dev`
- The SWR config is provided globally via `SWRProvider` in `app/layout.tsx`.
