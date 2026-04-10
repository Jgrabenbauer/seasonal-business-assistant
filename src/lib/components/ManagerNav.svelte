<script lang="ts">
  import { page } from '$app/stores';
  import { cn } from '$lib/utils';
  import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import House from 'lucide-svelte/icons/house';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import Users from 'lucide-svelte/icons/users';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import Mail from 'lucide-svelte/icons/mail';
  import Award from 'lucide-svelte/icons/award';
  import ChartBar from 'lucide-svelte/icons/chart-bar';
  import Activity from 'lucide-svelte/icons/activity';
  import Settings from 'lucide-svelte/icons/settings';
  import CreditCard from 'lucide-svelte/icons/credit-card';
  import LogOut from 'lucide-svelte/icons/log-out';

  export let userRole: string = 'MANAGER';

  type NavLink = {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    roles: string[];
  };

  type NavSection = {
    title: string;
    links: NavLink[];
  };

  const sections: NavSection[] = [
    {
      title: 'Operations',
      links: [
        { href: '/dashboard', label: 'Readiness Board', icon: LayoutDashboard, roles: ['MANAGER', 'SUPERVISOR'] },
        { href: '/dashboard/turnovers', label: 'Turnovers', icon: RefreshCw, roles: ['MANAGER', 'SUPERVISOR'] },
        { href: '/dashboard/properties', label: 'Properties', icon: House, roles: ['MANAGER', 'SUPERVISOR'] },
        { href: '/dashboard/templates', label: 'Readiness Templates', icon: ClipboardList, roles: ['MANAGER', 'SUPERVISOR'] }
      ]
    },
    {
      title: 'Team',
      links: [
        { href: '/dashboard/workers', label: 'Field Team', icon: Users, roles: ['MANAGER', 'SUPERVISOR'] },
        { href: '/dashboard/sms-outbox', label: 'SMS Outbox', icon: MessageSquare, roles: ['MANAGER', 'SUPERVISOR'] },
        { href: '/dashboard/invites', label: 'Invites', icon: Mail, roles: ['MANAGER'] },
        { href: '/dashboard/certificates', label: 'Certificates', icon: Award, roles: ['MANAGER', 'SUPERVISOR'] }
      ]
    },
    {
      title: 'Analytics',
      links: [
        { href: '/dashboard/analytics', label: 'Readiness Analytics', icon: ChartBar, roles: ['MANAGER', 'SUPERVISOR'] },
        { href: '/dashboard/activity', label: 'Activity Log', icon: Activity, roles: ['MANAGER', 'SUPERVISOR'] }
      ]
    },
    {
      title: 'Account',
      links: [
        { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['MANAGER'] },
        { href: '/dashboard/billing', label: 'Billing', icon: CreditCard, roles: ['MANAGER'] }
      ]
    }
  ];

  function isActive(href: string): boolean {
    if (href === '/dashboard') return $page.url.pathname === '/dashboard';
    return $page.url.pathname.startsWith(href);
  }
</script>

<nav class="flex flex-col gap-5 p-3 pt-2">
  {#each sections as section}
    {@const visibleLinks = section.links.filter((l) => l.roles.includes(userRole))}
    {#if visibleLinks.length > 0}
      <div>
        <p class="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted-foreground">
          {section.title}
        </p>
        <div class="flex flex-col gap-0.5">
          {#each visibleLinks as link}
            <a
              href={link.href}
              class={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors',
                isActive(link.href)
                  ? 'bg-sidebar-active text-sidebar-active-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <svelte:component this={link.icon} size={16} strokeWidth={isActive(link.href) ? 2.5 : 2} />
              <span>{link.label}</span>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  {/each}

  <div class="mt-auto border-t border-sidebar-border pt-2">
    <form method="POST" action="/auth/logout">
      <button
        type="submit"
        class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted-foreground transition-colors hover:bg-white/5 hover:text-red-400"
      >
        <LogOut size={16} strokeWidth={2} />
        <span>Sign Out</span>
      </button>
    </form>
  </div>
</nav>
