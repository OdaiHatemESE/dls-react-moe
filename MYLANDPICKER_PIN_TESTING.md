# Testing Guide: Map Pin → Dropdown Updates

## Overview
This guide helps you test and verify that when a user places a pin on the MyLand map, the dropdowns automatically update with the selected address.

## How It Should Work

### User Flow
1. User opens MyLandPicker component
2. User clicks/taps on the map to place a pin
3. Map iframe sends address data via postMessage
4. Component receives the data and updates ALL dropdowns automatically:
   - Municipality dropdown updates
   - District dropdown populates and selects
   - Community dropdown populates and selects
   - Road dropdown (AAM only) populates and selects
   - Plot dropdown populates and selects
5. User can submit immediately OR manually adjust any dropdown

## Console Logging

The component now has detailed console logging to help debug the flow:

### When Map Pin is Placed
```
📍 Map pin placed - applying address data: { AddressType: "Onwani", ... }
📦 Pending selections queued: { district: "AL MARKHANIYA", community: "AL MUSHRIF", ... }
```

### As Dropdowns Update
```
🔄 Applying pending district: AL MARKHANIYA
🔄 Applying pending community: AL MUSHRIF
🔄 Applying pending road: 123
🔄 Applying pending plot: 456789
✅ Map data application complete - ready for user interaction
```

### When User Changes Dropdown
```
👤 User changed district to: AL BATEEN
```

## Testing Steps

### Test 1: Basic Map Pin Placement
**Steps:**
1. Open browser DevTools (F12) and go to Console tab
2. Open MyLandPicker component
3. Click on any plot on the map
4. Watch console logs

**Expected Console Output:**
```
📍 Map pin placed - applying address data: {...}
📦 Pending selections queued: {...}
🔄 Applying pending district: [DISTRICT_NAME]
🔄 Applying pending community: [COMMUNITY_NAME]
🔄 Applying pending plot: [PLOT_NUMBER]
✅ Map data application complete - ready for user interaction
```

**Expected UI:**
- ✅ Municipality dropdown shows selected value
- ✅ District dropdown shows selected value
- ✅ Community dropdown shows selected value
- ✅ Plot dropdown shows selected value
- ✅ No infinite loop messages
- ✅ Map doesn't jump or zoom multiple times

### Test 2: Map Pin Then Manual Change
**Steps:**
1. Click on map (fills all dropdowns)
2. Manually change the Community dropdown
3. Watch console and UI

**Expected Console Output:**
```
[Initial map pin logs...]
👤 User changed community to: [NEW_COMMUNITY]
```

**Expected UI:**
- ✅ Community changes to new selection
- ✅ Plot dropdown resets (downstream reset)
- ✅ District stays selected (upstream preserved)
- ✅ Map updates to show new community

### Test 3: Multiple Map Pins
**Steps:**
1. Click on one plot on the map
2. Wait for dropdowns to fill
3. Click on a different plot on the map
4. Watch for smooth transition

**Expected:**
- ✅ First pin fills dropdowns
- ✅ Second pin updates dropdowns to new address
- ✅ No errors in console
- ✅ Smooth transition between selections

### Test 4: AAM Municipality (with Road)
**Steps:**
1. Make sure map is showing Al Ain region
2. Click on a plot in AAM
3. Verify Road dropdown appears and fills

**Expected:**
- ✅ Municipality: AAM
- ✅ District filled
- ✅ Community filled
- ✅ Road dropdown appears with value
- ✅ Plot filled

### Test 5: Rapid Pin Placement
**Steps:**
1. Quickly click multiple locations on the map (5-10 clicks)
2. Wait for UI to stabilize
3. Check console for errors

**Expected:**
- ✅ Final selection takes precedence
- ✅ No race condition errors
- ✅ No infinite loops
- ✅ Dropdowns show last clicked location

## Troubleshooting

### Problem: Dropdowns Don't Update After Map Click

**Check:**
1. Open Console - do you see the `📍 Map pin placed` message?
   - **No**: Map iframe may not be sending postMessage
   - **Yes**: Continue to next check

