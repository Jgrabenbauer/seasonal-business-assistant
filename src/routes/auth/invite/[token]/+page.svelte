<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Accept Invite — SBA</title>
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
        {#if !data.invite}
          <h1 class="text-xl font-semibold mb-2">Invite Expired</h1>
          <p class="text-sm text-muted-foreground">This invite link is no longer valid. Please request a new one from your manager.</p>
        {:else}
          <h1 class="text-xl font-semibold mb-1">Accept Your Invite</h1>
          <p class="text-sm text-muted-foreground mb-6">
            You are joining as <span class="font-medium capitalize">{data.invite.role.toLowerCase()}</span>.
          </p>

          {#if form?.error}
            <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm mb-5">
              {form.error}
            </div>
          {/if}

          {#if form?.success}
            <div class="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm mb-5">
              Invite accepted. You can now start.
            </div>
          {:else}
            <form method="POST" action="?/accept" class="space-y-4">
              <div class="space-y-1.5">
                <Label for="name">Your name</Label>
                <Input id="name" type="text" name="name" required autocomplete="name" />
              </div>

              <div class="space-y-1.5">
                <Label for="phone">Phone number</Label>
                <Input id="phone" type="tel" name="phone" placeholder="+15085551234" autocomplete="tel" />
              </div>

              {#if data.invite.role !== 'WORKER'}
                <div class="space-y-1.5">
                  <Label for="password">Password</Label>
                  <Input id="password" type="password" name="password" required minlength={8} autocomplete="new-password" />
                  <p class="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>
              {/if}

              <Button type="submit" class="w-full mt-2">Accept Invite</Button>
            </form>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>
