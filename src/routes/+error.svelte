<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-muted/40">
  <div class="rounded-xl border border-border bg-card shadow-sm p-8 max-w-md w-full text-center space-y-4">
    <p class="text-6xl font-bold text-destructive">{$page.status}</p>
    <h1 class="text-2xl font-semibold">
      {$page.status === 404 ? 'Page Not Found' : 'Something Went Wrong'}
    </h1>
    <p class="text-muted-foreground">
      {$page.error?.message ?? 'An unexpected error occurred.'}
    </p>
    <a
      href="/"
      class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      Go Home
    </a>
  </div>
</div>
