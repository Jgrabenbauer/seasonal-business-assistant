<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { evaluateTurnoverReadiness, parseAcknowledgedExceptionIds } from '$lib/readiness';
  import { formatDateTime } from '$lib/utils';
  import Clock from 'lucide-svelte/icons/clock';
  import User from 'lucide-svelte/icons/user';
  import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
  import ShieldCheck from 'lucide-svelte/icons/shield-check';
  import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
  import type { Turnover, Property, User as UserType } from '$lib/types';

  export let turnover: Turnover & {
    property: Property;
    assignedTo: UserType | null;
    verifiedBy?: UserType | null;
    workOrder?: {
      checklistRun?: {
        items: Array<{
          id: string;
          title: string;
          status: string;
          photoRequired: boolean;
          attachments: Array<{ id?: string; createdAt?: string | Date | null; capturedByName?: string | null }>;
        }>;
      } | null;
    } | null;
  };
  export let compact = false;

  const now = () => new Date().getTime();

  function formatCountdown(target: Date) {
    const diff = target.getTime() - now();
    const abs = Math.abs(diff);
    const hoursTotal = Math.floor(abs / 3600000);
    const mins = Math.floor((abs % 3600000) / 60000);
    const days = Math.floor(hoursTotal / 24);
    const hours = hoursTotal % 24;
    const prefix = diff >= 0 ? 'in' : 'late by';
    if (days >= 1) return `${prefix} ${days}d ${hours}h`;
    return `${prefix} ${hours}h ${mins}m`;
  }

  $: arrival = turnover.guestArrivalAt ? new Date(turnover.guestArrivalAt) : null;
  $: items = turnover.workOrder?.checklistRun?.items ?? [];
  $: readiness = evaluateTurnoverReadiness({
    status: turnover.status,
    items,
    acknowledgedExceptionIds: parseAcknowledgedExceptionIds(turnover.exceptionOverrideItemIds),
    guestArrivalAt: turnover.guestArrivalAt,
    slaDeadlineAt: turnover.slaDeadlineAt
  });
  $: blockerSummary = readiness.blockers
    .map((blocker) => `${blocker.count} ${blocker.label.toLowerCase()}`)
    .join(' · ');
</script>

<a
  href="/dashboard/turnovers/{turnover.id}"
  class="block rounded-xl border p-4 no-underline shadow-sm transition-shadow hover:shadow-md
    {readiness.primaryTone === 'green'
      ? 'border-emerald-300 bg-emerald-50/70'
      : readiness.primaryTone === 'amber'
        ? 'border-orange-300 bg-orange-50/70'
        : 'border-red-300 bg-red-50/70'}"
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <p class="font-semibold text-sm text-card-foreground truncate">{turnover.property.name}</p>
      <p class="mt-0.5 text-xs text-muted-foreground truncate">{turnover.title}</p>
    </div>
    <StatusBadge status={turnover.status} />
  </div>

  <div class="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
    {#if arrival}
      <div>
        <p class="text-[10px] uppercase tracking-wide mb-0.5">Guest Arrival</p>
        <p class="font-medium text-foreground">{formatDateTime(arrival)}</p>
      </div>
    {/if}
    <div class="text-right">
      <p class="text-[10px] uppercase tracking-wide mb-0.5">Truth State</p>
      <p class="font-medium text-foreground">{readiness.primaryLabel}</p>
    </div>
  </div>

  <div class="mt-3 rounded-lg border border-white/70 bg-white/70 px-3 py-2">
    <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Blockers</p>
    {#if readiness.blockerCount > 0}
      <p class="mt-1 text-sm font-medium text-foreground">{blockerSummary}</p>
    {:else if readiness.primaryState === 'NEEDS_SIGN_OFF'}
      <p class="mt-1 text-sm font-medium text-foreground">No blockers. Ready for manager sign-off.</p>
    {:else}
      <p class="mt-1 text-sm font-medium text-foreground">No blockers. Verified and guest-ready.</p>
    {/if}
  </div>

  {#if !compact}
    <div class="mt-3 flex flex-wrap gap-1.5">
      {#if readiness.overdue}
        <span class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-[11px] font-medium text-red-800">
          Overdue
        </span>
      {/if}
      {#if readiness.dueToday}
        <span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">
          Arrival today
        </span>
      {/if}
      {#if readiness.acknowledgedIssueCount > 0}
        <span class="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-[11px] font-medium text-orange-800">
          <ShieldCheck size={11} strokeWidth={2} />
          {readiness.acknowledgedIssueCount} issue{readiness.acknowledgedIssueCount === 1 ? '' : 's'} acknowledged
        </span>
      {/if}
      <span class="inline-flex items-center rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-700">
        {readiness.checklist.completedSteps}/{readiness.checklist.totalSteps} steps complete
      </span>
      <span class="inline-flex items-center rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-700">
        {readiness.proof.capturedRequiredPhotos}/{readiness.proof.requiredPhotos} required photos
      </span>
    </div>
  {/if}

  <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
    {#if arrival}
      <span class="flex items-center gap-1">
        <Clock size={11} strokeWidth={2} />
        {formatCountdown(arrival)}
      </span>
    {/if}

    {#if readiness.primaryState === 'GUEST_READY_VERIFIED' && turnover.verifiedBy && turnover.verifiedAt}
      <span class="flex items-center gap-1">
        <CheckCircle2 size={11} strokeWidth={2} />
        Verified by {turnover.verifiedBy.name} at {formatDateTime(turnover.verifiedAt)}
      </span>
    {:else if turnover.assignedTo}
      <span class="flex items-center gap-1">
        <User size={11} strokeWidth={2} />
        {turnover.assignedTo.name}
      </span>
    {:else}
      <span class="flex items-center gap-1 text-yellow-700">
        <TriangleAlert size={11} strokeWidth={2} />
        Unassigned
      </span>
    {/if}
  </div>
</a>
