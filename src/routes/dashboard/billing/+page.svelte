<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import type { PageData } from './$types';
  export let data: PageData;

  $: trialDaysLeft = data.org.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(data.org.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  $: workerPct = Math.min(100, Math.round((data.workerCount / data.org.maxWorkers) * 100));
  $: propPct =
    data.org.maxProperties === -1
      ? 0
      : Math.min(100, Math.round((data.propertyCount / data.org.maxProperties) * 100));
  $: graceDays =
    data.subscription?.gracePeriodEndsAt
      ? Math.max(0, Math.ceil((new Date(data.subscription.gracePeriodEndsAt).getTime() - Date.now()) / 86400000))
      : null;

  let loadingCheckout = false;
  let loadingPortal = false;

  async function startCheckout(plan: 'STARTER' | 'PRO') {
    loadingCheckout = true;
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    const d = await res.json();
    loadingCheckout = false;
    if (d?.url) window.location.href = d.url;
  }

  async function openPortal() {
    loadingPortal = true;
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const d = await res.json();
    loadingPortal = false;
    if (d?.url) window.location.href = d.url;
  }
</script>

<svelte:head>
  <title>Billing — SBA</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
  <div>
    <h1 class="text-2xl font-semibold">Billing &amp; Plan</h1>
    <p class="text-muted-foreground text-sm mt-1">{data.org.name}</p>
  </div>

  <!-- Plan badge -->
  <div class="rounded-lg border border-border bg-card shadow-sm p-6 space-y-4">
    <div class="flex items-center gap-3 flex-wrap">
      <Badge class={data.org.planType === 'PRO' ? 'bg-primary text-primary-foreground' : ''} variant={data.org.planType === 'PRO' ? 'default' : 'secondary'}>
        {data.org.planType}
      </Badge>
      <Badge
        class={data.org.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' : data.org.subscriptionStatus === 'TRIAL' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-destructive text-destructive-foreground'}
      >
        {data.org.subscriptionStatus}
      </Badge>
    </div>

    {#if data.org.subscriptionStatus === 'TRIAL'}
      {#if trialDaysLeft !== null && trialDaysLeft <= 0}
        <p class="text-destructive font-medium">Trial expired. Upgrade to continue.</p>
      {:else if trialDaysLeft !== null}
        <p class="text-foreground">
          Trial ends in <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</strong>.
        </p>
      {:else}
        <p class="text-muted-foreground text-sm">Indefinite trial (legacy account).</p>
      {/if}
    {/if}
    {#if data.org.subscriptionStatus === 'PAST_DUE' && graceDays !== null}
      <p class="text-yellow-600">
        Payment issue. Grace period ends in {graceDays} day{graceDays !== 1 ? 's' : ''}.
      </p>
    {/if}

    <div class="flex flex-wrap gap-3">
      {#if data.org.planType !== 'PRO'}
        <Button disabled={loadingCheckout} onclick={() => startCheckout('PRO')}>
          {loadingCheckout ? 'Opening…' : 'Upgrade to Pro'}
        </Button>
      {/if}
      {#if data.org.subscriptionStatus !== 'TRIAL'}
        <Button variant="outline" disabled={loadingPortal} onclick={openPortal}>
          {loadingPortal ? 'Opening…' : 'Manage Billing'}
        </Button>
      {/if}
    </div>
  </div>

  <!-- Usage -->
  <div class="rounded-lg border border-border bg-card shadow-sm p-6 space-y-5">
    <h2 class="font-semibold text-lg">Usage</h2>

    <div class="space-y-1">
      <div class="flex justify-between text-sm">
        <span>Workers</span>
        <span class="font-medium">{data.workerCount} / {data.org.maxWorkers}</span>
      </div>
      <div class="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all {workerPct >= 100 ? 'bg-destructive' : workerPct >= 80 ? 'bg-warning' : 'bg-primary'}"
          style="width: {workerPct}%"
        ></div>
      </div>
    </div>

    <div class="space-y-1">
      <div class="flex justify-between text-sm">
        <span>Properties</span>
        <span class="font-medium">
          {data.propertyCount} / {data.org.maxProperties === -1 ? '∞' : data.org.maxProperties}
        </span>
      </div>
      {#if data.org.maxProperties !== -1}
        <div class="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all {propPct >= 100 ? 'bg-destructive' : propPct >= 80 ? 'bg-warning' : 'bg-primary'}"
            style="width: {propPct}%"
          ></div>
        </div>
      {:else}
        <p class="text-xs text-green-600">Unlimited (Pro)</p>
      {/if}
    </div>
  </div>
</div>
