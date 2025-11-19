# Onwani Address Mapping Reference

This document shows the mapping between Onwani Map Response fields and the AddressValue type used for submission.

## Onwani Map Response Structure

When a user places a pin on the MyLand map, the response contains:

```typescript
OnwaniMapResponse {
  AddressType: "Plot" | "Onwani" | "Pin"
  AddressValue_EN: string  // Full address in English
  AddressValue_AR: string  // Full address in Arabic
  
  InputCoordinates: {
    Lat: number | string
    Lng: number | string
  }
  
  PlotAddress: {
    MUNICIPALITYENG: string    // e.g., "Al Ain"
    MUNICIPALITYARA: string    // e.g., "العين"
    DISTRICTENG: string        // e.g., "AL AAMERAH"
    DISTRICTARA: string        // e.g., "العامرة"
    COMMUNITYENG: string       // e.g., "AL RIFAA"
    COMMUNITYARA: string       // e.g., "الرفاع"
    GISID: string             // Plot GIS ID
    PLOTNUMBER: string        // e.g., "6"
    ROADID: string            // e.g., "10"
  }
  
  OnwaniAddress: {
    MUNICIPALITYENG: string
    MUNICIPALITYARA: string
    DISTRICTENG: string
    DISTRICTARA: string
    COMMUNITYENG: string
    COMMUNITYARA: string
    Lat: number | string
    Lng: number | string
    // May contain additional fields similar to PlotAddress
  }
}
```

## AddressValue Type (Submission Format)

```typescript
AddressValue {
  // Database IDs (for Dubai/Northern Emirates only)
  emirateId?: number
  areaId?: number
  regionId?: number
  zoneId?: number
  plotId?: number
  
  // Names (for all emirates, especially Abu Dhabi from map)
  emirateNameEn?: string | null
  emirateNameAr?: string | null
  municipalityNameEn?: string | null
  municipalityNameAr?: string | null
  regionNameEn?: string | null        // District in Onwani terms
  regionNameAr?: string | null
  zoneNameEn?: string | null          // Was used for zone
  zoneNameAr?: string | null
  areaNameEn?: string | null          // Community in Onwani terms
  areaNameAr?: string | null
  
  // Address details
  streetName?: string                  // ROADID from Onwani
  houseNumber?: string                 // PLOTNUMBER from Onwani
  
  // Plot identifiers
  mainPlotId?: string | null           // GISID from Onwani
  premisesPlotId?: string | null       // Can be GISID or other
  
  // Coordinates
  latitude?: number | null
  longitude?: number | null
  
  // Full addresses
  fullAddressEn?: string | null
  fullAddressAr?: string | null
}
```

## Field Mapping Table

| **Onwani Field** | **AddressValue Field** | **Notes** |
|------------------|------------------------|-----------|
| **PlotAddress.MUNICIPALITYENG** | `municipalityNameEn` | Municipality name (Al Ain, Abu Dhabi, Al Dhafra) |
| **PlotAddress.MUNICIPALITYARA** | `municipalityNameAr` | Arabic municipality name |
| **PlotAddress.DISTRICTENG** | `regionNameEn` | District becomes Region in our system |
| **PlotAddress.DISTRICTARA** | `regionNameAr` | Arabic district name |
| **PlotAddress.COMMUNITYENG** | `areaNameEn` | Community becomes Area in our system |
| **PlotAddress.COMMUNITYARA** | `areaNameAr` | Arabic community name |
| **PlotAddress.GISID** | `mainPlotId` OR `premisesPlotId` | Plot GIS identifier |
| **PlotAddress.PLOTNUMBER** | `houseNumber` | Plot number becomes house/building number |
| **PlotAddress.ROADID** | `streetName` | Road ID becomes street identifier |
| **InputCoordinates.Lat** | `latitude` | Latitude coordinate |
| **InputCoordinates.Lng** | `longitude` | Longitude coordinate |
| **AddressValue_EN** | `fullAddressEn` | Complete English address string |
| **AddressValue_AR** | `fullAddressAr` | Complete Arabic address string |

## Emirate Determination

The `emirateNameEn` is derived from the municipality:

```typescript
const municipalityToEmirate = {
  "Abu Dhabi": "Abu Dhabi",
  "Al Ain": "Abu Dhabi",      // Al Ain is part of Abu Dhabi Emirate
  "Al Dhafra": "Abu Dhabi",   // Western Region of Abu Dhabi
  "Western": "Abu Dhabi"
}
```

## Example Mapping

Based on your screenshot showing Previously submitted (IDH):

| **Label** | **Value** | **Onwani Source** | **AddressValue Field** |
|-----------|-----------|-------------------|------------------------|
| Emirate | Abu Dhabi | Derived from MUNICIPALITYENG | `emirateNameEn: "Abu Dhabi"` |
| Area | AL RIFAA | PlotAddress.COMMUNITYENG | `areaNameEn: "AL RIFAA"` |
| Street | 3 | PlotAddress.ROADID | `streetName: "3"` |
| House/Building | 100114178 | PlotAddress.PLOTNUMBER | `houseNumber: "100114178"` |
| Region | Al Ain | PlotAddress.MUNICIPALITYENG | `municipalityNameEn: "Al Ain"` |
| Zone | AL AAMERAH | PlotAddress.DISTRICTENG | `regionNameEn: "AL AAMERAH"` |
| Plot | 141933 | Could be derived field | `plotId` (if numeric) |
| Main Plot | 100114178 | PlotAddress.GISID | `mainPlotId: "100114178"` |
| Premises | Plot_100114178 | Formatted string | `premisesPlotId: "Plot_100114178"` |

