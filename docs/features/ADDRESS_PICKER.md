# Address Picker - Onwani Integration

**Last Updated:** December 15, 2025

## Quick Start

### Basic Usage

```typescript
'use client';

import AddressPicker from '@/app/components/forms/AddressPicker';
import { useState } from 'react';

export default function AddressForm() {
  const [address, setAddress] = useState<AddressValue | null>(null);

  return (
    <AddressPicker
      value={address}
      onChange={setAddress}
      lang="ar"
      required
    />
  );
}
```

### With Form Validation

```typescript
import { useForm } from 'react-hook-form';

interface FormData {
  address: AddressValue;
}

export default function StudentUpdateForm() {
  const { register, setValue, watch } = useForm<FormData>();
  const currentAddress = watch('address');

  return (
    <form>
      <AddressPicker
        value={currentAddress}
        onChange={(addr) => setValue('address', addr)}
        required
        error={errors.address?.message}
      />
    </form>
  );
}
```

## Component API

### AddressPicker Props

```typescript
interface AddressPickerProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  lang?: 'en' | 'ar';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

interface AddressValue {
  emirate: string;           // Emirate ID
  region: string;            // Region ID
  area: string;              // Area ID
  plot?: string;             // Plot number (optional)
  building?: string;         // Building number (optional)
  flatNumber?: string;       // Flat/unit number (optional)
  
  // Display names
  emirateName: string;
  regionName: string;
  areaName: string;
}
```

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────┐
│           AddressPicker Component                    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  1. Emirate Dropdown                       │    │
│  │     - Load from /api/db/emirates           │    │
│  └──────────────┬─────────────────────────────┘    │
│                 │                                    │
│                 ▼                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  2. Region Dropdown                        │    │
│  │     - Load from /api/db/regions            │    │
│  │     - Filter by selected emirate           │    │
│  └──────────────┬─────────────────────────────┘    │
│                 │                                    │
│                 ▼                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  3. Area Dropdown                          │    │
│  │     - Load from /api/db/areas              │    │
│  │     - Filter by selected region            │    │
│  └──────────────┬─────────────────────────────┘    │
│                 │                                    │
│                 ▼                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  4. Optional Fields                        │    │
│  │     - Plot number                          │    │
│  │     - Building number                      │    │
│  │     - Flat/unit number                     │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
User selects Emirate
       ↓
Fetch Regions for Emirate
       ↓
User selects Region
       ↓
Fetch Areas for Region
       ↓
User selects Area
       ↓
User enters Plot/Building/Flat (optional)
       ↓
onChange fires with complete AddressValue
```

## API Routes

### Get Emirates

```typescript
// GET /api/db/emirates
// Returns all emirates

Response: {
  emirates: [
    { id: '1', nameEn: 'Abu Dhabi', nameAr: 'أبوظبي' },
    { id: '2', nameEn: 'Dubai', nameAr: 'دبي' },
    // ...
  ]
}
```

### Get Regions

```typescript
// GET /api/db/regions?emirateId=1
// Returns regions for specific emirate

Response: {
  regions: [
    { id: '101', nameEn: 'Al Ain', nameAr: 'العين', emirateId: '1' },
    // ...
  ]
}
```

### Get Areas

```typescript
// GET /api/db/areas?regionId=101
// Returns areas for specific region

Response: {
  areas: [
    { id: '1001', nameEn: 'Al Jimi', nameAr: 'الجيمي', regionId: '101' },
    // ...
  ]
}
```

## Implementation

### Component Code

```typescript
// app/components/forms/AddressPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AddressValue {
  emirate: string;
  region: string;
  area: string;
  plot?: string;
  building?: string;
  flatNumber?: string;
  emirateName: string;
  regionName: string;
  areaName: string;
}

