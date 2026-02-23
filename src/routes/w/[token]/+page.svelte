<script lang="ts">
  import OfflineBanner from '$lib/components/OfflineBanner.svelte';
  import PhotoUpload from '$lib/components/PhotoUpload.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let items = data.workOrder.checklistRun?.items ?? [];
  let runId = data.workOrder.checklistRun?.id ?? '';

  $: allDone = items.length > 0 && items.every((i) => i.status !== 'PENDING');
  $: todayItems = items.filter((i) => i.status === 'PENDING');
  $: completedItems = items.filter((i) => i.status !== 'PENDING');
  $: completeCount = completedItems.length;

  async function toggleItem(item: (typeof items)[0]) {
    const newStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const res = await fetch(`/api/checklist/${runId}/item/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], status: newStatus };
        items = [...items];
      }
    }
  }
</script>

<svelte:head>
  <title>{data.workOrder.title} — Readiness Steps</title>
</svelte:head>

<OfflineBanner />

<div class="max-w-lg mx-auto px-4 py-6 pb-24">
  <div class="mb-6">
    <h1 class="text-2xl font-bold">{data.workOrder.property.name}</h1>
    <p class="text-surface-500 mt-1">{data.workOrder.title}</p>
  </div>

  {#if !data.workOrder.checklistRun}
    <div class="card p-8 text-center">
      <p class="text-surface-500">No readiness steps attached to this turnover.</p>
    </div>
  {:else if allDone}
    <div class="card variant-filled-success p-8 text-center animate-pulse-once">
      <p class="text-4xl mb-3">✅</p>
      <p class="text-2xl font-bold">Property Ready!</p>
      <p class="mt-2 opacity-80">Great work. Readiness steps are complete.</p>
    </div>
  {:else}
    <!-- Overdue banner -->
    {#if data.isOverdue && todayItems.length > 0}
      <div class="bg-error-500 text-white rounded-lg px-4 py-2 mb-4 font-semibold text-sm">
        OVERDUE — Please complete this turnover as soon as possible.
      </div>
    {/if}

    <!-- Today's Tasks -->
    <div class="mb-2 flex items-center justify-between">
      <h2 class="font-semibold text-lg">Today's Readiness Steps</h2>
      <span class="badge variant-soft-surface text-xs">{todayItems.length} remaining</span>
    </div>

    <ul class="space-y-3">
      {#each todayItems as item (item.id)}
        <li class="card p-4 flex items-center gap-4 min-h-[88px] transition-all duration-200">
          <button
            class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95 transition-transform"
            on:click={() => toggleItem(item)}
            aria-label="Toggle {item.title}"
            type="button"
          >
            <span class="w-10 h-10 border-2 border-surface-400 rounded-full block"></span>
          </button>

          <div class="flex-1 min-w-0">
            <p class="text-lg leading-snug">{item.title}</p>
            {#if item.description}
              <p class="text-sm text-surface-400 mt-0.5">{item.description}</p>
            {/if}
            {#if item.photoRequired && item.attachments.length === 0}
              <p class="text-xs text-warning-500 mt-1">📷 Photo required</p>
            {/if}
          </div>

          <PhotoUpload bind:item {runId} />
        </li>
      {/each}
    </ul>

    <!-- Completed items -->
    {#if completedItems.length > 0}
      <details class="mt-6">
          <summary class="cursor-pointer text-sm font-medium text-surface-500 select-none mb-3">
          Completed ({completedItems.length})
        </summary>
        <ul class="space-y-3">
          {#each completedItems as item (item.id)}
            <li
              class="card p-4 flex items-center gap-4 min-h-[88px] variant-filled-success transition-all duration-200"
            >
              <button
                class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95 transition-transform"
                on:click={() => toggleItem(item)}
                aria-label="Undo {item.title}"
                type="button"
              >
                <span class="text-3xl leading-none">✅</span>
              </button>

              <div class="flex-1 min-w-0">
                <p class="text-lg leading-snug line-through opacity-60">{item.title}</p>
              </div>

              <PhotoUpload bind:item {runId} />
            </li>
          {/each}
        </ul>
      </details>
    {/if}
  {/if}
</div>

<!-- Sticky bottom progress bar -->
{#if data.workOrder.checklistRun && !allDone}
  <div class="fixed bottom-0 left-0 right-0 bg-surface-50-900-token border-t border-surface-300-600-token px-4 py-3 z-30">
    <div class="max-w-lg mx-auto space-y-1">
      <div class="flex justify-between text-xs text-surface-500">
        <span>{completeCount} of {items.length} complete</span>
        <span>{Math.round((completeCount / items.length) * 100)}%</span>
      </div>
      <div class="h-2 bg-surface-200-700-token rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 rounded-full transition-all duration-300"
          style="width: {items.length > 0 ? (completeCount / items.length) * 100 : 0}%"
        ></div>
      </div>
    </div>
  </div>
{/if}
