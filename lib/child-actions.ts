import "server-only";

import type { StudentActionConfig } from "@prisma/client-parent-portal";
import { prismaParent } from "@/lib/prisma-parent";
import { isUpdatePeriodActive, getActiveAcademicYearValue } from "@/lib/admin-config";
import type {
  ChildActionDescriptor,
  ChildActionResponse,
  ChildActionStudentSummary,
  ChildActionUpdateRequest,
  ChildStatusBannerDescriptor,
  ChildActionDisplay,
  ChildActionStyle,
  ChildActionAction,
  ChildActionVariant,
  ChildActionLegacyVariant,
  ChildActionType,
  ChildActionColor,
  LocalizedText,
  AdminActionConfigSchema,
  LocalizedInput,
} from "@/types/child-actions";

type ChildActionRequestOptions = {
  studentPersonId: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  educationTypeHint?: string | null;
  schoolYearHint?: string | null;
  idhStatusId?: number | null;
  idhFetchedAt?: string | null;
  activeAcademicYear?: number | null;
  updatePeriodActive?: boolean;
};

type ResolveContext = {
  student: ChildActionStudentSummary;
  updatePeriodActive: boolean;
  updateRequest: ChildActionUpdateRequest;
  configs: StudentActionConfig[];
  idhStatusId: number | null;
  idhFetchedAt: string | null;
};

const DEFAULT_PDF_REASON: LocalizedText = {
  en: "Conduct PDF not available yet.",
  ar: "ملف السلوك غير متوفر بعد.",
};

const UPDATE_DISABLED_REASON: LocalizedText = {
  en: "Updates temporarily disabled.",
  ar: "تم إيقاف التحديثات مؤقتًا.",
};

const UPDATE_DISABLED_REASON_KEY = "childActions.reasons.updateDisabled";
const PDF_UNAVAILABLE_REASON_KEY = "childActions.reasons.pdfUnavailable";

type ParsedAvailability = {
  includeStatuses: Array<number | null> | null;
  excludeStatuses: Array<number | null> | null;
  requiresUpdatePeriod: boolean;
  requiresPdf: boolean;
  requiresPdfMode: "disable" | "hide";
  requiresPdfReason: LocalizedText | null;
  requiresConductSignature: "signed" | "unsigned" | "any";
};

type ParsedActionConfig = {
  row: StudentActionConfig;
  display: ChildActionDisplay;
  style: ChildActionStyle;
  action: ChildActionAction & { hrefTemplate: string | null };
  availability: ParsedAvailability;
  metadata: Record<string, unknown> | null;
  order: number;
};

const DEFAULT_LABELS: Record<string, LocalizedText> = {
  "update-info": { en: "Update Information", ar: "تحديث المعلومات" },
  "sign-conduct": { en: "Sign Conduct", ar: "توقيع الميثاق" },
  "download-conduct": { en: "Download Conduct", ar: "تحميل الميثاق" },
  "view-profile": { en: "View Profile", ar: "عرض الملف" },
};

const DEFAULT_DESCRIPTIONS: Record<string, LocalizedText> = {
  "update-info": {
    en: "Refresh contact, address, and transportation details.",
    ar: "حدِّث أرقام التواصل والعنوان وطريقة المواصلات.",
  },
  "sign-conduct": {
    en: "Review and digitally sign the school conduct charter.",
    ar: "راجع ووقع على ميثاق السلوك المدرسي رقميًا.",
  },
  "download-conduct": {
    en: "Download a copy of the signed conduct agreement.",
    ar: "حمّل نسخة من اتفاقية السلوك الموقعة.",
  },
  "view-profile": {
    en: "Review full student profile details in one place.",
    ar: "استعرض معلومات ملف الطالب كاملة في مكان واحد.",
  },
};

const DEFAULT_ICONS: Record<string, string> = {
  "update-info": "edit-3",
  "sign-conduct": "signature",
  "download-conduct": "download",
  "view-profile": "eye",
};

