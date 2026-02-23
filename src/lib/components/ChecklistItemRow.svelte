<script lang="ts">
  import type { ChecklistItemRun } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  export let item: ChecklistItemRun & { attachments: { id: string; url: string }[] };

  const dispatch = createEventDispatcher<{ toggle: { item: typeof item } }>();
</script>

<li
  class="card p-4 flex items-center gap-4 min-h-[72px] transition-colors"
  class:variant-filled-success={item.status === 'COMPLETED'}
>
  <button
    class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    on:click={() => dispatch('toggle', { item })}
    aria-label="Toggle {item.title}"
    type="button"
  >
    {#if item.status === 'COMPLETED'}
      <span class="text-3xl leading-none">✅</span>
    {:else}
      <span class="w-8 h-8 border-2 border-surface-400 rounded-full block"></span>
    {/if}
  </button>

  <div class="flex-1 min-w-0">
    <p class="text-lg leading-snug" class:line-through={item.status === 'COMPLETED'}>
      {item.title}
    </p>
    {#if item.description}
      <p class="text-sm text-surface-400 mt-0.5 truncate">{item.description}</p>
    {/if}
    {#if item.photoRequired && item.attachments.length === 0}
      <p class="text-xs text-warning-500 mt-1">Photo required</p>
    {/if}
  </div>

  <slot name="action" />
</li>
