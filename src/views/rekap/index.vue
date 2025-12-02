<script setup>
import { ref, onMounted, watch } from "vue";
import Api from "@/services/api";
import Cookies from "js-cookie";
import AdminLayout from "@/components/layout/AdminLayout.vue";

const recaps = ref([]);
const isLoading = ref(false);

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

watch(
  () => [filters.value.type, filters.value.group],
  () => fetchData(1)
);

onMounted(() => fetchData());
</script>


<template>
  <AdminLayout>
    <div class="p-4 sm:p-6 lg:p-8">
      <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6">

        <!-- HEADER -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Rekap data pelanggan
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Daftar rekap data pelanggan
          </p>
        </div>

       <!-- SEARCH & FILTER -->
<div class="flex gap-3 mb-6 flex-col sm:flex-row">

  <!-- SELECT TYPE -->
  <select
    v-model="filters.type"
    class="w-full sm:w-48 px-4 py-3 rounded-xl border border-gray-300
           dark:border-gray-700 dark:bg-gray-800 text-sm"
  >
    <option value="">Semua</option>
    <option value="sale">Sale</option>
    <option value="rental">Rental</option>
    <option value="repair">Repair</option>
  </select>

  <!-- SEARCH INPUT -->
  <div class="relative flex-1">
    <input
      v-model="filters.search"
      @keydown.enter="searchHandler"
      type="text"
      placeholder="Cari invoice..."
      class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300
             dark:border-gray-700 dark:bg-gray-800"
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
    class="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
  >
    Cari
  </button>

</div>


        <!-- LOADING -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>

        <!-- EMPTY -->
        <div v-else-if="recaps.length === 0" class="text-center py-16 text-gray-500">
          Tidak ada data
        </div>

        <!-- TABLE -->
        <div v-else class="overflow-x-auto border rounded-2xl">
          <table class="min-w-[800px] w-full text-sm">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-3 text-left">No</th>
                <th v-if="!filters.group" class="p-3">Invoice</th>
                <th class="p-3">Pelanggan</th>
                <th class="p-3">Total</th>
                <th v-if="!filters.group" class="p-3">Jenis</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in recaps"
                :key="i"
                class="border-t dark:border-gray-700"
              >
                <td class="p-3">
                  {{ (pagination.currentPage - 1) * pagination.perPage + i + 1 }}
                </td>
                <td v-if="!filters.group" class="p-3">{{ r.invoice }}</td>
                <td class="p-3">{{ r.perusahaan }}</td>
                <td class="p-3">
                  Rp {{ Number(r.total || 0).toLocaleString("id-ID") }}
                </td>
                <td v-if="!filters.group" class="p-3">{{ r.type }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="pagination.total > pagination.perPage"
          class="mt-6 flex justify-between items-center flex-wrap gap-4"
        >
          <p class="text-sm text-gray-500">
            Menampilkan
            {{ (pagination.currentPage - 1) * pagination.perPage + 1 }}
            -
            {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }}
            dari {{ pagination.total }}
          </p>

          <div class="flex gap-2">
            <button
              @click="goToPage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="px-4 py-2 rounded-lg border disabled:opacity-50"
            >
              Prev
            </button>
            <button
              @click="goToPage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.totalPages"
              class="px-4 py-2 rounded-lg border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>
