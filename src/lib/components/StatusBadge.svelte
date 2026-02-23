<script lang="ts">
  export let status: string;

  const variants: Record<string, string> = {
    PENDING: 'variant-soft-warning',
    IN_PROGRESS: 'variant-soft-primary',
    COMPLETED: 'variant-soft-success',
    CANCELLED: 'variant-soft-surface',
    NOT_READY: 'variant-soft-warning',
    READY: 'variant-soft-success',
    VERIFIED: 'variant-soft-primary'
  };

  const labels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NOT_READY: 'Not Ready',
    READY: 'Ready',
    VERIFIED: 'Verified'
  };

  $: variant = variants[status] ?? 'variant-soft-surface';
  $: label = labels[status] ?? status;
</script>

<span class="badge {variant}">{label}</span>
