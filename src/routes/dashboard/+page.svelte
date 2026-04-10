<script lang="ts">
  import TurnoverCard from '$lib/components/TurnoverCard.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import type { PageData } from './$types';

  export let data: PageData;

  const columns = [
    { key: 'upcoming' as const, label: 'Upcoming', emptyText: 'No upcoming turnovers scheduled.' },
    { key: 'inProgress' as const, label: 'In Progress', emptyText: 'No turnovers in progress.' },
    { key: 'ready' as const, label: 'Ready', emptyText: 'None ready yet.' },
    { key: 'overdue' as const, label: 'Overdue', emptyText: 'No overdue turnovers.' },
    { key: 'verified' as const, label: 'Verified', emptyText: 'No verified turnovers.' }
  ];
</script>

<svelte:head>
  <title>Readiness Board — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-semibold">Readiness Board</h1>
    <p class="text-sm text-muted-foreground mt-1">Track every turnover from not ready to verified.</p>
  </div>
  <Button href="/dashboard/turnovers">Schedule Turnover</Button>
</div>

<div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
  {#each columns as col}
    {@const items = data.columns[col.key]}
    <div class="space-y-2">
      <div class="flex items-center justify-between px-1 mb-2">
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</h2>
        {#if items.length > 0}
          <Badge variant="secondary" class="text-xs">{items.length}</Badge>
        {/if}
      </div>
      {#if items.length === 0}
        <div class="rounded-lg border border-dashed border-border p-5 flex flex-col items-center text-center gap-2">
          <ClipboardList size={20} class="text-muted-foreground" strokeWidth={1.5} />
          <p class="text-xs text-muted-foreground">{col.emptyText}</p>
        </div>
      {:else}
        {#each items as turnover}
          <TurnoverCard {turnover} />
        {/each}
      {/if}
    </div>
  {/each}
</div>
