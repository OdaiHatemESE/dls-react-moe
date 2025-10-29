export type ChildActionKey = string;

export type ChildActionLegacyVariant = "primary" | "secondary" | "neutral" | "download";

export type ChildActionVariant = "solid" | "outline" | "ghost" | "link";

export type ChildActionColor = "primary" | "secondary" | "info" | "success" | "warning" | "danger" | "neutral";

export type ChildActionType = "href" | "event" | "download";

export type LocalizedText = {
  en: string;
  ar: string;
};

export type LocalizedInput = string | Partial<LocalizedText> | null | undefined;

export interface ChildActionDisplay {
  label: LocalizedText;
  description?: LocalizedText;
  shortLabel?: LocalizedText;
  labelKey?: string | null;
  descriptionKey?: string | null;
}

export interface AdminActionConfigSchema {
  schemaVersion?: number;
  display?: {
    label?: LocalizedInput;
    shortLabel?: LocalizedInput;
    description?: LocalizedInput;
    labelKey?: string | null;
    descriptionKey?: string | null;
  };
  style?: {
    icon?: string | null;
    color?: string | null;
    variant?: string | null;
  };
  action?: {
    type?: string | null;
    href?: string | null;
    hrefTemplate?: string | null;
    handlerKey?: string | null;
    payload?: Record<string, unknown> | null;
    downloadFileName?: string | null;
  };
  availability?: {
    status?: {
      include?: Array<number | null> | null;
      exclude?: Array<number | null> | null;
    };
    requiresUpdatePeriod?: boolean;
    requiresPdf?: boolean;
    requiresPdfMode?: "disable" | "hide";
    requiresPdfReason?: LocalizedInput;
    requiresConductSignature?: "signed" | "unsigned" | "any";
  };
  metadata?: Record<string, unknown> | null;
  order?: number | null;
}

export interface ChildActionStyle {
  icon?: string | null;
  color?: ChildActionColor;
  variant?: ChildActionVariant;
}

export interface ChildActionAction {
  type: ChildActionType;
  href?: string;
  handlerKey?: string | null;
  payload?: Record<string, unknown> | null;
  downloadFileName?: string | null;
}

export interface ChildActionDescriptor {
  key: ChildActionKey;
  labelKey?: string;
  label: string;
  description?: string | null;
  href?: string;
  variant?: ChildActionLegacyVariant;
  disabled?: boolean;
  hidden?: boolean;
  reasonKey?: string | null;
  reason?: string | null;
  display: ChildActionDisplay;
  style: ChildActionStyle;
  action: ChildActionAction;
  disabledReason?: LocalizedText | null;
  order?: number | null;
  metadata?: Record<string, unknown> | null;
  configId?: number | null;
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

export type ChildActionIdhDebugShape = "empty" | "object" | "array" | "string" | "number" | "boolean" | "unknown";

export type ChildActionIdhDebugSource = "root" | "data" | "array" | "none";

export interface ChildActionIdhDebug {
  statusId: number | null;
  fetchedAt: string | null;
  upstreamStatus: number;
  parsedShape: ChildActionIdhDebugShape;
  extractedFrom: ChildActionIdhDebugSource;
  statusKey?: string;
  keys?: string[];
  arrayLength?: number;
  warning?: string;
  bodyPreview?: string | null;
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
  idhDebug?: ChildActionIdhDebug;
  actions: ChildActionDescriptor[];
  statusBanner: ChildStatusBannerDescriptor | null;
  badge: ChildStatusBadgeDescriptor | null;
  downloads: ChildActionDownloadsDescriptor;
  reasons: string[];
}
