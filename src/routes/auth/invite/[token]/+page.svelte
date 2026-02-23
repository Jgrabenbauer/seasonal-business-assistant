<script lang="ts">
  import type { ActionData, PageData } from './$types';
  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Accept Invite — SBA</title>
</svelte:head>

<div class="max-w-md mx-auto mt-10">
  <div class="card p-6 space-y-4">
    {#if !data.invite}
      <h1 class="text-xl font-bold">Invite Expired</h1>
      <p class="text-surface-500 text-sm">Please request a new invite.</p>
    {:else}
      <h1 class="text-xl font-bold">Accept Invite</h1>
      <p class="text-surface-500 text-sm">
        You are joining as {data.invite.role}.
      </p>
      {#if form?.error}
        <div class="alert variant-filled-error"><p>{form.error}</p></div>
      {/if}
      {#if form?.success}
        <div class="alert variant-filled-success"><p>Invite accepted. You can now start.</p></div>
      {:else}
        <form method="POST" action="?/accept" class="space-y-4">
          <label class="label">
            <span>Name *</span>
            <input class="input" type="text" name="name" required />
          </label>
          <label class="label">
            <span>Phone</span>
            <input class="input" type="tel" name="phone" />
          </label>
          {#if data.invite.role !== 'WORKER'}
            <label class="label">
              <span>Password *</span>
              <input class="input" type="password" name="password" required minlength="8" />
            </label>
          {/if}
          <button type="submit" class="btn variant-filled-primary w-full">Accept Invite</button>
        </form>
      {/if}
    {/if}
  </div>
</div>
