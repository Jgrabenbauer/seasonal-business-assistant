<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { formatDateTime } from '$lib/utils';
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';
  import ShieldAlert from 'lucide-svelte/icons/shield-alert';
  import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
  import BadgeCheck from 'lucide-svelte/icons/badge-check';

  export let data: PageData;
  export let form: ActionData;

  let copiedMessage: string | null = null;

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement('input');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    copiedMessage = `${label} copied`;
    const current = copiedMessage;
    setTimeout(() => {
      if (copiedMessage === current) copiedMessage = null;
    }, 1800);
  }

  function downloadPdf() {
    if (form && 'pdfBase64' in form && form.pdfBase64) {
      const bytes = Uint8Array.from(atob(form.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (form as { filename?: string }).filename ?? 'turnover-readiness-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  $: if (form && 'pdfBase64' in form) downloadPdf();
  $: turnover = data.turnover;
  $: readiness = data.readiness;
  $: items = turnover.workOrder?.checklistRun?.items ?? [];
  $: proofPhotos = items.flatMap((item) =>
    item.attachments.map((att) => ({
      ...att,
      itemTitle: item.title,
      capturedByName: att.capturedByName ?? turnover.assignedTo?.name ?? 'Field worker'
    }))
  );
</script>

<svelte:head>
  <title>{turnover.title} — SBA</title>
</svelte:head>

<div class="flex items-center gap-2 text-muted-foreground text-sm mb-4">
  <a href="/dashboard/turnovers" class="text-primary underline-offset-4 hover:underline">Turnovers</a>
  <span>/</span>
  <span class="truncate text-foreground">{turnover.property.name}</span>
</div>

<div class="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(255,247,237,0.95))] p-6 shadow-sm mb-6">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="max-w-3xl">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Guest-Ready Truth</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">{turnover.property.name}</h1>
      <p class="mt-1 text-sm text-muted-foreground">{turnover.title}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={turnover.status} />
        {#if readiness.primaryState === 'GUEST_READY_VERIFIED'}
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <BadgeCheck size={12} strokeWidth={2} />
            {readiness.primaryLabel}
          </span>
        {:else if readiness.primaryState === 'NEEDS_SIGN_OFF'}
          <span class="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">
            <ShieldAlert size={12} strokeWidth={2} />
            {readiness.primaryLabel}
          </span>
        {:else}
          <span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
            <TriangleAlert size={12} strokeWidth={2} />
            {readiness.primaryLabel}
          </span>
        {/if}
      </div>
      <p class="mt-3 text-sm text-foreground">{readiness.primaryDescription}</p>
      <p class="mt-2 text-sm text-muted-foreground">
        Guest arrival {formatDateTime(turnover.guestArrivalAt)} · Readiness deadline {formatDateTime(turnover.slaDeadlineAt)}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      {#if data.reportUrl}
        <Button href={data.reportUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
          Open Confidence Report
        </Button>
      {/if}
      <form method="POST" action="?/export_pdf" use:enhance>
        <Button type="submit" variant="outline" size="sm">Export Report</Button>
      </form>
    </div>
  </div>

  <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Required Steps</p>
      <p class="mt-2 text-base font-semibold">
        {readiness.checklist.completedSteps}/{readiness.checklist.totalSteps} complete
      </p>
      <p class="mt-1 text-sm text-muted-foreground">Every checklist step must be complete before sign-off.</p>
    </div>
    <div class="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Required Proof</p>
      <p class="mt-2 text-base font-semibold">
        {readiness.proof.capturedRequiredPhotos}/{readiness.proof.requiredPhotos} photos captured
      </p>
      <p class="mt-1 text-sm text-muted-foreground">{readiness.proof.totalPhotos} total proof photo{readiness.proof.totalPhotos === 1 ? '' : 's'} uploaded.</p>
    </div>
    <div class="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Verification</p>
      <p class="mt-2 text-base font-semibold">
        {turnover.verifiedBy ? turnover.verifiedBy.name : turnover.status === 'READY' ? 'Pending sign-off' : 'Not verified'}
      </p>
      <p class="mt-1 text-sm text-muted-foreground">
        {turnover.verifiedAt ? `Verified ${formatDateTime(turnover.verifiedAt)}` : 'Verification has not happened yet.'}
      </p>
    </div>
    <div class="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Exceptions</p>
      <p class="mt-2 text-base font-semibold">{readiness.checklist.skippedSteps}</p>
      <p class="mt-1 text-sm text-muted-foreground">
        {readiness.override.active
          ? `${readiness.acknowledgedIssueCount} acknowledged issue${readiness.acknowledgedIssueCount === 1 ? '' : 's'} on file`
          : 'Open issues must be acknowledged before sign-off.'}
      </p>
    </div>
  </div>
</div>

{#if form?.error}
  <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
{/if}
{#if form?.sent}
  <div class="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm mb-4">Link resent successfully.</div>
{/if}
{#if form?.sentExternal}
  <div class="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm mb-4">Owner update sent successfully.</div>
{/if}

<div class="grid gap-6 xl:grid-cols-[1.15fr,0.85fr] mb-6">
  <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div>
        <h2 class="text-lg font-semibold">Blockers</h2>
        <p class="mt-1 text-sm text-muted-foreground">The turnover cannot move forward until these are resolved or explicitly acknowledged.</p>
      </div>
      <Badge variant="secondary">{readiness.blockerCount}</Badge>
    </div>

    {#if readiness.blockers.length === 0}
      <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p class="font-medium text-emerald-900">No active blockers.</p>
        <p class="mt-1 text-sm text-emerald-800">The checklist and proof meet the readiness rules.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each readiness.blockers as blocker}
          <div class="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-red-950">{blocker.label}</p>
                <p class="mt-1 text-sm text-red-900/80">{blocker.count} item{blocker.count === 1 ? '' : 's'} still blocking readiness.</p>
              </div>
              <Badge class="bg-red-600 text-white">{blocker.count}</Badge>
            </div>
            <ul class="mt-3 space-y-1 text-sm text-red-900/90">
              {#each blocker.items as itemTitle}
                <li>{itemTitle}</li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {/if}

    {#if readiness.override.active}
      <div class="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <p class="font-medium text-orange-950">Acknowledged Issues</p>
        <p class="mt-1 text-sm text-orange-900/85">
          {readiness.override.acknowledgedByName ?? 'Manager'} acknowledged {readiness.acknowledgedIssueCount}
          issue{readiness.acknowledgedIssueCount === 1 ? '' : 's'}
          {#if readiness.override.acknowledgedAt}
            on {formatDateTime(readiness.override.acknowledgedAt)}
          {/if}
          .
        </p>
        {#if readiness.override.reason}
          <p class="mt-2 text-sm text-orange-900">{readiness.override.reason}</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div>
        <h2 class="text-lg font-semibold">Decision</h2>
        <p class="mt-1 text-sm text-muted-foreground">Ready and verified are controlled state changes.</p>
      </div>
      <Badge variant="secondary">{readiness.primaryLabel}</Badge>
    </div>

    {#if turnover.status === 'VERIFIED'}
      <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p class="font-medium text-emerald-950">Verified by {turnover.verifiedBy?.name ?? 'Manager'}</p>
        <p class="mt-1 text-sm text-emerald-900/85">
          {turnover.verifiedAt ? formatDateTime(turnover.verifiedAt) : 'Verification time unavailable'}
        </p>
      </div>
    {:else if turnover.status === 'READY'}
      <form method="POST" action="?/verify" use:enhance class="space-y-4">
        <div class="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p class="font-medium text-orange-950">Needs manager sign-off</p>
          <p class="mt-1 text-sm text-orange-900/85">Verification records who approved this turnover and when.</p>
        </div>
        <label class="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
          <input type="checkbox" name="confirmVerification" class="mt-0.5 h-4 w-4 rounded border border-input" />
          <span>I reviewed the checklist proof, photos, and any acknowledged issues for this turnover.</span>
        </label>
        <Button type="submit">Verify Guest-Ready</Button>
      </form>
    {:else if readiness.canMarkReady}
      <form method="POST" action="?/mark_ready" use:enhance class="space-y-4">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p class="font-medium text-emerald-950">Ready for sign-off</p>
          <p class="mt-1 text-sm text-emerald-900/85">All enforcement rules pass. Promote this turnover to manager sign-off.</p>
        </div>
        <Button type="submit">Mark Ready for Sign-Off</Button>
      </form>
    {:else if readiness.canOverrideReady}
      <form method="POST" action="?/mark_ready_override" use:enhance class="space-y-4">
        <div class="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p class="font-medium text-orange-950">Open issues require explicit acknowledgment</p>
          <p class="mt-1 text-sm text-orange-900/85">Incomplete steps and missing proof are still blocked. Only open issues can be acknowledged for sign-off.</p>
        </div>
        <div class="space-y-1.5">
          <Label for="overrideReason">Acknowledgment Reason</Label>
          <textarea
            id="overrideReason"
            name="overrideReason"
            rows="4"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Explain why these issues are acceptable for sign-off."
            required
          ></textarea>
        </div>
        <Button type="submit" variant="outline">Acknowledge Issues and Mark Ready</Button>
      </form>
    {:else}
      <div class="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p class="font-medium text-red-950">Cannot move this turnover forward yet.</p>
        <p class="mt-1 text-sm text-red-900/85">Resolve the blockers above before it can be marked ready.</p>
      </div>
    {/if}
  </div>
</div>

<div class="rounded-2xl border border-border bg-card p-6 shadow-sm mb-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold">Field Turnover Flow</h2>
    {#if turnover.assignedTo}
      <Badge variant="secondary">{turnover.assignedTo.name}</Badge>
    {/if}
  </div>

  {#if turnover.assignedTo}
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="font-medium">{turnover.assignedTo.name}</p>
        <p class="text-sm text-muted-foreground">{turnover.assignedTo.phone}</p>
      </div>
      <div class="flex gap-2">
        {#if data.magicLink}
          <Button href={data.magicLink} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
            Open Field View
          </Button>
          <form method="POST" action="?/send_link" use:enhance>
            <Button type="submit" variant="ghost" size="sm">Resend SMS</Button>
          </form>
        {/if}
      </div>
    </div>
    {#if data.magicLink}
      <div class="mt-3">
        <p class="text-xs text-muted-foreground mb-1">Short Link</p>
        <div class="flex items-center gap-2">
          <code class="text-xs bg-muted px-2 py-1 rounded break-all flex-1">{data.shortLink ?? '—'}</code>
          {#if data.shortLink}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onclick={() => data.shortLink && copyText(data.shortLink, 'Short link')}
              aria-label="Copy short link"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M8 7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2v-2h2V7h-7v2H8V7z"/>
                <path d="M5 9a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm2 0v7h7V9H7z"/>
              </svg>
            </Button>
          {/if}
        </div>
        {#if copiedMessage}
          <div class="mt-2 text-xs text-muted-foreground">{copiedMessage}</div>
        {/if}
      </div>
    {/if}
  {:else}
    <form method="POST" action="?/assign" use:enhance class="flex flex-wrap gap-3 items-end">
      <div class="space-y-1.5 flex-1 min-w-48">
        <Label for="workerId">Assign Field Worker</Label>
        <select id="workerId" name="workerId" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Select worker...</option>
          {#each data.workers as worker}
            <option value={worker.id}>{worker.name} {worker.phone ? `(${worker.phone})` : '(no phone)'}</option>
          {/each}
        </select>
      </div>
      <Button type="submit">Assign &amp; Send SMS</Button>
    </form>
  {/if}

  {#if data.smsUpdates.length > 0}
    <div class="mt-5 border-t border-border pt-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium">Updates Sent</h3>
        <Badge variant="secondary">{data.smsUpdates.length}</Badge>
      </div>
      <ul class="space-y-2">
        {#each data.smsUpdates as message}
          <li class="rounded-lg border border-border bg-muted/30 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{message.to}</span>
              <span>{formatDateTime(message.createdAt)}</span>
            </div>
            <p class="mt-2 text-sm">{message.body}</p>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<div class="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
  <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Proof as Evidence</h2>
      <Badge variant="secondary">{proofPhotos.length}</Badge>
    </div>

    {#if proofPhotos.length > 0}
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

    <ul class="space-y-3">
      {#each items as item}
        <li class="rounded-2xl border border-border bg-muted/20 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="font-medium">{item.title}</p>
              {#if item.notes}
                <p class="mt-1 text-sm text-muted-foreground">{item.notes}</p>
              {/if}
              {#if item.completedAt}
                <p class="mt-1 text-xs text-muted-foreground">{formatDateTime(item.completedAt)}</p>
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
          {#if item.photoRequired && item.attachments.length === 0}
            <p class="mt-2 text-xs font-medium text-red-700">Required proof photo missing.</p>
          {/if}
        </li>
      {/each}
    </ul>
  </div>

  <div class="space-y-6">
    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Audit Trail</h2>
        <Badge variant="secondary">{data.turnover.readinessHistory.length}</Badge>
      </div>
      {#if data.turnover.readinessHistory.length === 0}
        <p class="text-sm text-muted-foreground">No readiness events recorded yet.</p>
      {:else}
        <ul class="space-y-3">
          {#each data.turnover.readinessHistory as event}
            <li class="rounded-2xl border border-border bg-muted/20 p-4">
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

    {#if turnover.status === 'VERIFIED' && turnover.organization.planType === 'PRO'}
      <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-semibold">Send Proof to Owner</h2>
            <p class="text-sm text-muted-foreground mt-1">Share the verified report once you are comfortable standing behind the evidence.</p>
          </div>
          {#if data.reportUrl}
            <Button href={data.reportUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
              Preview report
            </Button>
          {/if}
        </div>
        <form method="POST" action="?/send_external" use:enhance class="space-y-4">
          <div class="space-y-1.5">
            <Label for="email">Recipient Email</Label>
            <Input id="email" type="email" name="email" placeholder="owner@example.com" required />
          </div>
          <div class="space-y-1.5">
            <Label for="sms">Recipient SMS (optional)</Label>
            <Input id="sms" type="tel" name="sms" placeholder="+15085551234" />
          </div>
          <Button type="submit">Send Owner Update</Button>
        </form>
      </div>
    {/if}
  </div>
</div>
