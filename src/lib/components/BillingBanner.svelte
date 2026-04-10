<script lang="ts">
  export let billingInfo: {
    isTrialExpired: boolean;
    trialDaysRemaining: number | null;
    isActive: boolean;
    planType: string;
    subscriptionStatus: string;
  };
</script>

{#if billingInfo.isTrialExpired}
  <div class="bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium flex items-center justify-between gap-2">
    <span>Your trial has expired. Upgrade to continue using SBA.</span>
    <a href="/dashboard/billing" class="underline font-semibold whitespace-nowrap">Upgrade now</a>
  </div>
{:else if billingInfo.trialDaysRemaining !== null && billingInfo.trialDaysRemaining <= 3}
  <div class="bg-warning text-warning-foreground px-4 py-2 text-sm font-medium flex items-center justify-between gap-2">
    <span>
      {billingInfo.trialDaysRemaining === 0
        ? 'Your trial expires today!'
        : `Trial expires in ${billingInfo.trialDaysRemaining} day${billingInfo.trialDaysRemaining !== 1 ? 's' : ''}.`}
    </span>
    <a href="/dashboard/billing" class="underline font-semibold whitespace-nowrap">View plan</a>
  </div>
{/if}
