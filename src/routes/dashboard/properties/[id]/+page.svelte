<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatDate, formatDateTime } from '$lib/utils';
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>{data.property.name} — SBA</title>
</svelte:head>

<div class="flex items-center gap-2 text-surface-400 text-sm mb-4">
  <a href="/dashboard/properties" class="anchor">Properties</a>
  <span>/</span>
  <span>{data.property.name}</span>
</div>

<h1 class="text-2xl font-bold mb-1">{data.property.name}</h1>
{#if data.property.address}
  <p class="text-surface-500 mb-1">📍 {data.property.address}</p>
{/if}
{#if data.property.notes}
  <p class="text-surface-400 text-sm mb-6">{data.property.notes}</p>
{/if}

{#if form?.error}
  <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
{/if}
{#if form?.success}
  <div class="alert variant-filled-success mb-4"><p>SLA overrides saved.</p></div>
{/if}

<div class="card p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">SLA Overrides</h2>
  <p class="text-sm text-surface-500 mb-4">
    Default SLA offset: {data.org.slaDefaultOffsetHours}h · Verification required: {data.org.verificationRequired ? 'Yes' : 'No'}
  </p>
  {#if data.org.planType !== 'PRO'}
    <div class="alert variant-filled-warning mb-4">
      <p>SLA overrides are available on the Pro plan.</p>
    </div>
  {/if}
  <form method="POST" action="?/update_sla" use:enhance class="grid md:grid-cols-2 gap-4">
    <label class="label">
      <span>Property SLA Offset (hours before arrival)</span>
      <input
        class="input"
        type="number"
        name="slaOffsetHours"
        min="0"
        value={data.property.slaOffsetHours ?? ''}
        placeholder={String(data.org.slaDefaultOffsetHours)}
        disabled={data.org.planType !== 'PRO'}
      />
      <small class="text-surface-400">Leave blank to use org default.</small>
    </label>
    <label class="label">
      <span>Verification Required</span>
      <select class="select" name="verificationRequired" disabled={data.org.planType !== 'PRO'}>
        <option value="">Use org default</option>
        <option value="on" selected={data.property.verificationRequired === true}>Yes</option>
        <option value="off" selected={data.property.verificationRequired === false}>No</option>
      </select>
    </label>
    <div>
      <button type="submit" class="btn variant-filled-primary" disabled={data.org.planType !== 'PRO'}>Save SLA Overrides</button>
    </div>
  </form>
</div>

<div class="card p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Readiness History</h2>
  {#if data.turnovers.length === 0}
    <p class="text-surface-500 text-sm">No turnovers recorded for this property.</p>
  {:else}
    <ul class="space-y-2">
      {#each data.turnovers.slice(0, 10) as turnover}
        <li class="flex items-center justify-between text-sm">
          <div class="min-w-0">
            <p class="font-medium truncate">{turnover.title}</p>
            <p class="text-surface-400 text-xs">
              Arrival {formatDateTime(turnover.guestArrivalAt)}
              {#if turnover.readyAt}
                · Ready {formatDateTime(turnover.readyAt)}
              {/if}
              {#if turnover.verifiedAt}
                · Verified {formatDateTime(turnover.verifiedAt)}
              {/if}
            </p>
          </div>
          <StatusBadge status={turnover.status} />
        </li>
      {/each}
    </ul>
  {/if}
</div>

<div class="flex items-center justify-between mb-4">
  <h2 class="text-lg font-semibold">Turnover History</h2>
  <a
    href="/dashboard/turnovers?propertyId={data.property.id}"
    class="btn btn-sm variant-filled-primary"
  >
    + Schedule Turnover
  </a>
</div>

{#if data.turnovers.length === 0}
  <div class="card p-6 text-center text-surface-400">
    <p>No turnovers for this property yet.</p>
  </div>
{:else}
  <div class="table-container">
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Title</th>
          <th>Assigned</th>
          <th>Guest Arrival</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.turnovers as turnover}
          <tr>
            <td class="font-medium">{turnover.title}</td>
            <td>{turnover.assignedTo?.name ?? '—'}</td>
            <td>{formatDate(turnover.guestArrivalAt)}</td>
            <td><StatusBadge status={turnover.status} /></td>
            <td>
              <a href="/dashboard/turnovers/{turnover.id}" class="btn btn-sm variant-ghost">View</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
