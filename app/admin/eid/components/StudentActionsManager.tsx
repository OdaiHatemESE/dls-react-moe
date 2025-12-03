"use client";

import { useState } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trash2, Edit, Plus, Loader2, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import type {
  AdminActionConfigSchema,
  ChildActionColor,
  ChildActionVariant,
  ChildActionType,
} from "@/types/child-actions";

type StudentAction = {
  id: number;
  educationType: string;
  actionName: string;
  actionKey: string;
  isEnabled: boolean;
  displayOrder: number;
  description?: string | null;
  configJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

const EDUCATION_TYPES = [
  "Public",
  "Private",
  "Charter",
  "Homeschool",
  "International",
  "Special",
];

const normalizeEducationType = (value: string) => {
  if (!value) {
    return value;
  }
  const match = EDUCATION_TYPES.find(
    (type) => type.toLowerCase() === value.toLowerCase()
  );
  return match ?? value;
};

type LocalizedFieldState = {
  en: string;
  ar: string;
};

type AdminConfigFormState = {
  label: LocalizedFieldState;
  shortLabel: LocalizedFieldState;
  description: LocalizedFieldState;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  color: ChildActionColor;
  variant: ChildActionVariant;
  actionType: ChildActionType;
  href: string;
  hrefTemplate: string;
  handlerKey: string;
  payloadJson: string;
  downloadFileName: string;
  statusInclude: string;
  statusExclude: string;
  requiresUpdatePeriod: boolean;
  requiresPdf: boolean;
  requiresPdfMode: "disable" | "hide";
  requiresPdfReason: LocalizedFieldState;
  requiresConductSignature: "signed" | "unsigned" | "any";
  metadataJson: string;
  order: string;
};

type LocalizedFieldKey = "label" | "shortLabel" | "description" | "requiresPdfReason";

type FormState = {
  educationType: string;
  actionName: string;
  actionKey: string;
  isEnabled: boolean;
  displayOrder: number;
  description: string;
  config: AdminConfigFormState;
};

const ACTION_COLORS: ChildActionColor[] = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "danger",
  "neutral",
];

const ACTION_VARIANTS: ChildActionVariant[] = ["solid", "outline", "ghost", "link"];
const ACTION_TYPES: ChildActionType[] = ["href", "download", "event"];
const PDF_MODES = ["disable", "hide"] as const;
const CONDUCT_REQUIREMENTS = ["any", "signed", "unsigned"] as const;

const createEmptyLocalizedField = (): LocalizedFieldState => ({ en: "", ar: "" });

const createEmptyConfigForm = (): AdminConfigFormState => ({
  label: createEmptyLocalizedField(),
  shortLabel: createEmptyLocalizedField(),
  description: createEmptyLocalizedField(),
  labelKey: "",
  descriptionKey: "",
  icon: "",
  color: "primary",
  variant: "solid",
  actionType: "href",
  href: "",
  hrefTemplate: "",
  handlerKey: "",
  payloadJson: "",
  downloadFileName: "",
  statusInclude: "",
  statusExclude: "",
  requiresUpdatePeriod: false,
  requiresPdf: false,
  requiresPdfMode: "disable",
  requiresPdfReason: createEmptyLocalizedField(),
  requiresConductSignature: "any",
  metadataJson: "",
  order: "",
});

const createEmptyFormState = (): FormState => ({
  educationType: "",
  actionName: "",
  actionKey: "",
  isEnabled: true,
  displayOrder: 0,
  description: "",
  config: createEmptyConfigForm(),
});

const toLocalizedFieldState = (input: unknown): LocalizedFieldState => {
  if (!input) {
    return createEmptyLocalizedField();
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    return { en: trimmed, ar: trimmed };
  }

  if (typeof input === "object" && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    const en = typeof obj.en === "string" ? obj.en : "";
    const ar = typeof obj.ar === "string" ? obj.ar : "";
    return { en, ar };
  }

  return createEmptyLocalizedField();
};

const formatStatusList = (values?: Array<number | null> | null): string => {
  if (!values || !values.length) {
    return "";
  }

  return values
    .map((value) => (value === null ? "null" : String(value)))
    .join(", ");
};

const parseStatusInput = (value: string): Array<number | null> | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return undefined;
  }

  return parts.map((part) => {
    if (part.toLowerCase() === "null") {
      return null;
    }
    const parsed = Number(part);
    if (Number.isNaN(parsed)) {
      throw new Error("Status filters must contain numbers or 'null'");
    }
    return parsed;
  });
};

