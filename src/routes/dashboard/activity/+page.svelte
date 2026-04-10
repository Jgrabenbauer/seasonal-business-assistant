<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  const actionLabels: Record<string, string> = {
    TURNOVER_SCHEDULED: 'Turnover scheduled',
    TURNOVER_ASSIGNED: 'Turnover assigned',
    TURNOVER_READY: 'Property marked ready',
    TURNOVER_VERIFIED: 'Turnover verified',
    READINESS_STEP_COMPLETED: 'Readiness step completed',
    CHECKLIST_ITEM_COMPLETED: 'Checklist item completed',
    PHOTO_UPLOADED: 'Proof photo uploaded',
    TEMPLATE_CREATED: 'Template created',
    TEMPLATE_EDITED: 'Template edited',
    WORKER_ADDED: 'Worker added',
    PROPERTY_ADDED: 'Property added',
    MAGIC_LINK_SENT: 'Magic link sent',
    MAGIC_LINK_USED: 'Field link opened'
  };

  function getLogMeta(log: PageData['logs'][number]) {
    return log.metadata as Record<string, string> | null;
  }

  function relativeTime(date: string | Date): string {
    const ms = Date.now() - new Date(date).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
</script>

<svelte:head>
  <title>Readiness Activity — SBA</title>
</svelte:head>

<div class="space-y-4">
  <h1 class="text-2xl font-semibold">Readiness Activity</h1>

  {#if data.logs.length === 0}
    <div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No activity yet.</div>
  {:else}
    <ul class="space-y-2">
      {#each data.logs as log (log.id)}
        {@const meta = getLogMeta(log)}
        <li class="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
          <div class="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm">{actionLabels[log.actionType] ?? log.actionType}</p>
            {#if meta?.title}
              <p class="text-xs text-muted-foreground truncate">{meta.title}</p>
            {/if}
            <p class="text-xs text-muted-foreground mt-0.5">
              {log.user ? `${log.user.name} (${log.user.role})` : 'Worker via link'}
              &middot; {log.entityType} &middot; {relativeTime(log.createdAt)}
            </p>
          </div>
        </li>
      {/each}
    </ul>

    <Pagination page={data.page} totalPages={data.totalPages} />
  {/if}
</div>
