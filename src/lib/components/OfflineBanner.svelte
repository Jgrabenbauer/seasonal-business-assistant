<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';

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
    class="sticky top-0 z-50 flex items-center justify-between rounded-none border-b border-warning bg-warning/15 px-4 py-2 text-sm font-medium text-warning-foreground"
    role="alert"
  >
    <span>You're offline. Changes will not be saved.</span>
    <Button variant="outline" size="sm" onclick={() => window.location.reload()}>
      Retry
    </Button>
  </div>
{/if}
