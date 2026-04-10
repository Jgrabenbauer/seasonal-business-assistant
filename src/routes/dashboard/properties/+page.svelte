<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let showForm = false;
</script>

<svelte:head>
  <title>Properties — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Properties</h1>
  <Button variant={showForm ? 'outline' : 'default'} onclick={() => (showForm = !showForm)} type="button">
    {showForm ? 'Cancel' : 'Add Property'}
  </Button>
</div>

{#if showForm}
  <div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">Add Property</h2>
    {#if form?.error}
      <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
    {/if}
    <form method="POST" action="?/create" class="space-y-4">
      <div class="space-y-1.5">
        <Label for="name">Name</Label>
        <Input id="name" type="text" name="name" required placeholder="Nauset Cottage" />
      </div>
      <div class="space-y-1.5">
        <Label for="address">Address</Label>
        <Input id="address" type="text" name="address" placeholder="123 Beach Rd, Eastham MA" />
      </div>
      <div class="space-y-1.5">
        <Label for="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Access codes, special instructions..." />
      </div>
      <Button type="submit">Save Property</Button>
    </form>
  </div>
{/if}

{#if data.properties.length === 0}
  <div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
    <p>No properties yet. Add your first property above.</p>
  </div>
{:else}
  <div class="rounded-md border border-border overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 text-muted-foreground">
        <tr>
          <th class="text-left px-4 py-3 font-medium">Name</th>
          <th class="text-left px-4 py-3 font-medium">Address</th>
          <th class="text-left px-4 py-3 font-medium">Turnovers</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each data.properties as property}
          <tr class="hover:bg-muted/30 transition-colors">
            <td class="px-4 py-3 font-medium">{property.name}</td>
            <td class="px-4 py-3 text-muted-foreground">{property.address ?? '—'}</td>
            <td class="px-4 py-3">{property._count.turnovers}</td>
            <td class="px-4 py-3 text-right">
              <Button href="/dashboard/properties/{property.id}" variant="ghost" size="sm">View</Button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