interface AddressPickerProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  lang?: 'en' | 'ar';
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function AddressPicker({
  value,
  onChange,
  lang = 'en',
  required = false,
  disabled = false,
  error,
}: AddressPickerProps) {
  const [emirates, setEmirates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState({ emirates: false, regions: false, areas: false });

  // Load emirates on mount
  useEffect(() => {
    loadEmirates();
  }, []);

  // Load regions when emirate changes
  useEffect(() => {
    if (value?.emirate) {
      loadRegions(value.emirate);
    }
  }, [value?.emirate]);

  // Load areas when region changes
  useEffect(() => {
    if (value?.region) {
      loadAreas(value.region);
    }
  }, [value?.region]);

  async function loadEmirates() {
    setLoading(prev => ({ ...prev, emirates: true }));
    try {
      const res = await fetch('/api/db/emirates');
      const data = await res.json();
      setEmirates(data.emirates || []);
    } catch (error) {
      console.error('Failed to load emirates:', error);
    } finally {
      setLoading(prev => ({ ...prev, emirates: false }));
    }
  }

  async function loadRegions(emirateId: string) {
    setLoading(prev => ({ ...prev, regions: true }));
    setRegions([]);
    setAreas([]);
    try {
      const res = await fetch(`/api/db/regions?emirateId=${emirateId}`);
      const data = await res.json();
      setRegions(data.regions || []);
    } catch (error) {
      console.error('Failed to load regions:', error);
    } finally {
      setLoading(prev => ({ ...prev, regions: false }));
    }
  }

  async function loadAreas(regionId: string) {
    setLoading(prev => ({ ...prev, areas: true }));
    setAreas([]);
    try {
      const res = await fetch(`/api/db/areas?regionId=${regionId}`);
      const data = await res.json();
      setAreas(data.areas || []);
    } catch (error) {
      console.error('Failed to load areas:', error);
    } finally {
      setLoading(prev => ({ ...prev, areas: false }));
    }
  }

  const handleEmirateChange = (emirateId: string) => {
    const emirate = emirates.find(e => e.id === emirateId);
    onChange({
      emirate: emirateId,
      emirateName: lang === 'ar' ? emirate?.nameAr : emirate?.nameEn,
      region: '',
      regionName: '',
      area: '',
      areaName: '',
    });
  };

  const handleRegionChange = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    onChange({
      ...value!,
      region: regionId,
      regionName: lang === 'ar' ? region?.nameAr : region?.nameEn,
      area: '',
      areaName: '',
    });
  };

  const handleAreaChange = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    onChange({
      ...value!,
      area: areaId,
      areaName: lang === 'ar' ? area?.nameAr : area?.nameEn,
    });
  };

  return (
    <div className="space-y-4">
      {/* Emirate */}
      <div>
        <Label>{lang === 'ar' ? 'الإمارة' : 'Emirate'} {required && '*'}</Label>
        <Select
          value={value?.emirate || ''}
          onValueChange={handleEmirateChange}
          disabled={disabled || loading.emirates}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang === 'ar' ? 'اختر الإمارة' : 'Select Emirate'} />
          </SelectTrigger>
          <SelectContent>
            {emirates.map((emirate) => (
              <SelectItem key={emirate.id} value={emirate.id}>
                {lang === 'ar' ? emirate.nameAr : emirate.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region */}
      {value?.emirate && (
        <div>
          <Label>{lang === 'ar' ? 'المنطقة' : 'Region'} {required && '*'}</Label>
          <Select
            value={value?.region || ''}
            onValueChange={handleRegionChange}
            disabled={disabled || loading.regions || regions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={lang === 'ar' ? 'اختر المنطقة' : 'Select Region'} />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {lang === 'ar' ? region.nameAr : region.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Area */}
      {value?.region && (
        <div>
          <Label>{lang === 'ar' ? 'المنطقة' : 'Area'} {required && '*'}</Label>
          <Select
            value={value?.area || ''}
            onValueChange={handleAreaChange}
            disabled={disabled || loading.areas || areas.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={lang === 'ar' ? 'اختر المنطقة' : 'Select Area'} />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {lang === 'ar' ? area.nameAr : area.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Optional Fields */}
      {value?.area && (
        <>
          <div>
            <Label>{lang === 'ar' ? 'رقم القطعة' : 'Plot Number'}</Label>
            <Input
              value={value?.plot || ''}
              onChange={(e) => onChange({ ...value, plot: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div>
            <Label>{lang === 'ar' ? 'رقم المبنى' : 'Building Number'}</Label>
            <Input
              value={value?.building || ''}
              onChange={(e) => onChange({ ...value, building: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div>
            <Label>{lang === 'ar' ? 'رقم الشقة' : 'Flat Number'}</Label>
            <Input
              value={value?.flatNumber || ''}
              onChange={(e) => onChange({ ...value, flatNumber: e.target.value })}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

## Database Schema

### Emirates Table

```sql
CREATE TABLE Emirates (
  id INT PRIMARY KEY IDENTITY,
  nameEn NVARCHAR(100) NOT NULL,
  nameAr NVARCHAR(100) NOT NULL,
  code NVARCHAR(10)
);
```

### Regions Table

```sql
CREATE TABLE Regions (
  id INT PRIMARY KEY IDENTITY,
  emirateId INT NOT NULL,
  nameEn NVARCHAR(100) NOT NULL,
  nameAr NVARCHAR(100) NOT NULL,
  FOREIGN KEY (emirateId) REFERENCES Emirates(id)
);
```

### Areas Table

```sql
CREATE TABLE Areas (
  id INT PRIMARY KEY IDENTITY,
  regionId INT NOT NULL,
  nameEn NVARCHAR(100) NOT NULL,
  nameAr NVARCHAR(100) NOT NULL,
  FOREIGN KEY (regionId) REFERENCES Regions(id)
);
```

## Integration with Student Update

```typescript
// app/child/[id]/update-info/page.tsx
'use client';

import AddressPicker from '@/app/components/forms/AddressPicker';

export default function UpdateInfoPage() {
  const [address, setAddress] = useState<AddressValue | null>(null);

  async function handleSubmit() {
    // Submit to IDH API
    const payload = {
      studentId: student.id,
      emiratesId: student.emiratesId,
      address: {
        emirate: address.emirate,
        region: address.region,
        area: address.area,
        plot: address.plot,
        building: address.building,
        flatNumber: address.flatNumber,
      },
    };

    const response = await fetch('/api/parent/update-information-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <AddressPicker
        value={address}
        onChange={setAddress}
        lang={i18n.lang}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Troubleshooting

### Dropdowns Not Loading

**Problem**: Dropdowns are empty  
**Solution**: Check API routes return correct format:
```typescript
{ emirates: [...] }  // not just [...]
```

### Regions Not Filtered

**Problem**: All regions show for all emirates  
**Solution**: Ensure API route filters by emirateId:
```typescript
WHERE emirateId = @emirateId
```

### Arabic Names Not Showing

**Problem**: Only English names display  
**Solution**: Pass correct `lang` prop and ensure DB has Arabic names

## Related Documentation

- [Child Actions](CHILD_ACTIONS.md) - Student update info flow
- [Architecture](../core/ARCHITECTURE.md) - Database structure
