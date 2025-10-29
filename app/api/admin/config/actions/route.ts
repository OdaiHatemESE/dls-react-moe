import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient as ParentPortalPrisma } from "@prisma/client-parent-portal";
import type {
  AdminActionConfigSchema,
  ChildActionColor,
  ChildActionVariant,
  ChildActionType,
  LocalizedText,
} from "@/types/child-actions";

const prisma = new ParentPortalPrisma();

// GET all student actions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const educationType = searchParams.get("educationType");

    const where = educationType ? { educationType } : {};

    const actions = await prisma.studentActionConfig.findMany({
      where,
      orderBy: [{ educationType: "asc" }, { displayOrder: "asc" }],
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error("Error fetching student actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch student actions" },
      { status: 500 }
    );
  }
}

// POST create new student action
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      educationType,
      actionName,
      actionKey,
      isEnabled,
      displayOrder,
      description,
      config,
      configJson,
    } = body;

    if (!educationType || !actionName || !actionKey) {
      return NextResponse.json(
        { error: "Education type, action name, and action key are required" },
        { status: 400 }
      );
    }

    let normalizedConfigJson: string | null | undefined;
    try {
      normalizedConfigJson = resolveConfigJson(config, configJson);
    } catch (error) {
      const message = toErrorMessage(error, "Invalid action configuration payload");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const action = await prisma.studentActionConfig.create({
      data: {
        educationType,
        actionName,
        actionKey,
        isEnabled: isEnabled ?? true,
        displayOrder: typeof displayOrder === "number" ? displayOrder : Number(displayOrder) || 0,
        description: description || null,
        configJson: normalizedConfigJson ?? null,
        createdBy: session.user.emiratesId || session.user.id || "system",
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Error creating student action:", error);

    if (isPrismaUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "Action with this education type and key already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: toErrorMessage(error, "Failed to create student action") },
      { status: 500 }
    );
  }
}

// DELETE student action
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Action ID is required" },
        { status: 400 }
      );
    }

    await prisma.studentActionConfig.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Action deleted successfully" });
  } catch (error) {
    console.error("Error deleting student action:", error);
    return NextResponse.json(
      { error: "Failed to delete student action" },
      { status: 500 }
    );
  }
}

// PATCH update student action
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, config, configJson, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Action ID is required" },
        { status: 400 }
      );
    }

    let normalizedConfigJson: string | null | undefined;
    try {
      normalizedConfigJson = resolveConfigJson(config, configJson);
    } catch (error) {
      const message = toErrorMessage(error, "Invalid action configuration payload");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    const updatesRecord = updates as Record<string, unknown>;
    const allowedKeys = [
      "educationType",
      "actionName",
      "actionKey",
      "isEnabled",
      "displayOrder",
      "description",
    ] as const;

    for (const key of allowedKeys) {
      if (!(key in updatesRecord)) {
        continue;
      }

      const value = updatesRecord[key];
      switch (key) {
        case "displayOrder":
          data.displayOrder = typeof value === "number" ? value : Number(value) || 0;
          break;
        case "description":
          data.description = typeof value === "string" && value.trim().length ? value : null;
          break;
        case "educationType":
        case "actionName":
        case "actionKey":
          if (typeof value === "string" && value.trim().length) {
            data[key] = value.trim();
          }
          break;
        case "isEnabled":
          if (typeof value === "boolean") {
            data.isEnabled = value;
          } else if (typeof value === "string") {
            data.isEnabled = value.toLowerCase() === "true";
          } else {
            data.isEnabled = Boolean(value);
          }
          break;
      }
    }

    if (normalizedConfigJson !== undefined) {
      data.configJson = normalizedConfigJson;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const action = await prisma.studentActionConfig.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("Error updating student action:", error);

    if (isPrismaUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "Action with this education type and key already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: toErrorMessage(error, "Failed to update student action") },
      { status: 500 }
    );
  }
}

const CURRENT_SCHEMA_VERSION = 1;
const VALID_COLORS: ChildActionColor[] = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "danger",
  "neutral",
];
const VALID_VARIANTS: ChildActionVariant[] = ["solid", "outline", "ghost", "link"];
const VALID_ACTION_TYPES: ChildActionType[] = ["href", "download", "event"];
const VALID_PDF_MODES = ["disable", "hide"] as const;
const VALID_CONDUCT_REQUIREMENTS = ["signed", "unsigned", "any"] as const;

function resolveConfigJson(config: unknown, configJson: unknown): string | null | undefined {
  if (config !== undefined) {
    if (config === null) {
      return null;
    }
    const sanitized = sanitizeAdminActionConfig(config);
    return hasMeaningfulConfig(sanitized) ? JSON.stringify(sanitized) : null;
  }

  if (configJson !== undefined) {
    if (configJson === null) {
      return null;
    }

    let parsed: unknown = configJson;
    if (typeof configJson === "string") {
      const trimmed = configJson.trim();
      if (!trimmed.length) {
        return null;
      }
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        throw new Error("configJson must be valid JSON");
      }
    }

    const sanitized = sanitizeAdminActionConfig(parsed);
    return hasMeaningfulConfig(sanitized) ? JSON.stringify(sanitized) : null;
  }

  return undefined;
}

