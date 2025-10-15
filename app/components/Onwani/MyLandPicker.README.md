# MyLandPicker Component - Detailed Documentation

## Overview
`MyLandPicker` is a comprehensive React client component that integrates with the MyLand map system to allow users to select Onwani (UAE standardized) addresses. It provides a cascading selection UI (Municipality → District → Community → Road → Plot) synchronized with an embedded MyLand iframe via postMessage API.

---

## File Structure & Imports

### Line 1: `"use client";`
**Purpose:** Marks this as a Next.js client component  
**Effect:** Enables browser-only features (hooks, event listeners, iframe interaction). Cannot be imported into Server Components.

### Lines 3-31: Header Comment Block
**Purpose:** Provides high-level documentation for developers  
**Effect:** Explains architecture, data sources, map triggers (inbound/outbound postMessage), props, and where to find key logic sections (~line numbers)

### Line 33: `import * as React from "react";`
**Purpose:** Import React library  
**Effect:** Provides access to hooks (useState, useEffect, useRef, useCallback) used throughout component

### Line 34: `import { useI18n } from "@/app/i18n/I18nProvider";`
**Purpose:** Import internationalization hook  
**Effect:** Enables locale detection for Arabic/English UI labels

### Lines 35-38: UI Component Imports
**Purpose:** Import shadcn/ui components (Button, Card, Select, Combobox)  
**Effect:** Provides pre-styled, accessible UI primitives for the interface

### Line 39: `import { cn } from "@/lib/utils";`
**Purpose:** Import className utility function  
**Effect:** Enables conditional Tailwind class merging for dynamic styling

### Line 40: `import { getCommunities, getCommunityShape, ... } from "@/lib/onwani-client";`
**Purpose:** Import API helper functions  
**Effect:** Provides typed fetch wrappers for Onwani data endpoints (districts, communities, roads, plots, GIS details)

### Line 41: `import type { Municipality, OnwaniSelection } from "@/types";`
**Purpose:** Import TypeScript types  
**Effect:** Enforces type safety for municipality codes (ADM/AAM/WRM) and selection payload structure

---

## Type Definitions

### Lines 43-49: `Props` Type
**Purpose:** Define component props interface  
**Effect:** 
- `defaultMunicipality`: Sets initial municipality (defaults to ADM - Abu Dhabi)
- `showOverlayShape`: Whether to fetch GeoJSON boundary for visualization
- `className`: Optional styling override
- `onOk`: Callback when user confirms selection
- `onCancel`: Callback when user cancels

### Line 51: `type NamedOption`
**Purpose:** Define structure for district/community options  
**Effect:** Ensures each option has `value` (identifier), `en` (English name), `ar` (Arabic name)

### Line 52: `type PlotOption`
**Purpose:** Define structure for plot dropdown options  
**Effect:** Stores `label` (display text), `value` (identifier), `gisid` (optional GIS system ID)

### Line 54: `const MYLAND_ALLOWED_ORIGIN`
**Purpose:** Security constant for iframe communication  
**Effect:** Only postMessages from this origin are processed (prevents XSS attacks)

---

## Component Declaration & Props

### Lines 55-61: Component Function Signature
**Purpose:** Define component with destructured props and defaults  
**Effect:** Sets up function component with default municipality="ADM", showOverlayShape=false

---

## Locale & Internationalization

### Lines 65-66: Locale Detection
```typescript
const { locale } = useI18n();
const isAr = locale === "ar";
```
**Purpose:** Detect current UI language  
**Effect:** `isAr` boolean used throughout to show Arabic vs English labels, placeholders, and iframe URLs

---

## State Management

### Lines 71-82: Selection State
**Purpose:** Track user's cascading address selections  
**Effect:**
- `municipality`: ADM/AAM/WRM (triggers district fetch)
- `districts`: Available districts array (populated by API)
- `district`: Selected district name (triggers community fetch)
- `communities`: Available communities array
- `community`: Selected community name (triggers road/plot fetch)
- `roads`: Available road IDs (AAM only)
- `roadId`: Selected road (AAM only, triggers plot refetch)
- `plot`: Selected plot number/GISID
- `plotOptions`: Available plots for dropdown
- `shape`: Optional GeoJSON boundary for selected community
- `submitting`: Loading state during final submission
- `loading`: Object tracking loading states for each cascade level

