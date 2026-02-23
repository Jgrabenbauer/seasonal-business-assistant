<script lang="ts">
  import { onMount } from 'svelte';

  let offline = false;

  onMount(() => {
    offline = !navigator.onLine;

    const handleOffline = () => (offline = true);
    const handleOnline = () => (offline = false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  });
</script>

{#if offline}
  <div
    class="alert variant-filled-warning sticky top-0 z-50 rounded-none flex items-center justify-between"
    role="alert"
  >
    <span class="font-semibold">You're offline. Changes will not be saved.</span>
    <button
      class="btn btn-sm variant-ghost"
      on:click={() => window.location.reload()}
      type="button"
    >
      Retry
    </button>
  </div>
{/if}