2. Do you see `📦 Pending selections queued`?
   - **No**: Message format may be different than expected
   - **Yes**: Continue to next check

3. Do you see `🔄 Applying pending` messages?
   - **No**: Data may not match dropdown options (case-sensitive)
   - **Yes**: Dropdowns should be updating

**Solutions:**
- Check if district/community names match exactly (case-sensitive)
- Look at the full `📍 Map pin placed` object to see actual data structure
- Verify dropdown options loaded correctly

### Problem: Infinite Loop (Console Flooding)

**Symptoms:**
- Same message repeated hundreds of times
- Browser becomes slow/unresponsive
- Console filled with messages

**Check Console For:**
- Repeated `→ Sending to map:` and `← Received from map:` cycles
- Multiple `🔄 Applying pending` for same value

**Solution:**
- This should NOT happen with the loop prevention in place
- If it does, check that `isApplyingMapDataRef` guards are in place
- Verify setTimeout calls are executing

### Problem: Dropdown Updates But Map Doesn't Zoom

**This is expected!**
- When map sends data, we DON'T send it back to prevent loops
- Map already knows its own selection
- Only when USER changes dropdown should map update

### Problem: Some Dropdowns Fill, Others Don't

**Possible Causes:**
1. **Case mismatch**: District name in pending vs. options
   - Check console: does pending value match option exactly?
   
2. **Timing issue**: Options haven't loaded yet
   - Pending will apply once options load
   - Check if you see `🔄 Applying pending` later

3. **Missing data**: Map didn't send that field
   - Check `📦 Pending selections queued` object
   - Some fields may be undefined

## Success Criteria

✅ **Pin Placement Works** if:
1. Console shows `📍 Map pin placed`
2. Console shows `🔄 Applying pending` for each field
3. All dropdowns fill with correct values
4. Console shows `✅ Map data application complete`
5. No error messages in console
6. No infinite loop messages
7. User can immediately submit OR manually adjust

## Performance Monitoring

### Normal Behavior
- Single pin click → 5-10 console messages total
- Processing time: < 500ms
- No lag in UI

### Warning Signs
- More than 20 messages for single click
- Processing time > 2 seconds
- UI freezes or becomes unresponsive

## Debugging Commands

### Check Current State
Open browser console and run:
```javascript
// See current dropdown values
document.querySelectorAll('[role="combobox"]').forEach(el => {
  console.log(el.getAttribute('aria-label'), el.textContent);
});
```

### Monitor postMessage Traffic
```javascript
// Add before component loads
window.addEventListener('message', (ev) => {
  if (ev.origin === 'https://myland.dmt.gov.ae') {
    console.log('🗺️ Map message:', ev.data);
  }
});
```

## Expected Message Format from Map

When user places pin, map should send:
```json
{
  "AddressType": "Onwani" or "Plot",
  "AddressValue_EN": "Plot 123, Al Mushrif, AL MARKHANIYA, Abu Dhabi",
  "OnwaniAddress": {
    "COMMUNITYENG": "AL MUSHRIF",
    "GISID": "123456",
    "Lng": "54.xxxx",
    "Lat": "24.xxxx"
  },
  "PlotAddress": { ... },
  "InputCoordinates": { "Lng": "...", "Lat": "..." }
}
```

## Common Scenarios

### Scenario A: Perfect Flow ✅
```
User clicks map → 
📍 Pin placed → 
📦 Pending queued → 
Municipality updates → 
Districts load → 
🔄 District applied → 
Communities load → 
🔄 Community applied → 
Plots load → 
🔄 Plot applied → 
✅ Complete
```

### Scenario B: Partial Data
```
User clicks map → 
📍 Pin placed → 
📦 Pending queued: { district: "X", community: undefined, plot: "123" } → 
District applies → 
Community doesn't apply (no data) → 
Plot applies when user manually selects community
```

### Scenario C: User Overrides Map
```
Map fills dropdowns → 
✅ Complete → 
👤 User changes community → 
Plot resets → 
Map updates (but doesn't send back to prevent loop)
```

---

**Last Updated**: October 15, 2025  
**Component**: `app/components/Onwani/MyLandPicker.tsx`