**Cascading Effect:** Each selection triggers API calls to fetch next level options and resets downstream selections

---

## Refs for Advanced State

### Lines 87-92: Coordination Refs
**Purpose:** Manage async operations and prevent race conditions  
**Effect:**
- `pendingRef`: Queues selections from map before dropdown options load
- `gisInfoRef`: Stores fetched GIS metadata for selected plot
- `lastCoordsRef`: Caches last known lat/lng for fallback zoom
- `userInteractedRef`: Differentiates user clicks from programmatic updates
- `isApplyingMapDataRef`: Prevents infinite loops when syncing map → UI
- `mapSelectionActiveRef`: Tracks if current state came from map pin

### Line 94: `iframeRef`
**Purpose:** Reference to MyLand iframe DOM element  
**Effect:** Enables postMessage communication via `contentWindow`

---

## Type Guards & Utilities

### Lines 99-104: Runtime Type Checking
**Purpose:** Safely validate unknown data from API/postMessage  
**Effect:**
- `isRecord`: Checks if value is non-null object
- `toStringIfScalar`: Converts string/number to string, returns undefined otherwise

### Lines 106-113: `getScalar` Helper
**Purpose:** Extract first matching property from object by key list  
**Effect:** Handles API response variations (e.g., `DISTRICT_NAME_EN` vs `district_name_en` vs `DISTRICTENG`)

### Lines 118-153: `extractPlotsFromShape`
**Purpose:** Parse plot identifiers from GeoJSON features  
**Effect:**
- Handles nested structures: `{ features: [...] }` or `{ data: { features: [...] } }`
- Searches feature properties for plot keys (GISID, PLOTNUMBER, etc.)
- Returns sorted, deduplicated array of plot identifiers
- Used when community shape overlay contains plot boundaries

### Lines 158-184: `extractPlotsFromAPI`
**Purpose:** Normalize plot list API responses into dropdown options  
**Effect:**
- Handles array or `{ data: [...] }` wrapper
- Maps plot number and GISID from various key patterns
- Creates `{label, value, gisid}` options with natural sorting
- Deduplicates by value

### Lines 189-206: `mergePlotOptions`
**Purpose:** Intelligently combine plot options from multiple sources  
**Effect:**
- Merges shape-derived plots with API-fetched plots
- Preserves entries with GISID
- Keeps most descriptive label
- Prevents duplicates while enriching data

---

## API Data Fetching Effects

### Lines 209-246: District Fetch Effect
**Purpose:** Load districts when municipality changes  
**Effect:**
1. Sets `loading.districts = true`
2. Resets downstream selections (district, community, road, plot) **only if user changed municipality**
3. Calls `getDistricts(municipality)` API
4. Normalizes response (handles array or `{data: [...]}`)
5. Maps to `{value, en, ar}` format by searching for multiple key patterns
6. Updates `districts` state
7. Sets `loading.districts = false`
8. Cleanup on unmount prevents stale updates

**Dependency:** `[municipality]` - runs when municipality changes

### Lines 249-282: Community Fetch Effect
**Purpose:** Load communities when district changes  
**Effect:**
1. Guards: only runs if `district` is set
2. Sets `loading.communities = true`
3. Resets downstream (community, road, plot) **only if user changed district**
4. Calls `getCommunities(municipality, district)`
5. Normalizes and maps response similar to districts
6. Updates `communities` state
7. Cleanup prevents stale updates

**Dependency:** `[municipality, district]` - runs when either changes

