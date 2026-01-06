'use client';

import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';

import { useI18n } from '@/app/i18n/I18nProvider';
import { jsonFetcher } from '@/lib/swr';
import { useToastNotifications } from '@/lib/hooks/use-toast-notifications';
import type { StudentAddress, StudentProfileV1 } from '@/app/types/studentprofile';
import type { IDHInsertResponse, IDHStudent, IDHApiResponse } from '@/app/types/idh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { ChildActionResponse } from '@/types/child-actions';


import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { AddressPicker } from '@/app/components/forms/AddressPicker';
import type { AddressPickerProps } from '@/app/components/forms/AddressPicker';

function formatAddress(address?: StudentAddress | null): string {
  if (!address) return '';
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.plotNumber,
    address.roadNumber,
    address.sector,
    address.city,
    address.state,
    address.country,
    address.poBox ? `PO Box ${address.poBox}` : null,
    address.zipCode,
  ];
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : part))
    .filter((part) => part && String(part).length > 0)
    .join(', ');
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_LIMIT_LABEL = '5 MB';
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf'];

// Helper: validates UAE mobile number format
function validateUAEMobile(phone: string): { isValid: boolean; error?: string } {
  const cleaned = phone.trim();
  
  // Empty is allowed for non-primary numbers
  if (!cleaned) {
    return { isValid: true };
  }
  
  // Remove spaces, dashes, and parentheses for validation
  const digitsOnly = cleaned.replace(/[\s\-()]/g, '');
  
  // Check if contains only digits and optional leading +
  if (!/^\+?\d+$/.test(digitsOnly)) {
    return { 
      isValid: false, 
      error: 'Phone number must contain only digits (and optional + prefix)'
    };
  }
  
  // Remove + for further validation
  const numbers = digitsOnly.replace(/^\+/, '');
  
  // UAE mobile formats:
  // 1. Local format: 05XXXXXXXX (10 digits starting with 05)
  // 2. International: 9715XXXXXXXX (12 digits starting with 971)
  
  if (numbers.startsWith('05')) {
    // Local UAE format: must be exactly 10 digits
    if (numbers.length !== 10) {
      return { 
        isValid: false, 
        error: 'UAE mobile number starting with 05 must be exactly 10 digits (05XXXXXXXX)'
      };
    }
    return { isValid: true };
  } else if (numbers.startsWith('971')) {
    // International format: must be exactly 12 digits
    if (numbers.length !== 12) {
      return { 
        isValid: false, 
        error: 'UAE mobile number with country code must be exactly 12 digits (9715XXXXXXXX)'
      };
    }
    // Check that after 971 comes 5 (mobile prefix)
    if (!numbers.startsWith('9715')) {
      return { 
        isValid: false, 
        error: 'UAE mobile number must start with 9715 when using country code'
      };
    }
    return { isValid: true };
  } else {
    return { 
      isValid: false, 
      error: 'UAE mobile number must start with 05 (local) or 9715 (international)'
    };
  }
}

// Helper: validates and returns Base64 for attachment based on repo rules
async function validateAndEncodeAttachment(file: File | null, locale: string): Promise<string> {
  if (!file) return '';
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    throw new Error(locale === 'ar' ? 'يجب أن يكون المستند بصيغة PDF.' : 'Attachment must be a PDF file.');
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      locale === 'ar'
        ? `حجم الملف المرفق كبير جداً. الحد الأقصى المسموح هو ${ATTACHMENT_LIMIT_LABEL}.`
        : `Attachment is too large. Maximum allowed size is ${ATTACHMENT_LIMIT_LABEL}.`
    );
  }
  return fileToBase64(file);
}

function textOrNull(value?: string | null): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function numberToString(value?: number | null): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
}

function formatCoordinate(value?: number | null): string | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(6)
    : null;
}