const FALLBACK_CONFIGS: Record<string, AdminActionConfigSchema> = {
  "update-info": {
    display: {
      label: DEFAULT_LABELS["update-info"],
      description: DEFAULT_DESCRIPTIONS["update-info"],
      labelKey: "childActions.updateInfo",
    },
    style: {
      icon: DEFAULT_ICONS["update-info"],
      color: "primary",
      variant: "solid",
    },
    action: {
      type: "href",
      hrefTemplate: "/child/:studentPersonId/update-info?mode=:updateMode",
    },
    availability: {
      status: { include: [null, 2, 5] },
      requiresUpdatePeriod: true,
    },
  },
  "sign-conduct": {
    display: {
      label: DEFAULT_LABELS["sign-conduct"],
      description: DEFAULT_DESCRIPTIONS["sign-conduct"],
      labelKey: "childActions.signConduct",
    },
    style: {
      icon: DEFAULT_ICONS["sign-conduct"],
      color: "primary",
      variant: "solid",
    },
    action: {
      type: "href",
      hrefTemplate: "/child/:studentPersonId/parent-conduct",
    },
    availability: {
      // REMOVED: status requirement - conduct signature is independent of IDH status
      requiresConductSignature: "unsigned",
    },
  },
  "download-conduct": {
    display: {
      label: DEFAULT_LABELS["download-conduct"],
      description: DEFAULT_DESCRIPTIONS["download-conduct"],
      labelKey: "childActions.downloadConduct",
    },
    style: {
      icon: DEFAULT_ICONS["download-conduct"],
      color: "info",
      variant: "solid",
    },
    action: {
      type: "download",
      handlerKey: "conduct-pdf",
      downloadFileName: "conduct-agreement-:studentPersonId.pdf",
    },
    availability: {
      // REMOVED: status requirement - PDF download is independent of IDH status
      requiresPdf: true,
      requiresPdfMode: "disable",
      requiresPdfReason: DEFAULT_PDF_REASON,
    },
  },
  "view-profile": {
    display: {
      label: DEFAULT_LABELS["view-profile"],
      description: DEFAULT_DESCRIPTIONS["view-profile"],
      labelKey: "childActions.viewProfile",
    },
    style: {
      icon: DEFAULT_ICONS["view-profile"],
      color: "neutral",
      variant: "outline",
    },
    action: {
      type: "href",
      hrefTemplate: "/child/:studentPersonId",
    },
    availability: {},
  },
};

export async function getChildActionsSummary(options: ChildActionRequestOptions): Promise<ChildActionResponse> {
  const { studentPersonId } = options;
  if (!studentPersonId) {
    throw new Error("studentPersonId is required");
  }

  const parentPersonId = options.parentPersonId ?? null;
  const studentEmirateId = options.studentEmirateId ?? null;
  const schoolYear = options.schoolYearHint ?? null;

  const activeAcademicYearPromise =
    options.activeAcademicYear !== undefined
      ? Promise.resolve(options.activeAcademicYear)
      : getActiveAcademicYearValue();

  const updatePeriodActivePromise =
    options.updatePeriodActive !== undefined
      ? Promise.resolve(options.updatePeriodActive)
      : isUpdatePeriodActive();

  const [activeAcademicYear, educationType, periodActive] = await Promise.all([
    activeAcademicYearPromise,
    Promise.resolve(options.educationTypeHint ?? null),
    updatePeriodActivePromise,
  ]);

  // Validate schoolYear against active academic year if both are available
  const isActiveYear = schoolYear && activeAcademicYear 
    ? String(activeAcademicYear) === schoolYear
    : true;

  console.debug("Active academic year:", activeAcademicYear, "Student's schoolYear:", schoolYear, "Is active:", isActiveYear);

  // Load configs based on education type
  const configs = await loadActionConfigs(educationType);

  const updateRequest = buildUpdateRequestFromIdh({
    studentPersonId,
    parentPersonId,
    studentEmirateId,
    idhStatusId: options.idhStatusId ?? null,
    idhFetchedAt: options.idhFetchedAt ?? null,
  });

  const student: ChildActionStudentSummary = {
    studentPersonId,
    parentPersonId,
    studentEmirateId,
    educationType,
  };

  const context: ResolveContext = {
    student,
    updatePeriodActive: periodActive,
    updateRequest,
    configs,
    idhStatusId: options.idhStatusId ?? null,
    idhFetchedAt: options.idhFetchedAt ?? null,
  };

  return resolveChildActions(context);
}