### Lines 285-329: Road Fetch Effect (AAM Only)
**Purpose:** Load road IDs for Al Ain municipality  
**Effect:**
1. Guards: only runs for `municipality === "AAM"` with valid district & community
2. Sets `loading.roads = true`
3. Resets downstream (roadId, plot) **only if user changed community**
4. Calls `getRoadIds(district, community)`
5. Handles both object arrays and scalar arrays (direct string/number values)
6. Deduplicates and sorts road IDs naturally
7. Updates `roads` state

**Dependency:** `[municipality, district, community, getScalar]`

### Lines 332-354: Community Shape Fetch Effect
**Purpose:** Optionally load GeoJSON boundary for selected community  
**Effect:**
1. Guards: only runs if `showOverlayShape = true` and full location is selected
2. Sets `loading.shape = true`
3. Calls `getCommunityShape(municipality, district, community)`
4. Stores raw GeoJSON in `shape` state
5. Extracts plot identifiers from shape features
6. Merges extracted plots into `plotOptions`
7. Enables visual overlay and fallback plot discovery

**Dependency:** `[showOverlayShape, municipality, district, community, extractPlotsFromShape, mergePlotOptions]`

### Lines 357-378: Plot Numbers Fetch Effect
**Purpose:** Load available plots for selected area  
**Effect:**
1. Guards: requires municipality, district, community
2. For AAM: includes `roadId` to filter plots by road
3. Calls `getPlotNumbers(municipality, district, community, roadId?)`
4. Extracts plots using `extractPlotsFromAPI`
5. Merges with existing `plotOptions` (enriches data from multiple sources)
6. Silent error handling (UI falls back to iframe or shape data)

**Dependency:** `[municipality, district, community, roadId, extractPlotsFromAPI, mergePlotOptions]`

---

## Pending Selection Application

### Lines 380-444: `tryApplyPending` Callback
**Purpose:** Apply queued selections from map once dropdown options load  
**Effect:**
1. Normalizes (trims, lowercases) pending values and current options
2. For each pending field (district, community, roadId, plot):
   - Searches options for case-insensitive match (value, en, ar)
   - If found and different from current: updates state, clears pending, prevents user reset
   - Sets `isApplyingMapDataRef = true` to prevent outbound map messages
   - Exits early after each update to allow cascade to complete
3. Called after every option list update and after map message processing

**Dependencies:** `[districts, communities, roads, plotOptions, district, community, roadId, plot]`

---

## Map Communication (INBOUND)

### Lines 447-577: postMessage Listener Effect
**Purpose:** Receive and process messages from MyLand iframe  
**Effect:**

#### Security Check (Line 449)
```typescript
if (ev.origin !== MYLAND_ALLOWED_ORIGIN) return;
```
**Purpose:** Validate message source  
**Effect:** Prevents malicious scripts from injecting fake data

#### JSON Parsing (Lines 452-470)
**Purpose:** Handle various message formats  
**Effect:** Parses string or object messages, extracts JSON if embedded in string

#### Type-Based Message Handling

##### `plot-list` Message (Lines 478-486)
**Purpose:** Receive available plots from map  
**Effect:** Updates `plotOptions` and clears `plot` if not in new list

##### `plot-selected` Message (Lines 487-504)
**Purpose:** User clicked a plot on map  
**Effect:**
- Sets `plot` state to selected value
- Extracts and stores GISID if provided
- Enriches `plotOptions` with GISID data

##### `AddressType` Message (Lines 505-575)
**Purpose:** Map pin placement (Onwani/Plot/Coordinates)  
**Effect:**
1. **Parsing Address Data:**
   - Extracts English address string (`AddressValue_EN`)
   - Parses `OnwaniAddress` and `PlotAddress` objects
   - Determines municipality from address text or object fields

2. **Municipality Normalization:**
   - Converts text like "Abu Dhabi" → "ADM"
   - Handles variations: "Al Ain", "ain", "alain" → "AAM"
   - Dhafra/Western → "WRM"

3. **Field Extraction:**
   - District: from OnwaniAddress/PlotAddress or comma-separated parts
   - Community: from nested objects or address parts
   - Plot: from GISID or PLOTNUMBER fields

