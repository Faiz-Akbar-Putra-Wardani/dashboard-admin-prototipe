<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import Api from "@/services/api";
import Cookies from "js-cookie";

import AdminLayout from "@/components/layout/AdminLayout.vue";

const route = useRoute();
const router = useRouter();
const uuid = route.params.uuid;

const transaction = ref(null);
const loading = ref(true);
const newStatus = ref("");
const statusUpdating = ref(false);

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID").format(value ?? 0);

const formatDate = (val) =>
  new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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

// DETAIL PERHITUNGAN (PPN)
const calculationSteps = computed(() => {
  if (!transaction.value) return [];

  const subtotal = Number(transaction.value.subtotal) || 0;
  const ppn = Number(transaction.value.ppn) || 0;
  const nego = Number(transaction.value.nego) || 0;
  const dp = Number(transaction.value.dp) || 0;

  const ppnNominal = subtotal * (ppn / 100);
  const totalBeforeNego = subtotal + ppnNominal;
  const totalAfterNego = totalBeforeNego - nego;
  const grandTotal = Number(transaction.value.grand_total ?? totalAfterNego) || 0;

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
      label: `PPN ${ppn}% dari Subtotal`,
      value: ppnNominal,
      formula: `Rp ${formatRupiah(subtotal)} × ${ppn}% = Rp ${formatRupiah(ppnNominal)}`,
      color: "amber",
      highlight: true,
    },
    {
      step: 3,
      label: "Total Sebelum Nego",
      value: totalBeforeNego,
      formula: `Rp ${formatRupiah(subtotal)} + Rp ${formatRupiah(ppnNominal)} = Rp ${formatRupiah(totalBeforeNego)}`,
      color: "indigo",
      highlight: true,
    },
    {
      step: 4,
      label: "Potongan Harga Nego",
      value: nego,
      formula: nego > 0 ? `- Rp ${formatRupiah(nego)}` : "Tidak ada nego",
      color: nego > 0 ? "red" : "gray",
    },
    {
      step: 5,
      label: "Total Setelah Nego",
      value: totalAfterNego,
      formula:
        nego > 0
          ? `Rp ${formatRupiah(totalBeforeNego)} - Rp ${formatRupiah(nego)} = Rp ${formatRupiah(totalAfterNego)}`
          : `Rp ${formatRupiah(totalBeforeNego)}`,
      color: "cyan",
      highlight: true,
    },
    {
      step: 6,
      label: "Down Payment (DP)",
      value: dp,
      formula: dp > 0 ? `Rp ${formatRupiah(dp)}` : "Tidak ada DP",
      color: dp > 0 ? "red" : "gray",
    },
    {
      step: 7,
      label: "TOTAL / SISA BAYAR",
      value: grandTotal,
      formula:
        dp > 0
          ? `Rp ${formatRupiah(totalAfterNego)} - Rp ${formatRupiah(dp)} = Rp ${formatRupiah(totalAfterNego - dp)}`
          : `Rp ${formatRupiah(totalAfterNego)}`,
      color: "purple",
      isFinal: true,
    },
  ];
});

onMounted(fetchDetail);
</script>

<template>
  <admin-layout>
    <div class="max-w-7xl mx-auto p-6">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-500">
        Memuat detail...
      </div>

      <div v-else>
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            Detail Penjualan /
            <span class="text-indigo-600">#{{ transaction.invoice }}</span>
          </h1>

          <button
            @click="openPrintPage"
            class="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2"
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
          <!-- KIRI: INFO PENJUALAN (mirror Informasi Perbaikan) -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6">Informasi Penjualan</h2>

            <div class="space-y-4 text-sm">
              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Invoice</span>
                <span class="font-medium break-all">#{{ transaction.invoice }}</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Customer</span>
                <span class="font-medium break-words text-left">
                  {{ transaction.customer?.name_perusahaan ?? "-" }}
                </span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Tanggal</span>
                <span>{{ formatDate(transaction.created_at) }}</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">PPN</span>
                <span>{{ transaction.ppn }}%</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span class="text-gray-600">Harga Produk (Subtotal)</span>
                <span class="font-medium">Rp {{ formatRupiah(transaction.subtotal) }}</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-between gap-1 items-start sm:items-center">
                <span class="text-gray-600">Status</span>
                <span
                  class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                >
                  {{ newStatus.toUpperCase() }}
                </span>
              </div>
            </div>
            <!-- Update Status -->
            <div class="mt-8 space-y-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Ubah Status</label>
              <select
                v-model="newStatus"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="proses">Proses</option>
                <option value="dikirim">Dikirim</option>
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
            <!-- Daftar Produk -->
            <div>
              <h2 class="text-lg font-semibold mb-6">Daftar Produk</h2>

              <!-- Desktop: Table View -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b-2 border-gray-200">
                      <th class="py-3 px-2 text-left">No</th>
                      <th class="py-3 px-2 text-left">Produk</th>
                      <th class="py-3 px-2 text-center">QTY</th>
                      <th class="py-3 px-2 text-center">PPN</th>
                      <th class="py-3 px-2 text-right">Harga Satuan</th>
                      <th class="py-3 px-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, i) in transaction.transaction_details"
                      :key="item.id"
                      class="border-b"
                    >
                      <td class="py-4 px-2">{{ i + 1 }}</td>
                      <td class="py-4 px-2 font-medium">
                        {{ item.product?.title ?? "-" }}
                      </td>
                      <td class="py-4 px-2 text-center">
                        {{ item.qty }}
                      </td>
                      <td class="py-4 px-2 text-center">
                        {{ transaction.ppn }}%
                      </td>
                      <td class="py-4 px-2 text-right text-gray-600">
                        Rp {{ formatRupiah(item.price / item.qty) }}
                      </td>
                      <td class="py-4 px-2 text-right font-semibold">
                        Rp {{ formatRupiah(item.price) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile: Card View -->
              <div class="md:hidden space-y-3">
                <div
                  v-for="(item, i) in transaction.transaction_details"
                  :key="item.id"
                  class="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex-1 pr-2">
                      <div class="text-xs text-gray-500 mb-1">Produk #{{ i + 1 }}</div>
                      <div class="font-semibold text-sm text-gray-900 break-words">
                        {{ item.product?.title ?? "-" }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex flex-col">
                      <span class="text-gray-500">QTY</span>
                      <span class="font-medium">{{ item.qty }}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-gray-500">PPN</span>
                      <span class="font-medium">{{ transaction.ppn }}%</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-gray-500">Harga Satuan</span>
                      <span class="font-medium">Rp {{ formatRupiah(item.price / item.qty) }}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-gray-500">Subtotal</span>
                      <span class="font-semibold text-indigo-600">Rp {{ formatRupiah(item.price) }}</span>
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

                  <!-- Harga - Menggunakan flex untuk menjaga Rp dan angka sejajar -->
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
                Rp {{ formatRupiah(transaction.grand_total) }}
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
</style>
