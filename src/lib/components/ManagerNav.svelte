<script lang="ts">
  import { page } from '$app/stores';

  export let userRole: string = 'MANAGER';

  const links = [
    { href: '/dashboard', label: 'Readiness Board', icon: '🧭', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/turnovers', label: 'Turnovers', icon: '🧹', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/properties', label: 'Properties', icon: '🏡', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/templates', label: 'Readiness Templates', icon: '📝', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/workers', label: 'Field Team', icon: '👷', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/sms-outbox', label: 'SMS Outbox', icon: '📱', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/invites', label: 'Invites', icon: '✉️', roles: ['MANAGER'] },
    { href: '/dashboard/certificates', label: 'Certificates', icon: '📜', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/analytics', label: 'Readiness Analytics', icon: '📈', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/activity', label: 'Readiness Activity', icon: '📊', roles: ['MANAGER', 'SUPERVISOR'] },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️', roles: ['MANAGER'] },
    { href: '/dashboard/billing', label: 'Billing', icon: '💳', roles: ['MANAGER'] }
  ];

  $: visibleLinks = links.filter((l) => l.roles.includes(userRole));
</script>

<nav class="flex flex-col gap-1 p-4">
  {#each visibleLinks as link}
    <a
      href={link.href}
      class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline
             {$page.url.pathname === link.href || ($page.url.pathname.startsWith(link.href) && link.href !== '/dashboard')
               ? 'variant-filled-primary'
               : 'hover:variant-soft-surface'}"
    >
      <span>{link.icon}</span>
      <span>{link.label}</span>
    </a>
  {/each}

  <div class="mt-auto pt-4 border-t border-surface-300-600-token">
    <form method="POST" action="/auth/logout">
      <button
        type="submit"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:variant-soft-error transition-colors"
      >
        <span>🚪</span>
        <span>Sign Out</span>
      </button>
    </form>
  </div>
</nav>