4. **AAM Road Derivation:**
   - Extracts road ID from OnwaniAddress.PlotAddress string (dash-separated)
   - Falls back to PlotAddress.ROADID field

5. **Coordinate Capture:**
   - Stores lng/lat from OnwaniAddress or InputCoordinates
   - Saves in `lastCoordsRef` for fallback zoom

6. **State Updates:**
   - Sets `isApplyingMapDataRef = true` to prevent loops
   - Stores selections in `pendingRef` (applied when options load)
   - Updates `plot` and `plotOptions` immediately if available
   - Sets `municipality` (triggers cascade)
   - Calls `tryApplyPending()` with current options

7. **Cleanup:**
   - Resets `isApplyingMapDataRef` after 100ms delay

**Dependencies:** `[getScalar, municipality, mergePlotOptions, tryApplyPending]`

---

## Map Communication (OUTBOUND)

### Lines 580-589: `sendToIframe` Helper
**Purpose:** Safely send messages to MyLand iframe  
**Effect:** Posts message to iframe contentWindow with origin validation

### Lines 591-606: `clearMapSelection` Helper
**Purpose:** Reset map state when user manually changes selections  
**Effect:**
- Clears all refs (pending, gisInfo, coords, flags)
- Sends reset messages to iframe
- Called when user interacts with dropdowns

### Lines 608: `canSubmit` Validation
**Purpose:** Determine if OK button should be enabled  
**Effect:** Requires municipality, district, community, road (if AAM), non-empty plot, and not submitting

---

## User Interaction Handlers

### Lines 611-626: `handleMunicipalityChange`
**Purpose:** User changed municipality dropdown  
**Effect:**
1. Logs user action
2. Sets `userInteractedRef = true` (enables smart resets)
3. Clears map selection
4. Updates municipality
5. Resets all downstream state (districts, communities, roads, plots, shape)

### Lines 628-641: `handleDistrictChange`
**Purpose:** User changed district dropdown  
**Effect:**
1. Logs and flags user action
2. Clears map selection
3. Updates district
4. Resets downstream (communities, roads, plots, shape)

### Lines 643-655: `handleCommunityChange`
**Purpose:** User changed community dropdown  
**Effect:**
1. Logs and flags user action
2. Clears map selection
3. Updates community
4. Resets downstream (roads, plots, shape)

### Lines 657-667: `handleRoadChange`
**Purpose:** User changed road dropdown (AAM only)  
**Effect:**
1. Logs and flags user action
2. Clears map selection
3. Updates roadId
4. Resets plots

### Lines 669-676: `handlePlotChange`
**Purpose:** User changed plot dropdown  
**Effect:**
1. Logs and flags user action
2. Clears map selection
3. Updates plot value

### Lines 678-700: `handleReset`
**Purpose:** User clicked Reset button  
**Effect:**
1. Flags as user interaction
2. Clears map selection and all refs
3. Resets municipality to default
4. **Clears all data arrays** (districts, communities, roads, plotOptions, shape)
5. Resets all selections to undefined/empty
6. Sends reset message to iframe

**Note:** Clearing data arrays forces fresh API fetches when user re-selects

### Lines 702-736: `handleOk` (Submission)
**Purpose:** User clicked OK to confirm selection  
**Effect:**
1. Guards: exits if `canSubmit` is false
2. Sets `submitting = true`
3. **Fetches plot database record:**
   - Prefers GISID over plot number
   - Calls `/api/db/plots?filter={gisid}` endpoint
   - Stores response or undefined on error
4. **Builds selection payload:**
   - municipality, districtEn, communityEn
   - roadId (if AAM)
   - plot number
   - shapeGeoJSON (if fetched)
   - dbPlotResponse (raw API result)
5. Calls `onOk` callback with payload
6. Sends `onwani-selection` message to iframe
7. Sets `submitting = false` in finally block

---

## Map Synchronization Effects (OUTBOUND)

### Lines 739-745: Municipality Sync
**Purpose:** Notify map when municipality changes  
**Effect:**
- Guards: skips if applying map data (prevents loop)
- Sends `{set: "region", municipality}` to iframe
- Updates map's regional context

