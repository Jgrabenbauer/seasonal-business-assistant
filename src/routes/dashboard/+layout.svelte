<script lang="ts">
  import ManagerNav from '$lib/components/ManagerNav.svelte';
  import BillingBanner from '$lib/components/BillingBanner.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<BillingBanner billingInfo={data.billingInfo} />

<div class="flex min-h-screen">
  <!-- Sidebar (desktop) -->
  <aside class="hidden md:flex md:w-64 md:flex-col border-r border-surface-300-600-token bg-surface-50-900-token">
    <div class="p-4 border-b border-surface-300-600-token">
      <h1 class="font-bold text-lg truncate">{data.user.organization.name}</h1>
      <p class="text-xs text-surface-500 truncate">{data.user.name}</p>
    </div>
    <div class="flex-1 overflow-y-auto">
      <ManagerNav userRole={data.user.role} />
    </div>
  </aside>

  <!-- Main content -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Mobile header -->
    <header class="md:hidden flex items-center justify-between p-4 border-b border-surface-300-600-token bg-surface-50-900-token">
      <h1 class="font-bold truncate">{data.user.organization.name}</h1>
    </header>

    <!-- Mobile bottom nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-surface-50-900-token border-t border-surface-300-600-token z-40 flex">
      <a href="/dashboard" class="flex-1 flex flex-col items-center py-2 text-xs gap-1">
        <span>🧭</span><span>Board</span>
      </a>
      <a href="/dashboard/turnovers" class="flex-1 flex flex-col items-center py-2 text-xs gap-1">
        <span>🧹</span><span>Turnovers</span>
      </a>
      <a href="/dashboard/properties" class="flex-1 flex flex-col items-center py-2 text-xs gap-1">
        <span>🏡</span><span>Properties</span>
      </a>
      <a href="/dashboard/workers" class="flex-1 flex flex-col items-center py-2 text-xs gap-1">
        <span>👷</span><span>Workers</span>
      </a>
    </nav>

    <main class="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
      <slot />
    </main>
  </div>
</div>
