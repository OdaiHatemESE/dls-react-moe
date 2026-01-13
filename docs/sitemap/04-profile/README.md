# Profile Page (/profile)

**Route**: `/profile`  
**File**: `app/profile/page.tsx`  
**Access**: Protected (requires authentication)

## 📋 Business Purpose

Displays the parent's personal profile information including:
- Personal details (names in Arabic and English)
- Contact information (email, phone)
- Address information
- Account status
- Emirates ID

**Special Behavior**: If no Emirates ID is found, shows a warning message prompting user to update UAE Pass information.

## 🔌 API Endpoints Used

### GET /api/PP/persons?eid=:eid
- **Purpose**: Fetch parent/person details
- **Auth**: Required
- **Response**: Person object with metadata (contacts, addresses)
- **Data Structure**:
  ```typescript
  {
    persons: [{
      id: string,
      identifier: string,        // Emirates ID
      givenName: string,
      middleName: string,
      familyName: string,
      username: string,
      status: 'active',
      metadata: {
        englishFirstName: string,
        englishFamilyName: string,
        birthDate: string,
        gender: string,
        nationality: string,
        maritalStatus: string,
        contacts: [{
          contactType: string,
          value: string,
          isPrimary: boolean
        }],
        addresses: [{
          addressLine1: string,
          addressLine2: string,
          city: string,
          state: string,
          country: string,
          zipCode: string,
          isPrimary: boolean
        }]
      }
    }]
  }
  ```

## ✅ Validation & Checks

1. **Emirates ID Check**:
   - If missing: Shows warning card
   - If present: Shows full profile

2. **Primary Contact Extraction**:
   - Looks for `isPrimary: true` flag
   - Falls back to first email/phone found

3. **Name Display Logic**:
   - Arabic: Uses givenName, middleName, familyName
   - English: Uses englishFirstName through englishFamilyName
   - Filters out null/empty values

## 🎨 Key Components

- **Loading Skeleton**: Full-page loading state
- **Warning Card**: Emirates ID missing alert (with UAE Pass link)
- **Hero Section**: Profile header with avatar
- **Contact Info Card**: Email and phone display
- **Personal Details Card**: Name, birthdate, gender, nationality
- **Address Card**: Primary address with full details

## 🔗 Related Pages

- **Dashboard**: Back navigation
- **UAE Pass**: External link to update Emirates ID

## 🎯 Key Features

- Bilingual display (Arabic/English)
- RTL support for Arabic
- Responsive design (mobile-first)
- Loading and error states
- Emirates ID validation
- Primary contact/address highlighting
