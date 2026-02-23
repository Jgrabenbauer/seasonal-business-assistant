<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
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
  const turnover = data.turnover;
</script>

<svelte:head>
  <title>{turnover.title} — SBA</title>
</svelte:head>

<div class="flex items-center gap-2 text-surface-400 text-sm mb-4">
  <a href="/dashboard/turnovers" class="anchor">Turnovers</a>
  <span>/</span>
  <span class="truncate">{turnover.title}</span>
</div>

<div class="flex flex-wrap items-start justify-between gap-4 mb-6">
  <div>
    <h1 class="text-2xl font-bold">{turnover.title}</h1>
    <p class="text-surface-500 mt-1">
      📍 {turnover.property.name}
      · 🧭 Arrival {formatDateTime(turnover.guestArrivalAt)}
    </p>
    <p class="text-surface-400 text-sm mt-1">
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
      <button type="submit" class="btn btn-sm variant-ghost">Export Certificate</button>
    </form>
  </div>
</div>

{#if form?.error}
  <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
{/if}
{#if form?.sent}
  <div class="alert variant-filled-success mb-4"><p>Link resent successfully.</p></div>
{/if}
{#if form?.sentExternal}
  <div class="alert variant-filled-success mb-4"><p>Certificate sent successfully.</p></div>
{/if}

<div class="card p-6 mb-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold">Readiness Summary</h2>
    <span class="badge variant-soft-surface">{data.readinessScore}% readiness</span>
  </div>
  <div class="h-2 bg-surface-200-700-token rounded-full overflow-hidden">
    <div class="h-full bg-primary-500 rounded-full" style="width: {data.readinessScore}%"></div>
  </div>
  <div class="mt-4 flex flex-wrap gap-2">
    {#if turnover.status !== 'READY' && turnover.status !== 'VERIFIED'}
      <form method="POST" action="?/mark_ready" use:enhance>
        <button type="submit" class="btn variant-filled-primary">
          {data.verificationRequired ? 'Mark Property Ready' : 'Mark Verified'}
        </button>
      </form>
    {/if}
    {#if turnover.status === 'READY' && data.verificationRequired}
      <form method="POST" action="?/verify" use:enhance>
        <button type="submit" class="btn variant-filled-primary">Verify Turnover</button>
      </form>
    {/if}
  </div>
</div>

<!-- Assignment -->
<div class="card p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Readiness Assignment</h2>

  {#if turnover.assignedTo}
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="font-medium">{turnover.assignedTo.name}</p>
        <p class="text-sm text-surface-500">{turnover.assignedTo.phone}</p>
      </div>
      <div class="flex gap-2">
        {#if data.magicLink}
          <a
            href={data.magicLink}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm variant-ghost-primary"
          >
            Open Field View
          </a>
          <form method="POST" action="?/send_link" use:enhance>
            <button type="submit" class="btn btn-sm variant-ghost">Resend SMS</button>
          </form>
        {/if}
      </div>
    </div>
    {#if data.magicLink}
      <div class="mt-3">
        <p class="text-xs text-surface-400 mb-1">Short Link:</p>
        <div class="flex items-center gap-2">
          <code class="text-xs bg-surface-200-700-token px-2 py-1 rounded break-all flex-1">
            {data.shortLink ?? '—'}
          </code>
          {#if data.shortLink}
            <button
              type="button"
              class="btn btn-sm variant-ghost"
              on:click={() => data.shortLink && copyText(data.shortLink, 'Short link')}
              aria-label="Copy short link"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M8 7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2v-2h2V7h-7v2H8V7z"/>
                <path d="M5 9a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm2 0v7h7V9H7z"/>
              </svg>
            </button>
          {/if}
        </div>
        {#if copiedMessage}
          <div class="mt-2 text-xs text-surface-500">{copiedMessage}</div>
        {/if}
      </div>
    {/if}
  {:else}
    <form method="POST" action="?/assign" use:enhance class="flex flex-wrap gap-3 items-end">
      <label class="label flex-1 min-w-48">
        <span>Assign Field Worker</span>
        <select class="select" name="workerId" required>
          <option value="">Select worker...</option>
          {#each data.workers as worker}
            <option value={worker.id}>{worker.name} {worker.phone ? `(${worker.phone})` : '(no phone)'}</option>
          {/each}
        </select>
      </label>
      <button type="submit" class="btn variant-filled-primary">Assign & Send SMS</button>
    </form>
  {/if}
</div>

<!-- Readiness Steps -->
{#if turnover.workOrder?.checklistRun}
  {@const run = turnover.workOrder.checklistRun}
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Readiness Steps</h2>
      {#if run.completedAt}
        <span class="badge variant-filled-success">Completed {formatDateTime(run.completedAt)}</span>
      {:else if run.startedAt}
        <span class="badge variant-soft-primary">Started {formatDateTime(run.startedAt)}</span>
      {/if}
    </div>

    <ul class="space-y-3">
      {#each run.items as item}
        <li class="flex items-start gap-3 p-3 rounded-lg bg-surface-100-800-token">
          <span class="mt-0.5 flex-shrink-0">
            {#if item.status === 'COMPLETED'}✅{:else if item.status === 'SKIPPED'}—{:else}○{/if}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-medium" class:line-through={item.status === 'COMPLETED'}>{item.title}</p>
            {#if item.notes}
              <p class="text-sm text-surface-500 mt-1">{item.notes}</p>
            {/if}
            {#if item.completedAt}
              <p class="text-xs text-surface-400 mt-1">{formatDateTime(item.completedAt)}</p>
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
  <div class="card p-6">
    <p class="text-surface-500">Readiness steps will be created when a worker is assigned.</p>
    <p class="text-sm text-surface-400 mt-1">Template: {turnover.template.name}</p>
  </div>
{:else}
  <div class="card p-6">
    <p class="text-surface-500">No readiness template attached to this turnover.</p>
  </div>
{/if}

<!-- External Notification -->
{#if turnover.status === 'VERIFIED' && turnover.organization.planType === 'PRO'}
  <div class="card p-6 mt-6">
    <h2 class="text-lg font-semibold mb-4">Owner/Guest Notification</h2>
    <form method="POST" action="?/send_external" use:enhance class="space-y-4">
      <label class="label">
        <span>Recipient Email *</span>
        <input class="input" type="email" name="email" placeholder="owner@example.com" required />
      </label>
      <label class="label">
        <span>Recipient SMS (optional)</span>
        <input class="input" type="tel" name="sms" placeholder="+15085551234" />
      </label>
      <button type="submit" class="btn variant-filled-primary">Send Readiness Certificate</button>
    </form>
  </div>
{/if}
