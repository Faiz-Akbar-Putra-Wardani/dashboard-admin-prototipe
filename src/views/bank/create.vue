<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import Swal from 'sweetalert2'
import Api from '@/services/api'
import { handleErrors } from '@/utils/handleErrors'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

const router = useRouter()
const currentPageTitle = ref('Tambah Bank')

const token = Cookies.get('token')

const form = reactive({
  account_holder: '',
  bank_name: '',
  account_number: '',
})

const errors = reactive({})
const isSubmitting = ref(false)

const storeBank = async () => {
  const confirm = await Swal.fire({ 
    title: 'Simpan Data?',
    text: 'Apakah kamu yakin ingin menambahkan data bank baru?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Simpan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
  })

  if (!confirm.isConfirmed) return
  isSubmitting.value = true
  errors.account_holder = ''
  errors.bank_name = ''
  errors.account_number = ''

  try {
    Api.defaults.headers.common['Authorization'] = token
    const response = await Api.post('/api/banks', form)

    await Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: response.data.meta?.message || 'Data bank berhasil disimpan.',
      timer: 2000,
      showConfirmButton: false,
    })
    router.push('/banks')
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
  router.push('/banks')
}
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Tambah Data Bank Baru
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Isi semua kolom di bawah ini untuk menambahkan rekening bank baru.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="storeBank" class="space-y-6">

        <!-- Nama Bank -->
        <div class="group relative">
          <input
            id="bank_name"
            v-model="form.bank_name"
            type="text"
            :data-filled="form.bank_name"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
            placeholder="Contoh: Bank BRI, Bank MANDIRI"
          />
          <label
            for="bank_name"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Nama Bank <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.bank_name" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ errors.bank_name }}
          </p>
        </div>

        <!-- Nomor Rekening -->
        <div class="group relative">
          <input
            id="account_number"
            v-model="form.account_number"
            type="text"
            :data-filled="form.account_number"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative font-mono"
            placeholder="Contoh: 2092-0101-1376-504"
          />
          <label
            for="account_number"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Nomor Rekening <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.account_number" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ errors.account_number }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Gunakan format dengan tanda hubung, contoh: 2092-0101-1376-504
          </p>
        </div>

        <!-- Atas Nama (Nama Pemilik) -->
        <div class="group relative">
          <input
            id="account_holder"
            v-model="form.account_holder"
            type="text"
            :data-filled="form.account_holder"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative uppercase"
            placeholder="Contoh: ISWOYO"
          />
          <label
            for="account_holder"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Atas Nama (Pemilik Rekening) <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.account_holder" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ errors.account_holder }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Nama akan otomatis diubah ke huruf kapital
          </p>
        </div>

        <!-- Info Box -->
        <div class="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 class="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                Contoh Format Data Bank
              </h4>
              <div class="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                <p><strong>Nomor Rekening:</strong></p>
                <p>- Bank BRI (2092-0101-1376-504)</p>
                <p>- Bank MANDIRI (114-00-2493557-2)</p>
                <p class="mt-2"><strong>Atas Nama:</strong> ISWOYO</p>
              </div>
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
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Data Bank' }}</span>
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>
