'use client';

import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { useI18n } from '@/app/i18n/I18nProvider';
import { jsonFetcher } from '@/lib/swr';
import type { StudentAddress, StudentProfileV1 } from '@/app/types/studentprofile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RefreshBar from '@/components/RefreshBar';

import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { AddressPicker, type AddressValue } from '@/app/components/forms/AddressPicker';

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

function textOrNull(value?: string | null): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function numberToString(value?: number | null): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
}

function localizedName(
  locale: string,
  english?: string | null,
  arabic?: string | null,
): string | null {
  const preferred = locale === 'ar' ? arabic ?? english : english ?? arabic;
  return textOrNull(preferred);
}

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
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sourcedId = params.id as string | undefined;
  const modeParam = searchParams.get('mode');
  const mode: Mode = modeParam === 'edit' ? 'edit' : 'init';

  const swrKey = sourcedId ? `/api/PP/student/${encodeURIComponent(sourcedId)}` : null;
  const { data: student, error, isLoading } = useSWR<StudentProfileV1>(swrKey, jsonFetcher);

  const meta = (student as StudentProfileWithMeta | undefined)?.meta;
  const primaryAddress = React.useMemo<StudentAddress | null>(() => {
    return student?.addresses?.[0] ?? null;
  }, [student]);

  const formattedCurrentAddress = React.useMemo(() => formatAddress(primaryAddress), [primaryAddress]);

  const [contactNumbers, setContactNumbers] = React.useState<string[]>(['']);
  const contactsInitialized = React.useRef(false);
  const [addressChanged, setAddressChanged] = React.useState<boolean>(false);
  const [newAddress, setNewAddress] = React.useState<AddressValue | null>(null);
  const [supportingDocument, setSupportingDocument] = React.useState<File | null>(null);
  const [transportation, setTransportation] = React.useState<string>('');
  const [otherTransportation, setOtherTransportation] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [addressSaveState, setAddressSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const addressSignatureRef = React.useRef<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!student || contactsInitialized.current) return;
    const mobileContacts = (student.contacts || [])
      .filter((contact) => contact.type === 'Mobile' && contact.value)
      .map((contact) => contact.value.trim())
      .filter(Boolean);

    if (mobileContacts.length > 0) {
      setContactNumbers(mobileContacts.slice(0, 2));
    } else {
      setContactNumbers(['']);
    }
    contactsInitialized.current = true;
  }, [student]);

  React.useEffect(() => {
    if (!addressChanged) {
      setNewAddress(null);
      setSupportingDocument(null);
    }
  }, [addressChanged]);

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

  const updateInfo = t.child.updateInfo;
  const summaryFields = updateInfo.addressSection.summaryFields;
  const summaryPlaceholder = updateInfo.addressSection.summaryPending;

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
    setSupportingDocument(file);
  };

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

    if (addressChanged && (!newAddress || !newAddress.emirateId || !newAddress.areaId)) {
      setErrorMessage(updateInfo.validation.addressDetails);
      return;
    }

    if (addressChanged && !supportingDocument) {
      setErrorMessage(updateInfo.validation.document);
      return;
    }

    if (!transportation) {
      setErrorMessage(updateInfo.validation.transportation);
      return;
    }

    if (transportation === 'other' && !otherTransportation.trim()) {
      setErrorMessage(updateInfo.validation.otherTransportation);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PreparedPayload = {
        studentId: sourcedId || '',
        mode,
        contactNumbers: sanitizedContacts.slice(0, 2),
        addressChanged,
        newAddress: addressChanged ? newAddress : null,
        documentName: supportingDocument ? supportingDocument.name : null,
        transportation: transportation === 'other' ? otherTransportation.trim() : transportation,
      };

      // Placeholder for future API integration.
      console.log('Update info submission', payload);

      await new Promise((resolve) => setTimeout(resolve, 400));

      if (sourcedId) {
        router.push(`/child/${encodeURIComponent(sourcedId)}/parent-conduct?studentId=${encodeURIComponent(sourcedId)}`);
      }
    } catch (submitError) {
      console.error(submitError);
      setErrorMessage(locale === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sourcedId) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {t.parentConduct.noStudentId}
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
        {t.child.no_data_available_for_child}
      </div>
    );
  }

  const displayName = locale === 'ar'
    ? [student.firstNameArabic, student.middleNameArabic, student.lastNameArabic].filter(Boolean).join(' ')
    : [
        student.firstNameEnglish,
        student.middleNameEnglish,
        student.thirdNameEnglish,
        student.fourthNameEnglish,
        student.familyNameEnglish,
      ]
        .filter(Boolean)
        .join(' ');

  return (
    <div className={clsx('min-h-screen bg-gradient-to-br from-background/40 via-background to-background/60', locale === 'ar' && 'direction-rtl')}>
      <div className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link
              href={`/child/${encodeURIComponent(sourcedId)}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {locale === 'ar' ? 'عودة إلى ملف الطالب' : 'Back to child profile'}
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mt-2">
              {updateInfo.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {mode === 'edit' ? updateInfo.intro.edit : updateInfo.intro.init}
            </p>
          </div>
          <Badge variant={mode === 'edit' ? 'destructive' : 'secondary'}>
            {mode === 'edit' ? updateInfo.modeLabel.edit : updateInfo.modeLabel.init}
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <Card className="border border-primary/20 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span>{displayName || sourcedId}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 text-sm text-muted-foreground">
              <div>
                <span className="block text-xs font-medium text-foreground/70 mb-1">
                  {t.child.sourced_id}
                </span>
                <span className="font-mono text-foreground">{student.id}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-foreground/70 mb-1">
                  {t.child.status}
                </span>
                <span className="capitalize">{student.status || '—'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-foreground/70 mb-1">
                  {t.child.role}
                </span>
                <span className="capitalize">{student.role || '—'}</span>
              </div>
            </CardContent>
          </Card>
          <RefreshBar
            swrKey={swrKey}
            meta={meta}
            labels={{
              lastUpdated: locale === 'ar' ? 'آخر تحديث:' : 'Last updated:',
              confirm: locale === 'ar' ? 'جلب بيانات حديثة؟' : 'Fetch fresh data?',
              refresh: locale === 'ar' ? 'تحديث' : 'Refresh',
              refreshing: locale === 'ar' ? 'جاري التحديث…' : 'Refreshing…',
              unknown: locale === 'ar' ? 'غير معروف' : 'unknown',
            }}
          />
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-sm border border-border/60">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {updateInfo.contactSection.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {updateInfo.contactSection.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactNumbers.map((number, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`contact-${index}`} className="text-sm font-medium">
                    {index === 0
                      ? updateInfo.contactSection.primaryLabel
                      : updateInfo.contactSection.secondaryLabel}
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id={`contact-${index}`}
                      type="tel"
                      inputMode="tel"
                      value={number}
                      onChange={(event) => handleContactChange(index, event.target.value)}
                      placeholder="05XXXXXXXX"
                      className="flex-1"
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRemoveContact(index)}
                      >
                        {updateInfo.contactSection.removeButton}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {contactNumbers.length < 2 && (
                <Button type="button" variant="secondary" onClick={handleAddContact}>
                  {updateInfo.contactSection.addButton}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-border/60">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {updateInfo.addressSection.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {updateInfo.addressSection.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium block mb-2">
                  {updateInfo.addressSection.currentLabel}
                </Label>
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {formattedCurrentAddress || t.child.no_address_available}
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={addressChanged}
                  onChange={(event) => setAddressChanged(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>{updateInfo.addressSection.changeToggle}</span>
              </label>

              {addressChanged && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">
                      {updateInfo.addressSection.newAddressLabel}
                    </Label>
                    <AddressPicker
                      value={newAddress ?? undefined}
                      onChange={(value) => setNewAddress(value)}
                      disabled={!addressChanged}
                      required={{ emirate: true, area: true }}
                    />
                  </div>
                  <div className="p-4 rounded-lg border border-border/70 bg-muted/30 h-full">
                    <div className="text-sm font-medium mb-3">
                      {updateInfo.addressSection.summaryLabel}
                    </div>
                    <dl className="space-y-2 text-sm text-muted-foreground">
                      {summaryRows.map((row) =>
                        row.value ? (
                          <div key={row.label} className="flex justify-between gap-3">
                            <dt className="font-medium text-foreground/80">{row.label}</dt>
                            <dd className="text-right">{row.value}</dd>
                          </div>
                        ) : null
                      )}
                      {summaryRows.every((row) => !row.value) && (
                        <div className="text-sm text-muted-foreground/80 italic">
                          {summaryPlaceholder}
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address-document" className="text-sm font-medium">
                  {updateInfo.addressSection.documentLabel}
                </Label>
                <Input
                  id="address-document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={!addressChanged}
                  onChange={handleFileChange}
                  className={clsx('cursor-pointer', !addressChanged && 'opacity-80 cursor-not-allowed')}
                />
                <p className="text-xs text-muted-foreground">
                  {supportingDocument
                    ? `${updateInfo.fileNameLabel}: ${supportingDocument.name}`
                    : updateInfo.noFileSelected}
                </p>
                <p className="text-xs text-muted-foreground">
                  {updateInfo.addressSection.documentHelper}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-border/60">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {updateInfo.transportationSection.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {updateInfo.transportationSection.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {updateInfo.transportationSection.selectLabel}
                </Label>
                <Select value={transportation} onValueChange={(value) => setTransportation(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر طريقة المواصلات' : 'Select a method'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">{updateInfo.transportationSection.options.car}</SelectItem>
                    <SelectItem value="bus">{updateInfo.transportationSection.options.bus}</SelectItem>
                    <SelectItem value="public">{updateInfo.transportationSection.options.public}</SelectItem>
                    <SelectItem value="other">{updateInfo.transportationSection.options.other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {transportation === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="other-transportation" className="text-sm font-medium">
                    {updateInfo.transportationSection.otherLabel}
                  </Label>
                  <Input
                    id="other-transportation"
                    value={otherTransportation}
                    onChange={(event) => setOtherTransportation(event.target.value)}
                    placeholder={locale === 'ar' ? 'اكتب تفاصيل طريقة المواصلات' : 'Describe the arrangement'}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/child/${encodeURIComponent(sourcedId)}`)}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {updateInfo.submit.cancel}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? updateInfo.submit.submitting : updateInfo.submit.continue}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
