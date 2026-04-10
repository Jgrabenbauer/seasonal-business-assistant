<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const onTimeRate =
    data.onTime.total > 0 ? Math.round((data.onTime.on_time / data.onTime.total) * 100) : 0;
</script>

<svelte:head>
  <title>Readiness Analytics — SBA</title>
</svelte:head>

<div class="max-w-3xl space-y-6">
  <h1 class="text-2xl font-semibold">Readiness Analytics</h1>

  <div class="grid md:grid-cols-3 gap-4">
    <div class="rounded-lg border border-border bg-card shadow-sm p-4">
      <p class="text-sm text-muted-foreground">Avg Time to Ready (min)</p>
      <p class="text-2xl font-bold">
        {data.avgTimeToReadyMinutes ? Math.round(data.avgTimeToReadyMinutes) : '—'}
      </p>
    </div>
    <div class="rounded-lg border border-border bg-card shadow-sm p-4">
      <p class="text-sm text-muted-foreground">% Ready Before Arrival</p>
      <p class="text-2xl font-bold">{onTimeRate}%</p>
    </div>
    <div class="rounded-lg border border-border bg-card shadow-sm p-4">
      <p class="text-sm text-muted-foreground">Avg Missed Items</p>
      <p class="text-2xl font-bold">
        {data.avgMissedItems ? data.avgMissedItems.toFixed(1) : '—'}
      </p>
    </div>
  </div>

  <div class="rounded-lg border border-border bg-card shadow-sm p-6">
    <h2 class="font-semibold text-lg mb-3">Worker Consistency Score</h2>
    {#if data.workerConsistency.length === 0}
      <p class="text-muted-foreground text-sm">No data yet.</p>
    {:else}
      <ul class="space-y-2">
        {#each data.workerConsistency as worker}
          <li class="flex justify-between text-sm">
            <span>{worker.name}</span>
            <span class="font-medium">{worker.score}%</span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="rounded-lg border border-border bg-card shadow-sm p-6">
    <h2 class="font-semibold text-lg mb-3">Repeat Readiness Issues</h2>
    {#if data.repeatIssues.length === 0}
      <p class="text-muted-foreground text-sm">No repeat issues recorded.</p>
    {:else}
      <ul class="space-y-2">
        {#each data.repeatIssues as item}
          <li class="flex justify-between text-sm">
            <span>{item.title}</span>
            <span class="font-medium">{item.count}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
