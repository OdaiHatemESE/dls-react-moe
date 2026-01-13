# My Applications Page (/parent/applications)

**Route**: `/parent/applications`  
**File**: `app/parent/applications/page.tsx`  
**Access**: Protected (requires authentication & Emirates ID)

## 📋 Business Purpose

Provides parents with:
- Overview of all student application submissions
- Application status tracking
- Statistics dashboard (total, in-progress, accepted)
- Resubmission workflow for returned applications
- Link to student profiles

## 🔌 API Endpoints Used

### 1. GET /api/PP/ChildList/:eid
- **Purpose**: Get list of children to extract source IDs
- **Used**: To get student IDs for application lookup

### 2. POST /api/PP/myapplications
- **Purpose**: Fetch applications for multiple students
- **Request Body**:
  ```typescript
  { sourceIds: string[] }
  ```
- **Response**:
  ```typescript
  {
    data: [{
      id: number,
      source_ID: string,           // Student sourcedId
      studentNumber: string,
      primaryPhone: string,
      otherPhone: string,
      transportationType: string,
      emirate: string,
      area: string,
      street: string,
      status_ID: number,           // 1-5
      returnComment: string | null,
      datetime: string,
      m95_Lookups: {              // Status metadata
        description: string
      }
    }]
  }
  ```

## 📊 Application Status Codes

| Status ID | Arabic | English | Badge Style |
|-----------|--------|---------|-------------|
| 1 | قيد الإجراء | In Progress | Orange |
| 2 | مرتجع | Returned | Destructive |
| 3 | تم التعديل | Modified | Secondary |
| 4 | تمت الموافقة | Accepted | Green |
| 5 | مرفوض | Rejected | Outline |

## ✅ Validation & Checks

1. **Children Extraction**: Maps children to get source IDs
2. **Application Mapping**: Creates Map<source_ID, Application> for quick lookup
3. **Filter Logic**: Only shows children WITH applications
   ```typescript
   .filter(({ application }) => application !== null)
   ```

## 🎨 Key Components

### Statistics Cards
- **Total Applications**: Blue gradient
- **In Progress** (status_ID = 1): Green gradient
- **Accepted** (status_ID = 4): Emerald gradient

### Applications Table
Columns:
1. ID
2. Student Name (with avatar)
3. Student Number
4. Status (badge)
5. Comment
6. Date
7. Action Button

### Action Buttons
- **Status = 2 (Returned)**: "Resubmit" → `/child/:id/update-info?mode=resubmit`
- **Status = 1 or 4**: "View Profile" → `/child/:id`

## 🔄 State Management

Uses SWR for both API calls:
```typescript
const { data: childrenData } = useSWR(childrenKey, jsonFetcher);
const { data: applicationsData } = useSWR(
  sourceIds.length > 0 ? ['/api/PP/myapplications', sourceIds] : null,
  fetcher
);
```

## 🌐 Internationalization

- Table headers localized
- Status text in Arabic/English
- Date formatting per locale
- RTL support

## 🎯 Key Features

- Multi-student application tracking
- Visual status indicators
- Resubmission workflow
- Statistics dashboard
- Responsive table
- Empty state handling
- Loading states
