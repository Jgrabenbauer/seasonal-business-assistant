<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';

  export let status: string;

  const config: Record<string, { label: string; class: string }> = {
    PENDING:     { label: 'Pending',     class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-100 text-blue-800 border-blue-200' },
    COMPLETED:   { label: 'Completed',   class: 'bg-green-100 text-green-800 border-green-200' },
    CANCELLED:   { label: 'Cancelled',   class: 'bg-secondary text-secondary-foreground' },
    NOT_READY:   { label: 'Not Ready',   class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    READY:       { label: 'Ready',       class: 'bg-green-100 text-green-800 border-green-200' },
    VERIFIED:    { label: 'Verified',    class: 'bg-blue-100 text-blue-800 border-blue-200' }
  };

  $: entry = config[status] ?? { label: status, class: 'bg-secondary text-secondary-foreground' };
</script>

<Badge class={cn('font-medium', entry.class)}>{entry.label}</Badge>
