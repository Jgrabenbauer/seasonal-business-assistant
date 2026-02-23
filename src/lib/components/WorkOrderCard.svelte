<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { formatDate } from '$lib/utils';
  import type { WorkOrder, Property, User } from '$lib/types';

  export let workOrder: WorkOrder & {
    property: Property;
    assignedTo: User | null;
  };
</script>

<a
  href="/dashboard/work-orders/{workOrder.id}"
  class="card card-hover p-4 block no-underline"
>
  <div class="flex items-start justify-between gap-2">
    <div class="flex-1 min-w-0">
      <p class="font-semibold truncate">{workOrder.title}</p>
      <p class="text-sm text-surface-500 mt-0.5">{workOrder.property.name}</p>
    </div>
    <StatusBadge status={workOrder.status} />
  </div>

  <div class="flex items-center gap-4 mt-3 text-sm text-surface-400">
    {#if workOrder.scheduledFor}
      <span>📅 {formatDate(workOrder.scheduledFor)}</span>
    {/if}
    {#if workOrder.assignedTo}
      <span>👤 {workOrder.assignedTo.name}</span>
    {:else}
      <span class="text-warning-500">Unassigned</span>
    {/if}
  </div>
</a>
