<script lang="ts">
  import { goto } from '$app/navigation';
  import { page as pageStore } from '$app/stores';

  export let page: number;
  export let totalPages: number;

  function goToPage(p: number) {
    const url = new URL($pageStore.url);
    url.searchParams.set('page', String(p));
    goto(url.toString());
  }
</script>

{#if totalPages > 1}
  <div class="flex items-center justify-center gap-2 mt-4">
    <button
      type="button"
      class="btn btn-sm variant-soft-surface"
      disabled={page <= 1}
      on:click={() => goToPage(page - 1)}
    >
      &lsaquo; Prev
    </button>

    {#each Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
      // Show pages around current page
      if (totalPages <= 7) return i + 1;
      if (page <= 4) return i + 1;
      if (page >= totalPages - 3) return totalPages - 6 + i;
      return page - 3 + i;
    }) as p}
      <button
        type="button"
        class="btn btn-sm {p === page ? 'variant-filled-primary' : 'variant-soft-surface'}"
        on:click={() => goToPage(p)}
      >
        {p}
      </button>
    {/each}

    <button
      type="button"
      class="btn btn-sm variant-soft-surface"
      disabled={page >= totalPages}
      on:click={() => goToPage(page + 1)}
    >
      Next &rsaquo;
    </button>
  </div>
{/if}
