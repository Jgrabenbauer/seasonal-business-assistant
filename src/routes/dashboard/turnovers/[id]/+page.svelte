<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { formatDateTime } from '$lib/utils';
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';

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
      a.download = (form as { filename?: string }).filename ?? 'turnover-certificate.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  $: if (form && 'pdfBase64' in form) downloadPdf();
  $: turnover = data.turnover;
</script>

<svelte:head>
  <title>{turnover.title} — SBA</title>
</svelte:head>

<div class="flex items-center gap-2 text-muted-foreground text-sm mb-4">
  <a href="/dashboard/turnovers" class="text-primary underline-offset-4 hover:underline">Turnovers</a>
  <span>/</span>
  <span class="truncate text-foreground">{turnover.title}</span>
</div>

<div class="flex flex-wrap items-start justify-between gap-4 mb-6">
  <div>
    <h1 class="text-2xl font-semibold">{turnover.title}</h1>
    <p class="text-muted-foreground mt-1">
      {turnover.property.name}
      &middot; Arrival {formatDateTime(turnover.guestArrivalAt)}
    </p>
    <p class="text-muted-foreground text-sm mt-1">
      SLA deadline {formatDateTime(turnover.slaDeadlineAt)}
      · SLA offset {data.slaOffsetHours}h ({data.slaSource === 'property' ? 'Property override' : 'Org default'})
      {#if turnover.readyAt}
        · Ready {formatDateTime(turnover.readyAt)}
      {/if}
      {#if turnover.verifiedAt}
        · Verified {formatDateTime(turnover.verifiedAt)}
      {/if}
    </p>
  </div>
  <div class="flex items-center gap-2">
    <StatusBadge status={turnover.status} />
    <form method="POST" action="?/export_pdf" use:enhance>
      <Button type="submit" variant="outline" size="sm">Export Certificate</Button>
    </form>
  </div>
</div>

{#if form?.error}
  <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
{/if}
{#if form?.sent}
  <div class="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm mb-4">Link resent successfully.</div>
{/if}
{#if form?.sentExternal}
  <div class="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm mb-4">Certificate sent successfully.</div>
{/if}

<div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold">Readiness Summary</h2>
    <Badge variant="secondary">{data.readinessScore}% readiness</Badge>
  </div>
  <div class="h-2 bg-secondary rounded-full overflow-hidden">
    <div class="h-full bg-primary rounded-full transition-all" style="width: {data.readinessScore}%"></div>
  </div>
  <div class="mt-4 flex flex-wrap gap-2">
    {#if turnover.status !== 'READY' && turnover.status !== 'VERIFIED'}
      <form method="POST" action="?/mark_ready" use:enhance>
        <Button type="submit">
          {data.verificationRequired ? 'Mark Property Ready' : 'Mark Verified'}
        </Button>
      </form>
    {/if}
    {#if turnover.status === 'READY' && data.verificationRequired}
      <form method="POST" action="?/verify" use:enhance>
        <Button type="submit">Verify Turnover</Button>
      </form>
    {/if}
  </div>
</div>

<!-- Assignment -->
<div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Readiness Assignment</h2>

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
        <p class="text-xs text-muted-foreground mb-1">Short Link:</p>
        <div class="flex items-center gap-2">
          <code class="text-xs bg-muted px-2 py-1 rounded break-all flex-1">
            {data.shortLink ?? '—'}
          </code>
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
</div>

<!-- Readiness Steps -->
{#if turnover.workOrder?.checklistRun}
  {@const run = turnover.workOrder.checklistRun}
  <div class="rounded-lg border border-border bg-card shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Readiness Steps</h2>
      {#if run.completedAt}
        <Badge class="bg-green-500 text-white">Completed {formatDateTime(run.completedAt)}</Badge>
      {:else if run.startedAt}
        <Badge variant="secondary">Started {formatDateTime(run.startedAt)}</Badge>
      {/if}
    </div>

    <ul class="space-y-3">
      {#each run.items as item}
        <li class="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
          <span class="mt-0.5 flex-shrink-0">
            {#if item.status === 'COMPLETED'}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
            {:else if item.status === 'SKIPPED'}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><circle cx="12" cy="12" r="10"/></svg>
            {/if}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-medium" class:line-through={item.status === 'COMPLETED'}>{item.title}</p>
            {#if item.notes}
              <p class="text-sm text-muted-foreground mt-1">{item.notes}</p>
            {/if}
            {#if item.completedAt}
              <p class="text-xs text-muted-foreground mt-1">{formatDateTime(item.completedAt)}</p>
            {/if}
            {#if item.attachments.length > 0}
              <div class="flex flex-wrap gap-2 mt-2">
                {#each item.attachments as att}
                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                    <img src={att.url} alt={att.filename} class="w-16 h-16 object-cover rounded" />
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  </div>
{:else if turnover.template}
  <div class="rounded-lg border border-border bg-card shadow-sm p-6">
    <p class="text-muted-foreground">Readiness steps will be created when a worker is assigned.</p>
    <p class="text-sm text-muted-foreground mt-1">Template: {turnover.template.name}</p>
  </div>
{:else}
  <div class="rounded-lg border border-border bg-card shadow-sm p-6">
    <p class="text-muted-foreground">No readiness template attached to this turnover.</p>
  </div>
{/if}

<!-- External Notification -->
{#if turnover.status === 'VERIFIED' && turnover.organization.planType === 'PRO'}
  <div class="rounded-lg border border-border bg-card shadow-sm p-6 mt-6">
    <h2 class="text-lg font-semibold mb-4">Owner/Guest Notification</h2>
    <form method="POST" action="?/send_external" use:enhance class="space-y-4">
      <div class="space-y-1.5">
        <Label for="email">Recipient Email</Label>
        <Input id="email" type="email" name="email" placeholder="owner@example.com" required />
      </div>
      <div class="space-y-1.5">
        <Label for="sms">Recipient SMS (optional)</Label>
        <Input id="sms" type="tel" name="sms" placeholder="+15085551234" />
      </div>
      <Button type="submit">Send Readiness Certificate</Button>
    </form>
  </div>
{/if}
