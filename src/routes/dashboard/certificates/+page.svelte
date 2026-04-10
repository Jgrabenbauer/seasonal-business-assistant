<script lang="ts">
  import { formatDateTime } from '$lib/utils';
  import { Button } from '$lib/components/ui/button';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Certificates — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Turnover Readiness Certificates</h1>
</div>

{#if data.certificates.length === 0}
  <div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
    <p>No verified turnovers yet.</p>
  </div>
{:else}
  <div class="rounded-md border border-border overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 text-muted-foreground">
        <tr>
          <th class="text-left px-4 py-3 font-medium">Property</th>
          <th class="text-left px-4 py-3 font-medium">Turnover</th>
          <th class="text-left px-4 py-3 font-medium">Verified</th>
          <th class="text-left px-4 py-3 font-medium">Verified By</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each data.certificates as cert}
          <tr class="hover:bg-muted/30 transition-colors">
            <td class="px-4 py-3 font-medium">{cert.property.name}</td>
            <td class="px-4 py-3">{cert.title}</td>
            <td class="px-4 py-3 text-muted-foreground">{formatDateTime(cert.verifiedAt)}</td>
            <td class="px-4 py-3 text-muted-foreground">{cert.verifiedBy?.name ?? '—'}</td>
            <td class="px-4 py-3 text-right">
              <Button href="/dashboard/turnovers/{cert.id}" variant="ghost" size="sm">View</Button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
