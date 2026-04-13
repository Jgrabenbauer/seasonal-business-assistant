<script lang="ts">
  import TurnoverCard from '$lib/components/TurnoverCard.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let showForm = false;

  const statuses = ['', 'NOT_READY', 'IN_PROGRESS', 'READY', 'VERIFIED'];
  const statusLabels: Record<string, string> = {
    '': 'All',
    NOT_READY: 'Not Guest-Ready',
    IN_PROGRESS: 'Not Guest-Ready',
    READY: 'Needs Sign-Off',
    VERIFIED: 'Guest-Ready'
  };
</script>

<svelte:head>
  <title>Turnovers — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Turnovers</h1>
  <Button variant={showForm ? 'outline' : 'default'} onclick={() => (showForm = !showForm)} type="button">
    {showForm ? 'Cancel' : 'Schedule Turnover'}
  </Button>
</div>

{#if showForm}
  <div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">Schedule Turnover</h2>
    {#if form?.error}
      <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
    {/if}
    <form method="POST" action="?/create" class="space-y-4">
      <div class="space-y-1.5">
        <Label for="title">Turnover Name</Label>
        <Input id="title" type="text" name="title" required placeholder="Friday Arrival - Porter Family" />
      </div>
      <div class="space-y-1.5">
        <Label for="propertyId">Property</Label>
        <select id="propertyId" name="propertyId" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Select property...</option>
          {#each data.properties as property}
            <option value={property.id} selected={data.propertyId === property.id}>{property.name}</option>
          {/each}
        </select>
      </div>
      <div class="space-y-1.5">
        <Label for="templateId">Readiness Template</Label>
        <select id="templateId" name="templateId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">No template</option>
          {#each data.templates as template}
            <option value={template.id}>{template.name}</option>
          {/each}
        </select>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="space-y-1.5">
          <Label for="scheduledStartAt">Scheduled Start</Label>
          <Input id="scheduledStartAt" type="datetime-local" name="scheduledStartAt" />
        </div>
        <div class="space-y-1.5">
          <Label for="guestArrivalAt">Guest Arrival</Label>
          <Input id="guestArrivalAt" type="datetime-local" name="guestArrivalAt" required />
        </div>
        <div class="space-y-1.5">
          <Label for="slaDeadlineAt">SLA Deadline</Label>
          <Input id="slaDeadlineAt" type="datetime-local" name="slaDeadlineAt" />
          <p class="text-xs text-muted-foreground">Leave blank to use the property or organization readiness deadline.</p>
        </div>
      </div>
      <Button type="submit">Schedule Turnover</Button>
    </form>
  </div>
{/if}

<div class="flex gap-2 mb-6 overflow-x-auto pb-1">
  {#each statuses as status}
    <Button
      href="/dashboard/turnovers{status ? `?status=${status}` : ''}"
      variant={data.statusFilter === status || (!data.statusFilter && !status) ? 'default' : 'outline'}
      size="sm"
      class="flex-shrink-0"
    >
      {statusLabels[status]}
    </Button>
  {/each}
</div>

{#if data.turnovers.length === 0}
  <div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
    <p>No turnovers found.</p>
  </div>
{:else}
  <div class="space-y-3">
    {#each data.turnovers as turnover}
      <TurnoverCard turnover={turnover} />
    {/each}
  </div>
{/if}
