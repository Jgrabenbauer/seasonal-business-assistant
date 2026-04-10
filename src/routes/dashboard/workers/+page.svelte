<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Field Team — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Field Team</h1>
  <Button href="/dashboard/invites">Invite Team Member</Button>
</div>

{#if form?.error}
  <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
{/if}

{#if data.workers.length === 0}
  <div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
    <p>No workers yet. Add your first team member above.</p>
  </div>
{:else}
  <div class="rounded-md border border-border overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 text-muted-foreground">
        <tr>
          <th class="text-left px-4 py-3 font-medium">Name</th>
          <th class="text-left px-4 py-3 font-medium">Phone</th>
          <th class="text-left px-4 py-3 font-medium">Turnovers</th>
          <th class="text-left px-4 py-3 font-medium">SMS Opt-In</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each data.workers as worker}
          <tr class="hover:bg-muted/30 transition-colors">
            <td class="px-4 py-3 font-medium">{worker.name}</td>
            <td class="px-4 py-3 text-muted-foreground">{worker.phone ?? '—'}</td>
            <td class="px-4 py-3">{worker._count.assignedTurnovers}</td>
            <td class="px-4 py-3">
              <form method="POST" action="?/toggle_sms" class="inline">
                <input type="hidden" name="workerId" value={worker.id} />
                <input type="hidden" name="enabled" value={worker.smsOptIn ? 'false' : 'true'} />
                <Button type="submit" variant="ghost" size="sm" disabled={!worker.phone}>
                  {#if worker.smsOptIn}
                    <Badge class="bg-green-100 text-green-800 border-green-200">On</Badge>
                  {:else}
                    <Badge variant="secondary">Off</Badge>
                  {/if}
                </Button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
