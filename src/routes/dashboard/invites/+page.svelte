<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Invites — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Invitations</h1>
</div>

{#if form?.error}
  <div class="alert variant-filled-error mb-4"><p>{form.error}</p></div>
{/if}

<div class="card p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Invite Team Member</h2>
  <form method="POST" action="?/create" use:enhance class="space-y-4">
    <label class="label">
      <span>Email *</span>
      <input class="input" type="email" name="email" required placeholder="worker@example.com" />
    </label>
    <label class="label">
      <span>Role *</span>
      <select class="select" name="role" required>
        <option value="WORKER">Worker</option>
        <option value="SUPERVISOR">Supervisor</option>
      </select>
    </label>
    <button type="submit" class="btn variant-filled-primary">Send Invite</button>
  </form>
</div>

<div class="card p-6">
  <h2 class="text-lg font-semibold mb-4">Invite Status</h2>
  {#if data.invites.length === 0}
    <p class="text-surface-500 text-sm">No invites yet.</p>
  {:else}
    <div class="table-container">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Expires</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.invites as invite}
            <tr>
              <td class="font-medium">{invite.email}</td>
              <td>{invite.role}</td>
              <td>
                <span class="badge variant-soft-surface">{invite.status}</span>
              </td>
              <td class="text-sm text-surface-500">
                {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : '—'}
              </td>
              <td class="text-right">
                {#if invite.status === 'PENDING'}
                  <form method="POST" action="?/resend" use:enhance class="inline">
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button type="submit" class="btn btn-sm variant-ghost">Resend</button>
                  </form>
                  <form method="POST" action="?/revoke" use:enhance class="inline">
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button type="submit" class="btn btn-sm variant-ghost">Revoke</button>
                  </form>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
