<script setup lang="ts">
import { apiDocs } from '~/config/docs/api'

definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <div>
    <UiPageHeader title="Public API Endpoints" breadcrumb="Docs / API Endpoints" />
    <p class="text-[12px] text-ink-soft mt-1">
      Endpoints reachable without a staff login — no-auth (used by the login flow) and
      <code class="font-mono">x-api-key</code>-authenticated endpoints for external consumer apps
      (Backbone, Ticketing). Internal admin/RBAC endpoints are not listed here.
    </p>

    <div class="mt-4 flex flex-col gap-4">
      <UiCard v-for="ep in apiDocs" :key="ep.method + ep.path">
        <div class="p-4">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span
              class="text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-block"
              :class="ep.method === 'GET' ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'"
            >
              {{ ep.method }}
            </span>
            <code class="text-[13px] font-mono text-ink font-semibold">{{ ep.path }}</code>
            <UiStatusChip
              :variant="ep.authType === 'none' ? 'ok' : 'warn'"
              :label="ep.authType === 'none' ? 'No auth' : 'x-api-key required'"
            />
          </div>
          <p class="text-[12px] text-ink-soft mt-2">{{ ep.description }}</p>

          <div v-if="ep.requestBody" class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Request body</div>
            <pre class="text-[11px] font-mono bg-[#FBFBFC] border border-line rounded-lg p-3 overflow-x-auto">{{ ep.requestBody }}</pre>
          </div>

          <div class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Response</div>
            <pre class="text-[11px] font-mono bg-[#FBFBFC] border border-line rounded-lg p-3 overflow-x-auto">{{ ep.responseShape }}</pre>
          </div>

          <div class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Example</div>
            <pre class="text-[11px] font-mono bg-[#FBFBFC] border border-line rounded-lg p-3 overflow-x-auto whitespace-pre">{{ ep.exampleCurl }}</pre>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
