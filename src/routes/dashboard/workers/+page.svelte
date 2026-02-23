<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Field Team — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Field Team</h1>
  <a class="btn variant-filled-primary" href="/dashboard/invites">Invite Team Member</a>
</div>

{#if form?.error}
  <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
{/if}

{#if data.workers.length === 0}
  <div class="card p-8 text-center text-surface-400">
    <p>No workers yet. Add your first team member above.</p>
  </div>
{:else}
  <div class="table-container">
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Turnovers</th>
          <th>SMS Opt-In</th>
        </tr>
      </thead>
      <tbody>
        {#each data.workers as worker}
          <tr>
            <td class="font-medium">{worker.name}</td>
            <td class="text-surface-500">{worker.phone ?? '—'}</td>
            <td>{worker._count.assignedTurnovers}</td>
            <td>
              <form method="POST" action="?/toggle_sms">
                <input type="hidden" name="workerId" value={worker.id} />
                <input type="hidden" name="enabled" value={worker.smsOptIn ? 'false' : 'true'} />
                <button type="submit" class="btn btn-sm variant-ghost" disabled={!worker.phone}>
                  {worker.smsOptIn ? 'On' : 'Off'}
                </button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
