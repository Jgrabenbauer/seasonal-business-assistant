<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  onMount(() => {
    if (data.user?.role === 'MANAGER') {
      goto('/dashboard');
    } else {
      goto('/auth/login');
    }
  });
</script>
