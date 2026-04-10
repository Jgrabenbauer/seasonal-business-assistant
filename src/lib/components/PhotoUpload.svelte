<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Camera from 'lucide-svelte/icons/camera';
  import Loader from 'lucide-svelte/icons/loader';

  export let item: { id: string; attachments: { id: string; url: string }[] };
  export let runId: string;

  const dispatch = createEventDispatcher<{ uploaded: { url: string } }>();

  let uploading = false;
  let error = '';

  async function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading = true;
    error = '';

    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size })
      });
      const presign = await presignRes.json();

      if (presign.directUpload) {
        const form = new FormData();
        form.append('file', file);
        form.append('itemRunId', item.id);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? 'Upload failed');
        }
        const { attachment } = await res.json();
        item.attachments = [...item.attachments, attachment];
        dispatch('uploaded', { url: attachment.url });
        return;
      }

      if (!presign.uploadUrl || !presign.publicUrl) throw new Error(presign.error ?? 'Upload failed');

      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      const completeRes = await fetch('/api/uploads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemRunId: item.id,
          url: presign.publicUrl,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size
        })
      });
      const complete = await completeRes.json();
      if (!completeRes.ok) throw new Error(complete.error ?? 'Upload failed');
      item.attachments = [...item.attachments, complete.attachment];
      dispatch('uploaded', { url: complete.attachment.url });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      uploading = false;
      input.value = '';
    }
  }
</script>

<label
  class="relative inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring"
  aria-label="Add photo"
  title="Add photo"
>
  {#if uploading}
    <span class="animate-spin inline-flex"><Loader size={16} strokeWidth={2} /></span>
  {:else}
    <Camera size={16} strokeWidth={2} />
    {#if item.attachments.length > 0}
      <span class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
        {item.attachments.length}
      </span>
    {/if}
  {/if}
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp,image/heic"
    capture="environment"
    class="sr-only"
    on:change={handleFileChange}
    disabled={uploading}
  />
</label>

{#if error}
  <p class="text-xs text-destructive absolute">{error}</p>
{/if}
