<script lang="ts">
  import { formatDateTime } from '$lib/utils';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Certificates — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Turnover Readiness Certificates</h1>
</div>

{#if data.certificates.length === 0}
  <div class="card p-8 text-center text-surface-400">
    <p>No verified turnovers yet.</p>
  </div>
{:else}
  <div class="table-container">
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Property</th>
          <th>Turnover</th>
          <th>Verified</th>
          <th>Verified By</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.certificates as cert}
          <tr>
            <td class="font-medium">{cert.property.name}</td>
            <td>{cert.title}</td>
            <td>{formatDateTime(cert.verifiedAt)}</td>
            <td>{cert.verifiedBy?.name ?? '—'}</td>
            <td>
              <a href="/dashboard/turnovers/{cert.id}" class="btn btn-sm variant-ghost">View</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