**Dependency:** `[municipality, sendToIframe]`

### Lines 748-754: District Sync
**Purpose:** Notify map when district changes  
**Effect:**
- Guards: requires district, skips if applying map data
- Sends `{set: "district", municipality, district}` to iframe
- Updates map's district layer/filter

**Dependency:** `[district, municipality, sendToIframe]`

### Lines 757-771: Community Sync & Plot Request
**Purpose:** Notify map when community changes  
**Effect:**
1. Guards: requires community, skips if applying map data
2. Resets plot selection **only if user changed community**
3. Sends `{set: "community", municipality, district, community}` to iframe
4. Sends `request-plots` message with full location context
5. Triggers map to load/display plots for area

**Dependency:** `[community, municipality, district, roadId, sendToIframe]`

### Lines 774-789: Road Change Plot Refresh (AAM)
**Purpose:** Update plot list when road changes in Al Ain  
**Effect:**
1. Guards: AAM only, requires community, skips if applying map data
2. Clears plot selection **only if user changed road**
3. Sends `request-plots` with updated roadId
4. Refreshes map plots filtered by road

**Dependency:** `[municipality, district, community, roadId, sendToIframe]`

### Lines 792-848: Plot Focus & Address Setting
**Purpose:** Focus map on selected plot and set coordinates  
**Effect:**
1. Guards: requires plot, district, community; skips if applying map data
2. **Extracts GISID:** Searches plotOptions for matching entry
3. **Sends focus messages:**
   - `focus-plot` with full context (municipality, district, community, roadId, plotNumber, GISID)
   - `focus-gisid` with GISID if available
   - `{set: "plot", gisid}` to highlight plot on map
4. **Fetches GIS details:**
   - Calls `getGisIds(gisid)` API
   - Extracts lng/lat from response
   - Sends `{set: "address", address: "lng,lat"}` to zoom map
   - Falls back to `lastCoordsRef` if API fails
5. **Effect:** Map pans, zooms, and highlights selected plot

**Dependency:** `[plot, municipality, district, community, roadId, sendToIframe, plotOptions, getScalar]`

### Lines 851-854: Pending Application Effect
**Purpose:** Retry pending selections when options update  
**Effect:** Calls `tryApplyPending()` after any dropdown option list changes

**Dependency:** `[districts, communities, roads, plotOptions, tryApplyPending]`

---

## JSX Render (UI)

### Lines 856-858: Card Container
**Purpose:** Wrap component in shadcn Card  
**Effect:** Applies border, shadow, background styling with optional className override

### Lines 859-876: Card Header
**Purpose:** Title bar with municipality selector and reset  
**Effect:**
- Shows "Onwani Address Picker" (AR/EN)
- Municipality dropdown (ADM/AAM/WRM with Arabic labels)
- Reset button to clear all state

### Lines 877: Card Content Container
**Purpose:** Main content area with vertical spacing  
**Effect:** `space-y-4 pt-6` applies 16px gap between children

### Lines 879-966: Cascading Dropdowns Grid
**Purpose:** 2-column responsive grid of selection controls  
**Effect:**

#### District Combobox (Lines 881-896)
- Label: "District" (AR: "المنطقة")
- Options: Mapped from `districts` state with AR/EN labels
- Cross-language search: AR locale shows AR label but can search EN
- Disabled when loading
- Calls `handleDistrictChange` on selection

#### Community Combobox (Lines 898-913)
- Label: "Community" (AR: "المجتمع")
- Options: Mapped from `communities` state
- Cross-language search enabled
- Disabled until district selected or while loading
- Calls `handleCommunityChange` on selection

#### Road Combobox (Lines 915-931) - AAM Only
- Conditional render: `municipality === "AAM"`
- Label: "Road ID (AAM)" (AR: "رقم الطريق")
- Options: Direct mapping from `roads` array
- Disabled until community selected
- Calls `handleRoadChange` on selection

