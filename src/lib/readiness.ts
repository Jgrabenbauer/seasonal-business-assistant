export type ReadinessAttachment = {
  id?: string;
  createdAt?: Date | string | null;
  capturedByName?: string | null;
  url?: string;
  filename?: string;
  mimeType?: string;
};

export type ReadinessItem = {
  id?: string;
  title: string;
  status: string;
  photoRequired: boolean;
  notes?: string | null;
  completedAt?: Date | string | null;
  attachments: ReadinessAttachment[];
};

export type PrimaryReadinessState =
  | 'NOT_GUEST_READY'
  | 'NEEDS_SIGN_OFF'
  | 'GUEST_READY_VERIFIED';

export type ReadinessBlocker = {
  type: 'incomplete' | 'missing-proof' | 'open-issue';
  label: string;
  count: number;
  items: string[];
};

export type ReadinessEvaluation = {
  primaryState: PrimaryReadinessState;
  primaryLabel: string;
  primaryDescription: string;
  primaryTone: 'red' | 'amber' | 'green';
  checklist: {
    totalSteps: number;
    completedSteps: number;
    pendingSteps: number;
    skippedSteps: number;
  };
  proof: {
    requiredPhotos: number;
    capturedRequiredPhotos: number;
    totalPhotos: number;
    missingRequiredPhotos: number;
  };
  blockers: ReadinessBlocker[];
  blockerCount: number;
  hardBlockerCount: number;
  unacknowledgedIssueCount: number;
  acknowledgedIssueCount: number;
  canMarkReady: boolean;
  canOverrideReady: boolean;
  canVerify: boolean;
  dueToday: boolean;
  overdue: boolean;
  atRisk: boolean;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function parseAcknowledgedExceptionIds(
  value: unknown
): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function evaluateTurnoverReadiness(params: {
  status?: string | null;
  items: ReadinessItem[];
  acknowledgedExceptionIds?: string[];
  guestArrivalAt?: Date | string | null;
  slaDeadlineAt?: Date | string | null;
  now?: Date;
}): ReadinessEvaluation {
  const now = params.now ?? new Date();
  const acknowledgedIds = new Set(params.acknowledgedExceptionIds ?? []);
  const items = params.items ?? [];

  const pendingItems = items.filter((item) => item.status === 'PENDING');
  const skippedItems = items.filter((item) => item.status === 'SKIPPED');
  const completedItems = items.filter((item) => item.status === 'COMPLETED');
  const missingProofItems = items.filter(
    (item) => item.photoRequired && item.attachments.length === 0
  );
  const requiredPhotoItems = items.filter((item) => item.photoRequired);
  const capturedRequiredPhotoItems = requiredPhotoItems.filter(
    (item) => item.attachments.length > 0
  );
  const totalPhotos = items.reduce((count, item) => count + item.attachments.length, 0);
  const acknowledgedIssues = skippedItems.filter(
    (item) => item.id && acknowledgedIds.has(item.id)
  );
  const unacknowledgedIssues = skippedItems.filter(
    (item) => !item.id || !acknowledgedIds.has(item.id)
  );

  const blockers: ReadinessBlocker[] = [];
  if (pendingItems.length > 0) {
    blockers.push({
      type: 'incomplete',
      label: 'Incomplete steps',
      count: pendingItems.length,
      items: pendingItems.map((item) => item.title)
    });
  }
  if (missingProofItems.length > 0) {
    blockers.push({
      type: 'missing-proof',
      label: 'Missing required proof',
      count: missingProofItems.length,
      items: missingProofItems.map((item) => item.title)
    });
  }
  if (unacknowledgedIssues.length > 0) {
    blockers.push({
      type: 'open-issue',
      label: 'Open issues',
      count: unacknowledgedIssues.length,
      items: unacknowledgedIssues.map((item) => item.title)
    });
  }

  const blockerCount = blockers.reduce((count, blocker) => count + blocker.count, 0);
  const hardBlockerCount = pendingItems.length + missingProofItems.length;
  const isCompliant = blockerCount === 0;
  const primaryState: PrimaryReadinessState =
    params.status === 'VERIFIED' && isCompliant
      ? 'GUEST_READY_VERIFIED'
      : params.status === 'READY' && isCompliant
        ? 'NEEDS_SIGN_OFF'
        : 'NOT_GUEST_READY';

  const primaryLabel =
    primaryState === 'GUEST_READY_VERIFIED'
      ? 'Guest-Ready (Verified)'
      : primaryState === 'NEEDS_SIGN_OFF'
        ? 'Needs Sign-Off'
        : 'Not Guest-Ready';

  const primaryDescription =
    primaryState === 'GUEST_READY_VERIFIED'
      ? 'Verified against checklist proof and ready for guest arrival.'
      : primaryState === 'NEEDS_SIGN_OFF'
        ? 'Checklist proof is complete and waiting for manager verification.'
        : blockerCount > 0
          ? `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} still require action.`
          : 'Field work is still in progress.';

  const arrival =
    params.guestArrivalAt !== null && params.guestArrivalAt !== undefined
      ? new Date(params.guestArrivalAt)
      : null;
  const deadline =
    params.slaDeadlineAt !== null && params.slaDeadlineAt !== undefined
      ? new Date(params.slaDeadlineAt)
      : null;

  const overdue = deadline ? now.getTime() > deadline.getTime() && primaryState !== 'GUEST_READY_VERIFIED' : false;
  const dueToday = arrival ? isSameDay(arrival, now) && primaryState !== 'GUEST_READY_VERIFIED' : false;
  const atRisk =
    primaryState !== 'GUEST_READY_VERIFIED' &&
    !overdue &&
    ((arrival ? arrival.getTime() - now.getTime() <= 24 * 60 * 60 * 1000 : false) ||
      blockerCount > 0);

  return {
    primaryState,
    primaryLabel,
    primaryDescription,
    primaryTone:
      primaryState === 'GUEST_READY_VERIFIED'
        ? 'green'
        : primaryState === 'NEEDS_SIGN_OFF'
          ? 'amber'
          : 'red',
    checklist: {
      totalSteps: items.length,
      completedSteps: completedItems.length,
      pendingSteps: pendingItems.length,
      skippedSteps: skippedItems.length
    },
    proof: {
      requiredPhotos: requiredPhotoItems.length,
      capturedRequiredPhotos: capturedRequiredPhotoItems.length,
      totalPhotos,
      missingRequiredPhotos: missingProofItems.length
    },
    blockers,
    blockerCount,
    hardBlockerCount,
    unacknowledgedIssueCount: unacknowledgedIssues.length,
    acknowledgedIssueCount: acknowledgedIssues.length,
    canMarkReady: hardBlockerCount === 0 && unacknowledgedIssues.length === 0,
    canOverrideReady: hardBlockerCount === 0 && unacknowledgedIssues.length > 0,
    canVerify:
      params.status === 'READY' &&
      hardBlockerCount === 0 &&
      unacknowledgedIssues.length === 0,
    dueToday,
    overdue,
    atRisk
  };
}
