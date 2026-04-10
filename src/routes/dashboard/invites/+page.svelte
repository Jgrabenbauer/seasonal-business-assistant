<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Invites — SBA</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-semibold">Invitations</h1>
</div>

{#if form?.error}
  <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-4">{form.error}</div>
{/if}

<div class="rounded-lg border border-border bg-card shadow-sm p-6 mb-6">
  <h2 class="text-lg font-semibold mb-4">Invite Team Member</h2>
  <form method="POST" action="?/create" use:enhance class="space-y-4">
    <div class="space-y-1.5">
      <Label for="email">Email</Label>
      <Input id="email" type="email" name="email" required placeholder="worker@example.com" />
    </div>
    <div class="space-y-1.5">
      <Label for="role">Role</Label>
      <select id="role" name="role" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="WORKER">Worker</option>
        <option value="SUPERVISOR">Supervisor</option>
      </select>
    </div>
    <Button type="submit">Send Invite</Button>
  </form>
</div>

<div class="rounded-lg border border-border bg-card shadow-sm p-6">
  <h2 class="text-lg font-semibold mb-4">Invite Status</h2>
  {#if data.invites.length === 0}
    <p class="text-muted-foreground text-sm">No invites yet.</p>
  {:else}
    <div class="rounded-md border border-border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted/50 text-muted-foreground">
          <tr>
            <th class="text-left px-4 py-3 font-medium">Email</th>
            <th class="text-left px-4 py-3 font-medium">Role</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-left px-4 py-3 font-medium">Expires</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each data.invites as invite}
            <tr class="hover:bg-muted/30 transition-colors">
              <td class="px-4 py-3 font-medium">{invite.email}</td>
              <td class="px-4 py-3">{invite.role}</td>
              <td class="px-4 py-3">
                <Badge variant="secondary">{invite.status}</Badge>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : '—'}
              </td>
              <td class="px-4 py-3 text-right">
                {#if invite.status === 'PENDING'}
                  <form method="POST" action="?/resend" use:enhance class="inline">
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <Button type="submit" variant="ghost" size="sm">Resend</Button>
                  </form>
                  <form method="POST" action="?/revoke" use:enhance class="inline">
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <Button type="submit" variant="ghost" size="sm" class="text-destructive hover:bg-destructive/10">Revoke</Button>
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