#### Plot Combobox (Lines 933-953)
- Label: "Plot" (AR: "رقم القطعة")
- Options: Mapped from `plotOptions`
- Disabled until community selected
- Smart placeholder:
  - "Pick community first" if no community
  - "No plots available" if community but empty options
  - "Select plot" if options available
- Calls `handlePlotChange` on selection

#### Empty Plot Message (Lines 954-958)
- Shows when community selected but no plots found
- Helps user understand why dropdown is empty

### Lines 961-970: MyLand Iframe
**Purpose:** Embed interactive map  
**Effect:**
- URL switches based on locale (AR/EN MyLand URLs)
- ref={iframeRef} enables postMessage communication
- Fixed height: 480px
- Rounded border, shadow styling
- title="MyLand" for accessibility

### Lines 972-990: Action Buttons
**Purpose:** Cancel and OK buttons  
**Effect:**
- Cancel: Calls `onCancel` prop, styled as outline
- OK: Calls `handleOk`, disabled when `!canSubmit`
  - Shows loading state: "Submitting..." with pulse animation
  - Primary button styling
  - Min width: 100px for consistent sizing

---

## Data Flow Summary

### User Selection Flow
1. User selects **Municipality** → Fetches districts → Sends region to map
2. User selects **District** → Fetches communities → Sends district to map
3. User selects **Community** → Fetches roads (AAM) and plots → Sends community to map, requests plots
4. User selects **Road** (AAM only) → Refetches plots for road → Requests filtered plots from map
5. User selects **Plot** → Fetches GIS details → Focuses map on plot, sets coordinates
6. User clicks **OK** → Fetches DB record → Calls `onOk` with full payload

### Map Interaction Flow
1. User places **pin on map** → Iframe sends AddressType message
2. Component receives message → Extracts address fields → Queues in pendingRef
3. Sets municipality → Triggers district fetch
4. Districts load → tryApplyPending matches queued district → Sets district
5. Communities load → tryApplyPending matches queued community → Sets community
6. Plots load → tryApplyPending matches queued plot → Sets plot
7. Map and UI now synchronized

### Loop Prevention
- `isApplyingMapDataRef`: Set true when processing map data, prevents outbound messages
- `userInteractedRef`: Distinguishes user clicks (enable resets) from programmatic updates (preserve downstream)
- `mapSelectionActiveRef`: Tracks if current state mirrors map pin (cleared on user interaction)

---

## Key Features

### Cascading Selections
- Each level depends on previous level
- Smart resets: only clear downstream when user interacts, not when map updates

### Bidirectional Map Sync
- **UI → Map:** Effects send updates on every selection change
- **Map → UI:** postMessage listener queues selections, applies when options load

### Multi-source Data Enrichment
- Merges plots from: API, community shape GeoJSON, map messages
- Preserves most complete data (GISID + descriptive label)

### Internationalization
- All labels switch AR/EN based on locale
- Cross-language search (search English while showing Arabic)
- Locale-specific iframe URLs

### Error Resilience
- Silent API failures (fallback to other data sources)
- Origin validation for security
- Cleanup on unmount prevents memory leaks

### Loading States
- Per-field loading indicators
- Disabled states cascade correctly
- Optimistic UI updates

---

## API Endpoints Used

1. `getDistricts(municipality)` - Line 215
2. `getCommunities(municipality, district)` - Line 258
3. `getRoadIds(district, community)` - Line 297 (AAM only)
4. `getPlotNumbers(municipality, district, community, roadId?)` - Line 367
5. `getCommunityShape(municipality, district, community)` - Line 340 (optional)
6. `getGisIds(gisid)` - Line 821 (plot details)
7. `/api/db/plots?filter={gisid}` - Line 707 (database lookup)

---

## PostMessage Events

### Sent to Iframe (Outbound)
- `{set: "region", municipality}` - Set map municipality
- `{set: "district", municipality, district}` - Set map district
- `{set: "community", municipality, district, community}` - Set map community
- `{type: "request-plots", payload: {...}}` - Request plots for area
- `{set: "plot", gisid}` - Highlight plot
- `{type: "focus-plot", payload: {...}}` - Focus on plot
- `{type: "focus-gisid", payload: {GISID}}` - Focus by GISID
- `{set: "address", address: "lng,lat"}` - Set map center coordinates
- `{type: "reset", action: "clear"}` - Clear map selection
- `{type: "onwani-selection", payload: {...}}` - Final selection confirmation

