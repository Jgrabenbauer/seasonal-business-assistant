<script lang="ts">
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
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size
        })
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
</script>

<svelte:head>
  <title>Settings — SBA</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
  <h1 class="text-2xl font-bold">Settings</h1>

  {#if form?.error}
    <div class="alert variant-filled-error"><p>{form.error}</p></div>
  {/if}
  {#if form?.success}
    <div class="alert variant-filled-success"><p>Settings saved.</p></div>
  {/if}

  {#if data.org?.planType !== 'PRO'}
    <div class="alert variant-filled-warning">
      <p>Readiness SLA, branding, and SMS settings are available on the Pro plan.</p>
    </div>
  {/if}

  <form method="POST" action="?/update" use:enhance class="card p-6 space-y-4">
    <h2 class="text-lg font-semibold">Readiness SLA Policy</h2>
    <label class="label">
      <span>Default SLA Offset (hours before arrival)</span>
      <input
        class="input"
        type="number"
        name="slaDefaultOffsetHours"
        min="0"
        value={data.org?.slaDefaultOffsetHours ?? 0}
        disabled={data.org?.planType !== 'PRO'}
      />
      <small class="text-surface-400">Example: 2 = deadline is 2 hours before guest arrival.</small>
    </label>
    <label class="label">
      <span>Verification Required</span>
      <input
        type="checkbox"
        name="verificationRequired"
        checked={data.org?.verificationRequired ?? true}
        disabled={data.org?.planType !== 'PRO'}
      />
    </label>
    <div class="border-t border-surface-200-700-token pt-4"></div>
    <label class="label">
      <span>Company Name</span>
      <input class="input" type="text" name="brandName" value={data.org?.brandName ?? ''} disabled={data.org?.planType !== 'PRO'} />
    </label>
    <label class="label">
      <span>Accent Color</span>
      <input class="input" type="text" name="brandAccentColor" value={data.org?.brandAccentColor ?? ''} placeholder="#0f766e" disabled={data.org?.planType !== 'PRO'} />
    </label>
    <label class="label">
      <span>Logo URL</span>
      <input id="brandLogoUrl" class="input" type="url" name="brandLogoUrl" value={data.org?.brandLogoUrl ?? ''} disabled={data.org?.planType !== 'PRO'} />
      <small class="text-surface-400">Upload a logo file below or paste a URL.</small>
    </label>
    <label class="label">
      <span>Logo Upload</span>
      <input
        class="input"
        type="file"
        accept="image/*"
        on:change={handleLogoChange}
        disabled={uploading || data.org?.planType !== 'PRO'}
      />
      {#if uploadError}
        <small class="text-error-500">{uploadError}</small>
      {/if}
    </label>
    <label class="label">
      <span>Contact Info</span>
      <textarea class="textarea" name="brandContactInfo" rows="3" disabled={data.org?.planType !== 'PRO'}>{data.org?.brandContactInfo ?? ''}</textarea>
    </label>
    <label class="label">
      <span>Organization SMS Enabled</span>
      <input type="checkbox" name="smsEnabled" checked={data.org?.smsEnabled} disabled={data.org?.planType !== 'PRO'} />
    </label>
    <button type="submit" class="btn variant-filled-primary" disabled={data.org?.planType !== 'PRO'}>Save Settings</button>
  </form>
</div>
