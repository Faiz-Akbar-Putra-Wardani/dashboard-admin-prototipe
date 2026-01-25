<script setup>
import { ref, onMounted, computed } from "vue"
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

// ===== Perhitungan dasar (dipakai juga oleh calculationSteps) =====
const subtotal = computed(() =>
  repair.value ? Number(repair.value.repair_cost) || 0 : 0
)

const extra = computed(() =>
  repair.value ? Number(repair.value.extra) || 0 : 0
)

const pphPercent = computed(() =>
  repair.value ? Number(repair.value.pph) || 0 : 0
)

const dp = computed(() =>
  repair.value ? Number(repair.value.dp) || 0 : 0
)

const subtotalPlusExtra = computed(
  () => subtotal.value + extra.value
)

const pphNominal = computed(
  () => subtotalPlusExtra.value * (pphPercent.value / 100)
)

const totalAfterPph = computed(() =>
  Math.max(0, subtotalPlusExtra.value - pphNominal.value)
)

// ===== Ringkasan Perhitungan (step-by-step, khusus perbaikan) =====
const calculationSteps = computed(() => {
  if (!repair.value) return []

  const subtotalVal = subtotal.value
  const extraVal = extra.value
  const pphVal = pphPercent.value
  const dpVal = dp.value

  const subtotalPlusExtraVal = subtotalVal + extraVal
  const pphNominalVal = subtotalPlusExtraVal * (pphVal / 100)
  const totalAfterPphVal = Math.max(0, subtotalPlusExtraVal - pphNominalVal)
  const grandTotalVal =
    Number(repair.value.grand_total ?? totalAfterPphVal) || 0

  return [
    {
      step: 1,
      label: "Biaya Perbaikan (Subtotal)",
      value: subtotalVal,
      formula: null,
      color: "blue",
    },
    {
      step: 2,
      label: "Tambahan Biaya (Extra)",
      value: extraVal,
      formula:
        extraVal > 0
          ? `Rp ${formatRupiah(subtotalVal)} + Rp ${formatRupiah(extraVal)}`
          : "Tidak ada tambahan biaya",
      color: extraVal > 0 ? "green" : "gray",
    },
    {
      step: 3,
      label: "Subtotal + Tambahan Biaya",
      value: subtotalPlusExtraVal,
      formula: `Rp ${formatRupiah(subtotalVal)} + Rp ${formatRupiah(
        extraVal
      )} = Rp ${formatRupiah(subtotalPlusExtraVal)}`,
      color: "indigo",
      highlight: true,
    },
    {
      step: 4,
      label: `PPH ${pphVal}% dari Subtotal + Extra`,
      value: pphNominalVal,
      formula:
        pphVal > 0
          ? `Rp ${formatRupiah(
              subtotalPlusExtraVal
            )} × ${pphVal}% = Rp ${formatRupiah(pphNominalVal)}`
          : "PPH 0% (tidak dikenakan PPH)",
      color: pphVal > 0 ? "amber" : "gray",
      highlight: pphVal > 0,
    },
    {
      step: 5,
      label: "Total Setelah PPH",
      value: totalAfterPphVal,
      formula:
        pphVal > 0
          ? `Rp ${formatRupiah(
              subtotalPlusExtraVal
            )} - Rp ${formatRupiah(
              pphNominalVal
            )} = Rp ${formatRupiah(totalAfterPphVal)}`
          : `Rp ${formatRupiah(subtotalPlusExtraVal)}`,
      color: "cyan",
      highlight: true,
    },
    {
      step: 6,
      label: "Down Payment (DP)",
      value: dpVal,
      formula: dpVal > 0 ? `Rp ${formatRupiah(dpVal)}` : "Tidak ada DP",
      color: dpVal > 0 ? "red" : "gray",
    },
    {
      step: 7,
      label: "TOTAL / BIAYA PERBAIKAN",
      value: grandTotalVal,
      formula:
        dpVal > 0
          ? `Rp ${formatRupiah(
              totalAfterPphVal
            )} - Rp ${formatRupiah(
              dpVal
            )} = Rp ${formatRupiah(totalAfterPphVal - dpVal)}`
          : `Rp ${formatRupiah(totalAfterPphVal)}`,
      color: "purple",
      isFinal: true,
    },
  ]
});

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

    await Api.patch(`/api/repairs/${id}/status`, {
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
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            Detail Perbaikan /
            <span class="text-indigo-600">#{{ repair.invoice }}</span>
          </h1>

          <button
            @click="openPrintPage"
            class="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h8v4H6v-4z"
              />
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
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali
        </button>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- KIRI: INFO PERBAIKAN -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6">Informasi Perbaikan</h2>

            <div class="space-y-4 text-sm">
              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Invoice</span>
                <span class="font-medium break-all">#{{ repair.invoice }}</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Customer</span>
                <span class="font-medium break-words text-left">
                  {{ repair.customer?.name_perusahaan ?? "-" }}
                </span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Barang</span>
                <span class="font-medium break-words text-left">{{ repair.item_repair }}</span>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-gray-600">Tanggal</span>
                <span class="text-left">
                  {{ formatDate(repair.start_date) }} -
                  {{ formatDate(repair.end_date) }}
                </span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Teknisi (PIC)</span>
                <span class="text-left">{{ repair.pic }}</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Komponen</span>
                <span class="break-words text-left">{{ repair.component ?? "-" }}</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1 items-start sm:items-center">
                <span class="text-gray-600">Status</span>
                <span
                  class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                >
                  {{ repair.status.toUpperCase() }}
                </span>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <div class="flex flex-col sm:flex-row sm:justify-between gap-1 text-base font-semibold">
                  <span>Biaya Perbaikan</span>
                  <span class="text-indigo-600">
                    Rp {{ formatRupiah(repair.grand_total) }}
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
                <option value="dikerjakan">Dikerjakan</option>
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

          <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div>
              <h2 class="text-lg font-semibold mb-6">Barang Diperbaiki</h2>

              <!-- Desktop: Table View -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b-2 border-gray-200">
                      <th class="py-3 px-2 text-left">No</th>
                      <th class="py-3 px-2 text-left">Barang</th>
                      <th class="py-3 px-2 text-center">Estimasi Tanggal</th>
                      <th class="py-3 px-2 text-right">Biaya Perbaikan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b">
                      <td class="py-4 px-2">1</td>
                      <td class="py-4 px-2 font-medium">
                        {{ repair.item_repair }}
                      </td>
                      <td class="py-4 px-2 text-center">
                        <span
                          class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full inline-block"
                        >
                          {{ formatDate(repair.start_date) }} -
                          {{ formatDate(repair.end_date) }}
                        </span>
                      </td>
                      <td class="py-4 px-2 text-right font-semibold">
                        Rp {{ formatRupiah(totalAfterPph) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile: Card View -->
              <div class="md:hidden">
                <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex-1 pr-2">
                      <div class="text-xs text-gray-500 mb-1">Barang #1</div>
                      <div class="font-semibold text-sm text-gray-900 break-words">
                        {{ repair.item_repair }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="space-y-2 text-xs">
                    <div class="flex flex-col">
                      <span class="text-gray-500 mb-1">Estimasi Tanggal</span>
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 font-semibold rounded-full inline-block text-center">
                        {{ formatDate(repair.start_date) }} - {{ formatDate(repair.end_date) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span class="text-gray-500">Biaya Perbaikan</span>
                      <span class="font-semibold text-indigo-600">Rp {{ formatRupiah(totalAfterPph) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

           <!-- Detail Perhitungan Step-by-Step -->
            <div
              class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-200"
            >
              <h2
                class="text-lg font-semibold mb-6 flex items-center gap-2 text-indigo-900"
              >
                <svg
                  class="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Detail Perhitungan
              </h2>

              <div class="space-y-4">
                <div
                  v-for="calc in calculationSteps"
                  :key="calc.step"
                  :class="[
                    'rounded-xl p-4 border-2 transition-all',
                    calc.isFinal
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-purple-700 shadow-2xl'
                      : calc.highlight
                        ? 'bg-white border-' + calc.color + '-300 shadow-md'
                        : 'bg-white/60 border-gray-200',
                  ]"
                >
                  <!-- Header dengan nomor step -->
                  <div class="flex items-center gap-3 mb-2">
                    <div
                      :class="[
                        'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0',
                        calc.isFinal
                          ? 'bg-white text-purple-700'
                          : 'bg-' + calc.color + '-100 text-' + calc.color + '-700',
                      ]"
                    >
                      {{ calc.step }}
                    </div>
                    <span
                      :class="[
                        'font-semibold text-sm',
                        calc.isFinal ? 'text-white text-base md:text-lg' : 'text-gray-800',
                      ]"
                    >
                      {{ calc.label }}
                    </span>
                  </div>

                  <div class="mt-2 ml-11">
                    <div
                      :class="[
                        'font-bold flex items-baseline gap-1',
                        calc.isFinal ? 'text-white' : 'text-' + calc.color + '-700',
                      ]"
                    >
                      <span :class="calc.isFinal ? 'text-base md:text-lg' : 'text-sm md:text-base'">
                        Rp
                      </span>
                      <span 
                        :class="[
                          'whitespace-nowrap',
                          calc.isFinal ? 'text-xl md:text-2xl' : 'text-base md:text-lg'
                        ]"
                      >
                        {{ formatRupiah(calc.value) }}
                      </span>
                    </div>
                  </div>

                  <!-- Formula -->
                  <div
                    v-if="calc.formula"
                    :class="[
                      'text-xs mt-2 ml-11 p-2 rounded-lg font-mono break-all',
                      calc.isFinal
                        ? 'bg-purple-800/30 text-purple-100'
                        : calc.highlight
                          ? 'bg-' + calc.color + '-50 text-' + calc.color + '-800 border border-' + calc.color + '-200'
                          : 'bg-gray-50 text-gray-600',
                    ]"
                  >
                    {{ calc.formula }}
                  </div>
                </div>
              </div>
            </div>
            <!-- Total besar -->
            <div class="text-right">
              <div class="text-lg font-bold text-gray-800">Total</div>
              <div class="text-2xl font-bold text-indigo-600">
                Rp {{ formatRupiah(totalAfterPph) }}
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
  button,
  nav,
  header {
    display: none !important;
  }
}

/* Scrollbar horizontal untuk tabel */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #6366f1 #e5e7eb;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(to right, #6366f1, #8b5cf6);
  border-radius: 10px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to right, #4f46e5, #7c3aed);
}

/* Prevent text overflow */
.break-words {
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.break-all {
  word-break: break-all;
}

/* Ensure price stays in one line */
.whitespace-nowrap {
  white-space: nowrap;
}
</style>

