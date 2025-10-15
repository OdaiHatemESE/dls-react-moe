# MyLandPicker - Loop Prevention Mechanism

## Problem Statement

When integrating a map (iframe) with form dropdowns, there's a risk of infinite update loops:

```
User clicks map → Map sends address → Dropdowns update → 
Dropdowns trigger effects → Effects send to map → Map updates → 
Map sends new address → Dropdowns update → ... INFINITE LOOP
```

## Solution: Dual-Flag System

We use **two ref flags** to prevent loops while maintaining bidirectional sync:

### Flag 1: `userInteractedRef`
**Purpose**: Distinguish user-initiated changes from map-initiated changes

- `true` = User manually changed a dropdown
- `false` = Map/system changed the dropdown

**Used for**: Smart cascade resets (only reset downstream when user changes parent)

### Flag 2: `isApplyingMapDataRef`
**Purpose**: Prevent outbound postMessages during map data application

- `true` = Currently applying data received from map
- `false` = Ready to send updates to map

**Used for**: Block outbound effects when inbound data is being processed

## How It Works

### Scenario 1: User Changes Dropdown

```typescript
// User selects district from dropdown
handleDistrictChange(newDistrict) {
  userInteractedRef.current = true;      // Mark as user action
  isApplyingMapDataRef.current = false;  // Not applying map data
  setDistrict(newDistrict);
  // Effect runs:
  // - userInteractedRef = true → resets community/road/plot
  // - isApplyingMapDataRef = false → sends update to map ✓
}
```

**Flow:**
1. ✅ User interaction flag set
2. ✅ Dropdown updates
3. ✅ Downstream dropdowns reset (expected)
4. ✅ Map receives update and shows new district
5. ✅ No loop because map won't send back the same data

### Scenario 2: Map Sends Address (User Clicks Map)

```typescript
// Map iframe sends address via postMessage
onMapMessage(addressData) {
  isApplyingMapDataRef.current = true;   // Start applying map data
  
  // Store pending selections
  pendingRef.current = {
    district: "AL MARKHANIYA",
    community: "AL MUSHRIF",
    plot: "12345"
  };
  
  setMunicipality("ADM");  // Trigger cascade
  
  // Reset flag after cascade completes
  setTimeout(() => {
    isApplyingMapDataRef.current = false;
  }, 100);
}

// As districts load:
React.useEffect(() => {
  if (pendingDistrict && districts.includes(pendingDistrict)) {
    isApplyingMapDataRef.current = true;   // Re-assert flag
    userInteractedRef.current = false;     // Mark as map action
    setDistrict(pendingDistrict);
    setTimeout(() => {
      isApplyingMapDataRef.current = false;
    }, 0);
  }
}, [districts]);

// When district changes:
React.useEffect(() => {
  if (!district) return;
  if (isApplyingMapDataRef.current) return;  // ❌ BLOCKED - applying map data
  sendToIframe({ set: "district", district }); // Not sent during map apply
}, [district]);
```

**Flow:**
1. ✅ Map sends address data
2. ✅ `isApplyingMapDataRef = true` (prevents outbound messages)
3. ✅ Municipality updates
4. ✅ Districts load
5. ✅ Pending district applied with `userInteractedRef = false`
6. ✅ District effect runs but is **blocked** by `isApplyingMapDataRef`
7. ✅ Communities load
8. ✅ Pending community applied
9. ✅ All selections applied without sending redundant updates to map
10. ✅ Flag resets after 100ms
11. ✅ Form is ready for user interaction

### Scenario 3: User Changes After Map Selection

```typescript
// Map populated all fields
// isApplyingMapDataRef = false (after timeout)
// userInteractedRef = false (from last map action)

// User manually changes community
handleCommunityChange(newCommunity) {
  userInteractedRef.current = true;       // User action!
  isApplyingMapDataRef.current = false;   // Not applying map data
  setCommunity(newCommunity);
  // Effect runs:
  // - userInteractedRef = true → resets plot
  // - isApplyingMapDataRef = false → sends to map ✓
}
```

**Flow:**
1. ✅ User changes community
2. ✅ Plot resets (downstream)
3. ✅ Map receives update and zooms to new community
4. ✅ No loop - map doesn't re-send unless user clicks map again

## Effect Guards

Every outbound effect (that sends postMessage to map) has this guard:

```typescript
React.useEffect(() => {
  if (!someValue) return;
  
  // 🛡️ LOOP PREVENTION GUARD
  if (isApplyingMapDataRef.current) return;
  
  sendToIframe({ set: "something", value: someValue });
}, [someValue, sendToIframe]);
```

