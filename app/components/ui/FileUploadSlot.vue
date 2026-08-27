<script setup lang="ts">
/**
 * One upload slot: drag & drop, paste-an-image, or click to browse. Shows a thumbnail/icon
 * once a file is selected, click it to preview full-size in a modal. Generic — used for every
 * employee document/photo slot, not tied to any particular upload endpoint's URL shape.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: { id?: string; fileName: string; mimeType: string } | null
    endpoint: string
    /** Full GET URL to fetch the current file's bytes for preview — parent knows its own route shape. */
    previewEndpoint?: string
    accept?: string
    maxSizeMb?: number
    label?: string
    ocr?: boolean
    extraFields?: Record<string, string>
    /** Shown while a picked file is waiting for `endpoint` to become available (e.g. the
     * employee draft hasn't been created yet) — overrides the default "will auto-upload" text. */
    disabledHint?: string
  }>(),
  {
    modelValue: null,
    accept: 'image/jpeg,image/png,application/pdf',
    maxSizeMb: 5,
    ocr: false,
  }
)
const emit = defineEmits<{ 'update:modelValue': [any]; 'ocr-result': [Record<string, any>] }>()

const { upload, uploading, error } = useFileUpload()

const localPreviewUrl = ref('') // object URL for a just-picked, not-yet-uploaded file
const isDragOver = ref(false)
const showPreviewModal = ref(false)
const remotePreviewUrl = ref('')
const loadingPreview = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const slotRef = ref<HTMLElement | null>(null)
// Picking a file is always allowed, even before `endpoint` is ready (e.g. the employee
// draft hasn't been created yet) — the file is held here and uploaded automatically the
// moment `endpoint` becomes available, instead of blocking the user from picking it first.
const pendingFile = ref<File | null>(null)

const isImage = computed(() => {
  const mime = props.modelValue?.mimeType
  return mime ? mime.startsWith('image/') : localPreviewUrl.value !== ''
})

async function doUpload(file: File, endpointOverride?: string) {
  try {
    const res = await upload<{ data: any; ocr?: Record<string, any> }>(endpointOverride ?? props.endpoint, file, props.extraFields)
    emit('update:modelValue', res.data)
    if (props.ocr && res.ocr) emit('ocr-result', res.ocr)
    pendingFile.value = null
  } catch {
    // error already set by useFileUpload — keep pendingFile so a retry (e.g. next Lanjut) can resend it
  }
}

async function handleFile(file: File) {
  if (!props.accept.split(',').includes(file.type)) {
    error.value = `Tipe file tidak didukung: ${file.type}`
    return
  }
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    error.value = `File melebihi ${props.maxSizeMb}MB`
    return
  }

  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''

  if (!props.endpoint) {
    pendingFile.value = file
    return
  }
  await doUpload(file)
}

watch(
  () => props.endpoint,
  (endpoint) => {
    if (endpoint && pendingFile.value) doUpload(pendingFile.value)
  }
)

// Called directly by a parent that knows the endpoint became available at the exact moment
// this component is about to unmount (e.g. the wizard advancing past the step that holds the
// upload slot right after auto-creating the record) — the `watch` above never gets a chance to
// react in that case because both the endpoint prop and the unmount happen in the same flush.
async function uploadPendingTo(endpoint: string) {
  if (!pendingFile.value) return false
  await doUpload(pendingFile.value, endpoint)
  return true
}
defineExpose({ uploadPendingTo })

function onBrowseChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
  ;(e.target as HTMLInputElement).value = ''
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onPaste(e: ClipboardEvent) {
  const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
  const file = item?.getAsFile()
  if (file) handleFile(file)
}

async function openPreview() {
  showPreviewModal.value = true
  if (localPreviewUrl.value || remotePreviewUrl.value || !props.previewEndpoint) return
  loadingPreview.value = true
  try {
    const blob = await useApi<Blob>(props.previewEndpoint, { responseType: 'blob' } as any)
    remotePreviewUrl.value = URL.createObjectURL(blob)
  } catch {
    // preview fetch failed — modal just shows the "no preview" fallback
  } finally {
    loadingPreview.value = false
  }
}

const previewSrc = computed(() => localPreviewUrl.value || remotePreviewUrl.value)

onUnmounted(() => {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  if (remotePreviewUrl.value) URL.revokeObjectURL(remotePreviewUrl.value)
})
</script>

<template>
  <div>
    <label v-if="label" class="block text-[11.5px] font-semibold text-ink mb-1.5">{{ label }}</label>

    <div
      v-if="!modelValue && !localPreviewUrl"
      ref="slotRef"
      tabindex="0"
      class="border-2 border-dashed rounded-lg px-3 py-4 text-center cursor-pointer outline-none transition-colors"
      :class="isDragOver ? 'border-topbar-1 bg-[#FFF3EE]' : 'border-line bg-white hover:border-topbar-1'"
      @click="fileInputRef?.click()"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDrop($event)"
      @paste="onPaste($event)"
    >
      <p class="text-[11.5px] text-ink-soft">Klik, drag & drop, atau paste gambar</p>
      <input ref="fileInputRef" type="file" :accept="accept" hidden @change="onBrowseChange" />
    </div>

    <div v-else class="flex items-center gap-2.5 border border-line rounded-lg p-2 bg-white">
      <button type="button" class="w-11 h-11 rounded-md border border-line overflow-hidden shrink-0 bg-[#FAFAFA]" @click="openPreview">
        <!-- Thumbnail only for a just-picked local file (its blob: URL needs no auth). An
             already-uploaded file's thumbnail would need an authenticated fetch just like the
             modal preview below — not worth doing twice, so it shows a generic icon here and
             the real image loads lazily when the preview modal opens. -->
        <img v-if="isImage && localPreviewUrl" :src="localPreviewUrl" class="w-full h-full object-cover" />
        <span v-else class="flex items-center justify-center w-full h-full text-[9px] text-ink-soft">FILE</span>
      </button>
      <div class="flex-1 min-w-0">
        <p class="text-[12px] text-ink truncate">{{ modelValue?.fileName || 'File dipilih' }}</p>
        <p v-if="uploading" class="text-[10.5px] text-ink-soft">Mengunggah...</p>
        <p v-else-if="pendingFile" class="text-[10.5px] text-ink-soft">
          {{ disabledHint || 'Akan diunggah otomatis begitu data tersimpan' }}
        </p>
      </div>
      <button type="button" class="text-[11px] text-topbar-1 font-semibold shrink-0" @click="fileInputRef?.click()">Ganti</button>
      <input ref="fileInputRef" type="file" :accept="accept" hidden @change="onBrowseChange" />
    </div>

    <p v-if="error" class="text-red-600 text-[11px] mt-1">{{ error }}</p>

    <Teleport to="body">
      <UiModal v-model="showPreviewModal" :title="label" size="lg">
        <div class="flex items-center justify-center min-h-[200px]">
          <p v-if="loadingPreview" class="text-ink-soft text-[12px]">Memuat preview...</p>
          <img v-else-if="isImage && previewSrc" :src="previewSrc" class="max-w-full max-h-[70vh] rounded-lg" />
          <p v-else class="text-ink-soft text-[12px]">Preview tidak tersedia untuk tipe file ini.</p>
        </div>
      </UiModal>
    </Teleport>
  </div>
</template>