// No longer needed - educationType comes from enrollment data passed as hint
// async function resolveEducationType removed

async function loadActionConfigs(educationTypeHint: string | null): Promise<StudentActionConfig[]> {
  if (!educationTypeHint) return [];

  const candidates = [educationTypeHint, educationTypeHint.toLowerCase(), educationTypeHint.toUpperCase()]
    .map((value) => value.trim())
    .filter((value, index, self) => value.length > 0 && self.indexOf(value) === index);

  for (const candidate of candidates) {
    const rows = await prismaParent.studentActionConfig.findMany({
      where: { educationType: candidate },
      orderBy: { displayOrder: "asc" },
    });

    if (rows.length) {
      return rows;
    }
  }

  return [];
}

function buildUpdateRequestFromIdh(input: {
  studentPersonId: string;
  parentPersonId: string | null;
  studentEmirateId: string | null;
  idhStatusId: number | null;
  idhFetchedAt: string | null;
}): ChildActionUpdateRequest {
  const status = typeof input.idhStatusId === "number" ? input.idhStatusId : null;
  const hasActiveRequest = status !== null && status !== 2 && status !== 5;

  return {
    id: null,
    studentPersonId: input.studentPersonId,
    parentPersonId: input.parentPersonId,
    isInfoUpdateRequested: hasActiveRequest,
    infoUpdateRequestStatus: status,
    isConductAgreementSigned: false,
    conductAgreementStatus: null,
    studentEmirateId: input.studentEmirateId,
    pdfBase64: null,
    citizenship: null,
    createAt: input.idhFetchedAt ?? null,
    updateAt: input.idhFetchedAt ?? null,
  };
}

function resolveChildActions(context: ResolveContext): ChildActionResponse {
  const { student, updatePeriodActive, updateRequest, configs, idhStatusId } = context;
  const status = typeof idhStatusId === "number" ? idhStatusId : null;
  const hasPdf = !!updateRequest.pdfBase64;
  const debugLogsEnabled = process.env.CHILD_ACTIONS_DEBUG === "true";

  if (debugLogsEnabled) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎬 RESOLVING CHILD ACTIONS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Context:");
    console.log("  Student ID:", student.studentPersonId);
    console.log("  Education Type:", student.educationType ?? "null");
    console.log("  IDH Status ID:", status === null ? "null (no record)" : status);
    console.log("  Status Meaning:", getStatusMeaning(status));
    console.log("  Update Period Active:", updatePeriodActive ? "✅ YES" : "❌ NO");
    console.log("  Has PDF:", hasPdf ? "✅ YES" : "❌ NO");
    console.log("  Conduct Signed:", updateRequest.isConductAgreementSigned ? "✅ YES" : "❌ NO");
    console.log("  Configs Loaded:", configs.length);
  }

  const reasons = new Set<string>();
  const actionsFromConfig = buildConfiguredActions(context, configs, status, hasPdf, reasons);

  let actions = actionsFromConfig;
  if (!actions.length) {
    if (debugLogsEnabled) {
      console.log("⚠️  No configured actions found, using fallback");
    }
    actions = [buildFallbackViewProfileAction(student)];
  }

  let statusBanner = deriveStatusBannerForStatus(status);
  if (!updatePeriodActive) {
    statusBanner = null;
  }

  if (debugLogsEnabled) {
    console.log("\n🎯 RESOLVED ACTIONS:");
    actions.forEach((action, index) => {
      console.log(`\n  [${index + 1}] ${action.key.toUpperCase()}`);
      console.log(`      Label: ${action.label}`);
      console.log(`      Type: ${action.action.type}`);
      console.log(`      Hidden: ${action.hidden ? "🚫 YES" : "✅ NO"}`);
      console.log(`      Disabled: ${action.disabled ? "🔒 YES" : "✅ NO"}`);
      if (action.disabled && action.disabledReason) {
        console.log(`      Reason: ${action.disabledReason.en}`);
      }
      console.log(`      Href: ${action.href ?? "N/A"}`);
      console.log(`      Variant: ${action.variant ?? "default"}`);
      console.log(`      Color: ${action.style.color ?? "default"}`);
    });

    console.log("📢 BANNER:", statusBanner ? `${statusBanner.message} (${statusBanner.severity})` : "None");
    console.log("💾 DOWNLOADS:", hasPdf ? "Conduct PDF available" : "No PDFs");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  return {
    ok: true,
    student,
    educationType: student.educationType,
    updatePeriodActive,
    updateRequest,
    idhStatusId: status,
    idhFetchedAt: context.idhFetchedAt,
    actions,
    statusBanner,
    badge: null,
    downloads: { conductPdfAvailable: hasPdf },
    reasons: Array.from(reasons),
  };
}

