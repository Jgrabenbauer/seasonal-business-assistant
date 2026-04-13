<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const onTimeRate =
    data.onTime.total > 0 ? Math.round((data.onTime.on_time / data.onTime.total) * 100) : 0;

  function formatLeadTime(minutes: number | null) {
    if (minutes === null) {
      return {
        value: '—',
        detail: 'No completed turnovers yet',
        tone: 'text-foreground'
      };
    }

    if (minutes === 0) {
      return {
        value: 'On time',
        detail: 'Average ready at guest arrival',
        tone: 'text-foreground'
      };
    }

    const ahead = minutes > 0;
    const totalMinutes = Math.round(Math.abs(minutes));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = totalMinutes % 60;

    let duration = '';
    if (days >= 1) {
      duration = `${days}d ${hours}h`;
    } else if (totalMinutes >= 60) {
      duration = `${hours}h ${mins}m`;
    } else {
      duration = `${mins}m`;
    }

    return {
      value: duration,
      detail: ahead ? 'Ahead of guest arrival' : 'Behind guest arrival',
      tone: ahead ? 'text-green-700' : 'text-destructive'
    };
  }

  $: avgReadyLead = formatLeadTime(data.avgReadyLeadMinutes);
</script>

<svelte:head>
  <title>Readiness Analytics — SBA</title>
</svelte:head>

<div class="max-w-3xl space-y-6">
  <h1 class="text-2xl font-semibold">Readiness Analytics</h1>

  <div class="grid md:grid-cols-3 gap-4">
    <div class="rounded-lg border border-border bg-card shadow-sm p-4">
      <p class="text-sm text-muted-foreground">Avg Ready Buffer</p>
      <p class="text-2xl font-bold {avgReadyLead.tone}">
        {avgReadyLead.value}
      </p>
      <p class="mt-1 text-sm text-muted-foreground">{avgReadyLead.detail}</p>
    </div>
    <div class="rounded-lg border border-border bg-card shadow-sm p-4">
      <p class="text-sm text-muted-foreground">% Ready Before Arrival</p>
      <p class="text-2xl font-bold">{onTimeRate}%</p>
    </div>
    <div class="rounded-lg border border-border bg-card shadow-sm p-4">
      <p class="text-sm text-muted-foreground">Avg Missed Items</p>
      <p class="text-2xl font-bold">
        {data.avgMissedItems !== null ? data.avgMissedItems.toFixed(1) : '—'}
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
