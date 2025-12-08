<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import Api from "@/services/api"
import Cookies from "js-cookie"
import Swal from "sweetalert2"

import AdminLayout from "@/components/layout/AdminLayout.vue"

const route = useRoute()
const router = useRouter()
const id = route.params.id

const repair = ref(null)
const loading = ref(true)

const newStatus = ref("")
const statusUpdating = ref(false)

// Format Rupiah
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID").format(value ?? 0)

// Format tanggal
const formatDate = (val) => {
  if (!val) return "-"
  return new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Ambil detail perbaikan
const fetchDetail = async () => {
  try {
    const token = Cookies.get("token")
    Api.defaults.headers.common["Authorization"] = token

    const res = await Api.get(`/api/repairs/${id}`)
    repair.value = res.data.data
    newStatus.value = repair.value.status
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Gagal mengambil detail perbaikan",
      confirmButtonColor: "#e3342f",
    })
    router.back()
  } finally {
    loading.value = false
  }
}

// Update status perbaikan
const updateStatus = async () => {
  if (!newStatus.value) return

  try {
    statusUpdating.value = true

    await Api.put(`/api/repairs/${id}`, {
      ...repair.value,
      status: newStatus.value,
    })

    repair.value.status = newStatus.value

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Status perbaikan berhasil diperbarui",
      confirmButtonColor: "#4f46e5",
    })
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Gagal memperbarui status perbaikan",
      confirmButtonColor: "#e3342f",
    })
  } finally {
    statusUpdating.value = false
  }
}

// Print halaman perbaikan
const openPrintPage = () => {
  window.open(`/repairs/print?invoice=${repair.value.invoice}`, "_blank")
}


onMounted(fetchDetail);
</script>



<template>
  <admin-layout>
    <div class="max-w-7xl mx-auto p-6">

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-500">
        Memuat detail perbaikan...
      </div>

      <div v-else>
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            Detail Perbaikan /
            <span class="text-indigo-600">#{{ repair.invoice }}</span>
          </h1>

            <button
                @click="openPrintPage"
                class="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h8v4H6v-4z" />
                </svg>
                Cetak
            </button>
        </div>

        <!-- Tombol kembali -->
        <button
          @click="router.back()"
          class="mb-8 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- KIRI: INFO PERBAIKAN -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6">Informasi Perbaikan</h2>

            <div class="space-y-4 text-sm">

              <div class="flex justify-between">
                <span class="text-gray-600">Invoice</span>
                <span class="font-medium">#{{ repair.invoice }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Customer</span>
                <span class="font-medium">
                  {{ repair.customer?.name_perusahaan ?? "-" }}
                </span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Barang</span>
                <span class="font-medium">{{ repair.item_repair }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal</span>
                <span>
                  {{ formatDate(repair.start_date) }} -
                  {{ formatDate(repair.end_date) }}
                </span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Teknisi (PIC)</span>
                <span>{{ repair.pic }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Komponen</span>
                <span>{{ repair.component ?? "-" }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">DP</span>
                <span>Rp {{ formatRupiah(repair.dp) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-600">Status</span>
                <span
                  class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                >
                  {{ repair.status.toUpperCase() }}
                </span>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <div class="flex justify-between text-base font-semibold">
                  <span>Biaya Perbaikan</span>
                  <span class="text-indigo-600">
                    Rp {{ formatRupiah(repair.repair_cost) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Update Status -->
            <div class="mt-8 space-y-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Ubah Status</label>
              <select
                v-model="newStatus"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
               <option value="masuk">Masuk</option>
            <option value="proses">Proses</option>
            <option value="selesai">Selesai</option>
              </select>

              <button
                @click="updateStatus"
                :disabled="statusUpdating"
                class="w-full mt-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-70"
              >
                {{ statusUpdating ? "Memperbarui..." : "Perbarui Status" }}
              </button>
            </div>
          </div>

          <!-- KANAN: DETAIL BARANG PERBAIKAN -->
<div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
  <h2 class="text-lg font-semibold mb-6">Barang Diperbaiki</h2>

  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b-2 border-gray-200">
          <th class="py-3 text-left">No</th>
          <th class="py-3 text-left">Barang</th>
          <th class="py-3 text-center">Estimasi Tanggal</th>
          <th class="py-3 text-right">Biaya Perbaikan</th>
        </tr>
      </thead>

      <tbody>
        <tr class="border-b">
          <td class="py-4">1</td>

          <td class="py-4 font-medium">
            {{ repair.item_repair }}
          </td>

          <td class="py-4 text-center">
            <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              {{ formatDate(repair.start_date) }} - {{ formatDate(repair.end_date) }}
            </span>
          </td>

          <td class="py-4 text-right font-semibold">
            Rp {{ formatRupiah(repair.repair_cost) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- TOTAL -->
  <div class="mt-8 text-right">
    <div class="text-lg font-bold text-gray-800">Total</div>
    <div class="text-2xl font-bold text-indigo-600">
      Rp {{ formatRupiah(repair.repair_cost) }}
    </div>
  </div>
</div>


        </div>
      </div>
    </div>
  </admin-layout>
</template>
<style scoped>
@media print {
  button, nav, header {
    display: none !important;
  }
}
</style>