function sanitizeAdminActionConfig(input: unknown): AdminActionConfigSchema {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("config must be an object");
  }

  const source = input as Record<string, unknown>;
  const result: AdminActionConfigSchema = { schemaVersion: CURRENT_SCHEMA_VERSION };

  const display = sanitizeDisplay(source.display);
  if (display) {
    result.display = display;
  }

  const style = sanitizeStyle(source.style);
  if (style) {
    result.style = style;
  }

  const action = sanitizeAction(source.action);
  if (action) {
    result.action = action;
  }

  const availability = sanitizeAvailability(source.availability);
  if (availability) {
    result.availability = availability;
  }

  if ("metadata" in source) {
    result.metadata = sanitizeMetadata(source.metadata);
  }

  if ("order" in source) {
    const order = sanitizeOrder(source.order);
    if (order !== undefined) {
      result.order = order;
    }
  }

  return result;
}

function sanitizeDisplay(input: unknown): AdminActionConfigSchema["display"] | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const source = input as Record<string, unknown>;
  const display: AdminActionConfigSchema["display"] = {};

  const label = coerceLocalized(source.label, "display.label");
  if (label) {
    display.label = label;
  }

  const shortLabel = coerceLocalized(source.shortLabel, "display.shortLabel");
  if (shortLabel) {
    display.shortLabel = shortLabel;
  }

  const description = coerceLocalized(source.description, "display.description");
  if (description) {
    display.description = description;
  }

  const labelKey = coerceOptionalString(source.labelKey);
  if (labelKey !== undefined) {
    display.labelKey = labelKey;
  }

  const descriptionKey = coerceOptionalString(source.descriptionKey);
  if (descriptionKey !== undefined) {
    display.descriptionKey = descriptionKey;
  }

  return Object.keys(display).length ? display : undefined;
}

function sanitizeStyle(input: unknown): AdminActionConfigSchema["style"] | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const source = input as Record<string, unknown>;
  const style: AdminActionConfigSchema["style"] = {};

  if ("icon" in source) {
    const icon = coerceOptionalString(source.icon, true);
    if (icon !== undefined) {
      style.icon = icon ? icon : null;
    }
  }

  if ("color" in source) {
    const color = coerceOptionalString(source.color, true);
    if (color) {
      const normalized = color.toLowerCase();
      if (!VALID_COLORS.includes(normalized as ChildActionColor)) {
        throw new Error(`style.color must be one of: ${VALID_COLORS.join(", ")}`);
      }
      style.color = normalized;
    } else {
      style.color = null;
    }
  }

  if ("variant" in source) {
    const variant = coerceOptionalString(source.variant, true);
    if (variant) {
      const normalized = variant.toLowerCase();
      if (!VALID_VARIANTS.includes(normalized as ChildActionVariant)) {
        throw new Error(`style.variant must be one of: ${VALID_VARIANTS.join(", ")}`);
      }
      style.variant = normalized;
    } else {
      style.variant = null;
    }
  }

  return Object.keys(style).length ? style : undefined;
}

function sanitizeAction(input: unknown): AdminActionConfigSchema["action"] | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (input === null) {
    return {};
  }

  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("action must be an object");
  }

  const source = input as Record<string, unknown>;
  const action: AdminActionConfigSchema["action"] = {};

  const type = coerceOptionalString(source.type, true);
  const normalizedType = normalizeActionType(type);
  action.type = normalizedType;

  if ("href" in source) {
    const href = coerceOptionalString(source.href, true);
    if (href !== undefined) {
      action.href = href ? href : null;
    }
  }

  if ("hrefTemplate" in source) {
    const hrefTemplate = coerceOptionalString(source.hrefTemplate, true);
    if (hrefTemplate !== undefined) {
      action.hrefTemplate = hrefTemplate ? hrefTemplate : null;
    }
  }

  if ("handlerKey" in source) {
    const handlerKey = coerceOptionalString(source.handlerKey, true);
    if (handlerKey !== undefined) {
      action.handlerKey = handlerKey ? handlerKey : null;
    }
  }

  if ("payload" in source) {
    action.payload = sanitizePayload(source.payload);
  }

  if ("downloadFileName" in source) {
    const fileName = coerceOptionalString(source.downloadFileName, true);
    if (fileName !== undefined) {
      action.downloadFileName = fileName ? fileName : null;
    }
  }

  return action;
}

