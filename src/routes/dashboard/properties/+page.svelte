<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let showForm = false;
</script>

<svelte:head>
  <title>Properties — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Properties</h1>
  <button class="btn variant-filled-primary" on:click={() => (showForm = !showForm)} type="button">
    {showForm ? 'Cancel' : '+ Add Property'}
  </button>
</div>

{#if showForm}
  <div class="card p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">Add Property</h2>
    {#if form?.error}
      <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
    {/if}
    <form method="POST" action="?/create" class="space-y-4">
      <label class="label">
        <span>Name *</span>
        <input class="input" type="text" name="name" required placeholder="Nauset Cottage" />
      </label>
      <label class="label">
        <span>Address</span>
        <input class="input" type="text" name="address" placeholder="123 Beach Rd, Eastham MA" />
      </label>
      <label class="label">
        <span>Notes</span>
        <textarea class="textarea" name="notes" rows="2" placeholder="Access codes, special instructions..."></textarea>
      </label>
      <button type="submit" class="btn variant-filled-primary">Save Property</button>
    </form>
  </div>
{/if}

{#if data.properties.length === 0}
  <div class="card p-8 text-center text-surface-400">
    <p>No properties yet. Add your first property above.</p>
  </div>
{:else}
  <div class="table-container">
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Name</th>
          <th>Address</th>
          <th>Turnovers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.properties as property}
          <tr>
            <td class="font-medium">{property.name}</td>
            <td class="text-surface-500">{property.address ?? '—'}</td>
            <td>{property._count.turnovers}</td>
            <td>
              <a href="/dashboard/properties/{property.id}" class="btn btn-sm variant-ghost">View</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
