<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let showForm = false;
</script>

<svelte:head>
  <title>Readiness Templates — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Readiness Templates</h1>
  <button class="btn variant-filled-primary" on:click={() => (showForm = !showForm)} type="button">
    {showForm ? 'Cancel' : '+ New Template'}
  </button>
</div>

{#if showForm}
  <div class="card p-6 mb-6">
    {#if form?.error}
      <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
    {/if}
    <form method="POST" action="?/create" class="flex gap-3">
      <input class="input flex-1" type="text" name="name" required placeholder="Standard Turnover" />
      <button type="submit" class="btn variant-filled-primary">Create</button>
    </form>
  </div>
{/if}

{#if data.templates.length === 0}
  <div class="card p-8 text-center text-surface-400">
    <p>No templates yet. Create your first readiness template.</p>
  </div>
{:else}
  <div class="space-y-3">
    {#each data.templates as template}
      <a
        href="/dashboard/templates/{template.id}"
        class="card card-hover p-4 flex items-center justify-between no-underline block"
      >
        <div>
          <p class="font-semibold">{template.name}</p>
          <p class="text-sm text-surface-500">{template._count.items} items</p>
        </div>
        <span class="text-surface-400">→</span>
      </a>
    {/each}
  </div>
{/if}