function getStatusMeaning(status: number | null): string {
  switch (status) {
    case null:
      return "No record (never submitted)";
    case 1:
      return "Pending review";
    case 2:
      return "Approved/Completed";
    case 3:
      return "Under review";
    case 4:
      return "Approved - Signature needed";
    case 5:
      return "Rejected";
    default:
      return `Unknown status (${status})`;
  }
}

function buildConfiguredActions(
  context: ResolveContext,
  configs: StudentActionConfig[],
  status: number | null,
  hasPdf: boolean,
  reasons: Set<string>
): ChildActionDescriptor[] {
  if (!configs.length) {
    return [];
  }

  const parsed = configs
    .filter((cfg) => cfg.isEnabled !== false)
    .map(parseStudentActionConfig)
    .filter((cfg): cfg is ParsedActionConfig => cfg !== null);

  if (!parsed.length) {
    return [];
  }

  const descriptors: ChildActionDescriptor[] = [];

  for (const config of parsed) {
    const descriptor = buildDescriptorFromConfig(config, context, status, hasPdf);
    if (!descriptor) {
      continue;
    }

    if (!descriptor.hidden) {
      if (descriptor.disabledReason?.en) {
        reasons.add(descriptor.disabledReason.en);
      } else if (descriptor.reason) {
        reasons.add(descriptor.reason);
      }
    }

    descriptors.push(descriptor);
  }

  descriptors.sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.key.localeCompare(b.key);
  });

  return descriptors;
}

function parseStudentActionConfig(row: StudentActionConfig): ParsedActionConfig | null {
  const rawJson = row.configJson?.trim();
  let schema: AdminActionConfigSchema | null = null;

  if (rawJson) {
    try {
      schema = JSON.parse(rawJson) as AdminActionConfigSchema;
    } catch (error) {
      console.error("Failed to parse StudentActionConfig.configJson", { id: row.id, error });
    }
  }

  if (!schema) {
    schema = FALLBACK_CONFIGS[row.actionKey] ?? null;
  }

  if (!schema) {
    schema = {};
  }

  const fallbackLabel = DEFAULT_LABELS[row.actionKey] ?? {
    en: row.actionName ?? row.actionKey,
    ar: row.actionName ?? row.actionKey,
  };

  const label = normalizeLocalizedText(schema.display?.label, fallbackLabel);
  const description = normalizeOptionalLocalizedText(
    schema.display?.description,
    DEFAULT_DESCRIPTIONS[row.actionKey]
  );
  const shortLabel = normalizeOptionalLocalizedText(schema.display?.shortLabel, undefined);

  const display: ChildActionDisplay = {
    label,
    description,
    shortLabel,
    labelKey: schema.display?.labelKey ?? null,
    descriptionKey: schema.display?.descriptionKey ?? null,
  };

  const icon = schema.style?.icon ?? DEFAULT_ICONS[row.actionKey] ?? null;
  const color = normalizeColor(schema.style?.color, schema.action?.type === "download" ? "info" : "primary");
  const variant = normalizeVariant(schema.style?.variant);

  const style: ChildActionStyle = {
    icon,
    color,
    variant,
  };

  const actionType = normalizeActionType(schema.action?.type);
  const hrefTemplate = schema.action?.hrefTemplate ?? schema.action?.href ?? null;
  const payload = schema.action?.payload ?? null;
  const downloadFileName = schema.action?.downloadFileName ?? null;

  const action: ChildActionAction & { hrefTemplate: string | null } = {
    type: actionType,
    href: undefined,
    handlerKey: schema.action?.handlerKey ?? null,
    payload,
    downloadFileName,
    hrefTemplate,
  };

  const availability = normalizeAvailability(schema.availability);
  const metadata = schema.metadata ?? null;
  const order = typeof schema.order === "number" ? schema.order : row.displayOrder ?? 0;

  return {
    row,
    display,
    style,
    action,
    availability,
    metadata,
    order,
  };
}

