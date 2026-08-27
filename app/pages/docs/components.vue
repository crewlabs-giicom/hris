<script setup lang="ts">
import { componentDocs } from '~/config/docs/components'

definePageMeta({ middleware: ['auth'] })

const TABS = ['UI Components', 'Layout Components', 'Composables', 'Stores'] as const
const activeTab = ref<(typeof TABS)[number]>('UI Components')

const categoryByTab: Record<(typeof TABS)[number], 'ui' | 'layout' | 'composable' | 'store'> = {
  'UI Components': 'ui',
  'Layout Components': 'layout',
  Composables: 'composable',
  Stores: 'store',
}

const visible = computed(() => componentDocs.filter((c) => c.category === categoryByTab[activeTab.value]))
</script>

<template>
  <div>
    <UiPageHeader title="Component Docs" breadcrumb="Docs / Components" />

    <UiCard class="mt-3">
      <UiTabs v-model="activeTab" :tabs="[...TABS]" />

      <div class="p-4 flex flex-col gap-4">
        <div v-for="entry in visible" :key="entry.name" class="border border-line rounded-lg p-4">
          <div class="flex items-baseline justify-between">
            <h3 class="text-[13.5px] font-bold text-ink">{{ entry.name }}</h3>
            <code class="text-[10.5px] text-ink-soft">{{ entry.path }}</code>
          </div>
          <p class="text-[12px] text-ink-soft mt-1">{{ entry.description }}</p>

          <div v-if="entry.props?.length" class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Props</div>
            <table class="w-full text-[11.5px] border-collapse">
              <thead>
                <tr class="text-left text-ink-soft bg-[#FAFAFA]">
                  <th class="px-2 py-1 font-semibold">Name</th>
                  <th class="px-2 py-1 font-semibold">Type</th>
                  <th class="px-2 py-1 font-semibold">Default</th>
                  <th class="px-2 py-1 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in entry.props" :key="p.name" class="border-t border-line">
                  <td class="px-2 py-1 font-mono">{{ p.name }}{{ p.required ? '*' : '' }}</td>
                  <td class="px-2 py-1 font-mono text-ink-soft">{{ p.type }}</td>
                  <td class="px-2 py-1 font-mono text-ink-soft">{{ p.default ?? '—' }}</td>
                  <td class="px-2 py-1 text-ink-soft">{{ p.description ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="entry.slots?.length" class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Slots</div>
            <ul class="text-[11.5px] text-ink-soft flex flex-col gap-1">
              <li v-for="s in entry.slots" :key="s.name">
                <code class="font-mono text-ink">#{{ s.name }}</code>
                <template v-if="s.scope"> — scope: <code class="font-mono">{{ s.scope }}</code></template>
                — {{ s.description }}
              </li>
            </ul>
          </div>

          <div v-if="entry.emits?.length" class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Emits</div>
            <ul class="text-[11.5px] text-ink-soft flex flex-col gap-1">
              <li v-for="e in entry.emits" :key="e.name">
                <code class="font-mono text-ink">{{ e.name }}</code> (<code class="font-mono">{{ e.payload }}</code>) — {{ e.description }}
              </li>
            </ul>
          </div>

          <div v-if="entry.returns?.length" class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Returns</div>
            <ul class="text-[11.5px] text-ink-soft flex flex-col gap-1">
              <li v-for="r in entry.returns" :key="r.name">
                <code class="font-mono text-ink">{{ r.name }}</code>: <code class="font-mono">{{ r.type }}</code> — {{ r.description }}
              </li>
            </ul>
          </div>

          <div class="mt-3">
            <div class="text-[10.5px] font-bold text-ink-soft uppercase mb-1">Example</div>
            <pre class="text-[11px] font-mono bg-[#FBFBFC] border border-line rounded-lg p-3 overflow-x-auto whitespace-pre">{{ entry.example }}</pre>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>
