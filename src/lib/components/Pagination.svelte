<script lang="ts">
  import { goto } from '$app/navigation';
  import { page as pageStore } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  export let page: number;
  export let totalPages: number;

  function goToPage(p: number) {
    const url = new URL($pageStore.url);
    url.searchParams.set('page', String(p));
    goto(url.toString());
  }
</script>

{#if totalPages > 1}
  <div class="flex items-center justify-center gap-1 mt-4">
    <Button
      variant="outline"
      size="sm"
      disabled={page <= 1}
      onclick={() => goToPage(page - 1)}
    >
      &lsaquo; Prev
    </Button>

    {#each Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
      if (totalPages <= 7) return i + 1;
      if (page <= 4) return i + 1;
      if (page >= totalPages - 3) return totalPages - 6 + i;
      return page - 3 + i;
    }) as p}
      <Button
        variant={p === page ? 'default' : 'outline'}
        size="sm"
        onclick={() => goToPage(p)}
        class={cn('min-w-8', p === page && 'pointer-events-none')}
      >
        {p}
      </Button>
    {/each}

    <Button
      variant="outline"
      size="sm"
      disabled={page >= totalPages}
      onclick={() => goToPage(page + 1)}
    >
      Next &rsaquo;
    </Button>
  </div>
{/if}
