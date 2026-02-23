<script lang="ts">
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
      ? Math.max(
          0,
          Math.ceil(
            (new Date(data.subscription.gracePeriodEndsAt).getTime() - Date.now()) / 86400000
          )
        )
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
    const data = await res.json();
    loadingCheckout = false;
    if (data?.url) window.location.href = data.url;
  }

  async function openPortal() {
    loadingPortal = true;
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    loadingPortal = false;
    if (data?.url) window.location.href = data.url;
  }
</script>

<svelte:head>
  <title>Billing — SBA</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Billing &amp; Plan</h1>
    <p class="text-surface-500 text-sm mt-1">{data.org.name}</p>
  </div>

  <!-- Plan badge -->
  <div class="card p-6 space-y-4">
    <div class="flex items-center gap-3">
      <span class="badge {data.org.planType === 'PRO' ? 'variant-filled-primary' : 'variant-soft-surface'} text-base px-3 py-1">
        {data.org.planType}
      </span>
      <span class="badge {data.org.subscriptionStatus === 'ACTIVE' ? 'variant-filled-success' : data.org.subscriptionStatus === 'TRIAL' ? 'variant-filled-warning' : 'variant-filled-error'}">
        {data.org.subscriptionStatus}
      </span>
    </div>

    {#if data.org.subscriptionStatus === 'TRIAL'}
      {#if trialDaysLeft !== null && trialDaysLeft <= 0}
        <p class="text-error-500 font-medium">Trial expired. Upgrade to continue.</p>
      {:else if trialDaysLeft !== null}
        <p class="text-surface-600">
          Trial ends in <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</strong>.
        </p>
      {:else}
        <p class="text-surface-500 text-sm">Indefinite trial (legacy account).</p>
      {/if}
    {/if}
    {#if data.org.subscriptionStatus === 'PAST_DUE' && graceDays !== null}
      <p class="text-warning-600">
        Payment issue. Grace period ends in {graceDays} day{graceDays !== 1 ? 's' : ''}.
      </p>
    {/if}

    <div class="flex flex-wrap gap-3">
      {#if data.org.planType !== 'PRO'}
        <button
          type="button"
          class="btn variant-filled-primary"
          disabled={loadingCheckout}
          on:click={() => startCheckout('PRO')}
        >
          {loadingCheckout ? 'Opening…' : 'Upgrade to Pro'}
        </button>
      {/if}
      {#if data.org.subscriptionStatus !== 'TRIAL'}
        <button
          type="button"
          class="btn variant-soft-surface"
          disabled={loadingPortal}
          on:click={openPortal}
        >
          {loadingPortal ? 'Opening…' : 'Manage Billing'}
        </button>
      {/if}
    </div>
  </div>

  <!-- Usage -->
  <div class="card p-6 space-y-5">
    <h2 class="font-semibold text-lg">Usage</h2>

    <!-- Workers -->
    <div class="space-y-1">
      <div class="flex justify-between text-sm">
        <span>Workers</span>
        <span class="font-medium">{data.workerCount} / {data.org.maxWorkers}</span>
      </div>
      <div class="h-2 bg-surface-200-700-token rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all {workerPct >= 100 ? 'bg-error-500' : workerPct >= 80 ? 'bg-warning-500' : 'bg-primary-500'}"
          style="width: {workerPct}%"
        ></div>
      </div>
    </div>

    <!-- Properties -->
    <div class="space-y-1">
      <div class="flex justify-between text-sm">
        <span>Properties</span>
        <span class="font-medium">
          {data.propertyCount} / {data.org.maxProperties === -1 ? '∞' : data.org.maxProperties}
        </span>
      </div>
      {#if data.org.maxProperties !== -1}
        <div class="h-2 bg-surface-200-700-token rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all {propPct >= 100 ? 'bg-error-500' : propPct >= 80 ? 'bg-warning-500' : 'bg-primary-500'}"
            style="width: {propPct}%"
          ></div>
        </div>
      {:else}
        <p class="text-xs text-success-500">Unlimited (Pro)</p>
      {/if}
    </div>
  </div>
</div>
