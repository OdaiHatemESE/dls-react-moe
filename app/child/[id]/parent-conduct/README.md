# Parent Conduct Agreement Wizard

This directory implements the parent conduct agreement flow under the dynamic route `/child/[id]/parent-conduct`. The page walks guardians through school, guardian, and conduct terms before capturing a digital acknowledgment.

## Page entry

- **Route**: `/child/[id]/parent-conduct`
- **File**: `page.tsx`
- **Params**:
  - `id`: The hashed child identifier used for downstream API calls (aliased in the component as `routeChildId`).

The page is rendered as a Next.js client component because it relies on interactive wizards, SWR, and client-side state.

## Data dependencies

All runtime data is fetched on the client with SWR using the shared `jsonFetcher` from `lib/swr.ts`.

| Purpose | Endpoint | SWR key |
| ------- | -------- | ------- |
| Fetch parent, student, and school metadata (contact info, roles, addresses) | `/api/oneroster/basic-info-full?eid={id}` | `['oneroster/basic-info-full', id]` |
| Retrieve the students recent school enrollment to determine the current school and stream | `/api/oneroster/schoolenrollments?studentSourcedId={studentId}` | `['oneroster/schoolenrollments', studentSourcedId]` |

The page keeps the OneRoster payloads in their original structure whenever possible. Helper functions in `page.tsx` (e.g., `collectOrgs`, `findLatestEnrollment`, `extractStreamGradeName`) normalize specific fields for display without mutating the source data.

## Wizard structure

The UI is a four-step wizard:

1. **School information** – Displays the latest school name, address, phone, and email resolved from OneRoster org relationships.
2. **Guardian information** – Shows the authenticated guardians name, national ID, and contact details.
3. **Conduct terms** – Renders the structured commitments from both the school and guardian sides via the `conductTerms` constant.
4. **Signature** – Summarizes captured data and prompts for final acknowledgment (signature capture UI pending future work).

Navigation is controlled by local state:

- `currentStep` (10) handles progress UI, step content, and navigation buttons.
- `handleNext` / `handlePrevious` increment or decrement the current step.
- The back button returns to `/child/{id}` when the wizard is exited early.

## Error handling & guard rails

- Displays a blocking warning banner if either the parent or student API payload carries a `warning` flag.
- Shows a destructive alert when fetch errors occur (network or API failures).
- Progress and summary sections guard against missing data by falling back to غير متوفر (not available) when necessary.

## Styling notes

- Tailwind CSS is used for layout and typography.
- Shared UI primitives (`Card`, `Separator`, `Spinner`) come from `components/ui` and `components`.
- RTL direction is applied at the container level to ensure Arabic copy alignment.

## Extending the wizard

When adding new fields or steps:

1. Reuse the existing helper utilities to keep OneRoster parsing consistent.
2. Keep new API integrations within the SWR pattern (`useSWR(key, fetcher)`) and avoid server-only modules on the client.
3. Update the `conductTerms` constant if policy language changes (maintain the nested structure for easy rendering).
4. Provide additional validation or acknowledgement fields in the signature step while preserving the existing summary block.

## Related files

- `app/child/[id]/page.tsx` – Child dashboard overview page that links into the conduct wizard.
- `lib/oneroster.ts` – Fetch utilities and token management for OneRoster APIs.
- `app/api/oneroster/basic-info-full/route.ts` – Supplies the parent/student payloads consumed here.
- `app/api/oneroster/schoolenrollments/route.ts` – Provides enrollment data for resolving the current school.
