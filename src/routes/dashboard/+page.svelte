<script lang="ts">
  import TurnoverCard from '$lib/components/TurnoverCard.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
  import CalendarClock from 'lucide-svelte/icons/calendar-clock';
  import ShieldAlert from 'lucide-svelte/icons/shield-alert';
  import BadgeCheck from 'lucide-svelte/icons/badge-check';
  import Siren from 'lucide-svelte/icons/siren';
  import type { PageData } from './$types';

  export let data: PageData;

  const summaryCards = [
    {
      key: 'overdue' as const,
      label: 'Overdue',
      description: 'Missed the readiness deadline and still not guest-ready.',
      icon: Siren,
      class: 'border-red-300 bg-red-50 text-red-950'
    },
    {
      key: 'atRisk' as const,
      label: 'At Risk',
      description: 'Tight timing or blockers that could derail arrival readiness.',
      icon: TriangleAlert,
      class: 'border-amber-300 bg-amber-50 text-amber-950'
    },
    {
      key: 'needsSignOff' as const,
      label: 'Needs Sign-Off',
      description: 'Proof is complete and waiting for manager verification.',
      icon: ShieldAlert,
      class: 'border-orange-300 bg-orange-50 text-orange-950'
    },
    {
      key: 'dueToday' as const,
      label: 'Arrivals Today',
      description: 'Properties with arrivals today that still need attention.',
      icon: CalendarClock,
      class: 'border-sky-300 bg-sky-50 text-sky-950'
    },
    {
      key: 'verified' as const,
      label: 'Guest-Ready',
      description: 'Verified turnovers with proof and a visible audit trail.',
      icon: BadgeCheck,
      class: 'border-emerald-300 bg-emerald-50 text-emerald-950'
    }
  ];

  const actionSections = [
    {
      key: 'overdue' as const,
      label: 'Overdue',
      emptyText: 'No overdue turnovers.',
      class: 'border-red-300/80 bg-red-50/70'
    },
    {
      key: 'atRisk' as const,
      label: 'At Risk',
      emptyText: 'No at-risk turnovers right now.',
      class: 'border-amber-300/80 bg-amber-50/70'
    },
    {
      key: 'needsSignOff' as const,
      label: 'Needs Sign-Off',
      emptyText: 'Nothing is waiting on manager verification.',
      class: 'border-orange-300/80 bg-orange-50/70'
    }
  ];

  const watchSections = [
    {
      key: 'dueToday' as const,
      label: 'Arrivals Today',
      emptyText: 'No unverified arrivals today.',
      class: 'border-sky-300/80 bg-sky-50/70'
    },
    {
      key: 'verified' as const,
      label: 'Guest-Ready',
      emptyText: 'No verified turnovers yet.',
      class: 'border-emerald-300/80 bg-emerald-50/70'
    }
  ];
</script>

<svelte:head>
  <title>Turnover Readiness Dashboard — SBA</title>
</svelte:head>

<div class="mb-6 rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(255,247,237,0.95))] p-6 shadow-sm">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Decision Mode</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">What requires action right now</h1>
      <p class="mt-2 max-w-2xl text-sm text-muted-foreground">
        The board only prioritizes what can still affect guest readiness: late turnovers, current blockers, and homes waiting for sign-off.
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        {data.summary.overdue + data.summary.atRisk + data.summary.needsSignOff} needing attention
      </Badge>
      <Button href={data.primaryAction.href}>{data.primaryAction.label}</Button>
    </div>
  </div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
  {#each summaryCards as card}
    <div class="rounded-xl border p-4 shadow-sm {card.class}">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{card.label}</p>
          <p class="mt-2 text-3xl font-bold">{data.summary[card.key]}</p>
        </div>
        <div class="rounded-full bg-white/70 p-2 shadow-sm">
          <svelte:component this={card.icon} size={18} strokeWidth={2.25} />
        </div>
      </div>
      <p class="mt-3 text-sm leading-relaxed opacity-80">{card.description}</p>
    </div>
  {/each}
</div>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Action Required</h2>
    <Badge variant="secondary">{data.summary.overdue + data.summary.atRisk + data.summary.needsSignOff}</Badge>
  </div>

  {#each actionSections as section}
    {@const items = data.groups[section.key]}
    <section class="rounded-2xl border p-4 {section.class}">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em]">{section.label}</h3>
          <p class="mt-1 text-sm text-muted-foreground">{section.emptyText}</p>
        </div>
        {#if items.length > 0}
          <Badge variant="secondary">{items.length}</Badge>
        {/if}
      </div>

      {#if items.length === 0}
        <div class="rounded-xl border border-dashed border-border bg-background/80 p-5 flex flex-col items-center gap-2 text-center">
          <ClipboardList size={20} class="text-muted-foreground" strokeWidth={1.5} />
          <p class="text-xs text-muted-foreground">{section.emptyText}</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {#each items as turnover}
            <TurnoverCard {turnover} />
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

<div class="mt-6 grid gap-4 xl:grid-cols-2">
  {#each watchSections as section}
    {@const items = data.groups[section.key]}
    <section class="rounded-2xl border p-4 {section.class}">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-[0.16em]">{section.label}</h2>
        {#if items.length > 0}
          <Badge variant="secondary">{items.length}</Badge>
        {/if}
      </div>
      {#if items.length === 0}
        <div class="rounded-xl border border-dashed border-border bg-background/80 p-5 flex flex-col items-center gap-2 text-center">
          <ClipboardList size={20} class="text-muted-foreground" strokeWidth={1.5} />
          <p class="text-xs text-muted-foreground">{section.emptyText}</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each items as turnover}
            <TurnoverCard {turnover} compact />
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

{#if data.groups.onDeck.length > 0}
  <div class="mt-6">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">On Deck</h2>
      <Badge variant="secondary">{data.groups.onDeck.length}</Badge>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {#each data.groups.onDeck as turnover}
        <TurnoverCard {turnover} compact />
      {/each}
    </div>
  </div>
{/if}
