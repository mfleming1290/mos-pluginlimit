<template>
  <div class="plugin-limit-page">
    <div class="card">
      <h2>Plugin Source Limit</h2>
      <p class="description">
        Change the maximum GitHub source archive size accepted by the MOS plugin installer.
        The stock MOS limit is 10 MB.
      </p>

      <label for="limit">Maximum source archive size</label>
      <div class="limit-row">
        <input
          id="limit"
          v-model.number="limitMb"
          type="number"
          min="1"
          max="2048"
          step="1"
          :disabled="busy"
        />
        <span>MB</span>
      </div>

      <div class="actions">
        <button class="primary" :disabled="busy || !validLimit" @click="saveAndApply">
          {{ busy ? 'Applying…' : 'Apply & Restart API' }}
        </button>
        <button :disabled="busy" @click="restoreDefault">Restore 10 MB</button>
        <button :disabled="busy" @click="loadSettings">Reload</button>
      </div>

      <p v-if="message" :class="['message', messageType]">{{ message }}</p>

      <div class="note">
        <strong>Persistence:</strong> the configured value is reapplied after MOS starts and after MOS OS updates.
        If a future MOS release changes the API source layout, the patch will refuse to modify an unknown structure.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

const PLUGIN_NAME = 'pluginlimit';
const limitMb = ref(64);
const busy = ref(false);
const message = ref('');
const messageType = ref('info');

const validLimit = computed(() => Number.isInteger(Number(limitMb.value)) && Number(limitMb.value) >= 1 && Number(limitMb.value) <= 2048);

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const loadSettings = async () => {
  message.value = '';
  try {
    const res = await fetch(`/api/v1/mos/plugins/settings/${PLUGIN_NAME}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Settings request failed (${res.status})`);
    const data = await res.json();
    const saved = Number(data.plugin_source_limit_mb);
    if (Number.isInteger(saved) && saved >= 1 && saved <= 2048) limitMb.value = saved;
  } catch (error) {
    messageType.value = 'error';
    message.value = `Could not load settings: ${error.message}`;
  }
};

const saveSettings = async (value) => {
  const res = await fetch(`/api/v1/mos/plugins/settings/${PLUGIN_NAME}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plugin_source_limit_mb: Number(value) }),
  });
  if (!res.ok) throw new Error(`Saving settings failed (${res.status})`);
};

const runFunction = async (functionName) => {
  const res = await fetch('/api/v1/mos/plugins/executefunction', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plugin: PLUGIN_NAME, function: functionName }),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch (_) {}
    throw new Error(`Plugin function failed (${res.status})${detail ? `: ${detail}` : ''}`);
  }
};

const saveAndApply = async () => {
  if (!validLimit.value) return;
  busy.value = true;
  message.value = '';
  try {
    await saveSettings(limitMb.value);
    await runFunction('apply_plugin_limit');
    messageType.value = 'success';
    message.value = `Configured ${limitMb.value} MB. MOS API will restart in about 5 seconds; this page may briefly lose connection.`;
  } catch (error) {
    messageType.value = 'error';
    message.value = error.message;
  } finally {
    busy.value = false;
  }
};

const restoreDefault = async () => {
  limitMb.value = 10;
  await saveAndApply();
};

onMounted(loadSettings);
</script>

<style scoped>
.plugin-limit-page {
  padding: 24px;
  max-width: 760px;
}
.card {
  border: 1px solid rgba(128,128,128,.35);
  border-radius: 12px;
  padding: 24px;
  background: rgba(128,128,128,.06);
}
h2 { margin-top: 0; }
.description { opacity: .8; margin-bottom: 22px; }
label { display: block; font-weight: 600; margin-bottom: 8px; }
.limit-row { display: flex; align-items: center; gap: 10px; }
input {
  width: 160px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(128,128,128,.5);
  background: transparent;
  color: inherit;
  font-size: 16px;
}
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
button {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(128,128,128,.5);
  cursor: pointer;
}
button:disabled { opacity: .5; cursor: not-allowed; }
.primary { font-weight: 700; }
.message { margin-top: 18px; padding: 10px 12px; border-radius: 8px; }
.message.success { background: rgba(46, 160, 67, .15); }
.message.error { background: rgba(218, 54, 51, .15); }
.message.info { background: rgba(56, 139, 253, .12); }
.note { margin-top: 22px; opacity: .8; font-size: .92rem; line-height: 1.45; }
</style>
