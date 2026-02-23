<script lang="ts">
  import TurnoverCard from '$lib/components/TurnoverCard.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Readiness Board — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-bold">Property Readiness Board</h1>
    <p class="text-sm text-surface-500 mt-1">Track every turnover from not ready to verified.</p>
  </div>
  <a href="/dashboard/turnovers" class="btn variant-filled-primary">Schedule Turnover</a>
</div>

<div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
  <div class="space-y-3">
    <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wide">Upcoming Turnovers</h2>
    {#if data.columns.upcoming.length === 0}
      <div class="card p-4 text-xs text-surface-400">No upcoming turnovers.</div>
    {:else}
      {#each data.columns.upcoming as turnover}
        <TurnoverCard turnover={turnover} />
      {/each}
    {/if}
  </div>

  <div class="space-y-3">
    <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wide">In Progress</h2>
    {#if data.columns.inProgress.length === 0}
      <div class="card p-4 text-xs text-surface-400">No active turnovers.</div>
    {:else}
      {#each data.columns.inProgress as turnover}
        <TurnoverCard turnover={turnover} />
      {/each}
    {/if}
  </div>

  <div class="space-y-3">
    <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wide">Ready</h2>
    {#if data.columns.ready.length === 0}
      <div class="card p-4 text-xs text-surface-400">None ready yet.</div>
    {:else}
      {#each data.columns.ready as turnover}
        <TurnoverCard turnover={turnover} />
      {/each}
    {/if}
  </div>

  <div class="space-y-3">
    <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wide">Overdue</h2>
    {#if data.columns.overdue.length === 0}
      <div class="card p-4 text-xs text-surface-400">No overdue turnovers.</div>
    {:else}
      {#each data.columns.overdue as turnover}
        <TurnoverCard turnover={turnover} />
      {/each}
    {/if}
  </div>

  <div class="space-y-3">
    <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wide">Verified</h2>
    {#if data.columns.verified.length === 0}
      <div class="card p-4 text-xs text-surface-400">No verified turnovers.</div>
    {:else}
      {#each data.columns.verified as turnover}
        <TurnoverCard turnover={turnover} />
      {/each}
    {/if}
  </div>
</div>
