<script setup>
import { ref, onMounted } from "vue";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

import AdminLayout from "@/components/layout/AdminLayout.vue";
import DeleteModal from "@/components/DeleteButton.vue";

import Api from "@/services/api";
import Cookies from "js-cookie";

// State utama
const details = ref([]);
const keywords = ref("");
const isLoading = ref(true);

const pagination = ref({
  currentPage: 1,
  perPage: 5,
  total: 0,
});

// Ambil data detail produk dari API
const fetchData = async (pageNumber = 1, search = "") => {
  const token = Cookies.get("token");

  if (!token) {
    toast.error("Token tidak ditemukan, silakan login ulang.");
    return;
  }

  Api.defaults.headers.common["Authorization"] = token;

  try {
    const response = await Api.get(
      `/api/detail-products?page=${pageNumber}&search=${search}`
    );

    details.value = response.data.data;
    pagination.value = {
      currentPage: response.data.pagination?.currentPage || 1,
      perPage: response.data.pagination?.perPage || 5,
      total: response.data.pagination?.total || response.data.data.length,
    };
  } catch (error) {
    console.error("Gagal ambil data detail produk:", error);
    toast.error("Gagal mengambil data detail produk.");
  } finally {
    isLoading.value = false;
  }
};

// Fungsi pencarian
const searchHandler = () => {
  fetchData(1, keywords.value);
};

// Fungsi pagination
const goToPage = (page) => {
  if (page >= 1 && page <= Math.ceil(pagination.value.total / pagination.value.perPage)) {
    fetchData(page, keywords.value);
  }
};

// Lifecycle
onMounted(() => {
  fetchData();
});
</script>

<template>
  <AdminLayout>
    <div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div
        class="rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-indigo-100 dark:bg-gray-900/90 dark:border-indigo-900/50 p-6 lg:p-8"
      >
        <!-- Header -->
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Detail Produk
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Daftar spesifikasi detail setiap produk
            </p>
          </div>

          <router-link
            to="/detail-products/create"
            class="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium text-sm px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg
              class="w-5 h-5 group-hover:rotate-90 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Detail
          </router-link>
        </div>

        <!-- Search -->
        <div class="relative mb-6">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <input
                v-model="keywords"
                @keydown.enter="searchHandler"
                type="text"
                placeholder="Cari model atau produk..."
                class="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-all"
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
            <button
              @click="searchHandler"
              class="px-6 py-3.5 bg-indigo-600 text-white font-medium text-sm rounded-2xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              Cari
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="space-y-4">
          <div v-for="n in 5" :key="n" class="animate-pulse">
            <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>

        <!-- Table -->
      <div
  v-else-if="details.length > 0"
  class="overflow-x-auto w-full rounded-2xl border border-gray-200 dark:border-gray-700"
>
  <table class="min-w-max w-full">
            <thead
              class="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50"
            >
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">No</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Produk</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Model</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Cylinder</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Voltage</th>
                <th class="px-6 py-4 text-right text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="(item, i) in details"
                :key="item.id"
                class="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ (pagination.currentPage - 1) * pagination.perPage + i + 1 }}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                  {{ item.product?.title || '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ item.model || '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ item.cylinder || '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ item.voltage || '-' }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <router-link
                      :to="`/detail-products/edit/${item.uuid}`"
                      class="p-2.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </router-link>

                    <DeleteModal
                      :uuid="item.uuid"
                      endpoint="/api/detail-products"
                      :fetchData="fetchData"
                       class="p-2 rounded-xl transition-all"
                    >
                      <template #trigger>
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2.2 2.2 0 0116.138 21H7.862a2.2 2.2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </template>
                    </DeleteModal>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty -->
        <div v-else class="text-center py-16">
          <div class="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              class="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Belum ada data detail produk
          </p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