## Code Implementation

In `AddressPicker.tsx` (handleConfirmSelection):

```typescript
const onwaniData = selection.onwaniMapResponse;
const plotAddr = onwaniData?.PlotAddress;
const onwaniAddr = onwaniData?.OnwaniAddress;

const updates: Partial<AddressValue> = {
  // Municipality → stored in multiple places for compatibility
  municipalityNameEn: plotAddr?.MUNICIPALITYENG || onwaniAddr?.MUNICIPALITYENG || null,
  municipalityNameAr: plotAddr?.MUNICIPALITYARA || onwaniAddr?.MUNICIPALITYARA || null,
  
  // District → Region
  regionNameEn: plotAddr?.DISTRICTENG || onwaniAddr?.DISTRICTENG || null,
  regionNameAr: plotAddr?.DISTRICTARA || onwaniAddr?.DISTRICTARA || null,
  
  // Community → Area
  areaNameEn: plotAddr?.COMMUNITYENG || onwaniAddr?.COMMUNITYENG || null,
  areaNameAr: plotAddr?.COMMUNITYARA || onwaniAddr?.COMMUNITYARA || null,
  
  // Plot identifiers
  mainPlotId: plotAddr?.GISID || onwaniAddr?.GISID || null,
  premisesPlotId: plotAddr?.GISID || onwaniAddr?.GISID || null,
  
  // Address details
  streetName: plotAddr?.ROADID || null,
  houseNumber: plotAddr?.PLOTNUMBER || null,
  
  // Coordinates
  latitude: parseFloat(onwaniData?.InputCoordinates?.Lat) || null,
  longitude: parseFloat(onwaniData?.InputCoordinates?.Lng) || null,
  
  // Full addresses
  fullAddressEn: selection.addressValueEn || null,
  fullAddressAr: selection.addressValueAr || null,
  
  // Emirate derived from municipality
  emirateNameEn: deriveEmirateFromMunicipality(municipalityEn),
  emirateNameAr: deriveEmirateFromMunicipality(municipalityAr, 'ar'),
};
```

## Validation Rules

### Abu Dhabi Addresses (from Map)
Required fields:
- ✓ `emirateNameEn` (must contain "Abu Dhabi", "Al Ain", or "Dhafra")
- ✓ `latitude` (from map pin)
- ✓ `longitude` (from map pin)

### Dubai/Northern Emirates Addresses (from Form)
Required fields:
- ✓ `emirateId` (numeric database ID)
- ✓ `areaId` (numeric database ID)

## Submission to IDH API

When submitting to the IDH API (`/api/backoffice/idh`), the address fields are mapped:

```typescript
{
  emirate: emirateNameEn,           // "Abu Dhabi"
  area: areaNameEn,                 // "AL RIFAA"
  street: streetName,               // "3"
  houseBuilding: houseNumber,       // "100114178"
  region: municipalityNameEn,       // "Al Ain" (Municipality)
  zone: regionNameEn,               // "AL AAMERAH" (District)
  plot: plotId?.toString(),         // "141933"
  mainPlot: mainPlotId,             // "100114178"
  premises: premisesPlotId,         // "Plot_100114178"
  latitude: latitude?.toFixed(6),   // "24.123456"
  longitude: longitude?.toFixed(6), // "55.654321"
}
```

## Terminology Differences

| **Onwani Term** | **Our System Term** | **Database Field** |
|-----------------|---------------------|--------------------|
| Municipality | Region / Municipality | `municipalityNameEn` |
| District | Zone / District | `regionNameEn` |
| Community | Area / Sector | `areaNameEn` |
| GISID | Plot ID / Main Plot | `mainPlotId` |
| PLOTNUMBER | House/Building | `houseNumber` |
| ROADID | Street | `streetName` |

## Notes

1. **No Database IDs for Abu Dhabi**: When using the map picker, Abu Dhabi addresses don't have `emirateId`, `regionId`, `zoneId`, or `areaId` because they bypass the database lookups entirely.

2. **Coordinates are Critical**: For Abu Dhabi addresses, the validation requires valid coordinates to ensure a pin was actually placed on the map.

3. **Municipality vs Emirate**: The municipality (Al Ain, Abu Dhabi, Al Dhafra) is stored separately from the emirate name, even though they all belong to "Abu Dhabi" emirate.

4. **Plot ID Confusion**: There are multiple plot-related fields:
   - `plotId`: numeric ID (if from database)
   - `mainPlotId`: GISID string from Onwani
   - `premisesPlotId`: Can be GISID or formatted string

5. **Backward Compatibility**: The mapping preserves both old field names (region, zone, area) and new ones (municipality) to support existing integrations.
