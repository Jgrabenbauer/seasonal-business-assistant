<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { formatDateTime } from '$lib/utils';
  import Clock from 'lucide-svelte/icons/clock';
  import User from 'lucide-svelte/icons/user';
  import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
  import type { Turnover, Property, User as UserType } from '$lib/types';

  export let turnover: Turnover & {
    property: Property;
    assignedTo: UserType | null;
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
    if (days >= 1) return `${prefix} ${days}d ${hours}h`;
    return `${prefix} ${hours}h ${mins}m`;
  }

  $: arrival = turnover.guestArrivalAt ? new Date(turnover.guestArrivalAt) : null;
  $: sla = turnover.slaDeadlineAt ? new Date(turnover.slaDeadlineAt) : null;
  $: slaBreached = sla ? now() > sla.getTime() && !['READY', 'VERIFIED'].includes(turnover.status) : false;
  $: readiness = Math.max(0, Math.min(100, turnover.readinessScore ?? 0));
</script>

<a
  href="/dashboard/turnovers/{turnover.id}"
  class="block rounded-lg border border-border bg-card p-4 no-underline shadow-sm transition-shadow hover:shadow-md"
>
  <div class="flex items-start justify-between gap-2">
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm truncate text-card-foreground">{turnover.title}</p>
      <p class="text-xs text-muted-foreground mt-0.5">{turnover.property.name}</p>
    </div>
    <StatusBadge status={turnover.status} />
  </div>

  <div class="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
    {#if arrival}
      <div>
        <p class="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Guest Arrival</p>
        <p class="font-medium text-foreground">{formatDateTime(arrival)}</p>
      </div>
    {/if}
    {#if sla}
      <div class="text-right">
        <p class="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">SLA</p>
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
          {slaBreached ? 'bg-destructive text-destructive-foreground' : 'bg-green-100 text-green-800'}">
          {slaBreached ? 'Late' : 'On Track'}
        </span>
      </div>
    {/if}
  </div>

  <div class="mt-3">
    <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
      <span>Readiness</span>
      <span class="font-medium">{readiness}%</span>
    </div>
    <div class="h-1.5 bg-secondary rounded-full overflow-hidden">
      <div class="h-full bg-primary rounded-full transition-all" style="width: {readiness}%"></div>
    </div>
  </div>

  <div class="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
    {#if arrival}
      <span class="flex items-center gap-1">
        <Clock size={11} strokeWidth={2} />
        {formatCountdown(arrival)}
      </span>
    {/if}
    {#if turnover.assignedTo}
      <span class="flex items-center gap-1">
        <User size={11} strokeWidth={2} />
        {turnover.assignedTo.name}
      </span>
    {:else}
      <span class="flex items-center gap-1 text-yellow-600">
        <TriangleAlert size={11} strokeWidth={2} />
        Unassigned
      </span>
    {/if}
  </div>
</a>
