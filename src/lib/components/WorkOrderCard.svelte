<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { formatDate } from '$lib/utils';
  import Calendar from 'lucide-svelte/icons/calendar';
  import User from 'lucide-svelte/icons/user';
  import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
  import type { WorkOrder, Property, User as UserType } from '$lib/types';

  export let workOrder: WorkOrder & {
    property: Property;
    assignedTo: UserType | null;
  };
</script>

<a
  href="/dashboard/work-orders/{workOrder.id}"
  class="block rounded-lg border border-border bg-card p-4 no-underline shadow-sm transition-shadow hover:shadow-md"
>
  <div class="flex items-start justify-between gap-2">
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm truncate text-card-foreground">{workOrder.title}</p>
      <p class="text-xs text-muted-foreground mt-0.5">{workOrder.property.name}</p>
    </div>
    <StatusBadge status={workOrder.status} />
  </div>

  <div class="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
    {#if workOrder.scheduledFor}
      <span class="flex items-center gap-1">
        <Calendar size={11} strokeWidth={2} />
        {formatDate(workOrder.scheduledFor)}
      </span>
    {/if}
    {#if workOrder.assignedTo}
      <span class="flex items-center gap-1">
        <User size={11} strokeWidth={2} />
        {workOrder.assignedTo.name}
      </span>
    {:else}
      <span class="flex items-center gap-1 text-yellow-600">
        <TriangleAlert size={11} strokeWidth={2} />
        Unassigned
      </span>
    {/if}
  </div>
</a>
