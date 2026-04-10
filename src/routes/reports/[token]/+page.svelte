<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const org = data.turnover.organization;
  const items = data.turnover.workOrder?.checklistRun?.items ?? [];
  const history = data.turnover.readinessHistory ?? [];
</script>

<svelte:head>
  <title>Turnover Readiness Certificate — SBA</title>
</svelte:head>

<div class="min-h-screen bg-muted/40 px-4 py-8">
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="rounded-lg border border-border bg-card shadow-sm p-6">
      <div class="flex items-center gap-3">
        {#if org.brandLogoUrl}
          <img src={org.brandLogoUrl} alt="{org.name} logo" class="h-10" />
        {:else}
          <div class="text-xl font-bold" style="color: {org.brandAccentColor ?? '#0f766e'}">
            {org.brandName ?? org.name}
          </div>
        {/if}
      </div>
      <h1 class="text-2xl font-bold mt-4">Turnover Readiness Certificate</h1>
      <p class="text-muted-foreground mt-1">
        {data.turnover.title} — {data.turnover.property.name}
      </p>
      {#if data.turnover.verifiedAt}
        <p class="text-sm text-muted-foreground mt-2">
          Verified {new Date(data.turnover.verifiedAt).toLocaleString()}
        </p>
      {/if}
    </div>

    <div class="rounded-lg border border-border bg-card shadow-sm p-6">
      <h2 class="font-semibold text-lg mb-3">Readiness Summary</h2>
      <div class="text-sm text-muted-foreground mb-2">
        SLA Status: {data.turnover.slaDeadlineAt && data.turnover.readyAt && data.turnover.readyAt <= data.turnover.slaDeadlineAt ? 'On-time' : 'Late'}
      </div>
      <div class="text-sm text-muted-foreground mb-2">
        Readiness Score: {data.turnover.readinessScore}%
      </div>
      {#if data.turnover.verifiedBy}
        <div class="text-sm text-muted-foreground mb-2">
          Verified by: {data.turnover.verifiedBy.name}
        </div>
      {/if}
      {#if items.length === 0}
        <p class="text-muted-foreground text-sm">No checklist items available.</p>
      {:else}
        <ul class="space-y-2">
          {#each items as item}
            <li class="flex items-center justify-between border-b border-border pb-2 text-sm">
              <span>{item.title}</span>
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                {item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-secondary text-secondary-foreground'}">
                {item.status}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="rounded-lg border border-border bg-card shadow-sm p-6">
      <h2 class="font-semibold text-lg mb-3">Proof Photos</h2>
      {#if items.every((i) => i.attachments.length === 0)}
        <p class="text-muted-foreground text-sm">No photos uploaded.</p>
      {:else}
        <div class="grid grid-cols-2 gap-3">
          {#each items as item}
            {#each item.attachments as att}
              <img src={att.url} alt={att.filename} class="rounded-lg border border-border" />
            {/each}
          {/each}
        </div>
      {/if}
    </div>

    <div class="rounded-lg border border-border bg-card shadow-sm p-6">
      <h2 class="font-semibold text-lg mb-3">Audit Trail</h2>
      {#if history.length === 0}
        <p class="text-muted-foreground text-sm">No audit events recorded.</p>
      {:else}
        <ul class="space-y-2 text-sm text-muted-foreground">
          {#each history.slice(0, 5) as event}
            <li class="flex justify-between gap-3">
              <span>{event.status}{event.actor ? ` · ${event.actor.name}` : ''}</span>
              <span class="text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    {#if org.brandContactInfo}
      <div class="text-xs text-muted-foreground text-center">{org.brandContactInfo}</div>
    {/if}
  </div>
</div>
