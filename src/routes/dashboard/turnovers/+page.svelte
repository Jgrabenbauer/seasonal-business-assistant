<script lang="ts">
  import TurnoverCard from '$lib/components/TurnoverCard.svelte';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let showForm = false;

  const statuses = ['', 'NOT_READY', 'IN_PROGRESS', 'READY', 'VERIFIED'];
  const statusLabels: Record<string, string> = {
    '': 'All',
    NOT_READY: 'Upcoming',
    IN_PROGRESS: 'In Progress',
    READY: 'Ready',
    VERIFIED: 'Verified'
  };
</script>

<svelte:head>
  <title>Turnovers — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Turnovers</h1>
  <button class="btn variant-filled-primary" on:click={() => (showForm = !showForm)} type="button">
    {showForm ? 'Cancel' : '+ Schedule Turnover'}
  </button>
</div>

{#if showForm}
  <div class="card p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">Schedule Turnover</h2>
    {#if form?.error}
      <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
    {/if}
    <form method="POST" action="?/create" class="space-y-4">
      <label class="label">
        <span>Turnover Name *</span>
        <input class="input" type="text" name="title" required placeholder="July Turnover" />
      </label>
      <label class="label">
        <span>Property *</span>
        <select class="select" name="propertyId" required>
          <option value="">Select property...</option>
          {#each data.properties as property}
            <option value={property.id} selected={data.propertyId === property.id}>{property.name}</option>
          {/each}
        </select>
      </label>
      <label class="label">
        <span>Readiness Template</span>
        <select class="select" name="templateId">
          <option value="">No template</option>
          {#each data.templates as template}
            <option value={template.id}>{template.name}</option>
          {/each}
        </select>
      </label>
      <div class="grid md:grid-cols-3 gap-4">
        <label class="label">
          <span>Scheduled Start</span>
          <input class="input" type="datetime-local" name="scheduledStartAt" />
        </label>
        <label class="label">
          <span>Guest Arrival *</span>
          <input class="input" type="datetime-local" name="guestArrivalAt" required />
        </label>
        <label class="label">
          <span>SLA Deadline</span>
          <input class="input" type="datetime-local" name="slaDeadlineAt" />
          <small class="text-surface-400">Leave blank to use SLA policy.</small>
        </label>
      </div>
      <button type="submit" class="btn variant-filled-primary">Schedule Turnover</button>
    </form>
  </div>
{/if}

<div class="flex gap-2 mb-6 overflow-x-auto pb-1">
  {#each statuses as status}
    <a
      href="/dashboard/turnovers{status ? `?status=${status}` : ''}"
      class="btn btn-sm flex-shrink-0 {data.statusFilter === status || (!data.statusFilter && !status) ? 'variant-filled-primary' : 'variant-ghost-surface'}"
    >
      {statusLabels[status]}
    </a>
  {/each}
</div>

{#if data.turnovers.length === 0}
  <div class="card p-8 text-center text-surface-400">
    <p>No turnovers found.</p>
  </div>
{:else}
  <div class="space-y-3">
    {#each data.turnovers as turnover}
      <TurnoverCard turnover={turnover} />
    {/each}
  </div>
{/if}
