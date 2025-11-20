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
const currentPageTitle = ref('Tambah Pelanggan')

const token = Cookies.get('token')

const form = reactive({
  name_perusahaan: '',
  no_telp: '',
  address: '',
})

const errors = reactive({})
const isSubmitting = ref(false)

const storeCustomer = async () => {
    const confirm = await Swal.fire({
    title: 'Simpan Data?',
    text: 'Apakah kamu yakin ingin menambahkan pelanggan baru?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Simpan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
  })

  if (!confirm.isConfirmed) return
  isSubmitting.value = true
  errors.name_perusahaan = ''
  errors.no_telp = ''
  errors.address = ''

  try {
    Api.defaults.headers.common['Authorization'] = token
    const response = await Api.post('/api/customers', form)

    await Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: response.data.meta?.message || 'Data pelanggan berhasil disimpan.',
      timer: 2000,
      showConfirmButton: false,
    });
    router.push('/data-pelanggan')
  } catch (error) {
  if (error.response?.data) {
    handleErrors(error.response.data, errors);
    const errorMessages = error.response.data.errors
      ?.map(err => `<li>${err.msg}</li>`)
      .join("") || "<li>Terjadi kesalahan validasi.</li>";

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
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Kesalahan!",
      text: "Terjadi kesalahan, silakan coba lagi.",
    });
  }
} finally {
  isSubmitting.value = false
}
}
const goBack = () => {
  router.push('/data-pelanggan')
}
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Tambah Pelanggan Baru
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Isi semua kolom di bawah ini untuk menambahkan pelanggan baru.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="storeCustomer" class="space-y-6">

        <!-- Nama Perusahaan -->
        <div class="group relative">
          <input
            id="name_perusahaan"
            v-model="form.name_perusahaan"
            type="text"
            required
            :data-filled="form.name_perusahaan"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
            placeholder="Masukkan nama perusahaan"
          />
          <label
            for="name_perusahaan"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Nama Perusahaan <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.name_perusahaan" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ errors.name_perusahaan }}
          </p>
        </div>

              <!-- Nomor Telepon -->
        <div class="group relative">
          <input
            id="no_telp"
            v-model="form.no_telp"
            type="text"
            required
            :data-filled="form.no_telp"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
            placeholder="Contoh: 0812-3456-7890"
          />
          <label
            for="no_telp"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Nomor Telepon <span class="text-red-500">*</span>
          </label>
        </div>

        <!-- Alamat -->
        <div class="group relative">
          <textarea
            id="address"
            v-model="form.address"
            rows="4"
            required
            :data-filled="form.address"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all resize-none z-10 relative"
            placeholder="Masukkan alamat lengkap perusahaan"
          ></textarea>
          <label
            for="address"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Alamat Lengkap <span class="text-red-500">*</span>
          </label>
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
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Pelanggan' }}</span>
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>