function buildDescriptorFromConfig(
  config: ParsedActionConfig,
  context: ResolveContext,
  status: number | null,
  hasPdf: boolean
): ChildActionDescriptor | null {
  const availability = config.availability;

  let hidden = false;
  let disabled = false;
  let disabledReason: LocalizedText | null = null;
  let reasonKey: string | null = null;

  console.log(`\n  🔍 Evaluating action: ${config.row.actionKey}`);
  console.log(`     Current status: ${status}`);

  // Check status inclusion
  if (availability.includeStatuses && !availability.includeStatuses.some((value) => value === status)) {
    console.log(`     ❌ HIDDEN: Status ${status} not in include list [${availability.includeStatuses.join(", ")}]`);
    hidden = true;
  }

  // Check status exclusion
  if (availability.excludeStatuses && availability.excludeStatuses.some((value) => value === status)) {
    console.log(`     ❌ HIDDEN: Status ${status} in exclude list [${availability.excludeStatuses.join(", ")}]`);
    hidden = true;
  }

  // Check conduct signature requirements
  if (availability.requiresConductSignature === "signed" && !context.updateRequest.isConductAgreementSigned) {
    console.log(`     ❌ HIDDEN: Requires signed conduct but not signed`);
    hidden = true;
  }

  if (availability.requiresConductSignature === "unsigned" && context.updateRequest.isConductAgreementSigned) {
    console.log(`     ❌ HIDDEN: Requires unsigned conduct but already signed`);
    hidden = true;
  }

  // Check update period requirement
  if (availability.requiresUpdatePeriod && !context.updatePeriodActive) {
    console.log(`     🔒 DISABLED: Requires update period but period is closed`);
    disabled = true;
    disabledReason = UPDATE_DISABLED_REASON;
    reasonKey = UPDATE_DISABLED_REASON_KEY;
  }

  // Check PDF requirement
  if (availability.requiresPdf && !hasPdf) {
    if (availability.requiresPdfMode === "hide") {
      console.log(`     ❌ HIDDEN: Requires PDF but not available (mode: hide)`);
      hidden = true;
    } else {
      console.log(`     🔒 DISABLED: Requires PDF but not available (mode: disable)`);
      disabled = true;
      disabledReason = availability.requiresPdfReason ?? DEFAULT_PDF_REASON;
      if (!availability.requiresPdfReason) {
        reasonKey = PDF_UNAVAILABLE_REASON_KEY;
      }
    }
  }

  const templateContext = buildTemplateContext(context.student, status);

  const resolvedHref = resolveTemplateValue(config.action.hrefTemplate, templateContext);
  const resolvedPayload = resolvePayloadTemplates(config.action.payload, templateContext);
  const resolvedDownloadFileName = resolveTemplateValue(config.action.downloadFileName ?? null, templateContext);

  if (config.action.type === "href" && !resolvedHref) {
    console.log(`     ❌ HIDDEN: Action type is href but no href resolved`);
    hidden = true;
  }

  if (config.action.type !== "href" && !config.action.handlerKey && !resolvedHref) {
    console.log(`     ❌ HIDDEN+DISABLED: No handler or href for non-href action`);
    hidden = true;
    disabled = true;
  }

  if (config.action.type === "href" && !resolvedHref) {
    disabled = true;
  }

  console.log(`     Result: ${hidden ? "🚫 HIDDEN" : disabled ? "🔒 DISABLED" : "✅ ENABLED"}`);
  if (resolvedHref) {
    console.log(`     Href: ${resolvedHref}`);
  }

  const action: ChildActionAction = {
    type: config.action.type,
    href: resolvedHref,
    handlerKey: config.action.handlerKey ?? null,
    payload: resolvedPayload,
    downloadFileName: resolvedDownloadFileName ?? config.action.downloadFileName ?? null,
  };

  const label = config.display.label.en || config.display.label.ar;

  const descriptor: ChildActionDescriptor = {
    key: config.row.actionKey,
    labelKey: config.display.labelKey ?? undefined,
    label,
    description: config.display.description?.en ?? null,
    href: resolvedHref,
    variant: mapLegacyVariant(config.style.variant, config.action.type),
    disabled,
    hidden,
    reasonKey,
    reason: disabledReason ? disabledReason.en : null,
    display: config.display,
    style: config.style,
    action,
    disabledReason,
    order: config.order,
    metadata: config.metadata,
    configId: config.row.id,
  };

  return descriptor;
}

