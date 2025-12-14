<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import Api from "@/services/api";
import Cookies from "js-cookie";

import AdminLayout from "@/components/layout/AdminLayout.vue";
import { moneyFormat } from "@/utils/moneyFormat";

const route = useRoute();
const router = useRouter();
const uuid = route.params.uuid;

const transaction = ref(null);
const loading = ref(true);
const newStatus = ref("");
const statusUpdating = ref(false);

const fetchDetail = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get(`/api/transactions/${uuid}`);
    transaction.value = res.data.data;
    newStatus.value = transaction.value.status;
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Gagal mengambil detail transaksi",
      confirmButtonColor: "#e3342f",
    });
  } finally {
    loading.value = false;
  }
};

const updateStatus = async () => {
  if (!newStatus.value) {
    Swal.fire({
      icon: "warning",
      title: "Status kosong!",
      text: "Pilih status terlebih dahulu",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  try {
    statusUpdating.value = true;

   await Api.patch(`/api/transactions/${uuid}/status`, {
      status: newStatus.value,
    });

    transaction.value.status = newStatus.value;

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Status berhasil diperbarui",
      confirmButtonColor: "#4f46e5",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Gagal mengubah status",
      confirmButtonColor: "#e3342f",
    });
  } finally {
    statusUpdating.value = false;
  }
};

const openPrintPage = () => {
  window.open(`/penjualan/print?invoice=${transaction.value.invoice}`, "_blank");
};

onMounted(() => fetchDetail());

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID").format(value);

const formatDate = (val) =>
  new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// Computed untuk breakdown perhitungan step-by-step
const calculationSteps = computed(() => {
  if (!transaction.value) return [];

  const subtotal = transaction.value.subtotal || 0;
  const extra = transaction.value.extra || 0;
  const pph = transaction.value.pph || 0;
  const nego = transaction.value.nego || 0;
  const dp = transaction.value.dp || 0;

  // Step 1: Subtotal + Extra
  const subtotalPlusExtra = subtotal + extra;

  // Step 2: PPH dari subtotalPlusExtra
  const pphNominal = subtotalPlusExtra * (pph / 100);

  // Step 3: Total Sebelum Nego
  const totalBeforeNego = subtotalPlusExtra - pphNominal;

  // Step 4: Total Setelah Nego
  const totalAfterNego = totalBeforeNego - nego;

  // Step 5: Grand Total
  const grandTotal = totalAfterNego;

  return [
    {
      step: 1,
      label: "Harga Produk (Subtotal)",
      value: subtotal,
      formula: null,
      color: "blue",
    },
    {
      step: 2,
      label: "Tambahan Biaya",
      value: extra,
      formula: `+ Rp ${formatRupiah(extra)}`,
      color: "green",
    },
    {
      step: 3,
      label: "Total Tambahan Biaya",
      value: subtotalPlusExtra,
      formula: `Rp ${formatRupiah(subtotal)} + Rp ${formatRupiah(extra)} = Rp ${formatRupiah(subtotalPlusExtra)}`,
      color: "indigo",
      highlight: true,
    },
    {
      step: 4,
      label: `PPH ${pph}% dari Total Tambahan Biaya`,
      value: pphNominal,
      formula: `Rp ${formatRupiah(subtotalPlusExtra)} × ${pph}% = Rp ${formatRupiah(pphNominal)}`,
      color: "amber",
      highlight: true,
    },
    {
      step: 5,
      label: "Total Sebelum Nego",
      value: totalBeforeNego,
      formula: `Rp ${formatRupiah(subtotalPlusExtra)} - Rp ${formatRupiah(pphNominal)} = Rp ${formatRupiah(totalBeforeNego)}`,
      color: "blue",
      highlight: true,
    },
    {
      step: 6,
      label: "Potongan Harga Nego",
      value: nego,
      formula: nego > 0 ? `- Rp ${formatRupiah(nego)}` : "Tidak ada nego",
      color: nego > 0 ? "red" : "gray",
    },
    {
      step: 7,
      label: "Total Setelah Nego",
      value: totalAfterNego,
      formula: nego > 0 ? `Rp ${formatRupiah(totalBeforeNego)} - Rp ${formatRupiah(nego)} = Rp ${formatRupiah(totalAfterNego)}` : `Rp ${formatRupiah(totalBeforeNego)}`,
      color: "cyan",
      highlight: true,
    },
    {
      step: 8,
      label: "Down Payment (DP)",
      value: dp,
      formula: dp > 0 ? `- Rp ${formatRupiah(dp)}` : "Tidak ada DP",
      color: dp > 0 ? "red" : "gray",
    },
    {
      step: 9,
      label: "TOTAL / SISA BAYAR",
      value: grandTotal,
      formula: dp > 0 ? `Rp ${formatRupiah(totalAfterNego)} - Rp ${formatRupiah(dp)} = Rp ${formatRupiah(grandTotal)}` : `Rp ${formatRupiah(totalAfterNego)}`,
      color: "purple",
      isFinal: true,
    },
  ];
});
</script>

<template>
  <admin-layout>
    <div class="max-w-7xl mx-auto p-6">

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-500">
        Memuat detail...
      </div>

      <div v-else>
        <!-- Header + Cetak -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            Data Transaksi / <span class="text-indigo-600">#{{ transaction.invoice }}</span>
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

        <!-- Tombol Kembali -->
        <button @click="router.back()" class="mb-8 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Kiri: Informasi Pesanan -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informasi Pesanan
            </h2>

            <div class="space-y-4 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">No. Invoice</span>
                <span class="font-medium">#{{ transaction.invoice }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Nama Customer</span>
                <span class="font-medium flex items-center gap-2">
                  {{ transaction.customer?.name_perusahaan ?? "-" }}
                  <svg v-if="transaction.customer?.name_perusahaan" class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Dibuat pada</span>
                <span>{{ formatDate(transaction.created_at) }}</span>
              </div>

              <div class="flex justify-between items-center pt-2">
                <span class="text-gray-600">Status</span>
                <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  {{ newStatus.toUpperCase() }}
                </span>
              </div>
            </div>

            <div class="mt-8 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ubah Status</label>
                <select v-model="newStatus" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="proses">Proses</option>
                  <option value="dikirim">Dikirim</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <button @click="updateStatus" :disabled="statusUpdating"
                class="w-full mt-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2">
                <svg v-if="statusUpdating" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ statusUpdating ? 'Memperbarui...' : 'Perbarui Status' }}
              </button>
            </div>
          </div>

          <!-- Kanan: Daftar Paket + Detail Perhitungan -->
          <div class="lg:col-span-2 space-y-6">
            
           <!-- Daftar Paket -->
            <div class="bg-white rounded-2xl shadow-lg p-4 md:p-6">
              <h2 class="text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Daftar Paket
              </h2>

              <div class="overflow-x-auto -mx-4 md:mx-0">
                <div class="inline-block min-w-full align-middle px-4 md:px-0">
                  <table class="min-w-full text-sm">
                    <thead>
                      <tr class="border-b-2 border-gray-200">
                        <th class="py-3 px-2 text-left text-gray-700 font-semibold whitespace-nowrap">No.</th>
                        <th class="py-3 px-3 text-left text-gray-700 font-semibold whitespace-nowrap min-w-[150px]">NAMA PRODUK</th>
                        <th class="py-3 px-2 text-center text-gray-700 font-semibold whitespace-nowrap">QTY</th>
                        <th class="py-3 px-3 text-right text-gray-700 font-semibold whitespace-nowrap">HARGA</th>
                        <th class="py-3 px-3 text-right text-gray-700 font-semibold whitespace-nowrap">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="(item, i) in transaction.transaction_details" 
                        :key="item.id" 
                        class="border-b hover:bg-gray-50"
                      >
                        <td class="py-4 px-2">{{ i + 1 }}</td>
                        <td class="py-4 px-3 font-medium text-gray-800">
                          <div class="min-w-[150px]">{{ item.product?.title ?? '-' }}</div>
                        </td>
                        <td class="py-4 px-2 text-center whitespace-nowrap">{{ item.qty }}</td>
                        <td class="py-4 px-3 text-right text-gray-600 whitespace-nowrap">
                          Rp {{ formatRupiah(item.price / item.qty) }}
                        </td>
                        <td class="py-4 px-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          Rp {{ formatRupiah(item.price) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="md:hidden mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span>Geser ke kanan untuk melihat detail</span>
              </div>
            </div>
            <!-- Detail Perhitungan Step-by-Step -->
            <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
              <h2 class="text-lg font-semibold mb-6 flex items-center gap-2 text-indigo-900">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
                        : 'bg-white/60 border-gray-200'
                  ]"
                >
                  <!-- Step Header -->
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-3">
                      <div 
                        :class="[
                          'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                          calc.isFinal 
                            ? 'bg-white text-purple-700' 
                            : 'bg-' + calc.color + '-100 text-' + calc.color + '-700'
                        ]"
                      >
                        {{ calc.step }}
                      </div>
                      <span 
                        :class="[
                          'font-semibold text-sm',
                          calc.isFinal ? 'text-white text-lg' : 'text-gray-800'
                        ]"
                      >
                        {{ calc.label }}
                      </span>
                    </div>
                    <span 
                      :class="[
                        'font-bold text-right',
                        calc.isFinal ? 'text-white text-2xl' : 'text-' + calc.color + '-700 text-lg'
                      ]"
                    >
                      Rp {{ formatRupiah(calc.value) }}
                    </span>
                  </div>

                  <!-- Formula/Calculation -->
                  <div 
                    v-if="calc.formula" 
                    :class="[
                      'text-xs mt-2 p-2 rounded-lg font-mono',
                      calc.isFinal 
                        ? 'bg-purple-800/30 text-purple-100' 
                        : calc.highlight 
                          ? 'bg-' + calc.color + '-50 text-' + calc.color + '-800 border border-' + calc.color + '-200' 
                          : 'bg-gray-50 text-gray-600'
                    ]"
                  >
                    {{ calc.formula }}
                  </div>
                </div>
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
  button, nav, header { display: none !important; }
}
/* ✅ Custom scrollbar untuk tabel horizontal scroll */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #6366f1 #e5e7eb;
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

/* ✅ Smooth scroll behavior */
.overflow-x-auto {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
</style>
