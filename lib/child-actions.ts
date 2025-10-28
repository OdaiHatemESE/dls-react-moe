import "server-only";

import type { StudentActionConfig, UpdateInformationRequests } from "@prisma/client-parent-portal";
import { prismaParent } from "@/lib/prisma-parent";
import { isUpdatePeriodActive } from "@/lib/admin-config";
import type {
  ChildActionDescriptor,
  ChildActionKey,
  ChildActionResponse,
  ChildActionStudentSummary,
  ChildActionUpdateRequest,
  ChildStatusBadgeDescriptor,
  ChildStatusBannerDescriptor,
} from "@/types/child-actions";

type ChildActionRequestOptions = {
  studentPersonId: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  educationTypeHint?: string | null;
  idhStatusId?: number | null;
  idhFetchedAt?: string | null;
};

type ResolveContext = {
  student: ChildActionStudentSummary;
  updatePeriodActive: boolean;
  updateRequest: ChildActionUpdateRequest;
  configs: StudentActionConfig[];
  idhStatusId: number | null;
  idhFetchedAt: string | null;
};

const DOWNLOAD_UNAVAILABLE_REASON = "Conduct PDF not available yet.";

export async function getChildActionsSummary(options: ChildActionRequestOptions): Promise<ChildActionResponse> {
  const { studentPersonId } = options;
  if (!studentPersonId) {
    throw new Error("studentPersonId is required");
  }

  const parentPersonId = options.parentPersonId ?? null;
  const studentEmirateId = options.studentEmirateId ?? null;

  const [updateRow, educationType, periodActive, configs] = await Promise.all([
    loadUpdateInformationRow(studentPersonId, parentPersonId, studentEmirateId),
    resolveEducationType(studentPersonId, options.educationTypeHint ?? null),
    isUpdatePeriodActive(),
    loadActionConfigs(options.educationTypeHint ?? null, studentPersonId),
  ]);

  const updateRequest = normalizeUpdateRequest(updateRow, {
    studentPersonId,
    parentPersonId,
    studentEmirateId,
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

async function loadUpdateInformationRow(
  studentPersonId: string,
  parentPersonId: string | null,
  studentEmirateId: string | null
): Promise<UpdateInformationRequests | null> {
  const existing = await prismaParent.updateInformationRequests.findFirst({
    where: { studentPersonId },
    select: SELECT_FIELDS,
  });

  if (!existing) {
    return null;
  }

  const needsUpdate = (parentPersonId && !existing.parentPersonId) || (studentEmirateId && !existing.studentEmirateId);

  if (!needsUpdate) {
    return existing;
  }

  try {
    return await prismaParent.updateInformationRequests.update({
      where: { studentPersonId },
      data: {
        updateAt: new Date(),
        ...(parentPersonId && !existing.parentPersonId ? { parentPersonId } : {}),
        ...(studentEmirateId && !existing.studentEmirateId ? { studentEmirateId } : {}),
      },
      select: SELECT_FIELDS,
    });
  } catch (error) {
    console.error("Failed to update UpdateInformationRequests entry", { studentPersonId, error });
    return existing;
  }
}

const SELECT_FIELDS = {
  Id: true,
  studentPersonId: true,
  parentPersonId: true,
  isInfoUpdateRequested: true,
  infoUpdateRequestStatus: true,
  isConductAgreementSigned: true,
  conductAgreementStatus: true,
  studentEmirateId: true,
  pdfBase64: true,
  citizenship: true,
  createAt: true,
  updateAt: true,
} satisfies Record<keyof UpdateInformationRequests, boolean>;

async function resolveEducationType(studentPersonId: string, hint: string | null): Promise<string | null> {
  if (hint) return hint;

  const enrollment = await prismaParent.studentEnrollment.findFirst({
    where: {
      Student: {
        orSourcedId: studentPersonId,
      },
    },
    orderBy: [
      { entryDate: "desc" },
      { createdAt: "desc" },
    ],
    select: { educationType: true },
  });

  return enrollment?.educationType ?? null;
}

async function loadActionConfigs(educationTypeHint: string | null, studentPersonId: string): Promise<StudentActionConfig[]> {
  const educationTypeRaw = educationTypeHint ?? (await resolveEducationType(studentPersonId, null));
  if (!educationTypeRaw) return [];

  const candidates = [educationTypeRaw, educationTypeRaw.toLowerCase(), educationTypeRaw.toUpperCase()]
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

function normalizeUpdateRequest(
  row: UpdateInformationRequests | null,
  fallback: {
    studentPersonId: string;
    parentPersonId: string | null;
    studentEmirateId: string | null;
  }
): ChildActionUpdateRequest {
  if (!row) {
    return {
      id: null,
      studentPersonId: fallback.studentPersonId,
      parentPersonId: fallback.parentPersonId,
      isInfoUpdateRequested: false,
      infoUpdateRequestStatus: null,
      isConductAgreementSigned: false,
      conductAgreementStatus: null,
      studentEmirateId: fallback.studentEmirateId,
      pdfBase64: null,
      citizenship: null,
      createAt: null,
      updateAt: null,
    };
  }

  return {
    id: row.Id,
    studentPersonId: row.studentPersonId,
    parentPersonId: row.parentPersonId ?? null,
    isInfoUpdateRequested: !!row.isInfoUpdateRequested,
    infoUpdateRequestStatus: row.infoUpdateRequestStatus ?? null,
    isConductAgreementSigned: !!row.isConductAgreementSigned,
    conductAgreementStatus: row.conductAgreementStatus ?? null,
    studentEmirateId: row.studentEmirateId ?? null,
    pdfBase64: row.pdfBase64 ?? null,
    citizenship: row.citizenship ?? null,
    createAt: row.createAt ? row.createAt.toISOString() : null,
    updateAt: row.updateAt ? row.updateAt.toISOString() : null,
  };
}

function resolveChildActions(context: ResolveContext): ChildActionResponse {
  const { student, updatePeriodActive, updateRequest, configs } = context;
  const infoRequested = updateRequest.isInfoUpdateRequested;
  const status = updateRequest.infoUpdateRequestStatus;
  const conductSigned = updateRequest.isConductAgreementSigned;
  const hasPdf = !!updateRequest.pdfBase64;

  const configsNormalized = configs.map((cfg) => ({
    key: cfg.actionKey.toLowerCase(),
    config: cfg,
  }));

  const hasConfigs = configsNormalized.length > 0;
  const enabledKeys = new Set(
    configsNormalized.filter((entry) => entry.config.isEnabled).map((entry) => entry.key)
  );

  const isActionAllowed = (key: ChildActionKey): boolean => {
    if (!hasConfigs) return true;
    return enabledKeys.has(key);
  };

  const actions: ChildActionDescriptor[] = [];
  const reasons: string[] = [];
  let statusBanner: ChildStatusBannerDescriptor | null = null;

  const updateWindowOpen = updatePeriodActive;
  const updateAllowedByConfig = isActionAllowed("update-info");
  const shouldRenderUpdateAction = updateWindowOpen && updateAllowedByConfig;

  if (!infoRequested) {
    if (shouldRenderUpdateAction) {
      actions.push({
        key: "update-info",
        labelKey: "childActions.updateInfo",
        label: "Update Information",
        href: `/child/${student.studentPersonId}/update-info?mode=init`,
        variant: "primary",
      });
    }
  } else if (status === 1 || status === 2) {
    statusBanner = {
      key: "childActions.status.inProgress",
      messageKey: "childActions.status.inProgress",
      message: "Update request in progress...",
      severity: "info",
    };

    if (!conductSigned && isActionAllowed("sign-conduct")) {
      actions.push({
        key: "sign-conduct",
        labelKey: "childActions.signConduct",
        label: "Sign Conduct",
        href: `/child/${student.studentPersonId}/parent-conduct`,
        variant: "primary",
      });
    }

    if (conductSigned && isActionAllowed("download-conduct")) {
      actions.push({
        key: "download-conduct",
        labelKey: "childActions.downloadConduct",
        label: "Download Conduct",
        variant: "download",
        disabled: !hasPdf,
        reasonKey: !hasPdf ? "childActions.reasons.pdfUnavailable" : null,
        reason: !hasPdf ? DOWNLOAD_UNAVAILABLE_REASON : null,
      });
    }
  } else if (status === 3) {
    if (!conductSigned && isActionAllowed("sign-conduct")) {
      actions.push({
        key: "sign-conduct",
        labelKey: "childActions.signConduct",
        label: "Sign Conduct",
        href: `/child/${student.studentPersonId}/sign-conduct`,
        variant: "primary",
      });
    }

    if (conductSigned && isActionAllowed("download-conduct")) {
      actions.push({
        key: "download-conduct",
        labelKey: "childActions.downloadConduct",
        label: "Download Conduct",
        variant: "download",
        disabled: !hasPdf,
        reasonKey: !hasPdf ? "childActions.reasons.pdfUnavailable" : null,
        reason: !hasPdf ? DOWNLOAD_UNAVAILABLE_REASON : null,
      });
    }

    if (isActionAllowed("view-profile")) {
      actions.push({
        key: "view-profile",
        labelKey: "childActions.viewProfile",
        label: "View Profile",
        href: `/child/${student.studentPersonId}`,
        variant: "secondary",
      });
    }
  } else {
    if (isActionAllowed("view-profile")) {
      actions.push({
        key: "view-profile",
        labelKey: "childActions.viewProfile",
        label: "View Profile",
        href: `/child/${student.studentPersonId}`,
        variant: "secondary",
      });
    }
  }

  if (!actions.length && isActionAllowed("view-profile")) {
    actions.push({
      key: "view-profile",
      labelKey: "childActions.viewProfile",
      label: "View Profile",
      href: `/child/${student.studentPersonId}`,
      variant: "secondary",
    });
  }

  if (!updateWindowOpen) {
    statusBanner = null;
  }

  const badge = deriveBadge(updateRequest, shouldRenderUpdateAction);

  return {
    ok: true,
    student,
    educationType: student.educationType,
    updatePeriodActive,
    updateRequest,
    idhStatusId: context.idhStatusId,
    idhFetchedAt: context.idhFetchedAt,
    actions,
    statusBanner,
    badge,
    downloads: { conductPdfAvailable: hasPdf },
    reasons: Array.from(new Set(reasons)),
  };
}

function deriveBadge(
  updateRequest: ChildActionUpdateRequest,
  canShowUpdateIndicators: boolean
): ChildStatusBadgeDescriptor | null {
  if (!canShowUpdateIndicators) {
    return null;
  }

  if (!updateRequest.isInfoUpdateRequested) {
    return {
      key: "childActions.badge.updateRequired",
      labelKey: "childActions.badge.updateRequired",
      label: "Update Required",
      tooltipKey: "childActions.badge.updateTooltip",
      tooltip: "You need to update information",
      tone: "urgent",
    };
  }

  if (
    updateRequest.isInfoUpdateRequested &&
    updateRequest.infoUpdateRequestStatus === 3 &&
    !updateRequest.isConductAgreementSigned
  ) {
    return {
      key: "childActions.badge.signatureRequired",
      labelKey: "childActions.badge.signatureRequired",
      label: "Signature Required",
      tooltipKey: "childActions.badge.signatureTooltip",
      tooltip: "Conduct signature required",
      tone: "info",
    };
  }

  return null;
}