function normalizeAvailability(input: AdminActionConfigSchema["availability"] | undefined): ParsedAvailability {
  const includeStatuses = normalizeStatusList(input?.status?.include);
  const excludeStatuses = normalizeStatusList(input?.status?.exclude);
  const requiresUpdatePeriod = Boolean(input?.requiresUpdatePeriod);
  const requiresPdf = Boolean(input?.requiresPdf);
  const requiresPdfMode = input?.requiresPdfMode === "hide" ? "hide" : "disable";
  const requiresPdfReason = requiresPdf
    ? normalizeOptionalLocalizedText(input?.requiresPdfReason, DEFAULT_PDF_REASON) ?? DEFAULT_PDF_REASON
    : null;
  const requiresConductSignature =
    input?.requiresConductSignature === "signed" || input?.requiresConductSignature === "unsigned"
      ? input.requiresConductSignature
      : "any";

  return {
    includeStatuses,
    excludeStatuses,
    requiresUpdatePeriod,
    requiresPdf,
    requiresPdfMode,
    requiresPdfReason,
    requiresConductSignature,
  };
}

function normalizeStatusList(values: Array<number | null> | null | undefined): Array<number | null> | null {
  if (!Array.isArray(values)) {
    return null;
  }

  const normalized: Array<number | null> = [];
  for (const value of values) {
    const normalizedValue = normalizeStatusValue(value as unknown);
    if (normalizedValue !== undefined) {
      normalized.push(normalizedValue);
    }
  }

  return normalized.length ? normalized : null;
}

function normalizeStatusValue(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (trimmed.toLowerCase() === "null") {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeLocalizedText(input: LocalizedInput, fallback: LocalizedText): LocalizedText {
  if (!input) {
    return { ...fallback };
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      return { ...fallback };
    }
    return { en: trimmed, ar: trimmed };
  }

  const en = typeof input.en === "string" && input.en.trim().length ? input.en : fallback.en;
  const ar = typeof input.ar === "string" && input.ar.trim().length ? input.ar : en || fallback.ar;

  return { en, ar };
}

function normalizeOptionalLocalizedText(input: LocalizedInput, fallback?: LocalizedText): LocalizedText | undefined {
  if (!input) {
    return fallback ? { ...fallback } : undefined;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      return fallback ? { ...fallback } : undefined;
    }
    return { en: trimmed, ar: trimmed };
  }

  const hasEn = typeof input.en === "string" && input.en.trim().length;
  const hasAr = typeof input.ar === "string" && input.ar.trim().length;

  if (!hasEn && !hasAr) {
    return fallback ? { ...fallback } : undefined;
  }

  const fallbackEn = fallback?.en ?? (hasAr ? (input.ar as string) : "");
  const en = hasEn ? (input.en as string) : fallbackEn;
  const fallbackAr = fallback?.ar ?? "";
  const ar = hasAr ? (input.ar as string) : en || fallbackAr;

  return { en, ar };
}

const VALID_COLORS: ChildActionColor[] = ["primary", "secondary", "info", "success", "warning", "danger", "neutral"];

function normalizeColor(value: string | null | undefined, fallback: ChildActionColor): ChildActionColor {
  if (value) {
    const normalized = value.trim().toLowerCase();
    if (VALID_COLORS.includes(normalized as ChildActionColor)) {
      return normalized as ChildActionColor;
    }
  }
  return fallback;
}

const VALID_VARIANTS: ChildActionVariant[] = ["solid", "outline", "ghost", "link"];

