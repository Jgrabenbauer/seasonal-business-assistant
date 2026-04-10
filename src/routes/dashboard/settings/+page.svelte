<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;

  let uploading = false;
  let uploadError = '';

  function handleLogoChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (file) uploadLogo(file);
  }

  async function uploadLogo(file: File) {
    uploading = true;
    uploadError = '';
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size })
      });
      const presign = await presignRes.json();
      if (presign.directUpload) {
        uploadError = 'Logo uploads require S3 storage in production.';
        return;
      }
      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const input = document.querySelector<HTMLInputElement>('#brandLogoUrl');
      if (input) input.value = presign.publicUrl;
    } catch (err) {
      uploadError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      uploading = false;
    }
  }

  $: isPro = data.org?.planType === 'PRO';
</script>

<svelte:head>
  <title>Settings — SBA</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
  <h1 class="text-2xl font-semibold">Settings</h1>

  {#if form?.error}
    <div class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">{form.error}</div>
  {/if}
  {#if form?.success}
    <div class="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">Settings saved.</div>
  {/if}

  {#if !isPro}
    <div class="rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 text-sm">
      Readiness SLA, branding, and SMS settings are available on the Pro plan.
    </div>
  {/if}

  <form method="POST" action="?/update" use:enhance class="rounded-lg border border-border bg-card shadow-sm p-6 space-y-5">
    <h2 class="text-lg font-semibold">Readiness SLA Policy</h2>

    <div class="space-y-1.5">
      <Label for="slaDefaultOffsetHours">Default SLA Offset (hours before arrival)</Label>
      <Input
        id="slaDefaultOffsetHours"
        type="number"
        name="slaDefaultOffsetHours"
        min={0}
        value={data.org?.slaDefaultOffsetHours ?? 0}
        disabled={!isPro}
      />
      <p class="text-xs text-muted-foreground">Example: 2 = deadline is 2 hours before guest arrival.</p>
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="verificationRequired"
        name="verificationRequired"
        class="h-4 w-4 rounded border border-input"
        checked={data.org?.verificationRequired ?? true}
        disabled={!isPro}
      />
      <Label for="verificationRequired" class="cursor-pointer font-normal">Verification Required</Label>
    </div>

    <div class="border-t border-border pt-4">
      <h2 class="text-lg font-semibold">Branding</h2>
    </div>

    <div class="space-y-1.5">
      <Label for="brandName">Company Name</Label>
      <Input id="brandName" type="text" name="brandName" value={data.org?.brandName ?? ''} disabled={!isPro} />
    </div>

    <div class="space-y-1.5">
      <Label for="brandAccentColor">Accent Color</Label>
      <Input id="brandAccentColor" type="text" name="brandAccentColor" value={data.org?.brandAccentColor ?? ''} placeholder="#0f766e" disabled={!isPro} />
    </div>

    <div class="space-y-1.5">
      <Label for="brandLogoUrl">Logo URL</Label>
      <Input id="brandLogoUrl" type="url" name="brandLogoUrl" value={data.org?.brandLogoUrl ?? ''} disabled={!isPro} />
      <p class="text-xs text-muted-foreground">Upload a logo file below or paste a URL.</p>
    </div>

    <div class="space-y-1.5">
      <Label for="logoFile">Logo Upload</Label>
      <Input
        id="logoFile"
        type="file"
        accept="image/*"
        on:change={handleLogoChange}
        disabled={uploading || !isPro}
        class="cursor-pointer file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
      />
      {#if uploadError}
        <p class="text-xs text-destructive">{uploadError}</p>
      {/if}
    </div>

    <div class="space-y-1.5">
      <Label for="brandContactInfo">Contact Info</Label>
      <Textarea id="brandContactInfo" name="brandContactInfo" rows={3} disabled={!isPro}>{data.org?.brandContactInfo ?? ''}</Textarea>
    </div>

    <div class="border-t border-border pt-4">
      <h2 class="text-lg font-semibold">SMS</h2>
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="smsEnabled"
        name="smsEnabled"
        class="h-4 w-4 rounded border border-input"
        checked={data.org?.smsEnabled}
        disabled={!isPro}
      />
      <Label for="smsEnabled" class="cursor-pointer font-normal">Organization SMS Enabled</Label>
    </div>

    <Button type="submit" disabled={!isPro}>Save Settings</Button>
  </form>
</div>
