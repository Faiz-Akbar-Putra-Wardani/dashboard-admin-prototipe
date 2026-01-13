<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import Api from "@/services/api";
import Cookies from "js-cookie";
import AdminLayout from "@/components/layout/AdminLayout.vue";

const router = useRouter();

const recaps = ref([]);
const isLoading = ref(false);
const showPrintModal = ref(false);

const filters = ref({
  type: "",
  search: "",
  group: false,
});

const pagination = ref({
  currentPage: 1,
  perPage: 5,
  total: 0,
  totalPages: 1,
});

// PRINT OPTIONS
const printOptions = ref({
  scope: 'current', // 'current', 'all', 'type'
  selectedType: ''
});

const fetchData = async (page = 1) => {
  try {
    isLoading.value = true;
    pagination.value.currentPage = page;

    const token = Cookies.get("token");
    Api.defaults.headers.common.Authorization = token;

    const params = {
      page,
      limit: pagination.value.perPage,
      type: filters.value.type || undefined,
      search: filters.value.search || undefined,
      group: filters.value.group || undefined,
    };

    const res = await Api.get("/api/reports/customer-recap", { params });

    recaps.value = res.data?.data || [];
    const meta = res.data?.meta?.pagination;

    if (meta) {
      pagination.value.total = meta.total;
      pagination.value.totalPages = meta.totalPages;
    }
  } finally {
    isLoading.value = false;
  }
};

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.totalPages) return;
  fetchData(page);
};

const searchHandler = () => fetchData(1);

// FUNGSI PRINT
const openPrintModal = () => {
  showPrintModal.value = true;
  printOptions.value.selectedType = filters.value.type || '';
};

const executePrint = () => {
  const query = {
    group: filters.value.group || false,
    search: filters.value.search || ''
  };

  if (printOptions.value.scope === 'current') {
    // Print halaman saat ini
    query.page = pagination.value.currentPage;
    query.type = filters.value.type || '';
  } else if (printOptions.value.scope === 'all') {
    // Print semua data
    query.all = true;
    query.type = filters.value.type || '';
  } else if (printOptions.value.scope === 'type') {
    // Print berdasarkan type tertentu
    query.all = true;
    query.type = printOptions.value.selectedType;
  }

  router.push({
    path: '/reports/print',
    query
  });

  showPrintModal.value = false;
};

watch(
  () => [filters.value.type, filters.value.group],
  () => fetchData(1)
);

// Tambahkan fungsi ini di <script setup>
const exportExcel = async () => {
  try {
    isLoading.value = true;

    const token = Cookies.get("token");
    Api.defaults.headers.common.Authorization = token;

    // Parameter sama seperti getCustomerRecap
    const params = {
      type: filters.value.type || undefined,
      search: filters.value.search || undefined,
    };

    // Download file Excel
    const response = await Api.get("/api/reports/customer-recap/export", { 
      params,
      responseType: 'blob' // Penting untuk download file
    });

    // Buat URL dan trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Pelanggan_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Export failed:', error);
    alert('Gagal export Excel. Silakan coba lagi.');
  } finally {
    isLoading.value = false;
  }
};


onMounted(() => fetchData());
</script>

