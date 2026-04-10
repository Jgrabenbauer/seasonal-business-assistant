<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import Camera from 'lucide-svelte/icons/camera';
  import X from 'lucide-svelte/icons/x';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>{data.template.name} — SBA</title>
</svelte:head>

<div class="flex items-center gap-2 text-muted-foreground text-sm mb-4">
  <a href="/dashboard/templates" class="text-primary underline-offset-4 hover:underline">Templates</a>
  <span>/</span>
  <span class="text-foreground">{data.template.name}</span>
</div>

<h1 class="text-2xl font-semibold mb-6">{data.template.name}</h1>

{#if form?.error}
  <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
{/if}

<!-- Add item form -->
<div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Add Readiness Step</h2>
  <form method="POST" action="?/add_item" class="space-y-4">
    <div class="space-y-1.5">
      <Label for="title">Title</Label>
      <Input id="title" type="text" name="title" required placeholder="Strip and remake all beds" />
    </div>
    <div class="space-y-1.5">
      <Label for="description">Description</Label>
      <Input id="description" type="text" name="description" placeholder="Optional details..." />
    </div>
    <div class="flex items-center gap-2">
      <input type="checkbox" name="photoRequired" id="photoRequired" class="h-4 w-4 rounded border border-input" />
      <Label for="photoRequired" class="cursor-pointer font-normal">Photo required</Label>
    </div>
    <Button type="submit" size="sm">Add Step</Button>
  </form>
</div>

<!-- Item list -->
{#if data.template.items.length === 0}
  <div class="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
    <p>No items yet. Add your first readiness step above.</p>
  </div>
{:else}
  <div class="space-y-2">
    {#each data.template.items as item, i}
      <div class="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
        <span class="text-muted-foreground w-6 text-right flex-shrink-0 text-sm">{i + 1}</span>
        <div class="flex-1 min-w-0">
          <p class="font-medium">{item.title}</p>
          {#if item.description}
            <p class="text-sm text-muted-foreground">{item.description}</p>
          {/if}
          {#if item.photoRequired}
            <Badge class="bg-yellow-100 text-yellow-800 border-yellow-200 mt-1 gap-1 text-xs">
              <Camera size={10} strokeWidth={2} />
              Photo required
            </Badge>
          {/if}
        </div>
        <form method="POST" action="?/delete_item">
          <input type="hidden" name="itemId" value={item.id} />
          <Button type="submit" variant="ghost" size="icon-sm" class="text-destructive hover:bg-destructive/10" aria-label="Delete {item.title}">
            <X size={14} strokeWidth={2.5} />
          </Button>
        </form>
      </div>
    {/each}
  </div>
{/if}
