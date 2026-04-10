<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<svelte:head>
  <title>Create Account — SBA</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
  <div class="w-full max-w-sm">
    <!-- Wordmark -->
    <div class="flex items-center justify-center gap-2.5 mb-8">
      <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
        <span class="text-primary-foreground font-bold text-lg leading-none">S</span>
      </div>
      <div>
        <p class="font-bold text-xl leading-none tracking-tight">SBA</p>
        <p class="text-xs text-muted-foreground leading-none mt-0.5">Seasonal Business Assistant</p>
      </div>
    </div>

    <!-- Card -->
    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div class="p-7">
        <h1 class="text-xl font-semibold mb-1">Create your organization</h1>
        <p class="text-sm text-muted-foreground mb-6">Get started with a 14-day free trial</p>

        {#if form?.error}
          <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-5">
            {form.error}
          </div>
        {/if}

        <form method="POST" class="space-y-4">
          <div class="space-y-1.5">
            <Label for="orgName">Organization name</Label>
            <Input
              id="orgName"
              type="text"
              name="orgName"
              required
              placeholder="Cape Cod Stays"
              value={form?.orgName ?? ''}
            />
          </div>

          <div class="space-y-1.5">
            <Label for="name">Your name</Label>
            <Input
              id="name"
              type="text"
              name="name"
              required
              placeholder="Sarah Manager"
              value={form?.name ?? ''}
            />
          </div>

          <div class="space-y-1.5">
            <Label for="email">Email address</Label>
            <Input
              id="email"
              type="email"
              name="email"
              required
              autocomplete="email"
              value={form?.email ?? ''}
            />
          </div>

          <div class="space-y-1.5">
            <Label for="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              required
              minlength={8}
              autocomplete="new-password"
            />
            <p class="text-xs text-muted-foreground">Minimum 8 characters</p>
          </div>

          <Button type="submit" class="w-full mt-2">Create Account</Button>
        </form>
      </div>

      <div class="px-7 py-4 border-t border-border bg-muted/30">
        <p class="text-center text-sm text-muted-foreground">
          Already have an account?
          <a href="/auth/login" class="text-primary font-medium underline-offset-4 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
