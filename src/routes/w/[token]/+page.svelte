<script lang="ts">
  import OfflineBanner from '$lib/components/OfflineBanner.svelte';
  import PhotoUpload from '$lib/components/PhotoUpload.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import CircleCheck from 'lucide-svelte/icons/circle-check';
  import Camera from 'lucide-svelte/icons/camera';
  import { fly, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { PageData } from './$types';

  export let data: PageData;

  let items = data.workOrder.checklistRun?.items ?? [];
  let runId = data.workOrder.checklistRun?.id ?? '';

  // Holds IDs mid-animation so the item stays in the pending list until animation finishes
  let animatingIds = new Set<string>();

  $: pendingCount = items.filter((i) => i.status === 'PENDING').length;
  $: completeCount = items.length - pendingCount;
  $: allDone = items.length > 0 && pendingCount === 0;
  $: pendingItems = items.filter((i) => i.status === 'PENDING' || animatingIds.has(i.id));
  $: completedItems = items.filter((i) => i.status !== 'PENDING' && !animatingIds.has(i.id));

  /**
   * Triggers the check animation using the Web Animations API directly on the
   * clicked button's SVG children. Completely bypasses Svelte's reactive/transition
   * system so it fires reliably on every tap, not just the first.
   */
  function playCheckAnimation(btn: HTMLButtonElement) {
    const idle = btn.querySelector<SVGCircleElement>('.idle-circle');
    const fill = btn.querySelector<SVGCircleElement>('.fill-circle');
    const mark = btn.querySelector<SVGPathElement>('.check-mark');

    // #region agent log H-anim-1
    const fillTransform = fill ? window.getComputedStyle(fill).transform : 'NOT_FOUND';
    const btnRect = btn.getBoundingClientRect();
    const winH = window.innerHeight;
    const winW = window.innerWidth;
    fetch('http://127.0.0.1:7467/ingest/a34419ba-9091-4322-a376-bea62d5e530b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'549dcc'},body:JSON.stringify({sessionId:'549dcc',runId:'post-fix-3',location:'playCheckAnimation',message:'called',data:{hasBtn:!!btn,btnTag:btn?.tagName,hasIdle:!!idle,hasFill:!!fill,hasMark:!!mark,fillTransform,svgChildCount:btn?.querySelector('svg')?.childElementCount,btnRect:{top:Math.round(btnRect.top),left:Math.round(btnRect.left),width:Math.round(btnRect.width),height:Math.round(btnRect.height)},viewport:{w:winW,h:winH},btnVisible:btnRect.top>=0&&btnRect.bottom<=winH},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!fill) return;

    // Cancel any in-progress animations before starting fresh
    [idle, fill, mark].forEach((el) => el?.getAnimations().forEach((a) => a.cancel()));

    // Fade out the idle ring immediately
    idle?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 80,
      fill: 'forwards'
    });

    // Green circle pops in with spring overshoot
    const fillAnim = fill.animate(
      [
        { transform: 'scale(0)' },
        { transform: 'scale(1.18)', offset: 0.55 },
        { transform: 'scale(1)' }
      ],
      { duration: 460, easing: 'ease-out', fill: 'forwards' }
    );

    // #region agent log H-anim-2
    fetch('http://127.0.0.1:7467/ingest/a34419ba-9091-4322-a376-bea62d5e530b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'549dcc'},body:JSON.stringify({sessionId:'549dcc',runId:'post-fix-3',location:'playCheckAnimation',message:'anim-created',data:{fillAnimState:fillAnim.playState,fillAnimId:fillAnim.id},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Checkmark fades in with a short delay
    mark?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      delay: 180,
      fill: 'forwards'
    });

    // Log state 100ms later to check if animation is still running
    fillAnim.ready.then(() => {
      // Sample the computed transform 80ms into animation to verify WAAPI is actually painting
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const midTransform = window.getComputedStyle(fill).transform;
        const midRect = fill.getBoundingClientRect();
        fetch('http://127.0.0.1:7467/ingest/a34419ba-9091-4322-a376-bea62d5e530b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'549dcc'},body:JSON.stringify({sessionId:'549dcc',runId:'post-fix-3',location:'playCheckAnimation',message:'anim-mid',data:{fillAnimState:fillAnim.playState,fillCurrentTime:fillAnim.currentTime,midTransform,fillRect:{top:Math.round(midRect.top),left:Math.round(midRect.left),w:Math.round(midRect.width),h:Math.round(midRect.height)}},timestamp:Date.now()})}).catch(()=>{});
      }));
    });
    fillAnim.finished.then(() => {
      fetch('http://127.0.0.1:7467/ingest/a34419ba-9091-4322-a376-bea62d5e530b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'549dcc'},body:JSON.stringify({sessionId:'549dcc',runId:'post-fix-3',location:'playCheckAnimation',message:'anim-finished',data:{fillAnimState:fillAnim.playState},timestamp:Date.now()})}).catch(()=>{});
    }).catch(() => {
      fetch('http://127.0.0.1:7467/ingest/a34419ba-9091-4322-a376-bea62d5e530b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'549dcc'},body:JSON.stringify({sessionId:'549dcc',runId:'post-fix-3',location:'playCheckAnimation',message:'anim-CANCELLED',data:{fillAnimState:fillAnim.playState},timestamp:Date.now()})}).catch(()=>{});
    });
  }

  async function toggleItem(item: (typeof items)[0]) {
    const newStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const originalStatus = item.status;
    const idx = items.findIndex((i) => i.id === item.id);

    // #region agent log post-fix-3
    fetch('http://127.0.0.1:7467/ingest/a34419ba-9091-4322-a376-bea62d5e530b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'549dcc'},body:JSON.stringify({sessionId:'549dcc',runId:'post-fix-3',location:'entry',message:'toggleItem',data:{itemId:item.id,newStatus,idx,pendingItemsLen:pendingItems.length,animatingIds:[...animatingIds]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    let animationTimer: ReturnType<typeof setTimeout> | null = null;

    if (newStatus === 'COMPLETED') {
      // Update status first so the item is considered COMPLETED
      if (idx !== -1) {
        items[idx] = { ...items[idx], status: 'COMPLETED' };
        items = [...items];
      }
      // animatingIds keeps the item in the pending list while animation plays
      animatingIds = new Set([...animatingIds, item.id]);

      animationTimer = setTimeout(() => {
        animatingIds = new Set([...animatingIds].filter((id) => id !== item.id));
      }, 500);
    } else {
      // Unchecking: move back to pending immediately
      if (idx !== -1) {
        items[idx] = { ...items[idx], status: 'PENDING' };
        items = [...items];
      }
    }

    const res = await fetch(`/api/checklist/${runId}/item/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      const json = await res.json();
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...json.item };
        items = [...items];
      }
    } else {
      if (animationTimer) clearTimeout(animationTimer);
      animatingIds = new Set([...animatingIds].filter((id) => id !== item.id));
      if (idx !== -1) {
        items[idx] = { ...items[idx], status: originalStatus };
        items = [...items];
      }
    }
  }
</script>

<svelte:head>
  <title>{data.workOrder.title} — Readiness Steps</title>
</svelte:head>

<OfflineBanner />

<div class="max-w-lg mx-auto px-4 py-6 pb-28">
  <div class="mb-6">
    <h1 class="text-xl font-semibold">{data.workOrder.property.name}</h1>
    <p class="text-sm text-muted-foreground mt-0.5">{data.workOrder.title}</p>
  </div>

  {#if !data.workOrder.checklistRun}
    <div class="rounded-lg border border-border bg-card p-8 text-center">
      <p class="text-muted-foreground text-sm">No readiness steps attached to this turnover.</p>
    </div>

  {:else if allDone}
    <div
      in:scale={{ start: 0.88, duration: 500, easing: cubicOut }}
      class="rounded-2xl bg-green-500 text-white p-10 text-center shadow-lg"
    >
      <div class="flex justify-center mb-5">
        <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.18)" />
          <path
            d="M 20 40 L 33 53 L 60 26"
            stroke="white"
            stroke-width="5.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            class="all-done-check"
          />
        </svg>
      </div>
      <p class="text-2xl font-bold tracking-tight">Property Ready</p>
      <p class="mt-2 text-sm opacity-80">All readiness steps complete. Great work!</p>
    </div>

  {:else}
    {#if data.isOverdue && pendingCount > 0}
      <div class="rounded-lg border border-destructive bg-destructive/10 text-destructive px-4 py-2.5 mb-4 text-sm font-medium">
        Overdue — Please complete this turnover as soon as possible.
      </div>
    {/if}

    <div class="mb-3 flex items-center justify-between">
      <h2 class="font-semibold text-base">Readiness Steps</h2>
      <Badge variant="secondary" class="text-xs tabular-nums">{pendingCount} remaining</Badge>
    </div>

    <ul class="space-y-2">
      {#each pendingItems as item (item.id)}
        {@const completing = animatingIds.has(item.id)}
        <li
          out:fly={{ x: 56, duration: 300, easing: cubicOut }}
          class="rounded-lg border bg-card p-4 flex items-center gap-4 min-h-[88px] transition-colors duration-200
            {completing ? 'border-green-300 bg-green-50' : 'border-border'}"
        >
          <!--
            The button contains BOTH the idle ring and the completing check in the same SVG.
            Animation is driven entirely by WAAPI (playCheckAnimation) on click —
            no Svelte transitions, no {#if} toggles, no CSS transitions.
          -->
          <button
            class="check-btn flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            on:click={(e) => {
              if (completing) return;
              playCheckAnimation(e.currentTarget);
              toggleItem(item);
            }}
            aria-label="{completing ? 'Completing' : 'Complete'} {item.title}"
            type="button"
          >
            <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
              <!-- Idle ring — faded out by WAAPI when completing -->
              <circle cx="22" cy="22" r="20" class="idle-circle" />
              <!-- Green fill — scaled in by WAAPI from 0 -->
              <circle cx="22" cy="22" r="20" class="fill-circle" />
              <!-- Check mark — faded in by WAAPI -->
              <path d="M 11 22 L 18 29 L 33 14" class="check-mark" />
            </svg>
          </button>

          <div class="flex-1 min-w-0">
            <p class="text-base leading-snug font-medium {completing ? 'line-through opacity-50' : ''}">{item.title}</p>
            {#if item.description && !completing}
              <p class="text-sm text-muted-foreground mt-0.5">{item.description}</p>
            {/if}
            {#if item.photoRequired && item.attachments.length === 0 && !completing}
              <p class="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                <Camera size={11} strokeWidth={2} />
                Photo required
              </p>
            {/if}
          </div>

          <PhotoUpload bind:item {runId} />
        </li>
      {/each}
    </ul>

    {#if completedItems.length > 0}
      <details class="mt-5">
        <summary class="cursor-pointer text-sm font-medium text-muted-foreground select-none mb-3 flex items-center gap-1.5">
          <CircleCheck size={14} strokeWidth={2} />
          Completed ({completedItems.length})
        </summary>
        <ul class="space-y-2">
          {#each completedItems as item (item.id)}
            <li class="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-4 min-h-[72px]">
              <button
                class="done-btn flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                on:click={() => toggleItem(item)}
                aria-label="Undo {item.title}"
                type="button"
              >
                <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
                  <circle cx="22" cy="22" r="20" fill="#22c55e" />
                  <path
                    d="M 11 22 L 18 29 L 33 14"
                    stroke="white"
                    stroke-width="3.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                </svg>
              </button>
              <div class="flex-1 min-w-0">
                <p class="text-base leading-snug line-through opacity-50">{item.title}</p>
              </div>
              <PhotoUpload bind:item {runId} />
            </li>
          {/each}
        </ul>
      </details>
    {/if}
  {/if}
</div>

{#if data.workOrder.checklistRun && !allDone}
  <div class="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-30">
    <div class="max-w-lg mx-auto space-y-1.5">
      <div class="flex justify-between text-xs text-muted-foreground font-medium">
        <span class="tabular-nums">{completeCount} of {items.length} complete</span>
        <span class="tabular-nums">{items.length > 0 ? Math.round((completeCount / items.length) * 100) : 0}%</span>
      </div>
      <div class="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all duration-500"
          style="width: {items.length > 0 ? (completeCount / items.length) * 100 : 0}%"
        ></div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Idle ring */
  .idle-circle {
    fill: none;
    stroke: #94a3b8;
    stroke-width: 2.5;
    opacity: 0.45;
  }

  /* Green fill circle — starts at scale(0) so it's invisible; WAAPI animates it in on click */
  .fill-circle {
    fill: #22c55e;
    transform-box: fill-box;
    transform-origin: center;
    transform: scale(0);
  }

  /* Check mark path — starts invisible; WAAPI fades it in */
  .check-mark {
    stroke: white;
    stroke-width: 3.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    opacity: 0;
  }

  .check-btn {
    transition: transform 0.1s ease;
  }
  .check-btn:hover .idle-circle {
    opacity: 0.78;
  }
  .check-btn:active {
    transform: scale(0.86);
  }

  .done-btn {
    transition: transform 0.1s ease;
  }
  .done-btn:hover {
    opacity: 0.7;
  }
  .done-btn:active {
    transform: scale(0.87);
  }

  /* All-done banner checkmark draw-in */
  @keyframes all-done-draw {
    from { stroke-dashoffset: 62; }
    to   { stroke-dashoffset: 0; }
  }
  .all-done-check {
    stroke-dasharray: 62;
    stroke-dashoffset: 62;
    animation: all-done-draw 0.52s cubic-bezier(0.4, 0, 0.2, 1) 0.22s forwards;
  }
</style>