const tryParseJsonObject = (value: string, context: string): Record<string, unknown> | null | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${context} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${context} must be valid JSON`);
  }
};

const parseConfigJson = (configJson?: string | null): AdminConfigFormState => {
  const config = createEmptyConfigForm();
  if (!configJson || !configJson.trim()) {
    return config;
  }

  try {
    const parsed = JSON.parse(configJson) as AdminActionConfigSchema;

    if (parsed.display) {
      config.label = toLocalizedFieldState(parsed.display.label);
      config.shortLabel = toLocalizedFieldState(parsed.display.shortLabel);
      config.description = toLocalizedFieldState(parsed.display.description);
      config.labelKey = parsed.display.labelKey ?? "";
      config.descriptionKey = parsed.display.descriptionKey ?? "";
    }

    if (parsed.style) {
      config.icon = typeof parsed.style.icon === "string" ? parsed.style.icon : "";
      if (typeof parsed.style.color === "string" && ACTION_COLORS.includes(parsed.style.color as ChildActionColor)) {
        config.color = parsed.style.color as ChildActionColor;
      }
      if (typeof parsed.style.variant === "string" && ACTION_VARIANTS.includes(parsed.style.variant as ChildActionVariant)) {
        config.variant = parsed.style.variant as ChildActionVariant;
      }
    }

    if (parsed.action) {
      if (typeof parsed.action.type === "string" && ACTION_TYPES.includes(parsed.action.type as ChildActionType)) {
        config.actionType = parsed.action.type as ChildActionType;
      }
      config.href = typeof parsed.action.href === "string" ? parsed.action.href : "";
      config.hrefTemplate = typeof parsed.action.hrefTemplate === "string" ? parsed.action.hrefTemplate : "";
      config.handlerKey = typeof parsed.action.handlerKey === "string" ? parsed.action.handlerKey : "";
      config.downloadFileName =
        typeof parsed.action.downloadFileName === "string" ? parsed.action.downloadFileName : "";
      if (parsed.action.payload && typeof parsed.action.payload === "object") {
        config.payloadJson = JSON.stringify(parsed.action.payload, null, 2);
      }
    }

    if (parsed.availability) {
      if (parsed.availability.status) {
        config.statusInclude = formatStatusList(parsed.availability.status.include ?? undefined);
        config.statusExclude = formatStatusList(parsed.availability.status.exclude ?? undefined);
      }
      config.requiresUpdatePeriod = Boolean(parsed.availability.requiresUpdatePeriod);
      config.requiresPdf = Boolean(parsed.availability.requiresPdf);
      if (typeof parsed.availability.requiresPdfMode === "string" && PDF_MODES.includes(parsed.availability.requiresPdfMode as (typeof PDF_MODES)[number])) {
        config.requiresPdfMode = parsed.availability.requiresPdfMode as "disable" | "hide";
      }
      config.requiresPdfReason = toLocalizedFieldState(parsed.availability.requiresPdfReason);
      if (
        typeof parsed.availability.requiresConductSignature === "string" &&
        CONDUCT_REQUIREMENTS.includes(parsed.availability.requiresConductSignature as (typeof CONDUCT_REQUIREMENTS)[number])
      ) {
        config.requiresConductSignature = parsed.availability.requiresConductSignature as "signed" | "unsigned" | "any";
      }
    }

    if (parsed.metadata && typeof parsed.metadata === "object") {
      config.metadataJson = JSON.stringify(parsed.metadata, null, 2);
    }

    if (typeof parsed.order === "number") {
      config.order = String(parsed.order);
    }
  } catch (error) {
    console.warn("Failed to parse action config JSON", error);
  }

  return config;
};

const toLocalizedOutput = (value: LocalizedFieldState) => {
  const en = value.en.trim();
  const ar = value.ar.trim();
  if (!en && !ar) {
    return undefined;
  }
  return { en: en || ar, ar: ar || en };
};

const buildConfigPayload = (state: AdminConfigFormState): AdminActionConfigSchema | null => {
  const config: AdminActionConfigSchema = { schemaVersion: 1 };

  const display: AdminActionConfigSchema["display"] = {};
  const label = toLocalizedOutput(state.label);
  if (label) {
    display.label = label;
  }
  const shortLabel = toLocalizedOutput(state.shortLabel);
  if (shortLabel) {
    display.shortLabel = shortLabel;
  }
  const description = toLocalizedOutput(state.description);
  if (description) {
    display.description = description;
  }
  if (state.labelKey.trim()) {
    display.labelKey = state.labelKey.trim();
  }
  if (state.descriptionKey.trim()) {
    display.descriptionKey = state.descriptionKey.trim();
  }
  if (Object.keys(display).length) {
    config.display = display;
  }

  const style: AdminActionConfigSchema["style"] = {};
  const icon = state.icon.trim();
  if (icon) {
    style.icon = icon;
  }
  if (state.color) {
    style.color = state.color;
  }
  if (state.variant) {
    style.variant = state.variant;
  }
  if (Object.keys(style).length) {
    config.style = style;
  }

  const action: AdminActionConfigSchema["action"] = {
    type: state.actionType,
  };
  if (state.href.trim()) {
    action.href = state.href.trim();
  }
  if (state.hrefTemplate.trim()) {
    action.hrefTemplate = state.hrefTemplate.trim();
  }
  if (state.handlerKey.trim()) {
    action.handlerKey = state.handlerKey.trim();
  }
  if (state.downloadFileName.trim()) {
    action.downloadFileName = state.downloadFileName.trim();
  }
  const payload = tryParseJsonObject(state.payloadJson, "Action payload JSON");
  if (payload !== undefined) {
    action.payload = payload;
  }
  config.action = action;

  const availability: AdminActionConfigSchema["availability"] = {};
  const includeStatuses = parseStatusInput(state.statusInclude);
  const excludeStatuses = parseStatusInput(state.statusExclude);
  if (includeStatuses || excludeStatuses) {
    availability.status = {};
    if (includeStatuses) {
      availability.status.include = includeStatuses;
    }
    if (excludeStatuses) {
      availability.status.exclude = excludeStatuses;
    }
  }
  if (state.requiresUpdatePeriod) {
    availability.requiresUpdatePeriod = true;
  }
  if (state.requiresPdf) {
    availability.requiresPdf = true;
    availability.requiresPdfMode = state.requiresPdfMode;
    const reason = toLocalizedOutput(state.requiresPdfReason);
    if (reason) {
      availability.requiresPdfReason = reason;
    }
  }
  if (state.requiresConductSignature !== "any") {
    availability.requiresConductSignature = state.requiresConductSignature;
  }
  if (Object.keys(availability).length) {
    config.availability = availability;
  }

  const metadata = tryParseJsonObject(state.metadataJson, "Metadata JSON");
  if (metadata !== undefined) {
    config.metadata = metadata ?? null;
  }

  if (state.order.trim()) {
    const parsedOrder = Number(state.order.trim());
    if (Number.isNaN(parsedOrder)) {
      throw new Error("Order must be numeric");
    }
    config.order = parsedOrder;
  }

  const meaningfulKeys = Object.keys(config).filter((key) => key !== "schemaVersion");
  return meaningfulKeys.length ? config : null;
};

const createFormStateFromAction = (action?: StudentAction | null): FormState => {
  if (!action) {
    return createEmptyFormState();
  }

  return {
    educationType: normalizeEducationType(action.educationType),
    actionName: action.actionName,
    actionKey: action.actionKey,
    isEnabled: action.isEnabled,
    displayOrder: action.displayOrder ?? 0,
    description: action.description || "",
    config: parseConfigJson(action.configJson || ""),
  };
};

export function StudentActionsManager() {
  const { toast } = useToast();
  const { data: actions, mutate } = useSWR<StudentAction[]>(
    "/api/admin/config/actions",
    jsonFetcher
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<StudentAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>(createEmptyFormState());

  const updateConfigField = <K extends keyof AdminConfigFormState>(
    key: K,
    value: AdminConfigFormState[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const updateLocalizedField = (key: LocalizedFieldKey, locale: "en" | "ar", value: string) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: {
          ...prev.config[key],
          [locale]: value,
        },
      },
    }));
  };

  const handleOpenSheet = (action?: StudentAction) => {
    if (action) {
      setEditingAction(action);
      setFormData(createFormStateFromAction(action));
    } else {
      setEditingAction(null);
      setFormData(createEmptyFormState());
    }
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingAction(null);
    setFormData(createEmptyFormState());
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (open) {
      setIsSheetOpen(true);
      return;
    }
    handleCloseSheet();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let configPayload: AdminActionConfigSchema | null;
    try {
      configPayload = buildConfigPayload(formData.config);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please review the configuration inputs";
      toast({
        title: "Invalid configuration",
        description: message,
        variant: "error",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const url = "/api/admin/config/actions";
      const method = editingAction ? "PATCH" : "POST";
      const normalizedFormData = {
        educationType: normalizeEducationType(formData.educationType),
        actionName: formData.actionName,
        actionKey: formData.actionKey,
        isEnabled: formData.isEnabled,
        displayOrder: formData.displayOrder,
        description: formData.description.trim(),
      };
      const body: Record<string, unknown> = editingAction
        ? { id: editingAction.id, ...normalizedFormData }
        : { ...normalizedFormData };

      body.displayOrder = Number(normalizedFormData.displayOrder) || 0;
      body.description = normalizedFormData.description || "";
      body.config = configPayload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || "Failed to save action");
      }

      toast({
        title: "Success",
        description: `Action ${editingAction ? "updated" : "created"} successfully`,
      });

      await mutate();
      handleCloseSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save action";
      toast({
        title: "Error",
        description: message,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this action?")) return;

    try {
      const res = await fetch(`/api/admin/config/actions?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || "Failed to delete action");
      }

      toast({
        title: "Success",
        description: "Action deleted successfully",
      });

      await mutate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete action";
      toast({
        title: "Error",
        description: message,
        variant: "error",
      });
    }
  };

  const handleToggleEnabled = async (action: StudentAction) => {
    try {
      const res = await fetch("/api/admin/config/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.id, isEnabled: !action.isEnabled }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || "Failed to update action");
      }

      await mutate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update action";
      toast({
        title: "Error",
        description: message,
        variant: "error",
      });
    }
  };

  // Group actions by education type
  const groupedActions = actions?.reduce((acc, action) => {
    const normalizedType = normalizeEducationType(action.educationType);
    const key = normalizedType || action.educationType;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(action);
    return acc;
  }, {} as Record<string, StudentAction[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-aegold-700 to-aered-600 bg-clip-text text-transparent">
            Student Actions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure available actions by education type
          </p>
        </div>
        <Button onClick={() => handleOpenSheet()} className="bg-gradient-to-r from-aegold-700 to-aered-600 hover:from-aegold-800 hover:to-aered-700 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </div>

      <div className="space-y-6">
        {!groupedActions ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : Object.keys(groupedActions).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            No student actions configured
          </div>
        ) : (
          Object.entries(groupedActions).map(([educationType, typeActions]) => (
            <div key={educationType} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md">
              <div className="bg-gradient-to-r from-aegold-50 to-aegreen-50 dark:from-aegold-900/20 dark:to-aegreen-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-aegold-900 dark:text-aegold-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-aegold-700 rounded-full" />
                  {educationType} Education
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead className="font-semibold">Order</TableHead>
                    <TableHead className="font-semibold">Action Name</TableHead>
                    <TableHead className="font-semibold">Action Key</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeActions
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((action) => (
                      <TableRow key={action.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-mono text-sm">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
                            {action.displayOrder}
                          </span>
                        </TableCell>
                        <TableCell>
                                                    <div>\n                            <div className="font-medium flex items-center gap-2">\n                              <SettingsIcon className="w-4 h-4 text-purple-600" />\n                              {action.actionName}\n                            </div>
                            {action.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {action.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
                            {action.actionKey}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={action.isEnabled}
                              onCheckedChange={() => handleToggleEnabled(action)}
                            />
                            {action.isEnabled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                Disabled
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenSheet(action)}
                              className="hover:bg-aegold-100 hover:text-aegold-800 dark:hover:bg-aegold-900/30 dark:hover:text-aegold-300 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(action.id)}
                              className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-3xl"
        >
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <SheetHeader className="border-b px-6 py-4 text-left">
              <SheetTitle>
                {editingAction ? "Edit Student Action" : "Add Student Action"}
              </SheetTitle>
              <SheetDescription>
                {editingAction
                  ? "Update student action configuration"
                  : "Configure a new action for a specific education type"}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="educationType">Education Type *</Label>
                <Select
                  value={formData.educationType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationType: normalizeEducationType(value),
                    }))
                  }
                  disabled={!!editingAction}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actionName">Action Name *</Label>
                  <Input
                    id="actionName"
                    placeholder="e.g., Update Address"
                    value={formData.actionName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, actionName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionKey">Action Key *</Label>
                  <Input
                    id="actionKey"
                    placeholder="e.g., update_address"
                    value={formData.actionKey}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, actionKey: e.target.value }))
                    }
                    required
                    disabled={!!editingAction}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayOrder: Number.parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description of this action"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Display content</h3>
                  <p className="text-sm text-muted-foreground">
                    Localized labels shown to guardians across the app.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayLabelEn">Label (English) *</Label>
                    <Input
                      id="displayLabelEn"
                      placeholder="Update student information"
                      value={formData.config.label.en}
                      onChange={(e) => updateLocalizedField("label", "en", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayLabelAr">Label (Arabic) *</Label>
                    <Input
                      id="displayLabelAr"
                      placeholder="تحديث بيانات الطالب"
                      value={formData.config.label.ar}
                      onChange={(e) => updateLocalizedField("label", "ar", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayShortLabelEn">Short Label (English)</Label>
                    <Input
                      id="displayShortLabelEn"
                      placeholder="Update info"
                      value={formData.config.shortLabel.en}
                      onChange={(e) => updateLocalizedField("shortLabel", "en", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayShortLabelAr">Short Label (Arabic)</Label>
                    <Input
                      id="displayShortLabelAr"
                      placeholder="تحديث"
                      value={formData.config.shortLabel.ar}
                      onChange={(e) => updateLocalizedField("shortLabel", "ar", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayDescriptionEn">Description (English)</Label>
                    <Textarea
                      id="displayDescriptionEn"
                      value={formData.config.description.en}
                      onChange={(e) => updateLocalizedField("description", "en", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayDescriptionAr">Description (Arabic)</Label>
                    <Textarea
                      id="displayDescriptionAr"
                      value={formData.config.description.ar}
                      onChange={(e) => updateLocalizedField("description", "ar", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="labelKey">Label i18n key</Label>
                    <Input
                      id="labelKey"
                      placeholder="childActions.updateInfo"
                      value={formData.config.labelKey}
                      onChange={(e) => updateConfigField("labelKey", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionKey">Description i18n key</Label>
                    <Input
                      id="descriptionKey"
                      placeholder="childActions.updateInfo.description"
                      value={formData.config.descriptionKey}
                      onChange={(e) => updateConfigField("descriptionKey", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Style</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure icon and button styling for this action.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="styleIcon">Icon</Label>
                    <Input
                      id="styleIcon"
                      placeholder="lucide icon name"
                      value={formData.config.icon}
                      onChange={(e) => updateConfigField("icon", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="styleColor">Color</Label>
                    <Select
                      value={formData.config.color}
                      onValueChange={(value) => updateConfigField("color", value as ChildActionColor)}
                    >
                      <SelectTrigger id="styleColor">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_COLORS.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="styleVariant">Variant</Label>
                    <Select
                      value={formData.config.variant}
                      onValueChange={(value) => updateConfigField("variant", value as ChildActionVariant)}
                    >
                      <SelectTrigger id="styleVariant">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_VARIANTS.map((variant) => (
                          <SelectItem key={variant} value={variant}>
                            {variant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Action</h3>
                  <p className="text-sm text-muted-foreground">
                    Define how this action behaves when parents tap it.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="actionType">Type</Label>
                    <Select
                      value={formData.config.actionType}
                      onValueChange={(value) => updateConfigField("actionType", value as ChildActionType)}
                    >
                      <SelectTrigger id="actionType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.config.actionType === "href" && (
                    <>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="hrefTemplate">Href template</Label>
                        <Input
                          id="hrefTemplate"
                          placeholder="/child/:studentPersonId/update-info"
                          value={formData.config.hrefTemplate}
                          onChange={(e) => updateConfigField("hrefTemplate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="hrefStatic">Static href</Label>
                        <Input
                          id="hrefStatic"
                          placeholder="Optional direct link"
                          value={formData.config.href}
                          onChange={(e) => updateConfigField("href", e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {formData.config.actionType !== "href" && (
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="handlerKey">Handler key</Label>
                      <Input
                        id="handlerKey"
                        placeholder="conduct-pdf"
                        value={formData.config.handlerKey}
                        onChange={(e) => updateConfigField("handlerKey", e.target.value)}
                      />
                    </div>
                  )}
                  {formData.config.actionType === "download" && (
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="downloadFileName">Download file name</Label>
                      <Input
                        id="downloadFileName"
                        placeholder="conduct-agreement-:studentPersonId.pdf"
                        value={formData.config.downloadFileName}
                        onChange={(e) => updateConfigField("downloadFileName", e.target.value)}
                      />
                    </div>
                  )}
                </div>
                {(formData.config.actionType === "event" || formData.config.actionType === "download") && (
                  <div className="space-y-2">
                    <Label htmlFor="payloadJson">Payload JSON</Label>
                    <Textarea
                      id="payloadJson"
                      placeholder='{"event": "open-modal"}'
                      value={formData.config.payloadJson}
                      onChange={(e) => updateConfigField("payloadJson", e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports template tokens like <code>:studentPersonId</code>.
                    </p>
                  </div>
                )}
              </div>

              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Availability rules</h3>
                  <p className="text-sm text-muted-foreground">
                    Control when this action appears or is disabled.
                  </p>
                </div>
                {/* Status filtering removed for simplification - actions now show based on update period and other simple rules */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="requiresUpdatePeriod"
                    checked={formData.config.requiresUpdatePeriod}
                    onCheckedChange={(checked) => updateConfigField("requiresUpdatePeriod", checked)}
                  />
                  <Label htmlFor="requiresUpdatePeriod" className="font-normal">
                    Only available during the update period
                  </Label>
                </div>
                <div className="space-y-3 rounded-lg border border-dashed border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="requiresPdf"
                      checked={formData.config.requiresPdf}
                      onCheckedChange={(checked) => updateConfigField("requiresPdf", checked)}
                    />
                    <Label htmlFor="requiresPdf" className="font-normal">
                      Requires conduct PDF before enabling
                    </Label>
                  </div>
                  {formData.config.requiresPdf && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="requiresPdfMode">Unavailable mode</Label>
                          <Select
                            value={formData.config.requiresPdfMode}
                            onValueChange={(value) => updateConfigField("requiresPdfMode", value as (typeof PDF_MODES)[number])}
                          >
                            <SelectTrigger id="requiresPdfMode">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PDF_MODES.map((mode) => (
                                <SelectItem key={mode} value={mode}>
                                  {mode}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="requiresConductSignature">Conduct signature state</Label>
                          <Select
                            value={formData.config.requiresConductSignature}
                            onValueChange={(value) =>
                              updateConfigField("requiresConductSignature", value as AdminConfigFormState["requiresConductSignature"])
                            }
                          >
                            <SelectTrigger id="requiresConductSignature">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDUCT_REQUIREMENTS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="pdfReasonEn">Disabled reason (English)</Label>
                          <Textarea
                            id="pdfReasonEn"
                            rows={2}
                            value={formData.config.requiresPdfReason.en}
                            onChange={(e) => updateLocalizedField("requiresPdfReason", "en", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pdfReasonAr">Disabled reason (Arabic)</Label>
                          <Textarea
                            id="pdfReasonAr"
                            rows={2}
                            value={formData.config.requiresPdfReason.ar}
                            onChange={(e) => updateLocalizedField("requiresPdfReason", "ar", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {!formData.config.requiresPdf && (
                  <div className="space-y-2">
                    <Label htmlFor="requiresConductSignatureStandalone">Conduct signature state</Label>
                    <Select
                      value={formData.config.requiresConductSignature}
                      onValueChange={(value) =>
                        updateConfigField("requiresConductSignature", value as AdminConfigFormState["requiresConductSignature"])
                      }
                    >
                      <SelectTrigger id="requiresConductSignatureStandalone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDUCT_REQUIREMENTS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Metadata</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional override for ordering and custom metadata payloads.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="configOrder">Explicit order</Label>
                    <Input
                      id="configOrder"
                      type="number"
                      value={formData.config.order}
                      onChange={(e) => updateConfigField("order", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="metadataJson">Metadata JSON</Label>
                    <Textarea
                      id="metadataJson"
                      placeholder='{"trackingTag": "priority"}'
                      value={formData.config.metadataJson}
                      onChange={(e) => updateConfigField("metadataJson", e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev) => ({ ...prev, isEnabled: checked }))
                  }
                />
                <Label htmlFor="isEnabled">Enable this action</Label>
              </div>
            </div>
            </div>
            <SheetFooter className="gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseSheet}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingAction ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
