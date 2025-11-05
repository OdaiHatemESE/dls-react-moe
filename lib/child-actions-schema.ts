/**
 * Response schema validation for child actions API
 */

import { z } from 'zod';

// IDH Debug Schema
const IdhDebugSchema = z.object({
  statusId: z.number().nullable(),
  fetchedAt: z.string().nullable(),
  upstreamStatus: z.number(),
  parsedShape: z.enum(['empty', 'string', 'number', 'boolean', 'array', 'object', 'unknown']),
  extractedFrom: z.enum(['none', 'root', 'data', 'array']),
  statusKey: z.string().optional(),
  keys: z.array(z.string()).optional(),
  arrayLength: z.number().optional(),
  warning: z.string().optional(),
  bodyPreview: z.string().nullable().optional(),
});

const LocalizedTextSchema = z.object({
  en: z.string(),
  ar: z.string(),
});

const ChildActionDisplaySchema = z.object({
  label: LocalizedTextSchema,
  description: LocalizedTextSchema.optional(),
  shortLabel: LocalizedTextSchema.optional(),
  labelKey: z.string().nullable().optional(),
  descriptionKey: z.string().nullable().optional(),
});

const ChildActionStyleSchema = z.object({
  icon: z.string().nullable().optional(),
  color: z.enum(['primary', 'secondary', 'info', 'success', 'warning', 'danger', 'neutral']).optional(),
  variant: z.enum(['solid', 'outline', 'ghost', 'link']).optional(),
});

const ChildActionActionSchema = z.object({
  type: z.enum(['href', 'event', 'download']),
  href: z.string().optional(),
  handlerKey: z.string().nullable().optional(),
  payload: z.record(z.unknown()).nullable().optional(),
  downloadFileName: z.string().nullable().optional(),
});

const ChildActionDescriptorSchema = z.object({
  key: z.string(),
  labelKey: z.string().optional(),
  label: z.string(),
  description: z.string().nullable().optional(),
  href: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'neutral', 'download']).optional(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  reasonKey: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  display: ChildActionDisplaySchema,
  style: ChildActionStyleSchema,
  action: ChildActionActionSchema,
  disabledReason: LocalizedTextSchema.nullable().optional(),
  order: z.number().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  configId: z.number().nullable().optional(),
});

const ChildStatusBannerSchema = z.object({
  key: z.string(),
  messageKey: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'success']),
});

const ChildStatusBadgeSchema = z.object({
  key: z.string(),
  labelKey: z.string(),
  label: z.string(),
  tooltipKey: z.string().nullable().optional(),
  tooltip: z.string().nullable().optional(),
  tone: z.enum(['urgent', 'info']),
});

const ChildActionDownloadsSchema = z.object({
  conductPdfAvailable: z.boolean(),
});

const ChildActionStudentSummarySchema = z.object({
  studentPersonId: z.string(),
  parentPersonId: z.string().nullable(),
  studentEmirateId: z.string().nullable(),
  educationType: z.string().nullable(),
});

const ChildActionUpdateRequestSchema = z.object({
  id: z.number().nullable(),
  studentPersonId: z.string(),
  parentPersonId: z.string().nullable(),
  isInfoUpdateRequested: z.boolean(),
  infoUpdateRequestStatus: z.number().nullable(),
  isConductAgreementSigned: z.boolean(),
  conductAgreementStatus: z.number().nullable(),
  studentEmirateId: z.string().nullable(),
  pdfBase64: z.string().nullable(),
  citizenship: z.string().nullable(),
  createAt: z.string().nullable(),
  updateAt: z.string().nullable(),
});

// Child Action Response Schema
export const ChildActionResponseSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  student: ChildActionStudentSummarySchema,
  educationType: z.string().nullable(),
  updatePeriodActive: z.boolean(),
  updateRequest: ChildActionUpdateRequestSchema,
  idhStatusId: z.number().nullable(),
  idhFetchedAt: z.string().nullable(),
  idhDebug: IdhDebugSchema.optional(),
  actions: z.array(ChildActionDescriptorSchema),
  statusBanner: ChildStatusBannerSchema.nullable(),
  badge: ChildStatusBadgeSchema.nullable(),
  downloads: ChildActionDownloadsSchema,
  reasons: z.array(z.string()),
});

export type ChildActionResponse = z.infer<typeof ChildActionResponseSchema>;

/**
 * Validates child action response against schema
 * @throws z.ZodError if validation fails
 */
export function validateChildActionResponse(data: unknown): ChildActionResponse {
  return ChildActionResponseSchema.parse(data);
}

/**
 * Safely validates child action response, returning errors instead of throwing
 */
export function safeValidateChildActionResponse(data: unknown): 
  | { success: true; data: ChildActionResponse }
  | { success: false; errors: z.ZodError } {
  const result = ChildActionResponseSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}
