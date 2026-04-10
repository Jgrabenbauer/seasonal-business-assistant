<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { formatDate, formatDateTime } from '$lib/utils';
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>{data.property.name} — SBA</title>
</svelte:head>

<div class="flex items-center gap-2 text-muted-foreground text-sm mb-4">
  <a href="/dashboard/properties" class="text-primary underline-offset-4 hover:underline">Properties</a>
  <span>/</span>
  <span class="text-foreground">{data.property.name}</span>
</div>

<h1 class="text-2xl font-semibold mb-1">{data.property.name}</h1>
{#if data.property.address}
  <p class="text-muted-foreground mb-1">{data.property.address}</p>
{/if}
{#if data.property.notes}
  <p class="text-muted-foreground text-sm mb-6">{data.property.notes}</p>
{/if}

{#if form?.error}
  <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
{/if}
{#if form?.success}
  <div class="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm mb-4">SLA overrides saved.</div>
{/if}

<div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">SLA Overrides</h2>
  <p class="text-sm text-muted-foreground mb-4">
    Default SLA offset: {data.org.slaDefaultOffsetHours}h · Verification required: {data.org.verificationRequired ? 'Yes' : 'No'}
  </p>
  {#if data.org.planType !== 'PRO'}
    <div class="rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 text-sm mb-4">
      SLA overrides are available on the Pro plan.
    </div>
  {/if}
  <form method="POST" action="?/update_sla" use:enhance class="grid md:grid-cols-2 gap-4">
    <div class="space-y-1.5">
      <Label for="slaOffsetHours">Property SLA Offset (hours before arrival)</Label>
      <Input
        id="slaOffsetHours"
        type="number"
        name="slaOffsetHours"
        min={0}
        value={data.property.slaOffsetHours ?? ''}
        placeholder={String(data.org.slaDefaultOffsetHours)}
        disabled={data.org.planType !== 'PRO'}
      />
      <p class="text-xs text-muted-foreground">Leave blank to use org default.</p>
    </div>
    <div class="space-y-1.5">
      <Label for="verificationRequired">Verification Required</Label>
      <select id="verificationRequired" name="verificationRequired" disabled={data.org.planType !== 'PRO'} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        <option value="">Use org default</option>
        <option value="on" selected={data.property.verificationRequired === true}>Yes</option>
        <option value="off" selected={data.property.verificationRequired === false}>No</option>
      </select>
    </div>
    <div>
      <Button type="submit" disabled={data.org.planType !== 'PRO'}>Save SLA Overrides</Button>
    </div>
  </form>
</div>

<div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Readiness History</h2>
  {#if data.turnovers.length === 0}
    <p class="text-muted-foreground text-sm">No turnovers recorded for this property.</p>
  {:else}
    <ul class="space-y-2">
      {#each data.turnovers.slice(0, 10) as turnover}
        <li class="flex items-center justify-between text-sm">
          <div class="min-w-0">
            <p class="font-medium truncate">{turnover.title}</p>
            <p class="text-muted-foreground text-xs">
              Arrival {formatDateTime(turnover.guestArrivalAt)}
              {#if turnover.readyAt}· Ready {formatDateTime(turnover.readyAt)}{/if}
              {#if turnover.verifiedAt}· Verified {formatDateTime(turnover.verifiedAt)}{/if}
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
  <Button href="/dashboard/turnovers?propertyId={data.property.id}" size="sm">Schedule Turnover</Button>
</div>

{#if data.turnovers.length === 0}
  <div class="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
    <p>No turnovers for this property yet.</p>
  </div>
{:else}
  <div class="rounded-md border border-border overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 text-muted-foreground">
        <tr>
          <th class="text-left px-4 py-3 font-medium">Title</th>
          <th class="text-left px-4 py-3 font-medium">Assigned</th>
          <th class="text-left px-4 py-3 font-medium">Guest Arrival</th>
          <th class="text-left px-4 py-3 font-medium">Status</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each data.turnovers as turnover}
          <tr class="hover:bg-muted/30 transition-colors">
            <td class="px-4 py-3 font-medium">{turnover.title}</td>
            <td class="px-4 py-3 text-muted-foreground">{turnover.assignedTo?.name ?? '—'}</td>
            <td class="px-4 py-3 text-muted-foreground">{formatDate(turnover.guestArrivalAt)}</td>
            <td class="px-4 py-3"><StatusBadge status={turnover.status} /></td>
            <td class="px-4 py-3 text-right">
              <Button href="/dashboard/turnovers/{turnover.id}" variant="ghost" size="sm">View</Button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
