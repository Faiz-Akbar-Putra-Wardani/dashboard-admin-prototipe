<script setup>

import { ref, onMounted } from "vue";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

import AdminLayout from "@/components/layout/AdminLayout.vue";
import DeleteModal from "../../components/DeleteButton.vue";

import Api from "@/services/api";
import Cookies from "js-cookie";

const customers = ref([]);
const keywords = ref("");

const pagination = ref({
  currentPage: 1,
  perPage: 5,
  total: 0,
});

const fetchData = async (pageNumber = 1, search = "") => {
  const token = Cookies.get("token");

  if (!token) {
    toast.error("Token tidak ditemukan, silakan login ulang.");
    return;
  }

  Api.defaults.headers.common["Authorization"] = token;

  try {
    const response = await Api.get(
      `/api/customers?page=${pageNumber}&search=${search}`
    );
    customers.value = response.data.data;
    pagination.value = {
      currentPage: response.data.pagination.currentPage,
      perPage: response.data.pagination.perPage,
      total: response.data.pagination.total,
    };
  } catch (error) {
    console.error("Gagal ambil data:", error);
    toast.error("Gagal mengambil data pelanggan.");
  }
};

const searchHandler = () => {
  fetchData(1, keywords.value);
};

onMounted(() => {
  fetchData();
});
</script>


<template>
  <admin-layout>
    <!-- Card Utama -->
    <div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div class="rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-indigo-100 dark:bg-gray-900/90 dark:border-indigo-900/50 p-6 lg:p-8">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Daftar Pelanggan
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola data pelanggan dengan mudah
            </p>
          </div>

          <!-- Tombol Tambah (Floating Style) -->
          <router-link
            to="/data-pelanggan/create"
            class="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium text-sm px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg class="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pelanggan
          </router-link>
        </div>

        <!-- Search Bar -->
        <div class="relative mb-6">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <input
                v-model="keywords"
                @keydown.enter="searchHandler"
                type="text"
                placeholder="Cari nama perusahaan..."
                class="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-all"
              />
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              @click="searchHandler"
              class="px-6 py-3.5 bg-indigo-600 text-white font-medium text-sm rounded-2xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              Cari
            </button>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="space-y-4">
          <div v-for="n in 5" :key="n" class="animate-pulse">
            <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>

       <div v-if="customers.length > 0">
  <div class="overflow-x-auto w-full rounded-2xl border border-gray-200 dark:border-gray-700 scrollbar-thin">
    <table class="min-w-max w-full">
      <thead class="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">No</th>
          <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Perusahaan</th>
          <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Telepon</th>
          <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Alamat</th>
          <th class="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Aksi</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(c, i) in customers"
          :key="c.id"
          class="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30"
        >
          <td class="px-6 py-4 text-sm">
            {{ (pagination.currentPage - 1) * pagination.perPage + i + 1 }}
          </td>
          <td class="px-6 py-4 text-sm font-semibold">{{ c.name_perusahaan }}</td>
          <td class="px-6 py-4 text-sm">{{ c.no_telp }}</td>
          <td class="px-6 py-4 text-sm max-w-xs truncate">{{ c.address }}</td>

          <td class="px-6 py-4 text-right">
            <div class="flex justify-end gap-2">
              <router-link
                :to="`/data-pelanggan/edit/${c.id}`"
                class="p-2.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 
                       112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </router-link>

              <delete-modal
                :id="c.id"
                endpoint="/api/customers"
                :fetchData="fetchData"
                class="p-2 bg-red-100 rounded-xl"
              >
                <template #trigger>🗑️</template>
              </delete-modal>
            </div>
          </td>

        </tr>
      </tbody>
    </table>
  </div>
</div>




        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <div class="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400">Belum ada data pelanggan</p>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total > pagination.perPage && !isLoading" class="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} - 
            {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }} 
            dari {{ pagination.total }} data
          </p>

          <div class="flex items-center gap-2">
            <button
              @click="goToPage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="flex items-center gap-1">
              <template v-for="page in Math.min(5, Math.ceil(pagination.total / pagination.perPage))" :key="page">
                <button
                  v-if="page === pagination.currentPage"
                  class="w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-md"
                >
                  {{ page }}
                </button>
                <button
                  v-else
                  @click="goToPage(page)"
                  class="w-11 h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all"
                >
                  {{ page }}
                </button>
              </template>
              <span v-if="Math.ceil(pagination.total / pagination.perPage) > 5" class="px-2 text-gray-500">...</span>
            </div>

            <button
              @click="goToPage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === Math.ceil(pagination.total / pagination.perPage)"
              class="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>
<style >
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 1.5rem;
}

.page-button,
.prev-button,
.next-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-button:hover,
.prev-button:hover,
.next-button:hover {
  background-color: #2563eb;
  color: white;
}

.active-page {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

</style>