function sanitizeAvailability(input: unknown): AdminActionConfigSchema["availability"] | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const source = input as Record<string, unknown>;
  const availability: AdminActionConfigSchema["availability"] = {};

  if ("status" in source && source.status && typeof source.status === "object" && !Array.isArray(source.status)) {
    const statusSource = source.status as Record<string, unknown>;
    const include = sanitizeStatusArray(statusSource.include, "availability.status.include");
    const exclude = sanitizeStatusArray(statusSource.exclude, "availability.status.exclude");

    availability.status = {};
    if (include !== undefined) {
      availability.status.include = include ?? null;
    }
    if (exclude !== undefined) {
      availability.status.exclude = exclude ?? null;
    }

    if (!Object.keys(availability.status).length) {
      delete availability.status;
    }
  }

  if ("requiresUpdatePeriod" in source) {
    availability.requiresUpdatePeriod = Boolean(source.requiresUpdatePeriod);
  }

  if ("requiresPdf" in source) {
    availability.requiresPdf = Boolean(source.requiresPdf);
  }

  if ("requiresPdfMode" in source) {
    const mode = coerceOptionalString(source.requiresPdfMode, true);
    if (mode) {
      const normalized = mode.toLowerCase();
      if (!VALID_PDF_MODES.includes(normalized as (typeof VALID_PDF_MODES)[number])) {
        throw new Error(`availability.requiresPdfMode must be one of: ${VALID_PDF_MODES.join(", ")}`);
      }
      availability.requiresPdfMode = normalized as "disable" | "hide";
    } else {
      availability.requiresPdfMode = undefined;
    }
  }

  if ("requiresPdfReason" in source) {
    const reason = coerceLocalized(source.requiresPdfReason, "availability.requiresPdfReason");
    availability.requiresPdfReason = reason ?? undefined;
  }

  if ("requiresConductSignature" in source) {
    const requirement = coerceOptionalString(source.requiresConductSignature, true);
    if (requirement) {
      const normalized = requirement.toLowerCase();
      if (!VALID_CONDUCT_REQUIREMENTS.includes(normalized as (typeof VALID_CONDUCT_REQUIREMENTS)[number])) {
        throw new Error(
          `availability.requiresConductSignature must be one of: ${VALID_CONDUCT_REQUIREMENTS.join(", ")}`
        );
      }
      availability.requiresConductSignature = normalized as "signed" | "unsigned" | "any";
    } else {
      availability.requiresConductSignature = undefined;
    }
  }

  return Object.keys(availability).length ? availability : undefined;
}

function sanitizeStatusArray(value: unknown, field: string): Array<number | null> | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    if (!value.trim().length) {
      return null;
    }
    const entries = value.split(",").map((item) => item.trim()).filter(Boolean);
    const normalized = entries
      .map((entry) => sanitizeStatusValue(entry, field))
      .filter((entry): entry is number | null => entry !== undefined);
    return normalized.length ? normalized : null;
  }

  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }

  const result: Array<number | null> = [];
  for (const entry of value) {
    const normalized = sanitizeStatusValue(entry, field);
    if (normalized !== undefined) {
      result.push(normalized);
    }
  }

  return result.length ? result : null;
}

function sanitizeStatusValue(value: unknown, field: string): number | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) {
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

  throw new Error(`${field} entries must be numeric or "null"`);
}

function coerceLocalized(value: unknown, field: string): LocalizedText | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return undefined;
    }
    return { en: trimmed, ar: trimmed };
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const en = typeof obj.en === "string" ? obj.en.trim() : "";
    const ar = typeof obj.ar === "string" ? obj.ar.trim() : "";

    if (!en && !ar) {
      return undefined;
    }

    return { en: en || ar, ar: ar || en || "" };
  }

  throw new Error(`${field} must be a string or localized object`);
}

function coerceOptionalString(value: unknown, allowEmpty = false): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Expected a string value");
  }

  const trimmed = value.trim();
  if (!trimmed.length && !allowEmpty) {
    return undefined;
  }

  return trimmed.length ? trimmed : allowEmpty ? "" : undefined;
}

function normalizeActionType(type: string | null | undefined): ChildActionType {
  if (!type) {
    return "href";
  }

  const normalized = type.trim().toLowerCase();
  if (VALID_ACTION_TYPES.includes(normalized as ChildActionType)) {
    return normalized as ChildActionType;
  }

  throw new Error(`action.type must be one of: ${VALID_ACTION_TYPES.join(", ")}`);
}

function sanitizePayload(value: unknown): Record<string, unknown> | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("action.payload must be an object");
  }

  return value as Record<string, unknown>;
}

function sanitizeMetadata(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("metadata must be an object");
  }

  return value as Record<string, unknown>;
}

function sanitizeOrder(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  throw new Error("order must be numeric");
}

function hasMeaningfulConfig(config: AdminActionConfigSchema): boolean {
  const keys = Object.keys(config);
  if (!keys.length) {
    return false;
  }

  if (keys.length === 1 && keys[0] === "schemaVersion") {
    return false;
  }

  return true;
}

function isPrismaUniqueConstraintError(error: unknown): error is { code: "P2002" } {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  return code === "P2002";
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