**Effects Protected:**
- ✅ Municipality change → map region
- ✅ District change → map district
- ✅ Community change → map community + plot request
- ✅ Road change → plot request
- ✅ Plot change → map focus + coordinates

## Timing Strategy

### Immediate Timeout (0ms)
Used for **individual field updates**:
```typescript
setTimeout(() => {
  isApplyingMapDataRef.current = false;
}, 0);
```
- Allows React to complete state update cycle
- Prevents outbound message in same render cycle
- Unblocks for next user interaction

### Delayed Timeout (100ms)
Used for **full cascade from map**:
```typescript
setTimeout(() => {
  isApplyingMapDataRef.current = false;
}, 100);
```
- Allows entire cascade to complete (municipality → district → community → plot)
- Gives time for all pending selections to apply
- Ensures all effects run without sending to map

## Smart Reset Logic

The `userInteractedRef` flag enables smart cascading:

```typescript
React.useEffect(() => {
  // Load districts for municipality
  getDistricts(municipality).then(setDistricts);
  
  // Only reset downstream if USER changed municipality
  if (userInteractedRef.current) {
    setDistrict(undefined);
    setCommunity(undefined);
    setPlot("");
  }
  // If map changed municipality, preserve pending selections
}, [municipality]);
```

**Benefits:**
- Map-triggered cascades preserve all selections
- User-triggered changes only reset what's necessary
- No accidental data loss

## Testing Scenarios

### ✅ Test 1: Map Click → Form Fills
**Steps:**
1. Click on map plot
2. Observe dropdowns populate
3. Verify no console errors
4. Verify map doesn't zoom multiple times

**Expected:**
- All dropdowns fill correctly
- Single map zoom to selected plot
- No infinite message loop

### ✅ Test 2: Manual Dropdown → Map Updates
**Steps:**
1. Select district from dropdown
2. Observe map updates
3. Select community from dropdown
4. Observe map updates

**Expected:**
- Map updates each time
- No duplicate messages
- Downstream fields reset appropriately

### ✅ Test 3: Map Click → Manual Change → Map Updates
**Steps:**
1. Click map (fills all fields)
2. Change community dropdown
3. Observe plot resets
4. Observe map zooms to new community

**Expected:**
- Plot field clears (downstream reset)
- Map updates to new community
- No loop back to original selection

### ✅ Test 4: Rapid Changes
**Steps:**
1. Quickly change municipality dropdown multiple times
2. Quickly change district dropdown multiple times

**Expected:**
- No race conditions
- Final selection takes precedence
- Map shows final selection
- No error messages

### ✅ Test 5: Reset Button
**Steps:**
1. Fill form via map or manually
2. Click Reset button
3. Observe all fields clear
4. Observe map resets

**Expected:**
- All dropdowns empty
- Map returns to initial state
- `userInteractedRef = true` (for fresh start)
- Ready for new selection

## Debug Tips

### Check Flags in Console
Add to any effect:
```typescript
console.log('Effect:', {
  userInteracted: userInteractedRef.current,
  isApplyingMapData: isApplyingMapDataRef.current,
  value: someValue
});
```

### Monitor postMessage Traffic
```typescript
const sendToIframe = (data: unknown) => {
  console.log('→ Sending to map:', data);
  frame.contentWindow.postMessage(data, ORIGIN);
};

function onMessage(ev: MessageEvent) {
  console.log('← Received from map:', ev.data);
  // ... handle message
}
```

### Signs of a Loop
- Console floods with messages
- Browser becomes unresponsive
- Same postMessage sent repeatedly
- Effects firing continuously

### Fix a Loop
1. Check if new outbound effect has `isApplyingMapDataRef` guard
2. Verify timeout durations are appropriate
3. Ensure `userInteractedRef` is set correctly in handlers
4. Confirm pending selections clear properly

## Architecture Principles

1. **Inbound First**: Map data always takes priority during application
2. **Guard All Outbound**: Every effect that sends to map must have loop guard
3. **Clear Flags Quickly**: Reset flags ASAP to allow next interaction
4. **Timeout Safety**: Use timeouts to ensure React state updates complete
5. **User Intent Wins**: User actions override map state when they conflict

## Summary

The dual-flag system prevents infinite loops by:
- **Blocking outbound messages** during map data application (`isApplyingMapDataRef`)
- **Smart cascade control** based on action source (`userInteractedRef`)
- **Proper timing** with strategic setTimeout usage
- **Clear separation** between user-initiated and map-initiated changes

This enables **true bidirectional sync** without the chaos of infinite update loops! 🎯

---

**Last Updated**: October 15, 2025  
**Component**: `app/components/Onwani/MyLandPicker.tsx`
