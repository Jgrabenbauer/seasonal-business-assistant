<script lang="ts">
  import type { ChecklistItemRun } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { cn } from '$lib/utils';
  import CircleCheck from 'lucide-svelte/icons/circle-check';
  import Circle from 'lucide-svelte/icons/circle';
  import Camera from 'lucide-svelte/icons/camera';

  export let item: ChecklistItemRun & { attachments: { id: string; url: string }[] };

  const dispatch = createEventDispatcher<{ toggle: { item: typeof item } }>();

  $: completed = item.status === 'COMPLETED';
</script>

<li class={cn(
  'flex items-center gap-4 min-h-[72px] rounded-lg border p-4 transition-colors',
  completed ? 'bg-green-50 border-green-200' : 'bg-card border-border'
)}>
  <button
    class="flex-shrink-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
    on:click={() => dispatch('toggle', { item })}
    aria-label="Toggle {item.title}"
    type="button"
  >
    {#if completed}
      <CircleCheck size={28} class="text-green-600" strokeWidth={2} />
    {:else}
      <Circle size={28} class="text-muted-foreground" strokeWidth={1.5} />
    {/if}
  </button>

  <div class="flex-1 min-w-0">
    <p class={cn('text-base leading-snug', completed && 'line-through opacity-60')}>{item.title}</p>
    {#if item.description}
      <p class="text-sm text-muted-foreground mt-0.5 truncate">{item.description}</p>
    {/if}
    {#if item.photoRequired && item.attachments.length === 0}
      <p class="text-xs text-yellow-600 mt-1 flex items-center gap-1">
        <Camera size={11} strokeWidth={2} />
        Photo required
      </p>
    {/if}
  </div>

  <slot name="action" />
</li>
