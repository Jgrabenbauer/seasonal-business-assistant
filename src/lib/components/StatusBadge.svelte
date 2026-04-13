<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';

  export let status: string;

  const config: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    IN_PROGRESS: { label: 'Not Guest-Ready', class: 'bg-red-100 text-red-800 border-red-200' },
    COMPLETED: { label: 'Completed', class: 'bg-green-100 text-green-800 border-green-200' },
    CANCELLED: { label: 'Cancelled', class: 'bg-secondary text-secondary-foreground' },
    NOT_READY: { label: 'Not Guest-Ready', class: 'bg-red-100 text-red-800 border-red-200' },
    READY: {
      label: 'Needs Sign-Off',
      class: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    VERIFIED: { label: 'Guest-Ready', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  };

  $: entry = config[status] ?? { label: status, class: 'bg-secondary text-secondary-foreground' };
</script>

<Badge class={cn('font-medium', entry.class)}>{entry.label}</Badge>