function formatBytes(value?: number | null): string {
  if (!value || !Number.isFinite(value)) return '';
  const absolute = Math.abs(value);
  if (absolute < 1024) return `${absolute} B`;
  const units = ['KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = absolute / 1024;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

// Estimate original bytes from a Base64 string
function estimateBytesFromBase64(b64?: string | null): number {
  if (!b64) return 0;
  const str = b64.trim();
  if (!str) return 0;
  const padding = str.endsWith('==') ? 2 : str.endsWith('=') ? 1 : 0;
  return Math.floor((str.length * 3) / 4) - padding;
}

// Convert Base64 string to a PDF Blob
function base64ToBlob(base64: string, contentType = 'application/pdf'): Blob {
  const cleaned = base64.replace(/^data:[^;]+;base64,/, '');
  const byteChars = atob(cleaned);
  const byteNumbers = new Array<number>(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

function localizedName(
  locale: string,
  english?: string | null,
  arabic?: string | null,
): string | null {
  const preferred = locale === 'ar' ? arabic ?? english : english ?? arabic;
  return textOrNull(preferred);
}

// Normalize a free-text transportation value from IDH into our select model
function normalizeTransportation(raw?: string | null): { value: 'Bus' | 'Car' | 'On Foot' } {
  const t = (raw ?? '').trim();
  if (!t) return { value: 'On Foot' };
  const l = t.toLowerCase();
  const isCar = l === 'car' || l === 'private car' || l === 'private' || l === 'بالسيارة';
  const isBus = l === 'bus' || l === 'school bus' || l === 'schoolbus' || l === 'بواسطة الحافلة';
  const isOnFoot = l === 'on foot' || l === 'walking' || l === 'walk' || l === 'سيراً على الأقدام' || l === 'سيرا على الاقدام';
  if (isCar) return { value: 'Car' };
  if (isBus) return { value: 'Bus' };
  if (isOnFoot) return { value: 'On Foot' };
  return { value: 'On Foot' };
}

function getDisplayName(profile: StudentProfileV1, locale: string): string {
  const arabic = [profile.firstNameArabic, profile.middleNameArabic, profile.lastNameArabic]
    .filter(Boolean)
    .join(' ');
  const english = [
    profile.firstNameEnglish,
    profile.middleNameEnglish,
    profile.thirdNameEnglish,
    profile.fourthNameEnglish,
    profile.familyNameEnglish,
  ]
    .filter(Boolean)
    .join(' ');
  const fallback = profile.id ?? '';
  return locale === 'ar'
    ? (arabic || english || fallback)
    : (english || arabic || fallback);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const commaIndex = result.indexOf(',');
        const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
        resolve(base64);
      } else {
        reject(new Error('Failed to read attachment'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read attachment'));
    reader.readAsDataURL(file);
  });
}
 

// Helper: submit payload to IDH and normalize error shape
async function submitToIDH(idhPayload: IDHStudent): Promise<void> {
  const response = await fetch('/api/backoffice/idh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(idhPayload),
  });

  let result: IDHInsertResponse | null = null;
  try {
    result = await response.json();
  } catch {
    // Some upstream errors return empty bodies; ignore parse issues here.
  }

  if (!response.ok || !(result?.ok)) {
    const upstreamError = result?.error;
    const message = typeof upstreamError === 'string'
      ? upstreamError
      : upstreamError && typeof upstreamError === 'object'
        ? JSON.stringify(upstreamError)
        : response.statusText || 'IDH submission failed';
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
}

type AddressValue = NonNullable<AddressPickerProps['value']> & {
  emirateName?: string | null;
  areaName?: string | null;
  communityName?: string | null;
};
type Mode = 'init' | 'edit';

type PreparedPayload = {
  studentId: string;
  mode: Mode;
  contactNumbers: string[];
  addressChanged: boolean;
  newAddress?: AddressValue | null;
  documentName?: string | null;
  transportation: string;
};

type EligibleChild = {
  profile: StudentProfileV1;
  idhStatusId: number | null;
  educationType: string | null;
};

type StudentProfileWithMeta = StudentProfileV1 & {
  meta?: {
    cache?: {
      source?: 'cache' | 'upstream';
      lastUpdated?: string | null;
    };
    [key: string]: unknown;
  };
};

export default function UpdateStudentInfoPage() {
  const { t, locale } = useI18n();
  const toast = useToastNotifications();
  const { data: sessionData } = useSession();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sourcedId = params.id as string | undefined;
  const modeParam = searchParams.get('mode');
  // Mode resolution: 'init' for first-time submission, 'edit' for resubmission
  const mode: Mode = modeParam === 'resubmit' ? 'edit' : 'init';

  // ========== MODE-SPECIFIC DATA FETCHING ==========
  // Student data is always needed (for display name, enrollment, etc.)
  const studentSwrKey = sourcedId ? `/api/PP/student/${encodeURIComponent(sourcedId)}` : null;
  const { data: student, error: studentError, isLoading: studentLoading } = useSWR<StudentProfileV1>(studentSwrKey, jsonFetcher);

  // EDIT MODE: Also fetch previously submitted IDH data for prefilling
  const idhSwrKey = mode === 'edit' && sourcedId
    ? `/api/backoffice/idh?sourceId=${encodeURIComponent(sourcedId)}`
    : null;
  const { data: idhResp, error: idhError, isLoading: idhLoading } = useSWR<IDHApiResponse>(idhSwrKey, jsonFetcher);

  // Resolve loading and error states based on mode
  const error = studentError;
  const isLoading = mode === 'edit' ? (studentLoading || idhLoading) : studentLoading;

  const meta = (student as StudentProfileWithMeta | undefined)?.meta;
  const primaryAddress = React.useMemo<StudentAddress | null>(() => {
    if (!student?.addresses || student.addresses.length === 0) return null;
    // Find address with isPrimary flag, fallback to first address
    const primary = student.addresses.find(addr => addr.isPrimary);
    const selected = primary ?? student.addresses[0];
    return selected;
  }, [student]);

  const formattedCurrentAddress = React.useMemo(() => formatAddress(primaryAddress), [primaryAddress]);
  // Format previously submitted address from IDH (edit mode only)
  const formattedPrevSubmittedAddress = React.useMemo(() => {
    const idh = idhResp?.data;
    if (!idh) return '';
    const parts = [
      textOrNull(idh.houseBuilding),
      textOrNull(idh.street),
      textOrNull(idh.plot),
      textOrNull(idh.mainPlot),
      textOrNull(idh.premises),
      textOrNull(idh.area),
      textOrNull(idh.zone),
      textOrNull(idh.region),
      textOrNull(idh.emirate),
    ].filter(Boolean) as string[];
    return parts.join(', ');
  }, [idhResp]);

  const [contactNumbers, setContactNumbers] = React.useState<string[]>(['']);
  const contactsInitialized = React.useRef(false);
  const [addressChanged, setAddressChanged] = React.useState<boolean>(false);
  const [newAddress, setNewAddress] = React.useState<AddressValue | null>(null);
  const [supportingDocument, setSupportingDocument] = React.useState<File | null>(null);
  const [transportation, setTransportation] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [addressSaveState, setAddressSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const addressSignatureRef = React.useRef<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState<boolean>(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const firstErrorRef = React.useRef<HTMLDivElement>(null);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState<boolean>(false);
  const [preparedPayload, setPreparedPayload] = React.useState<PreparedPayload | null>(null);
  const [idhAttachmentUrl, setIdhAttachmentUrl] = React.useState<string | null>(null);
  const [eligibleChildren, setEligibleChildren] = React.useState<EligibleChild[]>([]);
  const [selectedChildIds, setSelectedChildIds] = React.useState<string[]>([]);
  const [applyToAllChildren, setApplyToAllChildren] = React.useState<boolean>(false);
  const [isFetchingChildren, setIsFetchingChildren] = React.useState<boolean>(false);
  const [childFetchError, setChildFetchError] = React.useState<string | null>(null);
  const idhAttachmentSize = React.useMemo(() => estimateBytesFromBase64(idhResp?.data?.attachment01 ?? null), [idhResp]);
  const eligibleChildIds = React.useMemo(
    () =>
      eligibleChildren
        .map((entry) => entry.profile.id)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
    [eligibleChildren]
  );

  // ========== INIT MODE: Initialize form from OneRoster data ==========
  React.useEffect(() => {
    if (mode !== 'init') return;
    if (!student || contactsInitialized.current) return;
    
    const mobileContacts = (student.contacts || [])
      .filter((contact) => contact.type === 'Mobile' && contact.value)
      .sort((a, b) => {
        // Sort by isPrimary flag: primary contacts first
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      })
      .map((contact) => contact.value.trim())
      .filter(Boolean);

    if (mobileContacts.length > 0) {
      setContactNumbers(mobileContacts.slice(0, 2));
    } else {
      setContactNumbers(['']);
    }
    contactsInitialized.current = true;
  }, [student, mode]);

  // ========== EDIT MODE: Initialize form from IDH data ==========
  React.useEffect(() => {
    if (mode !== 'edit') return;
    
    const idh = idhResp?.data;
    if (!idh) return;

    // Prefill contact numbers
    const primary = (idh.primaryPhone ?? '').trim();
    const other = (idh.otherPhone ?? '').trim();
    const numbers: string[] = [];
    if (primary) numbers.push(primary);
    if (other) numbers.push(other);
    setContactNumbers(numbers.length > 0 ? numbers.slice(0, 2) : ['']);

    // Prefill transportation
    const { value } = normalizeTransportation(idh.transportationType);
    setTransportation(value);
  }, [mode, idhResp]);

  // ========== Track unsaved changes (mode-specific baseline) ==========
  React.useEffect(() => {
    let initialContacts: string[] = [];
    let initialTransportation = '';
    
    if (mode === 'edit') {
      // EDIT MODE: baseline from IDH data
      const idh = idhResp?.data;
      const primary = (idh?.primaryPhone ?? '').trim();
      const other = (idh?.otherPhone ?? '').trim();
      if (primary) initialContacts.push(primary);
      if (other) initialContacts.push(other);
      initialTransportation = (idh?.transportationType ?? '').trim();
    } else {
      // INIT MODE: baseline from OneRoster data
      initialContacts = (student?.contacts || [])
        .filter((contact) => contact.type === 'Mobile' && contact.value)
        .sort((a, b) => {
          // Sort by isPrimary flag: primary contacts first
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return 0;
        })
        .map((contact) => contact.value.trim())
        .slice(0, 2);
      initialTransportation = '';
    }

    const baseline = initialContacts.length > 0 ? initialContacts : [''];
    const contactsChanged = JSON.stringify(contactNumbers) !== JSON.stringify(baseline);
    const transportationChanged = transportation !== initialTransportation;
    const hasChanges = contactsChanged || addressChanged || transportationChanged;
    setHasUnsavedChanges(hasChanges);
  }, [contactNumbers, addressChanged, transportation, student, mode, idhResp]);

  // Warn before leaving with unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  // Scroll to first error on validation failure
  React.useEffect(() => {
    if (errorMessage && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorRef.current.focus();
    }
  }, [errorMessage]);

  React.useEffect(() => {
    if (!addressChanged) {
      setNewAddress(null);
      setSupportingDocument(null);
    }
  }, [addressChanged]);

  React.useEffect(() => {
    if (!showConfirmDialog) {
      setApplyToAllChildren(false);
      setSelectedChildIds([]);
      setEligibleChildren([]);
      setChildFetchError(null);
      setIsFetchingChildren(false);
    }
  }, [showConfirmDialog]);

  React.useEffect(() => {
    setSelectedChildIds((prev) => {
      if (prev.length === 0) return prev;
      const valid = prev.filter((id) => eligibleChildIds.includes(id));
      return valid.length === prev.length ? prev : valid;
    });
  }, [eligibleChildIds]);

  // ========== Build PDF attachment URL (EDIT MODE only) ==========
  React.useEffect(() => {
    if (mode !== 'edit') return;
    
    let url: string | null = null;
    try {
      const b64 = (idhResp?.data?.attachment01 ?? '').trim();
      if (b64) {
        const blob = base64ToBlob(b64, 'application/pdf');
        url = URL.createObjectURL(blob);
        setIdhAttachmentUrl(url);
      } else {
        setIdhAttachmentUrl(null);
      }
    } catch {
      setIdhAttachmentUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [mode, idhResp?.data?.attachment01]);

  React.useEffect(() => {
    if (!addressChanged) {
      setAddressSaveState('idle');
      addressSignatureRef.current = null;
      return;
    }

    if (!newAddress || !newAddress.emirateId || !newAddress.areaId) {
      setAddressSaveState('idle');
      return;
    }

    const hasPlot = typeof newAddress.plotId === 'number' && Number.isFinite(newAddress.plotId);
    const hasStreetDetails = Boolean((newAddress.streetName ?? '').trim() && (newAddress.houseNumber ?? '').trim());

    if (!hasPlot && !hasStreetDetails) {
      setAddressSaveState('idle');
      return;
    }

    const signature = JSON.stringify(newAddress);
    if (signature === addressSignatureRef.current) {
      setAddressSaveState('saved');
      return;
    }

    let cancelled = false;
    setAddressSaveState('saving');

    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (cancelled) return;
        addressSignatureRef.current = signature;
        setAddressSaveState('saved');
      } catch (autoSaveError) {
        console.error('Auto-save address failed:', autoSaveError);
        if (cancelled) return;
        setAddressSaveState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addressChanged, newAddress]);

  const updateInfo = t?.child?.updateInfo;
  const summaryFields = updateInfo?.addressSection?.summaryFields;
  const summaryPlaceholder = updateInfo?.addressSection?.summaryPending;

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Debug Info:', {
      't exists': !!t,
      'locale': locale,
      'updateInfo exists': !!updateInfo,
      'updateInfo type': typeof updateInfo,
      'summaryFields exists': !!summaryFields,
    });
  }, [t, locale, updateInfo, summaryFields]);

  const summaryRows = React.useMemo(() => {
    if (!newAddress) return [] as Array<{ key: string; label: string; value: string | null }>;

    return [
      {
        key: 'houseNumber',
        label: summaryFields.houseNumber,
        value: textOrNull(newAddress.houseNumber),
      },
      {
        key: 'streetName',
        label: summaryFields.streetName,
        value: textOrNull(newAddress.streetName),
      },
      {
        key: 'plotNumber',
        label: summaryFields.plotNumber,
        value: numberToString(newAddress.plotId),
      },
      {
        key: 'mainPlotId',
        label: summaryFields.mainPlot,
        value: textOrNull(newAddress.mainPlotId),
      },
      {
        key: 'premisesPlotId',
        label: summaryFields.premises,
        value: textOrNull(newAddress.premisesPlotId),
      },
      {
        key: 'latitude',
        label: summaryFields.latitude,
        value: formatCoordinate(newAddress.latitude),
      },
      {
        key: 'longitude',
        label: summaryFields.longitude,
        value: formatCoordinate(newAddress.longitude),
      },
      {
        key: 'areaName',
        label: summaryFields.areaName,
        value: localizedName(locale, newAddress.areaNameEn, newAddress.areaNameAr),
      },
      {
        key: 'zoneName',
        label: summaryFields.zoneName,
        value: localizedName(locale, newAddress.zoneNameEn, newAddress.zoneNameAr),
      },
      {
        key: 'regionName',
        label: summaryFields.regionName,
        value: localizedName(locale, newAddress.regionNameEn, newAddress.regionNameAr),
      },
      {
        key: 'emirateName',
        label: summaryFields.emirateName,
        value: localizedName(locale, newAddress.emirateNameEn, newAddress.emirateNameAr),
      },
    ];
  }, [newAddress, summaryFields, locale]);

  const badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' =
    addressSaveState === 'saved'
      ? 'default'
      : addressSaveState === 'saving'
        ? 'secondary'
        : addressSaveState === 'error'
          ? 'destructive'
          : 'outline';

  const badgeLabel =
    addressSaveState === 'saving'
      ? updateInfo.addressSection.badge.saving
      : addressSaveState === 'saved'
        ? updateInfo.addressSection.badge.saved
        : addressSaveState === 'error'
          ? updateInfo.addressSection.badge.error
          : updateInfo.addressSection.badge.idle;

  const handleContactChange = (index: number, value: string) => {
    setContactNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const getContactNumberError = (number: string, index: number): string | null => {
    if (!number.trim()) return null;
    const validation = validateUAEMobile(number);
    if (!validation.isValid) {
      return locale === 'ar'
        ? 'يجب أن يبدأ الرقم بـ 05 (10 أرقام) أو 9715 (12 رقم)'
        : validation.error || 'Invalid format';
    }
    return null;
  };

  const handleAddContact = () => {
    setContactNumbers((prev) => (prev.length < 2 ? [...prev, ''] : prev));
  };

  const handleRemoveContact = (index: number) => {
    setContactNumbers((prev) => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (file) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        setErrorMessage(
          locale === 'ar'
            ? 'يجب أن يكون المستند بصيغة PDF.'
            : 'Attachment must be a PDF file.'
        );
        event.target.value = '';
        setSupportingDocument(null);
        return;
      }

      if (file.size > MAX_ATTACHMENT_BYTES) {
        setErrorMessage(
          locale === 'ar'
            ? `حجم الملف المرفق كبير جداً. الحد الأقصى المسموح هو ${ATTACHMENT_LIMIT_LABEL}.`
            : `Attachment is too large. Maximum allowed size is ${ATTACHMENT_LIMIT_LABEL}.`
        );
        event.target.value = '';
        setSupportingDocument(null);
        return;
      }

    }

    setSupportingDocument(file);
  };

  // ========== Compute confirmation address (mode-specific fallback) ==========
  const confirmAddress = React.useMemo(() => {
    type FlatAddress = {
      emirate: string; area: string; street: string; houseBuilding: string; region: string; zone: string; plot: string; mainPlot: string; premises: string; latitude: string; longitude: string;
    };
    const empty: FlatAddress = { emirate: '', area: '', street: '', houseBuilding: '', region: '', zone: '', plot: '', mainPlot: '', premises: '', latitude: '', longitude: '' };

    // If user changed address, use the new one
    if (preparedPayload?.addressChanged && preparedPayload.newAddress) {
      const next = preparedPayload.newAddress;
      return {
        source: 'new' as const,
        data: {
          emirate: textOrNull(next.emirateNameEn) ?? textOrNull(next.emirateName) ?? '',
          area: textOrNull(next.areaNameEn) ?? textOrNull(next.areaName) ?? '',
          street: textOrNull(next.fullAddressEn) ?? textOrNull(next.fullAddressAr) ?? textOrNull(next.streetName) ?? '',
          houseBuilding: textOrNull(next.houseNumber) ?? '',
          region: textOrNull(next.municipalityNameEn) ?? '',
          zone: textOrNull(next.regionNameEn) ?? '',
          plot: numberToString(next.plotId) ?? '',
          mainPlot: textOrNull(next.mainPlotId) ?? '',
          premises: textOrNull(next.premisesPlotId) ?? textOrNull(next.communityName) ?? '',
          latitude: formatCoordinate(next.latitude) ?? '',
          longitude: formatCoordinate(next.longitude) ?? '',
        } satisfies FlatAddress,
      };
    }

    // EDIT MODE: fallback to previously submitted IDH address
    if (mode === 'edit' && idhResp?.data) {
      const prev = idhResp.data;
      return {
        source: 'idh' as const,
        data: {
          emirate: textOrNull(prev.emirate) ?? '',
          area: textOrNull(prev.area) ?? '',
          street: textOrNull(prev.street) ?? '',
          houseBuilding: textOrNull(prev.houseBuilding) ?? '',
          region: textOrNull(prev.region) ?? '',
          zone: textOrNull(prev.zone) ?? '',
          plot: textOrNull(prev.plot) ?? '',
          mainPlot: textOrNull(prev.mainPlot) ?? '',
          premises: textOrNull(prev.premises) ?? '',
          latitude: textOrNull(prev.latitude) ?? '',
          longitude: textOrNull(prev.longitude) ?? '',
        } satisfies FlatAddress,
      };
    }

    // INIT MODE: fallback to OneRoster address
    if (primaryAddress) {
      return {
        source: 'oneroster' as const,
        data: {
          emirate: textOrNull(primaryAddress.state) ?? '',
          area: textOrNull(primaryAddress.city) ?? '',
          street: textOrNull(primaryAddress.addressLine1) ?? '',
          houseBuilding: textOrNull(primaryAddress.addressLine2) ?? '',
          region: textOrNull(primaryAddress.region) ?? '',
          zone: textOrNull(primaryAddress.sector) ?? '',
          plot: textOrNull(primaryAddress.plotNumber) ?? '',
          mainPlot: textOrNull(primaryAddress.plotId) ?? '',
          premises: textOrNull(primaryAddress.addressLine3) ?? '',
          latitude: '',
          longitude: '',
        } satisfies FlatAddress,
      };
    }

    return { source: 'empty' as const, data: empty };
  }, [preparedPayload, mode, idhResp, primaryAddress]);

  const fetchEligibleChildren = React.useCallback(async (): Promise<EligibleChild[]> => {
    if (!sessionData?.user?.emiratesId || !sourcedId) {
      setEligibleChildren([]);
      setChildFetchError(null);
      return [];
    }

    setIsFetchingChildren(true);
    setChildFetchError(null);

    try {
      const parentEid = sessionData.user.emiratesId;
      const listResponse = await fetch(`/api/PP/ChildList/${encodeURIComponent(parentEid)}`);
      if (!listResponse.ok) {
        throw new Error('childlist request failed');
      }

      const raw = (await listResponse.json()) as { students?: StudentProfileV1[] } | StudentProfileV1[];
      const children = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.students)
          ? raw.students
          : [];

      const otherChildren = children.filter((child) => child.id && child.id !== sourcedId);
      if (otherChildren.length === 0) {
        setEligibleChildren([]);
        return [];
      }

      const eligibilityResults = await Promise.all(
        otherChildren.map(async (child) => {
          try {
            const params = new URLSearchParams({ studentPersonId: child.id });
            if (sessionData.user?.emiratesId) {
              params.set('parentPersonId', sessionData.user.emiratesId);
            }
            const actionsResponse = await fetch(`/api/parent/child-actions?${params.toString()}`);
            if (!actionsResponse.ok) {
              throw new Error('actions request failed');
            }
            const actionsData = (await actionsResponse.json()) as ChildActionResponse;
            const hasUpdateInfo = Array.isArray(actionsData.actions)
              ? actionsData.actions.some(
                  (action) => action.key === 'update-info' && !action.hidden && !action.disabled
                )
              : false;
            const statusEligible = actionsData.idhStatusId === null || actionsData.idhStatusId === 2 || actionsData.idhStatusId === 5;
            const educationType = actionsData.educationType ?? null;
            const notPrivate = (educationType ?? '').toLowerCase() !== 'private';
            const eligible = hasUpdateInfo && statusEligible && notPrivate;
            return {
              child,
              eligible,
              idhStatusId: actionsData.idhStatusId ?? null,
              educationType,
            };
          } catch {
            return { child, eligible: false, idhStatusId: null, educationType: null };
          }
        })
      );

      const eligibleList = eligibilityResults
        .filter((result) => result.eligible && result.child.id)
        .map<EligibleChild>((result) => ({
          profile: result.child,
          idhStatusId: result.idhStatusId,
          educationType: result.educationType,
        }));

      setEligibleChildren(eligibleList);
      return eligibleList;
    } catch (error) {
      const message =
        locale === 'ar'
          ? 'تعذر التحقق من الأطفال الآخرين حالياً. يمكنك متابعة الطلب لطفل واحد.'
          : 'Unable to check other children right now. You can continue with a single-child submission.';
      setChildFetchError(message);
      setEligibleChildren([]);
      return [];
    } finally {
      setIsFetchingChildren(false);
    }
  }, [locale, sessionData?.user?.emiratesId, sourcedId]);

  const handleChildSelectionChange = React.useCallback((childId: string, checked: boolean) => {
    setSelectedChildIds((prev) => {
      if (checked) {
        return prev.includes(childId) ? prev : [...prev, childId];
      }
      return prev.filter((id) => id !== childId);
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const sanitizedContacts = contactNumbers
      .map((number) => number.trim())
      .filter((value, index) => (index === 0 ? value.length > 0 : value.length > 0));

    if (!sanitizedContacts[0]) {
      setErrorMessage(updateInfo.validation.primaryContact);
      return;
    }

    // Validate primary contact number format
    const primaryValidation = validateUAEMobile(sanitizedContacts[0]);
    if (!primaryValidation.isValid) {
      setErrorMessage(
        locale === 'ar'
          ? `رقم الهاتف الأساسي غير صحيح: يجب أن يبدأ الرقم بـ 05 (10 أرقام) أو 9715 (12 رقم)`
          : `Invalid primary contact number: ${primaryValidation.error}`
      );
      return;
    }

    // Validate additional contact number if provided
    if (sanitizedContacts[1]) {
      const secondaryValidation = validateUAEMobile(sanitizedContacts[1]);
      if (!secondaryValidation.isValid) {
        setErrorMessage(
          locale === 'ar'
            ? `رقم الهاتف الإضافي غير صحيح: يجب أن يبدأ الرقم بـ 05 (10 أرقام) أو 9715 (12 رقم)`
            : `Invalid additional contact number: ${secondaryValidation.error}`
        );
        return;
      }
    }

    // Address validation: different rules for Abu Dhabi (map-based) vs other emirates (form-based)
    if (addressChanged) {
      if (!newAddress) {
        setErrorMessage(updateInfo.validation.addressDetails);
        return;
      }
      
      // Check if it's Abu Dhabi address (from map - has emirateName but might not have emirateId)
      const isAbuDhabi = newAddress.emirateNameEn && 
        (newAddress.emirateNameEn.toLowerCase().includes('abu dhabi') ||
         newAddress.emirateNameEn.toLowerCase().includes('al ain') ||
         newAddress.emirateNameEn.toLowerCase().includes('dhafra'));
      
      if (isAbuDhabi) {
        // Abu Dhabi: must have emirate name and coordinates (from map pin)
        if (!newAddress.emirateNameEn || 
            (newAddress.latitude === undefined || newAddress.latitude === null) ||
            (newAddress.longitude === undefined || newAddress.longitude === null)) {
          setErrorMessage(updateInfo.validation.addressDetails);
          return;
        }
      } else {
        // Dubai/Northern Emirates: must have emirateId and areaId
        if (newAddress.emirateId === undefined ||
            newAddress.emirateId === null ||
            newAddress.areaId === undefined ||
            newAddress.areaId === null) {
          setErrorMessage(updateInfo.validation.addressDetails);
          return;
        }
      }
    }

    if (addressChanged && !supportingDocument) {
      setErrorMessage(updateInfo.validation.document);
      return;
    }

    if (!transportation) {
      setErrorMessage(updateInfo.validation.transportation);
      return;
    }

    // Prepare payload and show confirmation dialog
    const payload: PreparedPayload = {
      studentId: sourcedId || '',
      mode,
      contactNumbers: sanitizedContacts.slice(0, 2),
      addressChanged,
      newAddress: addressChanged ? newAddress : null,
      documentName: supportingDocument ? supportingDocument.name : null,
      transportation: transportation,
    };

    setPreparedPayload(payload);
    setShowConfirmDialog(true);
    setApplyToAllChildren(false);
    setSelectedChildIds([]);
    setChildFetchError(null);
    setEligibleChildren([]);
  };

  const handleConfirmSubmit = async () => {
    if (!preparedPayload || !student) {
      setShowConfirmDialog(false);
      return;
    }

    const studentNumber = textOrNull(student.studentNumber);
    const primaryEnrollment = student.enrollment?.find((enrollment) => textOrNull(enrollment.schoolId));
    const schoolId = primaryEnrollment ? textOrNull(primaryEnrollment.schoolId) : null;
    const sourceId = textOrNull(preparedPayload.studentId) ?? textOrNull(student.id);
    const normalizedSourceId = sourceId ?? '';

    const missingFields: string[] = [];
    if (!studentNumber) missingFields.push(locale === 'ar' ? 'رقم الطالب' : 'student number');
    if (!schoolId) missingFields.push(locale === 'ar' ? 'كود المدرسة' : 'school ID');
    if (!sourceId) missingFields.push(locale === 'ar' ? 'معرّف الطالب' : 'student ID');

    if (missingFields.length > 0) {
      setShowConfirmDialog(false);
      const message = locale === 'ar'
        ? `يتعذر متابعة الطلب بسبب نقص البيانات التالية: ${missingFields.join('، ')}.`
        : `Cannot continue because the following data is missing: ${missingFields.join(', ')}.`;
      setErrorMessage(message);
      setPreparedPayload(null);
      return;
    }

    // ========== Resolve address based on mode ==========
    const resolvedAddress = (() => {
      // If user changed address, use new address
      if (preparedPayload.addressChanged && preparedPayload.newAddress) {
        const next = preparedPayload.newAddress;
        return {
          emirate: textOrNull(next.emirateNameEn) ?? textOrNull(next.emirateName) ?? '',
          area: textOrNull(next.areaNameEn) ?? textOrNull(next.areaName) ?? '',
          street: textOrNull(next.fullAddressEn) ?? textOrNull(next.fullAddressAr) ?? textOrNull(next.streetName) ?? '',
          houseBuilding: textOrNull(next.houseNumber) ?? '',
          region: textOrNull(next.municipalityNameEn) ?? '',
          zone: textOrNull(next.regionNameEn) ?? '',
          plot: numberToString(next.plotId) ?? '',
          mainPlot: textOrNull(next.mainPlotId) ?? '',
          premises: textOrNull(next.premisesPlotId) ?? textOrNull(next.communityName) ?? '',
          latitude: formatCoordinate(next.latitude) ?? '',
          longitude: formatCoordinate(next.longitude) ?? '',
        };
      }

      // EDIT MODE: fallback to previously submitted IDH address
      if (mode === 'edit' && idhResp?.data) {
        const prev = idhResp.data;
        return {
          emirate: textOrNull(prev.emirate) ?? '',
          area: textOrNull(prev.area) ?? '',
          street: textOrNull(prev.street) ?? '',
          houseBuilding: textOrNull(prev.houseBuilding) ?? '',
          region: textOrNull(prev.region) ?? '',
          zone: textOrNull(prev.zone) ?? '',
          plot: textOrNull(prev.plot) ?? '',
          mainPlot: textOrNull(prev.mainPlot) ?? '',
          premises: textOrNull(prev.premises) ?? '',
          latitude: textOrNull(prev.latitude) ?? '',
          longitude: textOrNull(prev.longitude) ?? '',
        };
      }

      // INIT MODE: fallback to OneRoster address
      if (primaryAddress) {
        return {
          emirate: textOrNull(primaryAddress.state) ?? '',
          area: textOrNull(primaryAddress.city) ?? '',
          street: textOrNull(primaryAddress.addressLine1) ?? '',
          houseBuilding: textOrNull(primaryAddress.addressLine2) ?? '',
          region: textOrNull(primaryAddress.region) ?? '',
          zone: textOrNull(primaryAddress.sector) ?? '',
          plot: textOrNull(primaryAddress.plotNumber) ?? '',
          mainPlot: textOrNull(primaryAddress.plotId) ?? '',
          premises: textOrNull(primaryAddress.addressLine3) ?? '',
          latitude: '',
          longitude: '',
        };
      }

      return {
        emirate: '',
        area: '',
        street: '',
        houseBuilding: '',
        region: '',
        zone: '',
        plot: '',
        mainPlot: '',
        premises: '',
        latitude: '',
        longitude: '',
      };
    })();

    setErrorMessage(null);
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      if (preparedPayload.addressChanged && !supportingDocument) {
        throw new Error(locale === 'ar' ? 'الرجاء إعادة إرفاق المستند قبل الإرسال.' : 'Please reattach the supporting document before submitting.');
      }

      // ========== Handle attachment based on mode and user action ==========
      let attachmentBase64 = '';
      
      if (supportingDocument) {
        // User uploaded a new document (either mode)
        attachmentBase64 = await validateAndEncodeAttachment(supportingDocument, locale);
      } else if (mode === 'edit' && idhResp?.data?.attachment01) {
        // EDIT mode: No new document uploaded, reuse existing attachment from IDH
        attachmentBase64 = idhResp.data.attachment01;
      }
      // INIT mode with no document will remain empty string

      // ========== Fetch ManhalCodes based on emirate type ==========
      let stateID: string | undefined;
      let cityID: string | undefined;
      let regionID: string | undefined;
      let sectorID: string | undefined;

      if (preparedPayload.addressChanged && preparedPayload.newAddress) {
        const newAddr = preparedPayload.newAddress;
        
        // Check if it's Abu Dhabi address (from map - has emirateName but might not have emirateId)
        const isAbuDhabi = newAddr.emirateNameEn && 
          (newAddr.emirateNameEn.toLowerCase().includes('abu dhabi') ||
           newAddr.emirateNameEn.toLowerCase().includes('al ain') ||
           newAddr.emirateNameEn.toLowerCase().includes('dhafra'));
        
        if (isAbuDhabi) {
          // ABU DHABI: Fetch ManhalCodes from plots API using GISID
          // Determine GISID: prefer mainPlotId, fallback to premisesPlotId, then plotId
          const gisid = newAddr.mainPlotId || 
                        newAddr.premisesPlotId || 
                        (newAddr.plotId ? String(newAddr.plotId) : null);
          
          if (gisid) {
            try {
              const plotsResponse = await fetch(`/api/db/plots?filter=${encodeURIComponent(gisid)}`);
              
              if (plotsResponse.ok) {
                const plotsData = await plotsResponse.json();
                
                if (plotsData.data) {
                  stateID = plotsData.data.emirateManhalCode || undefined;
                  cityID = plotsData.data.regionManhalCode || undefined;
                  regionID = plotsData.data.zoneManhalCode || undefined;
                  sectorID = plotsData.data.areaManhalCode || undefined;
                }
              }
            } catch {
              // Silently handle ManhalCode fetch errors
            }
          }
        } else {
          // OTHER EMIRATES (Dubai/Northern): Use ManhalCode values from dropdowns
          // stateID = emirate ManhalCode
          stateID = newAddr.emirateManhalCode && textOrNull(newAddr.emirateManhalCode)
            ? newAddr.emirateManhalCode
            : undefined;
          
          // cityID = emirate ManhalCode (same as stateID for non-Abu Dhabi)
          cityID = newAddr.emirateManhalCode && textOrNull(newAddr.emirateManhalCode)
            ? newAddr.emirateManhalCode
            : undefined;
          
          // regionID = zone ManhalCode
          regionID = newAddr.areaManhalCode && textOrNull(newAddr.areaManhalCode)
            ? newAddr.areaManhalCode
            : undefined;
        
          
 

        }
      } else if (mode === 'edit' && idhResp?.data) {
        // EDIT MODE: Address not changed, preserve existing ManhalCodes from IDH
        stateID = textOrNull(idhResp.data.stateID) ?? undefined;
        cityID = textOrNull(idhResp.data.cityID) ?? undefined;
        regionID = textOrNull(idhResp.data.regionID) ?? undefined;
        sectorID = textOrNull(idhResp.data.sectorID) ?? undefined;
      }

      // ========== Build payload based on mode ==========
      const idhPayload: IDHStudent = {
        studentNumber: studentNumber ?? '',
        schoolId: schoolId ?? '',
        sourceId: sourceId ?? '',
        primaryPhone: preparedPayload.contactNumbers[0] ?? '',
        otherPhone: preparedPayload.contactNumbers[1] ?? '',
        transportationType: preparedPayload.transportation,
        emirate: resolvedAddress.emirate,
        area: resolvedAddress.area,
        street: resolvedAddress.street,
        houseBuilding: resolvedAddress.houseBuilding,
        region: resolvedAddress.region,
        zone: resolvedAddress.zone,
        plot: resolvedAddress.plot,
        mainPlot: resolvedAddress.mainPlot,
        premises: resolvedAddress.premises,
        latitude: resolvedAddress.latitude,
        longitude: resolvedAddress.longitude,
        attachment01: attachmentBase64,
        statusId: mode === 'init' ? 1 : 3, // STATUS: INIT=1, EDIT=3
        datetime: new Date().toISOString(),
        stateID: stateID,
        cityID: cityID,
        regionID: regionID,
        sectorID: sectorID,
      };

      await submitToIDH(idhPayload);

      const selectedBulkChildren = applyToAllChildren && selectedChildIds.length > 0
        ? eligibleChildren.filter((entry) => {
            const childId = textOrNull(entry.profile.id) ?? entry.profile.id;
            return childId && selectedChildIds.includes(childId) && childId !== normalizedSourceId;
          })
        : [];

      // IDH submission successful - now update information status via PP API (if endpoint exists)
      try {
        const statusResponse = await fetch(`/api/PP/information-status/${encodeURIComponent(normalizedSourceId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: mode === 'init' ? 1 : 3, // INIT=1, EDIT=3
            isInformationUpdated: true, // Only sent after successful IDH submission
          }),
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => null);
          // Log warning but don't block the user flow if endpoint doesn't exist
          if (statusResponse.status === 404) {
            console.warn('Information status endpoint not available on PP API');
            toast.warning(
              locale === 'ar' ? 'تحديث جزئي' : 'Partial Update',
              locale === 'ar'
                ? 'تم حفظ البيانات محلياً. نظام التحديث المركزي غير متوفر حالياً'
                : 'Data saved locally. Central update system not available'
            );
          } else {
            console.warn('Failed to update information status:', errorData);
            toast.warning(
              locale === 'ar' ? 'تحديث جزئي' : 'Partial Update',
              locale === 'ar'
                ? 'تم حفظ البيانات محلياً، لكن فشل التحديث في النظام المركزي'
                : 'Data saved locally, but failed to update central system'
            );
          }
        } else {
          toast.success(
            locale === 'ar' ? 'تم بنجاح' : 'Success',
            locale === 'ar'
              ? 'تم تحديث المعلومات وحفظها في جميع الأنظمة بنجاح'
              : 'Information updated and saved successfully across all systems'
          );
        }
      } catch (statusError) {
        console.warn('Error calling information-status API:', statusError);
        toast.warning(
          locale === 'ar' ? 'تحديث جزئي' : 'Partial Update',
          locale === 'ar'
            ? 'تم حفظ البيانات محلياً، لكن حدث خطأ في الاتصال بالنظام المركزي'
            : 'Data saved locally, but error connecting to central system'
        );
        // Non-blocking: continue even if status update fails
      }

      if (selectedBulkChildren.length > 0) {
        const bulkSuccessNames: string[] = [];
        const bulkFailedNames: string[] = [];

        for (const entry of selectedBulkChildren) {
          const childProfile = entry.profile;
          const childName = getDisplayName(childProfile, locale);
          const childId = textOrNull(childProfile.id) ?? childProfile.id;
          const childStudentNumber = textOrNull(childProfile.studentNumber);
          const childEnrollment = childProfile.enrollment?.find((enrollment) => textOrNull(enrollment.schoolId));
          const childSchoolId = childEnrollment ? textOrNull(childEnrollment.schoolId) : null;

          if (!childStudentNumber || !childSchoolId || !childId) {
            bulkFailedNames.push(childName);
            continue;
          }

          const childPayload: IDHStudent = {
            ...idhPayload,
            studentNumber: childStudentNumber,
            schoolId: childSchoolId,
            sourceId: childId,
          };

          try {
            await submitToIDH(childPayload);

            try {
              const childStatusResponse = await fetch(`/api/PP/information-status/${encodeURIComponent(childId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: idhPayload.statusId,
                  isInformationUpdated: true,
                }),
              });

              if (!childStatusResponse.ok) {
                console.warn('Failed to update information status for child', childId);
              }
            } catch (childStatusError) {
              console.warn('Error calling information-status API for child', childId, childStatusError);
            }

            bulkSuccessNames.push(childName);
          } catch (childError) {
            console.error('Bulk IDH submission failed for child', childId, childError);
            bulkFailedNames.push(childName);
          }
        }

        if (bulkSuccessNames.length > 0) {
          toast.success(
            locale === 'ar' ? 'تم التحديث للأطفال الآخرين' : 'Other children updated',
            locale === 'ar'
              ? `تم تحديث ${bulkSuccessNames.length} من الأطفال المحددين: ${bulkSuccessNames.join('، ')}.`
              : `Updated ${bulkSuccessNames.length} selected child(ren): ${bulkSuccessNames.join(', ')}.`
          );
        }

        if (bulkFailedNames.length > 0) {
          toast.warning(
            locale === 'ar' ? 'تعذر تحديث بعض الأطفال' : 'Some children were not updated',
            locale === 'ar'
              ? `يرجى المحاولة لاحقًا للأطفال: ${bulkFailedNames.join('، ')}.`
              : `Please try again for: ${bulkFailedNames.join(', ')}.`
          );
        }
      }

      setShowSuccessToast(true);
      setHasUnsavedChanges(false);

      // Clear SWR cache for student data and IDH data to ensure fresh data on next load
      await mutate(
        (key) => {
          if (typeof key === 'string') {
            return (
               key.includes('/api/parent/child-actions')
            );
          }
          return false;
        },
        undefined,
        { revalidate: true }
      );

      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/PP/ChildList'),
        undefined,
        { revalidate: true }
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // After successful update, navigate back to dashboard
      router.push('/dashboard');
    } catch (submitError: unknown) {
      console.error('IDH submission failed', submitError);
      const status = typeof submitError === 'object' && submitError && 'status' in submitError
        ? Number((submitError as { status?: number }).status)
        : undefined;
      const fallbackMessage = locale === 'ar' ? 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.' : 'Something went wrong while saving. Please try again.';

      if (status === 413) {
        const upstreamMessage = (() => {
          if (!(typeof submitError === 'object' && submitError && 'message' in submitError) || typeof (submitError as any).message !== 'string' || (submitError as any).message === 'IDH submission failed') {
            return null;
          }
          const raw = String((submitError as any).message).trim();
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.error === 'string') {
              return parsed.error;
            }
          } catch {
            // not JSON, fall back to raw string
          }
          return raw;
        })();
        const rawSize = supportingDocument ? formatBytes(supportingDocument.size) : '';
        const encodedSize = supportingDocument
          ? formatBytes(Math.ceil((supportingDocument.size ?? 0) / 3) * 4)
          : '';
        const composed = locale === 'ar'
          ? `${upstreamMessage ?? 'الملف المرفق كبير جداً.'} حجم الملف الحالي ${rawSize || 'غير معروف'} (حوالي ${encodedSize || '—'} بعد الترميز). يرجى تقليل الحجم إلى أقل من ${ATTACHMENT_LIMIT_LABEL}.`
          : `${upstreamMessage ?? 'The attachment is too large.'} Your file size is ${rawSize || 'unknown'} (≈ ${encodedSize || '—'} once encoded). Please reduce it below ${ATTACHMENT_LIMIT_LABEL}.`;
        setErrorMessage(composed.trim());
        toast.error(
          locale === 'ar' ? 'خطأ' : 'Error',
          composed.trim()
        );
      } else {
        const msg = typeof submitError === 'object' && submitError && 'message' in submitError
          ? String((submitError as any).message)
          : fallbackMessage;
        setErrorMessage(msg || fallbackMessage);
        toast.error(
          locale === 'ar' ? 'خطأ' : 'Error',
          msg || fallbackMessage
        );
      }
      const errorEl = document.getElementById('form-error-message');
      if (errorEl) {
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'assertive');
      }
    } finally {
      setIsSubmitting(false);
      setPreparedPayload(null);
    }
  };

  if (!sourcedId) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {t?.parentConduct?.noStudentId || 'No student ID provided'}
      </div>
    );
  }

  if (!updateInfo) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {locale === 'ar' ? 'خطأ في تحميل الترجمات' : 'Translation loading error. Please refresh the page.'}
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton locale={locale} />;
  }

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {message}
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-muted-foreground">
        {t?.child?.no_data_available_for_child || 'No data available for this child'}
      </div>
    );
  }

  const displayName = getDisplayName(student, locale);

  return (
    <div className={clsx('min-h-screen bg-gradient-to-br from-background/40 via-background to-background/60 relative overflow-hidden', locale === 'ar' && 'direction-rtl')}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/4 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {locale === 'ar' ? 'الانتقال إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>

      <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 shadow-sm transition-all duration-300 hover:shadow-md" role="banner">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <nav aria-label={locale === 'ar' ? 'التنقل' : 'Breadcrumb'} className="mb-3">
            <Link
              href={`/child/${encodeURIComponent(sourcedId)}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:gap-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:rounded-md px-1 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
              </svg>
              <span className="group-hover:underline decoration-primary decoration-2 underline-offset-4">{locale === 'ar' ? 'عودة إلى ملف الطالب' : 'Back to child profile'}</span>
            </Link>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className={clsx("text-xl sm:text-2xl lg:text-3xl font-bold text-foreground", locale === 'ar' && 'text-right')}>
                {updateInfo.title}
              </h1>
              <p className={clsx("text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl", locale === 'ar' && 'text-right')}>
                {mode === 'edit' ? updateInfo.intro.edit : updateInfo.intro.init}
              </p>
            </div>
            <Badge 
              variant={mode === 'edit' ? 'destructive' : 'secondary'}
              className="self-start text-xs sm:text-sm px-3 py-1.5"
            >
              {mode === 'edit' ? updateInfo.modeLabel.edit : updateInfo.modeLabel.init}
            </Badge>
          </div>
        </div>
      </header>

      <main id="main-form" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6" role="main">
        {/* Student Info Card */}
        <Card className="border border-primary/20 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 hover:scale-[1.01]" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-3">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-semibold text-lg sm:text-xl ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all duration-300 hover:scale-110 hover:ring-primary/40 hover:shadow-lg"
                aria-hidden="true"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="block">{displayName || sourcedId}</span>
                {meta?.cache?.source && (
                  <span className="text-xs text-muted-foreground font-normal mt-1 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {meta.cache.source === 'cache' 
                      ? (locale === 'ar' ? 'من الذاكرة المؤقتة' : 'Cached data')
                      : (locale === 'ar' ? 'بيانات حديثة' : 'Live data')}
                    {meta.cache.lastUpdated && (
                      <span className="text-[10px]">
                        ({new Date(meta.cache.lastUpdated).toLocaleString(locale === 'ar' ? 'ar-AE' : 'en-US')})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Success Toast */}
        {showSuccessToast && (
          <div 
            className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-3 animate-in slide-in-from-top-2"
            role="status"
            aria-live="polite"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{locale === 'ar' ? 'تم إرسال طلب تحديث البيانات بنجاح!' : 'Your data update request has been submitted!'}</span>
          </div>
        )}
        
        {/* IDH Return Comment (edit mode) - Sticky */}
        {mode === 'edit' && idhResp?.data?.ReturnComment && textOrNull(idhResp.data.ReturnComment) && (
          
          <div
            className="sticky top-0 z-30 rounded-lg border-2 border-amber-500/60 bg-gradient-to-r from-amber-50 via-amber-100/80 to-amber-50 dark:from-amber-900/40 dark:via-amber-900/60 dark:to-amber-900/40 px-5 py-4 text-sm shadow-lg backdrop-blur-sm animate-in slide-in-from-top-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-500/20 shrink-0">
                <svg className="w-6 h-6 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-bold text-base text-amber-900 dark:text-amber-100">
                  {locale === 'ar' ? '⚠️ سبب الإرجاع' : '⚠️ Return Reason'}
                </p>
                <p className="whitespace-pre-wrap break-words text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                  {idhResp.data.ReturnComment}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 pt-1 border-t border-amber-300/30">
                  {locale === 'ar' 
                    ? 'الرجاء مراجعة هذا السبب وتحديث المعلومات المطلوبة قبل إعادة الإرسال'
                    : 'Please review this reason and update the required information before resubmitting'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Non-blocking IDH error (edit mode) */}
        {mode === 'edit' && idhError && (
          <div
            className="rounded-lg border border-amber-500/40 bg-amber-50/60 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-3"
            role="status"
            aria-live="polite"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              {locale === 'ar'
                ? 'تعذر تحميل بيانات الطلب السابقة من IDH. سيظهر الملف ببيانات OneRoster.'
                : 'Could not load previous IDH submission. Falling back to OneRoster data.'}
            </span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div 
            id="form-error-message"
            ref={firstErrorRef}
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-3 animate-in slide-in-from-top-2"
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          className="space-y-6 sm:space-y-8"
          aria-label={updateInfo.title}
          noValidate
        >
          {/* Progress Indicator - Hidden */}
          <div className="hidden" role="status" aria-live="polite">
            <span className="text-xs sm:text-sm text-muted-foreground">
              {locale === 'ar' ? 'التقدم:' : 'Progress:'}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 sm:w-32 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ 
                    width: `${((contactNumbers.filter(n => n.trim()).length > 0 ? 33 : 0) + (addressChanged && newAddress ? 33 : 0) + (transportation ? 34 : 0))}%` 
                  }}
                  role="progressbar"
                  aria-valuenow={(contactNumbers.filter(n => n.trim()).length > 0 ? 33 : 0) + (addressChanged && newAddress ? 33 : 0) + (transportation ? 34 : 0)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={locale === 'ar' ? 'نسبة الإكمال' : 'Completion percentage'}
                />
              </div>
              <span className="text-xs font-medium text-foreground tabular-nums">
                {Math.round((contactNumbers.filter(n => n.trim()).length > 0 ? 33 : 0) + (addressChanged && newAddress ? 33 : 0) + (transportation ? 34 : 0))}%
              </span>
            </div>
          </div>

          <Card className="shadow-md border-2 border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
              <CardTitle className="text-lg sm:text-xl text-foreground flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span>{updateInfo.contactSection.title}</span>
              </CardTitle>
              <CardDescription className={clsx("text-sm text-muted-foreground mt-1.5", locale === 'ar' && 'text-right')}>
                {updateInfo.contactSection.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              <fieldset className="space-y-4">
                <legend className="sr-only">{updateInfo.contactSection.title}</legend>
                {contactNumbers.map((number, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`contact-${index}`} className={clsx("text-sm font-medium flex items-center gap-2", locale === 'ar' && 'flex-row-reverse justify-end')}>
                      <span>
                        {index === 0
                          ? updateInfo.contactSection.primaryLabel
                          : updateInfo.contactSection.secondaryLabel}
                      </span>
                      {index === 0 && (
                        <>
                          <Badge variant="default" className="text-xs px-2 py-0.5">
                            {locale === 'ar' ? 'أساسي' : 'Primary'}
                          </Badge>
                          <span className="text-destructive" aria-label={locale === 'ar' ? 'مطلوب' : 'required'}>*</span>
                        </>
                      )}
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          id={`contact-${index}`}
                          type="tel"
                          inputMode="tel"
                          value={number}
                          onChange={(event) => handleContactChange(index, event.target.value)}
                          placeholder="05XXXXXXXX"
                          dir="ltr"
                          className={clsx(
                            "w-full h-11 bg-background border-2",
                            getContactNumberError(number, index) 
                              ? "border-destructive focus:border-destructive focus-visible:ring-destructive/20"
                              : "border-input hover:border-primary/50 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                            "transition-all duration-200",
                            "text-foreground placeholder:text-muted-foreground/60",
                            locale === 'ar' && 'text-right',
                            isSubmitting && "opacity-50 cursor-not-allowed"
                          )}
                          required={index === 0}
                          aria-required={index === 0}
                          aria-invalid={!!getContactNumberError(number, index)}
                          aria-describedby={`contact-${index}-help ${getContactNumberError(number, index) ? `contact-${index}-error` : ''}`}
                          disabled={isSubmitting}
                        />
                      </div>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleContactChange(index, '')}
                          disabled={isSubmitting}
                          aria-label={`${locale === 'ar' ? 'مسح' : 'Clear'} ${index + 1}`}
                          className={clsx(
                            "shrink-0 h-11 border-2",
                            "hover:bg-muted hover:text-foreground hover:border-border",
                            "transition-all duration-200"
                          )}
                        >
                          <span className="hidden sm:inline">{locale === 'ar' ? 'مسح' : 'Clear'}</span>
                          <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    {getContactNumberError(number, index) && (
                      <p id={`contact-${index}-error`} className="text-xs text-destructive flex items-center gap-1.5 animate-in slide-in-from-top-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{getContactNumberError(number, index)}</span>
                      </p>
                    )}
                    {index === 0 && !getContactNumberError(number, index) && (
                      <p id="contact-0-help" className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {locale === 'ar' 
                            ? 'رقم الهاتف المحمول الرئيسي للتواصل العاجل (05XXXXXXXX أو 9715XXXXXXXX)'
                            : 'Primary mobile number for urgent contact (05XXXXXXXX or 9715XXXXXXXX)'}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </fieldset>

              {contactNumbers.length < 2 && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleAddContact}
                  disabled={isSubmitting}
                  className={clsx(
                    "w-full sm:w-auto h-11 border-2 border-dashed",
                    "bg-secondary/50 hover:bg-secondary hover:border-primary/50",
                    "transition-all duration-200"
                  )}
                  aria-label={updateInfo.contactSection.addButton}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {updateInfo.contactSection.addButton}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md border-2 border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 group" style={{ animationDelay: '300ms' }}>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40 group-hover:from-primary/10 transition-all duration-500">
              <CardTitle className="text-lg sm:text-xl text-foreground flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span>{updateInfo.addressSection.title}</span>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground  !mt-5">
                {updateInfo.addressSection.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              {/* Transportation Section */}
              <div className="space-y-2 pb-4 border-b border-border/30 mt-5">
                <Label htmlFor="transportation-method" className={clsx("text-sm font-medium flex items-center gap-2", locale === 'ar' && 'flex-row-reverse justify-end')}>
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{updateInfo.transportationSection.selectLabel}</span>
                  <span className="text-destructive" aria-label={locale === 'ar' ? 'مطلوب' : 'required'}>*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  {updateInfo.transportationSection.description}
                </p>
                <Select 
                  key={`transportation-${mode}-${transportation}`}
                  value={transportation} 
                  onValueChange={(value) => setTransportation(value)}
                  disabled={isSubmitting}
                  required
                >
                  <SelectTrigger 
                    id="transportation-method"
                    aria-required="true"
                    aria-invalid={errorMessage?.includes('transportation')}
                    className={clsx(
                      "h-11 border-2 bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200",
                      locale === 'ar' && 'text-right'
                    )}
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <SelectValue placeholder={locale === 'ar' ? 'اختر طريقة المواصلات' : 'Select a method'} />
                  </SelectTrigger>
                  <SelectContent dir={locale === 'ar' ? 'rtl' : 'ltr'} className={clsx(locale === 'ar' && 'text-right')}>
                    <SelectItem value="Bus">{locale === 'ar' ? 'بواسطة الحافلة' : 'By Bus'}</SelectItem>
                    <SelectItem value="Car">{locale === 'ar' ? 'بالسيارة' : 'By Car'}</SelectItem>
                    <SelectItem value="On Foot">{locale === 'ar' ? 'سيراً على الأقدام' : 'On Foot'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='my-5'>
                <Label className={clsx("text-sm font-medium block mb-2 flex items-center gap-2", locale === 'ar' && 'flex-row-reverse justify-end')}>
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{updateInfo.addressSection.currentLabel}</span>
                  {primaryAddress?.isPrimary && (
                    <Badge variant="default" className="text-xs px-2 py-0.5">
                      {locale === 'ar' ? 'أساسي' : 'Primary'}
                    </Badge>
                  )}
                </Label>
                <div className={clsx("rounded-xl border-2 border-dashed border-border/50 bg-muted/30 px-4 py-4 text-sm text-foreground/80 shadow-sm", locale === 'ar' && 'text-right')}>
                  <p className="leading-relaxed">{formattedCurrentAddress || t.child.no_address_available}</p>
                </div>
              </div>

              {mode === 'edit' && formattedPrevSubmittedAddress && (
                <div className='my-5'>
                  <Label className={clsx("text-sm font-medium block mb-2 flex items-center gap-2", locale === 'ar' && 'flex-row-reverse justify-end')}>
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{locale === 'ar' ? 'العنوان المرسل سابقاً' : 'Previously submitted address'}</span>
                  </Label>
                  <div className={clsx("rounded-xl border-2 border-dashed border-border/50 bg-muted/30 px-4 py-4 text-sm text-foreground/80 shadow-sm", locale === 'ar' && 'text-right')}>
                    <p className="leading-relaxed">{formattedPrevSubmittedAddress}</p>
                  </div>
                </div>
              )}

              {mode === 'edit' && idhAttachmentUrl && (
                <div className='my-5'>
                  <Label className={clsx("text-sm font-medium block mb-2 flex items-center gap-2", locale === 'ar' && 'flex-row-reverse justify-end')}>
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m0 0l3 3m-3-3l3-3m7 9V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2z" />
                    </svg>
                    <span>{locale === 'ar' ? 'المستند المرفوع سابقًا' : 'Previously uploaded document'}</span>
                  </Label>
                  <div className={clsx("rounded-xl border-2 border-dashed border-border/50 bg-muted/30 px-4 py-4 text-sm text-foreground/80 shadow-sm flex items-center justify-between gap-3", locale === 'ar' && 'flex-row-reverse text-right')}>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8m11 8H5a2 2 0 01-2-2V6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">{locale === 'ar' ? 'ملف PDF' : 'PDF file'}</span>
                      {idhAttachmentSize > 0 && (
                        <span className="text-xs text-muted-foreground">({formatBytes(idhAttachmentSize)})</span>
                      )}
                    </div>
                    <a
                      href={idhAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download="supporting-document.pdf"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                      </svg>
                      <span>{locale === 'ar' ? 'عرض/تحميل' : 'View / Download'}</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4">
                <label className={clsx("flex items-start gap-3 text-sm font-medium text-foreground cursor-pointer group", locale === 'ar' && 'flex-row text-right')}>
                  <input
                    type="checkbox"
                    checked={addressChanged}
                    onChange={(event) => setAddressChanged(event.target.checked)}
                    className="h-5 w-5 mt-0.5 rounded border-2 border-primary/40 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
                    disabled={isSubmitting}
                    aria-describedby="address-change-help"
                  />
                  <div className="flex-1">
                    <span className="group-hover:text-primary transition-colors block">{updateInfo.addressSection.changeToggle}</span>
                    <p id="address-change-help" className="text-xs text-muted-foreground mt-1.5">
                      {locale === 'ar'
                        ? 'حدد هذا الخيار إذا انتقلت إلى عنوان جديد'
                        : 'Check this option if you have moved to a new address'}
                    </p>
                  </div>
                </label>
              </div>

              {addressChanged && (
                <div className="animate-in fade-in-50 duration-300">
                  <div className="space-y-3">
                    <Label className={clsx("text-sm font-medium text-foreground flex items-center gap-2", locale === 'ar' && 'flex-row-reverse justify-end')}>
                      <span>{updateInfo.addressSection.newAddressLabel}</span>
                      <span className="text-destructive" aria-label={locale === 'ar' ? 'مطلوب' : 'required'}>*</span>
                    </Label>
                    <AddressPicker
                      value={newAddress ?? undefined}
                      onChange={(value) => setNewAddress(value)}
                      disabled={!addressChanged || isSubmitting}
                      required={{ emirate: true, area: true }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="address-document" className={clsx("text-sm font-medium flex items-center gap-2", locale === 'ar' && 'flex-row-reverse justify-end')}>
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{updateInfo.addressSection.documentLabel}</span>
                  {addressChanged && <span className="text-destructive" aria-label={locale === 'ar' ? 'مطلوب' : 'required'}>*</span>}
                </Label>

                {/* File Requirements Info Card */}
                <div className="rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-2 border-primary/20 p-4 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-foreground">
                        {locale === 'ar' ? 'متطلبات الملف' : 'File Requirements'}
                      </p>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {locale === 'ar' ? 'الصيغة: PDF فقط' : 'Format: PDF only'}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {locale === 'ar' ? 'الحد الأقصى للحجم: 5 ميجابايت' : 'Maximum size: 5 MB'}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {locale === 'ar' 
                              ? 'المستندات المقبولة: فاتورة خدمات، عقد الإيجار، أو مستند رسمي'
                              : 'Accepted: Services bill, tenancy contract, or official document'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className={clsx(
                  "relative rounded-xl border-2 border-dashed transition-all duration-300",
                  addressChanged && !supportingDocument
                    ? "border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10"
                    : supportingDocument
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-border/30 bg-muted/20",
                  (!addressChanged || isSubmitting) && "opacity-60 cursor-not-allowed"
                )}>
                  <Input
                    id="address-document"
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={!addressChanged || isSubmitting}
                    onChange={handleFileChange}
                    className={clsx(
                      'absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10',
                      (!addressChanged || isSubmitting) && 'cursor-not-allowed'
                    )}
                    required={addressChanged}
                    aria-required={addressChanged}
                    aria-describedby="address-document-help address-document-status"
                    aria-invalid={addressChanged && errorMessage?.includes('document')}
                  />
                  
                  <div className="p-6 text-center pointer-events-none">
                    {!supportingDocument ? (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <div className="p-4 rounded-full bg-primary/10">
                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {locale === 'ar' ? 'انقر لاختيار ملف PDF' : 'Click to select a PDF file'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ar' ? 'أو اسحب الملف وأفلته هنا' : 'or drag and drop it here'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-medium">{locale === 'ar' ? 'PDF • حتى 5 ميجابايت' : 'PDF • Up to 5 MB'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <div className="p-4 rounded-full bg-green-500/10">
                            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            {locale === 'ar' ? 'تم اختيار الملف بنجاح' : 'File selected successfully'}
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-semibold text-foreground truncate max-w-xs">{supportingDocument.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(supportingDocument.size / (1024 * 1024)).toFixed(2)} MB {locale === 'ar' ? 'من 5 ميجابايت' : 'of 5 MB'}
                          </p>
                          <p className="text-xs text-primary font-medium mt-2">
                            {locale === 'ar' ? 'انقر لتغيير الملف' : 'Click to change file'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status and Helper Text */}
                <div className="space-y-2">
                  {!supportingDocument && addressChanged && (
                    <p id="address-document-status" className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {updateInfo.noFileSelected}
                    </p>
                  )}
                  <p id="address-document-help" className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{updateInfo.addressSection.documentHelper}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice Alert */}
          <div 
            className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-amber-500/60 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '500ms' }}
            role="alert"
            aria-labelledby="important-notice-title"
          >
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse" style={{ animationDuration: '3s' }}>
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-500 animate-bounce" style={{ animationDuration: '2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 id="important-notice-title" className={clsx("text-base sm:text-lg font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2", locale === 'ar' && 'text-right')}>
                  <span>
                    {locale === 'ar' 
                      ? 'تنبيه هام - يرجى القراءة بعناية' 
                      : 'Important Notice - Please Read Carefully'}
                  </span>
                </h3>
                <div className={clsx("space-y-2.5 text-sm sm:text-base text-amber-900/90 dark:text-amber-100/90", locale === 'ar' && 'text-right')}>
                  <p className="leading-relaxed font-medium">
                    {locale === 'ar'
                      ? 'قبل إرسال هذا النموذج، يرجى التأكد من أن جميع المعلومات المقدمة صحيحة ودقيقة:'
                      : 'Before submitting this form, please ensure that all the information provided is correct and accurate:'}
                  </p>
                  <ul className={clsx("space-y-2 list-disc", locale === 'ar' ? 'mr-4 list-inside text-right' : 'ml-4 list-inside')}>
                    <li className="leading-relaxed">
                      {locale === 'ar'
                        ? 'تحقق من صحة أرقام الاتصال وإمكانية الوصول إليها'
                        : 'Verify that contact numbers are correct and reachable'}
                    </li>
                    <li className="leading-relaxed">
                      {locale === 'ar'
                        ? 'تأكد من دقة العنوان السكني وتطابقه مع المستندات الرسمية'
                        : 'Ensure the residential address matches official documents'}
                    </li>
                    <li className="leading-relaxed">
                      {locale === 'ar'
                        ? 'راجع المستند المرفق للتأكد من وضوحه وصحته'
                        : 'Review uploaded documents for clarity and validity'}
                    </li>
                    <li className="leading-relaxed">
                      {locale === 'ar'
                        ? 'تأكد من دقة معلومات النقل المدرسي'
                        : 'Confirm transportation details are accurate'}
                    </li>
                  </ul>
                  <p className="leading-relaxed font-semibold pt-2 border-t border-amber-300/30 dark:border-amber-700/30">
                    {locale === 'ar'
                      ? '⚠️ المعلومات غير الصحيحة قد تؤثر على خدمات طفلك المدرسية وقد تتطلب تحديثات لاحقة.'
                      : '⚠️ Incorrect information may affect your child\'s school services and may require later updates.'}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-800/80 dark:text-amber-200/80 italic">
                    {locale === 'ar'
                      ? 'بالمتابعة، أقر بأن جميع المعلومات المقدمة صحيحة وكاملة.'
                      : 'By proceeding, I acknowledge that all information provided is correct and complete.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-6 mt-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '600ms' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm(locale === 'ar' ? 'لديك تغييرات غير محفوظة. هل أنت متأكد من الرجوع؟' : 'You have unsaved changes. Are you sure you want to go back?')) {
                  return;
                }
                router.push(`/child/${encodeURIComponent(sourcedId)}`);
              }}
              className="w-full sm:w-auto hover:scale-105 transition-transform duration-300"
              disabled={isSubmitting}
              aria-label={updateInfo.submit.cancel}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
              </svg>
              {updateInfo.submit.cancel}
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto min-w-[200px] relative hover:scale-105 hover:shadow-lg transition-all duration-300 group" 
              disabled={isSubmitting}
              aria-label={isSubmitting ? updateInfo.submit.submitting : updateInfo.submit.continue}
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {!isSubmitting && (
                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{isSubmitting ? updateInfo.submit.submitting : updateInfo.submit.continue}</span>
            </Button>
          </div>
        </form>
      </main>
      {/* Keyboard Navigation Hints */}
      <div className="sr-only" role="region" aria-label={locale === 'ar' ? 'تلميحات لوحة المفاتيح' : 'Keyboard hints'}>
        <p>{locale === 'ar' ? 'استخدم Tab للتنقل بين الحقول' : 'Use Tab to navigate between fields'}</p>
        <p>{locale === 'ar' ? 'اضغط Enter لإرسال النموذج' : 'Press Enter to submit the form'}</p>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300">
          <DialogHeader className="space-y-3 pb-2">
            <DialogTitle className={clsx("flex items-center gap-3 text-xl font-bold", locale === 'ar' && 'flex-row text-right')}>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>
                {locale === 'ar' 
                  ? 'تأكيد التغييرات' 
                  : 'Confirm Changes'}
              </span>
            </DialogTitle>
            <DialogDescription className={clsx("text-base leading-relaxed", locale === 'ar' && 'text-right')}>
              {locale === 'ar'
                ? 'يرجى مراجعة التغييرات التالية قبل تقديم الطلب:'
                : 'Please review the following changes before submitting your request:'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Contact Numbers Summary */}
            <div className="rounded-lg border-2 border-border/50 bg-card/30 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base text-foreground">
                  {locale === 'ar' ? 'أرقام الاتصال' : 'Contact Numbers'}
                </h4>
              </div>
              <div className="p-4 space-y-3">
                <div className={clsx("flex items-center gap-3", locale === 'ar' && 'flex-row justify-start')}>
                  <Badge variant="secondary" className="shrink-0">
                    {locale === 'ar' ? 'الأساسي' : 'Primary'}
                  </Badge>
                  <span className="font-mono text-base font-medium text-foreground" dir="ltr">
                    {preparedPayload?.contactNumbers[0] || '—'}
                  </span>
                </div>
                {preparedPayload?.contactNumbers[1] && (
                  <div className={clsx("flex items-center gap-3", locale === 'ar' && 'flex-row justify-start')}>
                    <Badge variant="outline" className="shrink-0">
                      {locale === 'ar' ? 'الثانوي' : 'Secondary'}
                    </Badge>
                    <span className="font-mono text-base font-medium text-foreground" dir="ltr">
                      {preparedPayload.contactNumbers[1]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Address Summary */}
            <div className="rounded-lg border-2 border-border/50 bg-card/30 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base text-foreground">
                  {locale === 'ar' ? 'العنوان السكني' : 'Residential Address'}
                </h4>
              </div>
              <div className="p-4">
                {preparedPayload?.addressChanged ? (
                  <div className="space-y-3">
                    <Badge variant="default" className="mb-2">
                      {locale === 'ar' ? 'عنوان جديد' : 'New Address'}
                    </Badge>
                    <div className="space-y-2.5 bg-background/50 p-4 rounded-lg border border-border/40">
                      {confirmAddress.data.emirate && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'الإمارة:' : 'Emirate:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.emirate}</span>
                        </div>
                      )}
                      {confirmAddress.data.region && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'المدينة:' : 'City:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.region}</span>
                        </div>
                      )}
                      {confirmAddress.data.zone && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'المنطقة:' : 'Region:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.zone}</span>
                        </div>
                      )}
                      {confirmAddress.data.area && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'الحي/القطاع:' : 'Sector:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.area}</span>
                        </div>
                      )}
                      {confirmAddress.data.longitude && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'خط الطول:' : 'Longitude:'}
                          </span>
                          <span className="text-foreground font-medium font-mono text-sm">{confirmAddress.data.longitude}</span>
                        </div>
                      )}
                      {confirmAddress.data.latitude && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'خط العرض:' : 'Latitude:'}
                          </span>
                          <span className="text-foreground font-medium font-mono text-sm">{confirmAddress.data.latitude}</span>
                        </div>
                      )}
                      {confirmAddress.data.premises && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'الموقع/المبنى:' : 'Premises:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.premises}</span>
                        </div>
                      )}
                      {confirmAddress.data.mainPlot && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'القطعة الرئيسية:' : 'Main Plot:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.mainPlot}</span>
                        </div>
                      )}
                      {confirmAddress.data.plot && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'القطعة:' : 'Plot:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.plot}</span>
                        </div>
                      )}
                      {confirmAddress.data.street && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'الشارع:' : 'Street:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.street}</span>
                        </div>
                      )}
                      {confirmAddress.data.houseBuilding && (
                        <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'المبنى/المنزل:' : 'House / Building:'}
                          </span>
                          <span className="text-foreground font-medium">{confirmAddress.data.houseBuilding}</span>
                        </div>
                      )}
                      {preparedPayload.documentName && (
                        <div className={clsx("flex gap-3 pt-3 mt-3 border-t border-border/30", locale === 'ar' && 'flex-row text-right')}>
                          <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                            {locale === 'ar' ? 'المستند:' : 'Document:'}
                          </span>
                          <span className="text-foreground text-sm font-mono truncate flex-1" title={preparedPayload.documentName}>
                            📄 {preparedPayload.documentName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge variant={confirmAddress.source === 'idh' ? 'secondary' : 'outline'} className="mb-2">
                      {confirmAddress.source === 'idh'
                        ? (locale === 'ar' ? 'العنوان السابق' : 'Previously submitted')
                        : confirmAddress.source === 'oneroster'
                          ? (locale === 'ar' ? 'العنوان الحالي' : 'Current address')
                          : (locale === 'ar' ? 'لا يوجد عنوان' : 'No address')}
                    </Badge>
                    {confirmAddress.source === 'empty' ? (
                      <div className={clsx("text-sm text-muted-foreground italic py-2", locale === 'ar' && 'text-right')}>
                        {locale === 'ar' ? 'لا توجد بيانات عنوان لعرضها' : 'No address data to display'}
                      </div>
                    ) : (
                      <div className="space-y-2.5 bg-background/50 p-4 rounded-lg border border-border/40">
                        {confirmAddress.data.emirate && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'الإمارة:' : 'Emirate:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.emirate}</span>
                          </div>
                        )}
                        {confirmAddress.data.region && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'المدينة:' : 'City:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.region}</span>
                          </div>
                        )}
                        {confirmAddress.data.zone && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'المنطقة:' : 'Region:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.zone}</span>
                          </div>
                        )}
                        {confirmAddress.data.area && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'الحي/القطاع:' : 'Sector:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.area}</span>
                          </div>
                        )}
                        {confirmAddress.data.longitude && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'خط الطول:' : 'Longitude:'}</span>
                            <span className="text-foreground font-medium font-mono text-sm">{confirmAddress.data.longitude}</span>
                          </div>
                        )}
                        {confirmAddress.data.latitude && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'خط العرض:' : 'Latitude:'}</span>
                            <span className="text-foreground font-medium font-mono text-sm">{confirmAddress.data.latitude}</span>
                          </div>
                        )}
                        {confirmAddress.data.premises && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'الموقع/المبنى:' : 'Premises:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.premises}</span>
                          </div>
                        )}
                        {confirmAddress.data.mainPlot && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'القطعة الرئيسية:' : 'Main Plot:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.mainPlot}</span>
                          </div>
                        )}
                        {confirmAddress.data.plot && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'القطعة:' : 'Plot:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.plot}</span>
                          </div>
                        )}
                        {confirmAddress.data.street && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'الشارع:' : 'Street:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.street}</span>
                          </div>
                        )}
                        {confirmAddress.data.houseBuilding && (
                          <div className={clsx("flex gap-3", locale === 'ar' && 'flex-row text-right')}>
                            <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">{locale === 'ar' ? 'المبنى/المنزل:' : 'House / Building:'}</span>
                            <span className="text-foreground font-medium">{confirmAddress.data.houseBuilding}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Transportation Summary */}
            <div className="rounded-lg border-2 border-border/50 bg-card/30 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base text-foreground">
                  {locale === 'ar' ? 'وسيلة النقل' : 'Transportation'}
                </h4>
              </div>
              <div className="p-4">
                <div className="bg-background/50 px-4 py-3 rounded-lg border border-border/40">
                  <span className="font-medium text-foreground text-base">
                    {(() => {
                      const value = preparedPayload?.transportation;
                      if (!value) return '—';
                      if (locale === 'ar') {
                        if (value === 'Bus') return 'بواسطة الحافلة';
                        if (value === 'Car') return 'بالسيارة';
                        if (value === 'On Foot') return 'سيراً على الأقدام';
                      }
                      return value === 'Bus' ? 'By Bus' : value === 'Car' ? 'By Car' : value === 'On Foot' ? 'On Foot' : value;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-primary/30 bg-card/30 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2h2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v9" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h.01M16 16h.01" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-5 5 5" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base text-foreground">
                  {locale === 'ar' ? 'تطبيق على جميع أطفالي' : 'Apply to all my children'}
                </h4>
              </div>
              <div className="p-4 space-y-3">
                <label
                  className={clsx(
                    'flex items-start gap-3 text-sm font-medium text-foreground cursor-pointer',
                    locale === 'ar' && 'flex-row text-right'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={applyToAllChildren}
                    onChange={(event) => {
                      const { checked } = event.target;
                      setApplyToAllChildren(checked);
                      setSelectedChildIds([]);
                      setChildFetchError(null);
                      if (checked) {
                        if (eligibleChildren.length === 0 && !isFetchingChildren) {
                          void fetchEligibleChildren();
                        }
                      }
                    }}
                    className="mt-1 h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary"
                  />
                  <div className="space-y-1">
                    <span>
                      {locale === 'ar'
                        ? 'تطبيق نفس التعديلات على جميع الأبناء المرتبطين بحسابك'
                        : 'Apply the same update to all children linked to your account'}
                    </span>
                    {!applyToAllChildren && (
                      <p className="text-xs text-muted-foreground">
                        {locale === 'ar'
                          ? 'سيتم تطبيق نفس التعديلات على جميع الأبناء المرتبطين بحسابك عند اختيار هذا الخيار.'
                          : 'The same changes will be applied to all children linked to your account when this option is selected.'}
                      </p>
                    )}
                  </div>
                </label>

                {applyToAllChildren && (
                  <div
                    className={clsx(
                      'space-y-2 rounded-lg border border-border/40 bg-background/50 p-3',
                      locale === 'ar' && 'text-right'
                    )}
                  >
                    {isFetchingChildren && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{locale === 'ar' ? 'جارٍ التحقق من أهلية الأطفال...' : 'Checking which children are eligible...'}</span>
                      </div>
                    )}

                    {!isFetchingChildren && childFetchError && (
                      <p className="text-sm text-destructive">{childFetchError}</p>
                    )}

                    {!isFetchingChildren && !childFetchError && eligibleChildren.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                          ?  'لا يوجد أطفال مستوفون للشروط حاليًا'
                          : 'No children are currently eligible.'}
                      </p>
                    )}

                    {!isFetchingChildren && !childFetchError && eligibleChildren.length > 0 && (
                      <>
                        {eligibleChildren.map((entry) => {
                          const childId = textOrNull(entry.profile.id) ?? entry.profile.id;
                          if (!childId) return null;
                          const name = getDisplayName(entry.profile, locale);
                          const details: string[] = [];
                          if (entry.profile.studentNumber) {
                            details.push(
                              locale === 'ar'
                                ? `رقم الطالب: ${entry.profile.studentNumber}`
                                : `Student #: ${entry.profile.studentNumber}`
                            );
                          }
                          if (entry.educationType) {
                            details.push(
                              locale === 'ar'
                                ? `نوع التعليم: ${entry.educationType}`
                                : `Education: ${entry.educationType}`
                            );
                          }
                          const isChecked = selectedChildIds.includes(childId);
                          return (
                            <label
                              key={childId}
                              className={clsx(
                                'flex items-start gap-3 rounded-md border border-border/30 bg-card/40 px-3 py-2 transition-colors hover:border-primary/40',
                                locale === 'ar' && 'flex-row text-right'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(event) => handleChildSelectionChange(childId, event.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-primary/40 text-primary focus:ring-primary"
                              />
                              <div className="flex-1 space-y-1">
                                <p className="font-medium text-sm text-foreground">{name}</p>
                                {details.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {details.join(' | ')}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                        {selectedChildIds.length === 0 && (
                          <p className="text-xs text-destructive">
                            {locale === 'ar'
                              ? 'يرجى اختيار طفل واحد على الأقل للتطبيق.'
                              : 'Select at least one child to continue.'}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Warning Message */}
            <div className="rounded-lg border-2 border-amber-500/40 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 p-5">
              <div className={clsx("flex gap-4", locale === 'ar' && 'flex-row')}>
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className={clsx("text-sm text-amber-900 dark:text-amber-100 leading-relaxed font-medium", locale === 'ar' && 'text-right')}>
                  {locale === 'ar'
                    ? 'بالنقر على "تأكيد والإرسال"، أقر بأن جميع المعلومات المذكورة أعلاه صحيحة وكاملة وسيتم إرسال طلب تحديث البيانات.'
                    : 'By clicking "Confirm & Submit", I acknowledge that all information above is correct and complete and that a data update request will be submitted.'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="min-w-[120px] h-11"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting || (applyToAllChildren && selectedChildIds.length === 0)}
              className="min-w-[200px] h-11"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locale === 'ar' ? 'تأكيد والإرسال' : 'Confirm & Submit'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
