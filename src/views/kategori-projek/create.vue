<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import Swal from 'sweetalert2'
import Api from '@/services/api'
import { handleErrors } from '@/utils/handleErrors'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

const router = useRouter()
const currentPageTitle = ref('Tambah Kategori Proyek')

const token = Cookies.get('token')

const form = reactive({
  name: '',
  slug: '',
})

const errors = reactive({})
const isSubmitting = ref(false)
const isAutoSlug = ref(true) 

// Helper function untuk slugify
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        
    .replace(/[^\w\-]+/g, '')    
    .replace(/\-\-+/g, '-')      
    .replace(/^-+/, '')          
    .replace(/-+$/, '')          
}

// Auto-generate slug dari name
watch(() => form.name, (newName) => {
  if (isAutoSlug.value) {
    form.slug = slugify(newName)
  }
})

const handleSlugInput = () => {
  isAutoSlug.value = false
}

watch(() => form.slug, (newSlug) => {
  if (!newSlug) {
    isAutoSlug.value = true
  }
})

const storeProjectCategory = async () => {
  const confirm = await Swal.fire({
    title: 'Simpan Data?',
    text: 'Apakah kamu yakin ingin menambahkan kategori proyek baru?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Simpan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
  })

  if (!confirm.isConfirmed) return
  
  isSubmitting.value = true
  errors.name = ''
  errors.slug = ''

  try {
    Api.defaults.headers.common['Authorization'] = token
    const response = await Api.post('/api/project-categories', form)

    await Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: response.data.meta?.message || 'Kategori proyek berhasil disimpan.',
      timer: 2000,
      showConfirmButton: false,
    })
    
    router.push('/projects-categories')
  } catch (error) {
    if (error.response?.data) {
      handleErrors(error.response.data, errors)
      const errorMessages = error.response.data.errors
        ?.map(err => `<li>${err.msg}</li>`)
        .join("") || "<li>Terjadi kesalahan validasi.</li>"

      await Swal.fire({
        icon: "error",
        title: "Validasi Gagal!",
        html: `
          <ul style="text-align: center; margin: 0; padding-left: 1.2rem; color: #e53e3e;">
            ${errorMessages}
          </ul>
        `,
        confirmButtonText: "Tutup",
        confirmButtonColor: "#ef4444",
      })
    } else {
      Swal.fire({
        icon: "error",
        title: "Kesalahan!",
        text: "Terjadi kesalahan, silakan coba lagi.",
      })
    }
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/projects-categories')
}
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Tambah Kategori Proyek Baru
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Isi semua kolom di bawah ini untuk menambahkan kategori proyek baru.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="storeProjectCategory" class="space-y-6">

        <!-- Nama Kategori -->
        <div class="group relative">
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            :data-filled="form.name"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
            placeholder="Masukkan nama kategori"
          />
          <label
            for="name"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Nama Kategori <span class="text-red-500">*</span>
          </label>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Contoh: Perbaikan, Instalasi, Penyewaan
          </p>
          <p v-if="errors.name" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ errors.name }}
          </p>
        </div>

        <!-- Slug -->
        <div class="group relative">
          <input
            id="slug"
            v-model="form.slug"
            @input="handleSlugInput"
            type="text"
            required
            :data-filled="form.slug"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative font-mono"
            placeholder="Masukkan slug"
          />
          <label
            for="slug"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Slug (URL-friendly) <span class="text-red-500">*</span>
          </label>
          <div class="mt-1 flex items-start gap-2">
            <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              <span v-if="isAutoSlug" class="text-green-600 dark:text-green-400 font-medium">
                ✓ Auto-generate aktif
              </span>
              <span v-else class="text-amber-600 dark:text-amber-400 font-medium">
                ⚠ Manual mode
              </span>
              - Hanya gunakan huruf kecil, angka, dan tanda hubung (-). Contoh: perbaikan, instalasi-listrik
            </p>
          </div>
          <p v-if="errors.slug" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ errors.slug }}
          </p>
        </div>

        <!-- Preview Slug -->
        <div v-if="form.slug" class="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div>
              <p class="text-sm font-medium text-indigo-900 dark:text-indigo-200">Preview URL:</p>
              <p class="text-sm text-indigo-700 dark:text-indigo-300 font-mono mt-1">
                /proyek?category=<span class="font-bold">{{ form.slug }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Tombol Aksi -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            @click="goBack"
            class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Kategori' }}</span>
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>
