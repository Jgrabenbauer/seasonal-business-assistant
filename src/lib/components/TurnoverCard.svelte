<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { formatDateTime } from '$lib/utils';
  import type { Turnover, Property, User } from '$lib/types';

  export let turnover: Turnover & {
    property: Property;
    assignedTo: User | null;
  };

  const now = () => new Date().getTime();

  function formatCountdown(target: Date) {
    const diff = target.getTime() - now();
    const abs = Math.abs(diff);
    const hoursTotal = Math.floor(abs / 3600000);
    const mins = Math.floor((abs % 3600000) / 60000);
    const days = Math.floor(hoursTotal / 24);
    const hours = hoursTotal % 24;
    const prefix = diff >= 0 ? 'in' : 'late by';
    if (days >= 1) {
      return `${prefix} ${days}d ${hours}h`;
    }
    return `${prefix} ${hours}h ${mins}m`;
  }

  $: arrival = turnover.guestArrivalAt ? new Date(turnover.guestArrivalAt) : null;
  $: sla = turnover.slaDeadlineAt ? new Date(turnover.slaDeadlineAt) : null;
  $: slaBreached = sla ? now() > sla.getTime() && !['READY', 'VERIFIED'].includes(turnover.status) : false;
  $: readiness = Math.max(0, Math.min(100, turnover.readinessScore ?? 0));
</script>

<a href="/dashboard/turnovers/{turnover.id}" class="card card-hover p-4 block no-underline">
  <div class="flex items-start justify-between gap-2">
    <div class="flex-1 min-w-0">
      <p class="font-semibold truncate">{turnover.title}</p>
      <p class="text-sm text-surface-500 mt-0.5">{turnover.property.name}</p>
    </div>
    <StatusBadge status={turnover.status} />
  </div>

  <div class="mt-3 grid grid-cols-2 gap-3 text-xs text-surface-500">
    {#if arrival}
      <div>
        <p class="text-[11px] uppercase tracking-wide text-surface-400">Guest Arrival</p>
        <p class="font-medium text-surface-600">{formatDateTime(arrival)}</p>
      </div>
    {/if}
    {#if sla}
      <div class="text-right">
        <p class="text-[11px] uppercase tracking-wide text-surface-400">SLA</p>
        <span class="badge {slaBreached ? 'variant-filled-error' : 'variant-soft-success'}">
          {slaBreached ? 'Late' : 'On Track'}
        </span>
      </div>
    {/if}
  </div>

  <div class="mt-3">
    <div class="flex items-center justify-between text-xs text-surface-400">
      <span>Readiness</span>
      <span>{readiness}%</span>
    </div>
    <div class="h-2 bg-surface-200-700-token rounded-full overflow-hidden mt-1">
      <div class="h-full bg-primary-500 rounded-full" style="width: {readiness}%"></div>
    </div>
  </div>

  <div class="flex items-center gap-4 mt-3 text-xs text-surface-400">
    {#if arrival}
      <span>⏳ {formatCountdown(arrival)}</span>
    {/if}
    {#if turnover.assignedTo}
      <span>👤 {turnover.assignedTo.name}</span>
    {:else}
      <span class="text-warning-500">Unassigned</span>
    {/if}
  </div>
</a>
