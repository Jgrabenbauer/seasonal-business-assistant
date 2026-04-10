<script lang="ts">
  import ManagerNav from '$lib/components/ManagerNav.svelte';
  import BillingBanner from '$lib/components/BillingBanner.svelte';
  import { page } from '$app/stores';
  import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import House from 'lucide-svelte/icons/house';
  import Users from 'lucide-svelte/icons/users';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  const mobileNavItems = [
    { href: '/dashboard', label: 'Board', icon: LayoutDashboard },
    { href: '/dashboard/turnovers', label: 'Turnovers', icon: RefreshCw },
    { href: '/dashboard/properties', label: 'Properties', icon: House },
    { href: '/dashboard/workers', label: 'Workers', icon: Users }
  ];

  function isMobileActive(href: string): boolean {
    if (href === '/dashboard') return $page.url.pathname === '/dashboard';
    return $page.url.pathname.startsWith(href);
  }
</script>

<BillingBanner billingInfo={data.billingInfo} />

<div class="flex min-h-screen bg-background">
  <!-- Sidebar (desktop) -->
  <aside class="hidden md:flex md:w-60 md:flex-col border-r border-sidebar-border bg-sidebar">
    <!-- Wordmark -->
    <div class="p-4 border-b border-sidebar-border">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-7 h-7 rounded-md bg-sidebar-active flex items-center justify-center flex-shrink-0">
          <span class="text-sidebar-active-foreground font-bold text-sm leading-none">S</span>
        </div>
        <span class="font-bold text-base tracking-tight text-sidebar-foreground">SBA</span>
      </div>
      <div>
        <p class="text-sm font-semibold truncate leading-snug text-sidebar-foreground">{data.user.organization.name}</p>
        <p class="text-xs text-sidebar-muted-foreground truncate mt-0.5">{data.user.name}</p>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto">
      <ManagerNav userRole={data.user.role} />
    </div>
  </aside>

  <!-- Main content -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Mobile header -->
    <header class="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <span class="text-primary-foreground font-bold text-xs leading-none">S</span>
        </div>
        <span class="font-semibold text-sm truncate">{data.user.organization.name}</span>
      </div>
    </header>

    <!-- Mobile bottom nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex">
      {#each mobileNavItems as item}
        {@const active = isMobileActive(item.href)}
        <a
          href={item.href}
          aria-current={active ? 'page' : undefined}
          class="flex-1 flex flex-col items-center py-2.5 gap-1 text-[11px] font-medium transition-colors no-underline
                 {active ? 'text-primary' : 'text-muted-foreground'}"
        >
          <svelte:component this={item.icon} size={20} strokeWidth={active ? 2.5 : 1.75} />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>

    <main class="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
      <slot />
    </main>
  </div>
</div>
