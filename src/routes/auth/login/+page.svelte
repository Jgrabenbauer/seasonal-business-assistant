<script lang="ts">
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<svelte:head>
  <title>Sign In — SBA</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-surface-100-800-token px-4">
  <div class="card p-8 w-full max-w-md shadow-xl">
    <h1 class="text-2xl font-bold mb-2">Sign In</h1>
    <p class="text-surface-500 mb-6">Seasonal Business Assistant</p>

    {#if form?.error}
      <div class="alert variant-filled-error mb-4">
        <p>{form.error}</p>
      </div>
    {/if}

    <form method="POST" class="space-y-4">
      <label class="label">
        <span>Email</span>
        <input
          class="input"
          type="email"
          name="email"
          required
          autocomplete="email"
          value={form?.email ?? ''}
        />
      </label>

      <label class="label">
        <span>Password</span>
        <input
          class="input"
          type="password"
          name="password"
          required
          autocomplete="current-password"
        />
      </label>

      <button type="submit" class="btn variant-filled-primary w-full">
        Sign In
      </button>
    </form>

    <p class="text-center text-sm text-surface-500 mt-4">
      New organization?
      <a href="/auth/register" class="anchor">Register here</a>
    </p>
  </div>
</div>
