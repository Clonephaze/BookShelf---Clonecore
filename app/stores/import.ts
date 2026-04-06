import { defineStore } from 'pinia'
import { useLibraryStore } from './library'

export interface ImportPreviewBook {
  index: number
  title: string
  author: string
  isbn10: string | null
  isbn13: string | null
  rating: number | null
  targetShelf: string
  existsInLibrary: boolean
}

export interface ImportPreviewResponse {
  books: ImportPreviewBook[]
  totalParsed: number
  totalNew: number
  totalExisting: number
  issues: string[]
}

export interface ImportResultResponse {
  imported: number
  skippedExisting: number
  skippedError: number
  enriched: number
  notMatched: number
}

export const useImportStore = defineStore('goodreads-import', () => {
  const step = ref<'idle' | 'preview' | 'importing' | 'done'>('idle')
  const loading = ref(false)
  const error = ref('')
  const csvText = ref('')
  const preview = ref<ImportPreviewResponse | null>(null)
  const result = ref<ImportResultResponse | null>(null)

  // Progress tracking
  const estimatedProgress = ref(0)
  const progressMessage = ref('')
  let progressTimer: ReturnType<typeof setInterval> | null = null

  const previewDisplay = computed(() => {
    if (!preview.value) return []
    return preview.value.books.slice(0, 20)
  })

  const isImporting = computed(() => step.value === 'importing')

  async function uploadCsv(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      error.value = 'Please select a CSV file.'
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      error.value = 'File too large (max 5MB).'
      return
    }

    error.value = ''
    loading.value = true

    try {
      const text = await file.text()
      csvText.value = text

      const data = await $fetch<ImportPreviewResponse>('/api/import/goodreads/preview', {
        method: 'POST',
        body: { csv: text },
      })

      preview.value = data
      step.value = 'preview'
    }
    catch (err: unknown) {
      const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
        || 'Could not parse file. Please check it\'s a Goodreads CSV export.'
      error.value = msg
    }
    finally {
      loading.value = false
    }
  }

  async function executeImport() {
    if (!csvText.value) return

    error.value = ''
    loading.value = true
    step.value = 'importing'
    estimatedProgress.value = 0
    progressMessage.value = 'Starting import…'

    // Estimated progress: server processes 5 books/batch with ~1.5s per batch
    const totalNew = preview.value?.totalNew ?? 0
    const totalBatches = Math.max(1, Math.ceil(totalNew / 5))
    const msPerBatch = 1500 // ~1s delay + processing time
    let elapsed = 0

    progressTimer = setInterval(() => {
      elapsed += 200
      const estimatedBatchesDone = Math.min(elapsed / msPerBatch, totalBatches)
      const pct = Math.min(95, Math.round((estimatedBatchesDone / totalBatches) * 100))
      estimatedProgress.value = pct
      const booksEstimated = Math.min(totalNew, Math.round(estimatedBatchesDone * 5))
      progressMessage.value = `Processing ${booksEstimated} of ${totalNew} books…`
    }, 200)

    try {
      const data = await $fetch<ImportResultResponse>('/api/import/goodreads/execute', {
        method: 'POST',
        body: { csv: csvText.value },
        timeout: 120_000, // 2 minutes — enrichment is rate-limited
      })

      result.value = data
      estimatedProgress.value = 100
      progressMessage.value = 'Complete!'
      step.value = 'done'

      // Refresh library data
      const libraryStore = useLibraryStore()
      await libraryStore.fetch(true)
    }
    catch (err: unknown) {
      const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
        || 'Import may have partially completed — check your library. The request timed out.'
      error.value = msg
      estimatedProgress.value = 0
      progressMessage.value = ''
      // Don't go back to preview — books may have been imported server-side
      step.value = 'done'
      // Don't set result — null result tells the UI this was a timeout, not 0 imports

      // Refresh library anyway — partial imports are likely
      const libraryStore = useLibraryStore()
      await libraryStore.fetch(true)
    }
    finally {
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
      loading.value = false
    }
  }

  function reset() {
    step.value = 'idle'
    loading.value = false
    error.value = ''
    csvText.value = ''
    preview.value = null
    result.value = null
    estimatedProgress.value = 0
    progressMessage.value = ''
  }

  return {
    step,
    loading,
    error,
    csvText,
    preview,
    result,
    previewDisplay,
    isImporting,
    estimatedProgress,
    progressMessage,
    uploadCsv,
    executeImport,
    reset,
  }
})
