<script lang="ts">
  import { formatDateTime } from '$lib/utils';
  import { Badge } from '$lib/components/ui/badge';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>SMS Outbox — SBA</title>
</svelte:head>

<h1 class="text-2xl font-semibold mb-2">SMS Outbox</h1>
<p class="text-muted-foreground text-sm mb-6">Last 50 messages sent from this organization.</p>

{#if data.messages.length === 0}
  <div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
    <p>No messages sent yet.</p>
  </div>
{:else}
  <div class="space-y-3">
    {#each data.messages as msg}
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <Badge variant={msg.provider === 'twilio' ? 'default' : 'secondary'}>{msg.provider}</Badge>
            <span class="font-medium text-sm">{msg.to}</span>
            <Badge variant="outline" class="text-xs">{msg.status}</Badge>
          </div>
          <span class="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(msg.createdAt)}</span>
        </div>
        <p class="text-sm text-foreground whitespace-pre-wrap">{msg.body}</p>
        {#if msg.externalId}
          <p class="text-xs text-muted-foreground mt-1">SID: {msg.externalId}</p>
        {/if}
        {#if msg.errorMessage}
          <p class="text-xs text-destructive mt-1">{msg.errorMessage}</p>
        {/if}
      </div>
    {/each}
  </div>
{/if}
