<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>{data.template.name} — SBA</title>
</svelte:head>

<div class="flex items-center gap-2 text-surface-400 text-sm mb-4">
  <a href="/dashboard/templates" class="anchor">Templates</a>
  <span>/</span>
  <span>{data.template.name}</span>
</div>

<h1 class="text-2xl font-bold mb-6">{data.template.name}</h1>

{#if form?.error}
  <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
{/if}

<!-- Add item form -->
<div class="card p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Add Readiness Step</h2>
  <form method="POST" action="?/add_item" class="space-y-3">
    <label class="label">
      <span>Title *</span>
      <input class="input" type="text" name="title" required placeholder="Strip and remake all beds" />
    </label>
    <label class="label">
      <span>Description</span>
      <input class="input" type="text" name="description" placeholder="Optional details..." />
    </label>
    <label class="flex items-center gap-2">
      <input type="checkbox" name="photoRequired" class="checkbox" />
      <span class="text-sm">Photo required</span>
    </label>
    <button type="submit" class="btn variant-filled-primary btn-sm">Add Step</button>
  </form>
</div>

<!-- Item list -->
{#if data.template.items.length === 0}
  <div class="card p-6 text-center text-surface-400">
    <p>No items yet. Add your first readiness step above.</p>
  </div>
{:else}
  <div class="space-y-2">
    {#each data.template.items as item, i}
      <div class="card p-4 flex items-center gap-3">
        <span class="text-surface-400 w-6 text-right flex-shrink-0">{i + 1}</span>
        <div class="flex-1 min-w-0">
          <p class="font-medium">{item.title}</p>
          {#if item.description}
            <p class="text-sm text-surface-500">{item.description}</p>
          {/if}
          {#if item.photoRequired}
            <span class="badge variant-soft-warning text-xs mt-1">Photo required</span>
          {/if}
        </div>
        <form method="POST" action="?/delete_item">
          <input type="hidden" name="itemId" value={item.id} />
          <button
            type="submit"
            class="btn btn-sm variant-ghost-error"
            aria-label="Delete {item.title}"
          >
            ✕
          </button>
        </form>
      </div>
    {/each}
  </div>
{/if}
