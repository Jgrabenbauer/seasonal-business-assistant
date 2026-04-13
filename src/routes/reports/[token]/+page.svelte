<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { evaluateTurnoverReadiness, parseAcknowledgedExceptionIds } from '$lib/readiness';
  import { formatDateTime } from '$lib/utils';
  import type { PageData } from './$types';

  export let data: PageData;

  const org = data.turnover.organization;
  const items = data.turnover.workOrder?.checklistRun?.items ?? [];
  const history = data.turnover.readinessHistory ?? [];
  const readiness = evaluateTurnoverReadiness({
    status: data.turnover.status,
    items,
    acknowledgedExceptionIds: parseAcknowledgedExceptionIds(data.turnover.exceptionOverrideItemIds),
    guestArrivalAt: data.turnover.guestArrivalAt,
    slaDeadlineAt: data.turnover.slaDeadlineAt
  });
  const proofPhotos = items.flatMap((item) =>
    item.attachments.map((attachment) => ({
      ...attachment,
      itemTitle: item.title,
      capturedByName: attachment.capturedByName ?? data.turnover.assignedTo?.name ?? 'Field worker'
    }))
  );
</script>

<svelte:head>
  <title>Turnover Readiness Report — SBA</title>
</svelte:head>

<div class="min-h-screen bg-[linear-gradient(180deg,rgba(15,118,110,0.06),rgba(248,250,252,0.92))] px-4 py-8">
  <div class="mx-auto max-w-5xl space-y-6">
    <div class="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/40 px-6 py-4">
        <div class="flex items-center gap-3">
          {#if org.brandLogoUrl}
            <img src={org.brandLogoUrl} alt="{org.name} logo" class="h-10" />
          {:else}
            <div class="text-xl font-bold" style="color: {org.brandAccentColor ?? '#0f766e'}">
              {org.brandName ?? org.name}
            </div>
          {/if}
        </div>
        <StatusBadge status={data.turnover.status} />
      </div>

      <div class="p-6 md:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="max-w-3xl">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Confidence Report</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight">{data.turnover.property.name}</h1>
            <p class="mt-2 text-muted-foreground">{data.turnover.title}</p>
            <p class="mt-3 text-sm">{readiness.primaryLabel}</p>
            <p class="mt-2 text-sm text-muted-foreground">
              Guest arrival {formatDateTime(data.turnover.guestArrivalAt)} · Readiness deadline {formatDateTime(data.turnover.slaDeadlineAt)}
            </p>
          </div>

          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p class="font-semibold">Can I trust this property is ready?</p>
            <p class="mt-1 text-emerald-800/80">
              This report shows readiness status, verification, required proof coverage, and any acknowledged issues.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Readiness Status</p>
        <p class="mt-2 text-lg font-semibold">{readiness.primaryLabel}</p>
        <p class="mt-1 text-sm text-muted-foreground">{readiness.primaryDescription}</p>
      </div>
      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Verification</p>
        <p class="mt-2 text-lg font-semibold">{data.turnover.verifiedBy?.name ?? 'Pending'}</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {data.turnover.verifiedAt ? formatDateTime(data.turnover.verifiedAt) : 'Not yet verified'}
        </p>
      </div>
      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Required Steps</p>
        <p class="mt-2 text-lg font-semibold">{readiness.checklist.completedSteps}/{readiness.checklist.totalSteps}</p>
        <p class="mt-1 text-sm text-muted-foreground">Checklist steps completed.</p>
      </div>
      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Required Proof</p>
        <p class="mt-2 text-lg font-semibold">{readiness.proof.capturedRequiredPhotos}/{readiness.proof.requiredPhotos}</p>
        <p class="mt-1 text-sm text-muted-foreground">Required proof photos captured.</p>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.25fr,0.95fr]">
      <div class="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">Evidence Gallery</h2>
          <Badge variant="secondary">{proofPhotos.length}</Badge>
        </div>
        {#if proofPhotos.length === 0}
          <p class="text-sm text-muted-foreground">No proof photos uploaded.</p>
        {:else}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {#each proofPhotos as photo}
              <figure class="overflow-hidden rounded-2xl border border-border bg-muted/20">
                <img src={photo.url} alt={photo.filename} class="aspect-[4/3] w-full object-cover" />
                <figcaption class="px-4 py-3">
                  <p class="text-sm font-medium">{photo.itemTitle}</p>
                  <p class="mt-1 text-xs text-muted-foreground">Captured by {photo.capturedByName} · {formatDateTime(photo.createdAt)}</p>
                </figcaption>
              </figure>
            {/each}
          </div>
        {/if}
      </div>

      <div class="space-y-6">
        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Blockers and Exceptions</h2>
            <Badge variant="secondary">{readiness.blockerCount}</Badge>
          </div>
          {#if readiness.blockers.length === 0}
            <p class="text-sm text-muted-foreground">No active blockers remain on this turnover.</p>
          {:else}
            <ul class="space-y-3">
              {#each readiness.blockers as blocker}
                <li class="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p class="font-medium text-red-950">{blocker.label}</p>
                  <p class="mt-1 text-sm text-red-900/85">{blocker.count} blocking item{blocker.count === 1 ? '' : 's'}.</p>
                  <ul class="mt-2 space-y-1 text-sm text-red-900/90">
                    {#each blocker.items as itemTitle}
                      <li>{itemTitle}</li>
                    {/each}
                  </ul>
                </li>
              {/each}
            </ul>
          {/if}

          {#if data.turnover.exceptionOverrideReason}
            <div class="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p class="font-medium text-orange-950">Acknowledged Issues</p>
              <p class="mt-1 text-sm text-orange-900/85">
                {data.turnover.exceptionOverrideBy?.name ?? 'Manager'}
                {#if data.turnover.exceptionOverrideAt}
                  on {formatDateTime(data.turnover.exceptionOverrideAt)}
                {/if}
              </p>
              <p class="mt-2 text-sm text-orange-900">{data.turnover.exceptionOverrideReason}</p>
            </div>
          {/if}
        </div>

        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Verification Timeline</h2>
            <Badge variant="secondary">{history.length}</Badge>
          </div>
          {#if history.length === 0}
            <p class="text-sm text-muted-foreground">No audit events recorded.</p>
          {:else}
            <ul class="space-y-3">
              {#each history as event}
                <li class="rounded-2xl border border-border bg-muted/30 p-4">
                  <div class="flex items-center justify-between gap-2">
                    <StatusBadge status={event.status} />
                    <span class="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</span>
                  </div>
                  {#if event.note}
                    <p class="mt-2 text-sm">{event.note}</p>
                  {/if}
                  {#if event.actor}
                    <p class="mt-1 text-xs text-muted-foreground">{event.actor.name}</p>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>

    <div class="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Checklist of Record</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {readiness.checklist.completedSteps} of {readiness.checklist.totalSteps} steps complete.
          </p>
        </div>
        <Badge variant="secondary">{readiness.primaryLabel}</Badge>
      </div>
      {#if items.length === 0}
        <p class="text-sm text-muted-foreground">No checklist items available.</p>
      {:else}
        <div class="space-y-2">
          {#each items as item}
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm">
              <div class="min-w-0">
                <p class="font-medium">{item.title}</p>
                {#if item.notes}
                  <p class="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                {/if}
              </div>
              <div class="flex items-center gap-2">
                {#if item.attachments.length > 0}
                  <Badge variant="secondary">{item.attachments.length} photo{item.attachments.length === 1 ? '' : 's'}</Badge>
                {/if}
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : item.status === 'SKIPPED' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}">
                  {item.status === 'COMPLETED' ? 'Complete' : item.status === 'SKIPPED' ? 'Open Issue' : 'Incomplete'}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if org.brandContactInfo}
      <div class="text-center text-xs text-muted-foreground">{org.brandContactInfo}</div>
    {/if}
  </div>
</div>