### Received from Iframe (Inbound)
- `{type: "plot-list", payload: {plots: string[]}}` - Available plots
- `{type: "plot-selected", payload: {plot, GISID?}}` - User clicked plot
- `{AddressType: "Onwani"|"Plot"|"Pin", OnwaniAddress: {...}, PlotAddress: {...}}` - Pin placement

---

## Common Customization Points

### Change Default Municipality
Line 56: `defaultMunicipality = "ADM"` → Change to "AAM" or "WRM"

### Adjust Iframe Height
Line 968: `h-[480px]` → Change to desired height

### Modify Submit Behavior
Lines 702-736: Add validation, transformations, or additional API calls in `handleOk`

### Add More Plot Data Sources
Lines 357-378: Add additional `getPlotNumbers` calls or shape parsing logic

### Customize Loading States
Lines 78: Add more specific loading keys for finer-grained UI feedback

### Change Map Messages
Lines 739-848: Modify postMessage payloads to match your iframe API

---

## Troubleshooting

### Dropdowns Not Populating
- Check browser console for API errors
- Verify municipality/district/community values match API expectations
- Confirm `lib/onwani-client` endpoints are returning data

### Map Not Syncing
- Verify `MYLAND_ALLOWED_ORIGIN` matches actual iframe origin
- Check browser console for postMessage errors
- Confirm iframe is fully loaded before sending messages

### Infinite Loops
- Ensure `isApplyingMapDataRef` guards are in place (lines 742, 751, 760, 777, 795)
- Check that effects aren't triggering each other cyclically

### Pending Selections Not Applying
- Verify `tryApplyPending` is called after option lists update (line 852)
- Check normalization logic matches your data format (lines 382-384)
- Ensure option lists actually contain matching values

### Reset Not Clearing Everything
- Confirm `handleReset` clears all state arrays and values (lines 678-700)
- Check that map reset messages are being sent (line 698)

---

## Performance Considerations

- **Debouncing:** Consider debouncing rapid dropdown changes if performance is an issue
- **Memoization:** `extractPlotsFromShape`, `extractPlotsFromAPI`, `mergePlotOptions` are memoized with useCallback
- **Cleanup:** All effects properly cancel async operations on unmount
- **Ref Usage:** Refs avoid unnecessary re-renders for coordination state

---

## Security Notes

- **Origin Validation:** Line 449 ensures only trusted iframe can send messages
- **XSS Prevention:** All user input goes through controlled components
- **API Validation:** Type guards prevent injection of malformed data

---

## Accessibility

- Labels paired with form controls (lines 883, 899, 917, 935)
- Disabled states communicated via aria attributes (inherited from Combobox component)
- Iframe has descriptive title attribute (line 965)
- Button min-widths prevent layout shift (lines 867, 975, 982)

---

## Future Enhancements

1. **Offline Support:** Cache API responses in localStorage/IndexedDB
2. **Validation:** Add field-level error messages for invalid selections
3. **History:** Track selection history for quick re-selection
4. **Search:** Add text search across all fields simultaneously
5. **Mobile:** Add touch gestures for map interaction
6. **Analytics:** Track common selection patterns
7. **Presets:** Allow saving favorite addresses

---

## Dependencies

- React 18+
- Next.js 13+ (App Router)
- shadcn/ui components
- Tailwind CSS
- TypeScript 5+

---

## Related Files

- `/lib/onwani-client.ts` - API helper functions
- `/types/index.ts` - Type definitions for Municipality, OnwaniSelection
- `/app/i18n/I18nProvider.tsx` - Internationalization context
- `/components/ui/*` - UI component primitives

---

## Version History

Current implementation as of parent-db-address branch, October 2025.
