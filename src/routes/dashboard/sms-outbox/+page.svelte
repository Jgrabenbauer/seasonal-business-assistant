<script lang="ts">
  import { formatDateTime } from '$lib/utils';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>SMS Outbox — SBA</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">SMS Outbox</h1>
<p class="text-surface-500 mb-6">Last 50 messages sent from this organization.</p>

{#if data.messages.length === 0}
  <div class="card p-8 text-center text-surface-400">
    <p>No messages sent yet.</p>
  </div>
{:else}
  <div class="space-y-3">
    {#each data.messages as msg}
      <div class="card p-4">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="flex items-center gap-2">
            <span class="badge {msg.provider === 'twilio' ? 'variant-soft-primary' : 'variant-soft-surface'}">
              {msg.provider}
            </span>
            <span class="font-medium text-sm">{msg.to}</span>
            <span class="badge variant-soft-surface text-xs">{msg.status}</span>
          </div>
          <span class="text-xs text-surface-400 flex-shrink-0">{formatDateTime(msg.createdAt)}</span>
        </div>
        <p class="text-sm text-surface-600-300-token whitespace-pre-wrap">{msg.body}</p>
        {#if msg.externalId}
          <p class="text-xs text-surface-400 mt-1">SID: {msg.externalId}</p>
        {/if}
        {#if msg.errorMessage}
          <p class="text-xs text-error-500 mt-1">{msg.errorMessage}</p>
        {/if}
      </div>
    {/each}
  </div>
{/if}
