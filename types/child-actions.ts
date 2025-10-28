export type ChildActionKey = "update-info" | "sign-conduct" | "view-profile" | "download-conduct";

export type ChildActionVariant = "primary" | "secondary" | "neutral" | "download";

export interface ChildActionDescriptor {
  key: ChildActionKey;
  labelKey: string;
  label: string;
  href?: string;
  variant: ChildActionVariant;
  disabled?: boolean;
  reasonKey?: string | null;
  reason?: string | null;
}

export interface ChildStatusBannerDescriptor {
  key: string;
  messageKey: string;
  message: string;
  severity: "info" | "warning" | "success";
}

export interface ChildStatusBadgeDescriptor {
  key: string;
  labelKey: string;
  label: string;
  tooltipKey?: string | null;
  tooltip?: string | null;
  tone: "urgent" | "info";
}

export interface ChildActionDownloadsDescriptor {
  conductPdfAvailable: boolean;
}

export interface ChildActionStudentSummary {
  studentPersonId: string;
  parentPersonId: string | null;
  studentEmirateId: string | null;
  educationType: string | null;
}

export interface ChildActionUpdateRequest {
  id: number | null;
  studentPersonId: string;
  parentPersonId: string | null;
  isInfoUpdateRequested: boolean;
  infoUpdateRequestStatus: number | null;
  isConductAgreementSigned: boolean;
  conductAgreementStatus: number | null;
  studentEmirateId: string | null;
  pdfBase64: string | null;
  citizenship: string | null;
  createAt: string | null;
  updateAt: string | null;
}

export interface ChildActionResponse {
  ok: boolean;
  error?: string;
  student: ChildActionStudentSummary;
  educationType: string | null;
  updatePeriodActive: boolean;
  updateRequest: ChildActionUpdateRequest;
  idhStatusId: number | null;
  idhFetchedAt: string | null;
  actions: ChildActionDescriptor[];
  statusBanner: ChildStatusBannerDescriptor | null;
  badge: ChildStatusBadgeDescriptor | null;
  downloads: ChildActionDownloadsDescriptor;
  reasons: string[];
}