function normalizeVariant(value: string | null | undefined): ChildActionVariant {
  if (value) {
    const normalized = value.trim().toLowerCase();
    if (VALID_VARIANTS.includes(normalized as ChildActionVariant)) {
      return normalized as ChildActionVariant;
    }
  }
  return "solid";
}

function normalizeActionType(value: string | null | undefined): ChildActionType {
  if (value) {
    const normalized = value.trim().toLowerCase();
    if (normalized === "href" || normalized === "download" || normalized === "event") {
      return normalized;
    }
  }
  return "href";
}

function buildTemplateContext(student: ChildActionStudentSummary, status: number | null): Record<string, string> {
  const hasIdhRecord = status !== null;
  const updateMode = hasIdhRecord ? "resubmit" : "init";

  return {
    studentId: student.studentPersonId,
    studentPersonId: student.studentPersonId,
    parentPersonId: student.parentPersonId ?? "",
    studentEmirateId: student.studentEmirateId ?? "",
    educationType: student.educationType ?? "",
    updateMode,
    idhStatusId: status !== null ? String(status) : "",
  };
}

function resolveTemplateValue(template: string | null, context: Record<string, string>): string | undefined {
  if (!template) {
    return undefined;
  }

  const result = template.replace(/:([A-Za-z0-9_]+)/g, (_, token: string) => context[token] ?? "").trim();
  return result.length ? result : undefined;
}

function resolvePayloadTemplates(
  payload: Record<string, unknown> | null | undefined,
  context: Record<string, string>
): Record<string, unknown> | null {
  if (!payload) {
    return null;
  }

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    resolved[key] = resolvePayloadValue(value, context);
  }

  return resolved;
}

function resolvePayloadValue(value: unknown, context: Record<string, string>): unknown {
  if (typeof value === "string") {
    return templateReplace(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => resolvePayloadValue(entry, context));
  }

  if (value && typeof value === "object") {
    const nested: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value)) {
      nested[key] = resolvePayloadValue(entryValue, context);
    }
    return nested;
  }

  return value;
}

function templateReplace(template: string, context: Record<string, string>): string {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_, token: string) => context[token] ?? "");
}

function mapLegacyVariant(variant: ChildActionVariant | undefined, type: ChildActionType): ChildActionLegacyVariant {
  if (type === "download") {
    return "download";
  }

  switch (variant) {
    case "outline":
      return "secondary";
    case "ghost":
    case "link":
      return "neutral";
    default:
      return "primary";
  }
}

function buildFallbackViewProfileAction(student: ChildActionStudentSummary): ChildActionDescriptor {
  const label = DEFAULT_LABELS["view-profile"] ?? { en: "View Profile", ar: "عرض الملف" };
  const description = DEFAULT_DESCRIPTIONS["view-profile"];
  const href = `/child/${student.studentPersonId}`;

  return {
    key: "view-profile",
    labelKey: "childActions.viewProfile",
    label: label.en,
    description: description?.en ?? null,
    href,
    variant: "secondary",
    disabled: false,
    hidden: false,
    reasonKey: null,
    reason: null,
    display: {
      label,
      description,
      shortLabel: undefined,
      labelKey: "childActions.viewProfile",
      descriptionKey: null,
    },
    style: {
      icon: DEFAULT_ICONS["view-profile"],
      color: "neutral",
      variant: "outline",
    },
    action: {
      type: "href",
      href,
      handlerKey: null,
      payload: null,
      downloadFileName: null,
    },
    disabledReason: null,
    order: Number.MAX_SAFE_INTEGER,
    metadata: null,
    configId: null,
  };
}

function deriveStatusBannerForStatus(status: number | null): ChildStatusBannerDescriptor | null {
  console.log(`\n📢 Deriving status banner for status: ${status}`);
  
  if (status === 1 || status === 3) {
    console.log(`   ✅ Banner: "In Progress" (status ${status})`);
    return {
      key: "childActions.status.inProgress",
      messageKey: "childActions.status.inProgress",
      message: "Update request in progress...",
      severity: "info",
    };
  }

  console.log(`   ℹ️  No banner for status ${status}`);
  return null;
}

