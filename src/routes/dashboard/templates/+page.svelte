<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let showForm = false;
</script>

<svelte:head>
  <title>Readiness Templates — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Readiness Templates</h1>
  <Button variant={showForm ? 'outline' : 'default'} onclick={() => (showForm = !showForm)} type="button">
    {showForm ? 'Cancel' : 'New Template'}
  </Button>
</div>

{#if showForm}
  <div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
    {#if form?.error}
      <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
    {/if}
    <form method="POST" action="?/create" class="flex gap-3">
      <Input class="flex-1" type="text" name="name" required placeholder="Standard Turnover" />
      <Button type="submit">Create</Button>
    </form>
  </div>
{/if}

{#if data.templates.length === 0}
  <div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
    <p>No templates yet. Create your first readiness template.</p>
  </div>
{:else}
  <div class="space-y-2">
    {#each data.templates as template}
      <a
        href="/dashboard/templates/{template.id}"
        class="flex items-center justify-between rounded-lg border border-border bg-card p-4 no-underline transition-shadow hover:shadow-md"
      >
        <div>
          <p class="font-semibold">{template.name}</p>
          <p class="text-sm text-muted-foreground">{template._count.items} items</p>
        </div>
        <ChevronRight size={18} class="text-muted-foreground" strokeWidth={2} />
      </a>
    {/each}
  </div>
{/if}