<template>
  <AdminLayout>
    <div class="p-4 sm:p-6 lg:p-8">
      <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6">

        <!-- HEADER -->
        <div class="mb-6 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Rekap data pelanggan
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Daftar rekap data pelanggan
            </p>
          </div>

         <div class="flex gap-3">
            <!-- Tombol Print (yang sudah ada) -->
            <button
              @click="openPrintModal"
              class="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span class="font-semibold">Export PDF</span>
            </button>

            <!-- Tombol Export Excel BARU -->
            <button
              @click="exportExcel"
              class="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              :disabled="isLoading"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="font-semibold">Export Excel</span>
            </button>
          </div>
        </div>

        <!-- SEARCH & FILTER -->
        <div class="flex gap-3 mb-6 flex-col sm:flex-row">

          <!-- SELECT TYPE -->
          <select
            v-model="filters.type"
            class="w-full sm:w-48 px-4 py-3 rounded-xl border border-gray-300
                   dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua</option>
            <option value="penjualan">Penjualan</option>
            <option value="sewa">Sewa</option>
            <option value="perbaikan">Perbaikan</option>
          </select>

          <!-- CHECKBOX GROUP -->
          <label class="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
            <input
              type="checkbox"
              v-model="filters.group"
              class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kelompokkan per Pelanggan
            </span>
          </label>

          <!-- SEARCH INPUT -->
          <div class="relative flex-1">
            <input
              v-model="filters.search"
              @keydown.enter="searchHandler"
              type="text"
              placeholder="Cari invoice atau pelanggan..."
              class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300
                     dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg
              class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <!-- BUTTON -->
          <button
            @click="searchHandler"
            class="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            Cari
          </button>

        </div>

        <!-- LOADING -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>

        <!-- EMPTY -->
        <div v-else-if="recaps.length === 0" class="text-center py-16">
          <svg class="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400 font-medium">Tidak ada data rekap pelanggan</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Coba ubah filter atau kriteria pencarian</p>
        </div>

        <!-- TABLE -->
        <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-2xl">
          <table class="min-w-[800px] w-full text-sm">
            <thead class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
              <tr>
                <th class="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">No</th>
                <th v-if="!filters.group" class="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">Invoice</th>
                <th class="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">Pelanggan</th>
                <th v-if="!filters.group" class="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">Jenis</th>
                <th class="p-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in recaps"
                :key="i"
                class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="p-3 text-gray-600 dark:text-gray-400">
                  {{ (pagination.currentPage - 1) * pagination.perPage + i + 1 }}
                </td>
                <td v-if="!filters.group" class="p-3 font-medium text-gray-900 dark:text-white">
                  {{ r.invoice }}
                </td>
                <td class="p-3 text-gray-900 dark:text-white font-medium">
                  {{ r.perusahaan }}
                </td>
                <td v-if="!filters.group" class="p-3 text-center">
                  <span 
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                    :class="{
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': r.type === 'penjualan',
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': r.type === 'sewa',
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400': r.type === 'perbaikan'
                    }"
                  >
                    {{ r.type }}
                  </span>
                </td>
                <td class="p-3 text-right font-bold text-gray-900 dark:text-white">
                  Rp {{ Number(r.total || 0).toLocaleString("id-ID") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="pagination.total > pagination.perPage"
          class="mt-6 flex justify-between items-center flex-wrap gap-4"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan
            <span class="font-semibold text-gray-700 dark:text-gray-300">
              {{ (pagination.currentPage - 1) * pagination.perPage + 1 }}
            </span>
            -
            <span class="font-semibold text-gray-700 dark:text-gray-300">
              {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }}
            </span>
            dari
            <span class="font-semibold text-gray-700 dark:text-gray-300">
              {{ pagination.total }}
            </span>
          </p>

          <div class="flex gap-2">
            <button
              @click="goToPage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Prev
            </button>
            
            <!-- Page Numbers -->
            <div class="hidden sm:flex gap-1">
              <button
                v-for="page in Math.min(pagination.totalPages, 5)"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-4 py-2 rounded-lg border transition-all font-medium',
                  pagination.currentPage === page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="goToPage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.totalPages"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- MODAL PRINT OPTIONS -->
    <div
      v-if="showPrintModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showPrintModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            Opsi Cetak
          </h3>
          <button
            @click="showPrintModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- OPTION: HALAMAN SAAT INI -->
          <label class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            :class="printOptions.scope === 'current' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600'"
          >
            <input
              type="radio"
              v-model="printOptions.scope"
              value="current"
              class="mt-1 w-4 h-4 text-indigo-600"
            />
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-white">Halaman Saat Ini</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cetak data halaman {{ pagination.currentPage }} ({{ recaps.length }} data)
              </p>
            </div>
          </label>

          <!-- OPTION: SEMUA DATA -->
          <label class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            :class="printOptions.scope === 'all' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600'"
          >
            <input
              type="radio"
              v-model="printOptions.scope"
              value="all"
              class="mt-1 w-4 h-4 text-indigo-600"
            />
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-white">Semua Data</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cetak seluruh data ({{ pagination.total }} data)
                <span v-if="filters.type"> - {{ filters.type }}</span>
              </p>
            </div>
          </label>

          <!-- OPTION: BERDASARKAN JENIS -->
          <label class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            :class="printOptions.scope === 'type' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600'"
          >
            <input
              type="radio"
              v-model="printOptions.scope"
              value="type"
              class="mt-1 w-4 h-4 text-indigo-600"
            />
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-white mb-2">Berdasarkan Jenis</p>
              <select
                v-model="printOptions.selectedType"
                @click="printOptions.scope = 'type'"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih Jenis Transaksi</option>
                <option value="penjualan">Penjualan</option>
                <option value="sewa">Sewa</option>
                <option value="perbaikan">Perbaikan</option>
              </select>
            </div>
          </label>
        </div>

        <!-- BUTTONS -->
        <div class="flex gap-3 mt-6">
          <button
            @click="showPrintModal = false"
            class="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
          >
            Batal
          </button>
          <button
            @click="executePrint"
            :disabled="printOptions.scope === 'type' && !printOptions.selectedType"
            class="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cetak
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
