<script lang="ts">
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<svelte:head>
  <title>Register — SBA</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-surface-100-800-token px-4">
  <div class="card p-8 w-full max-w-md shadow-xl">
    <h1 class="text-2xl font-bold mb-2">Create Your Organization</h1>
    <p class="text-surface-500 mb-6">Set up your Seasonal Business Assistant account</p>

    {#if form?.error}
      <div class="alert variant-filled-error mb-4">
        <p>{form.error}</p>
      </div>
    {/if}

    <form method="POST" class="space-y-4">
      <label class="label">
        <span>Organization Name</span>
        <input
          class="input"
          type="text"
          name="orgName"
          required
          placeholder="Cape Cod Stays"
          value={form?.orgName ?? ''}
        />
      </label>

      <label class="label">
        <span>Your Name</span>
        <input
          class="input"
          type="text"
          name="name"
          required
          placeholder="Sarah Manager"
          value={form?.name ?? ''}
        />
      </label>

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
          minlength="8"
          autocomplete="new-password"
        />
      </label>

      <button type="submit" class="btn variant-filled-primary w-full">
        Create Account
      </button>
    </form>

    <p class="text-center text-sm text-surface-500 mt-4">
      Already have an account?
      <a href="/auth/login" class="anchor">Sign in</a>
    </p>
  </div>
</div>
