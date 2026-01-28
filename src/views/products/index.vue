<script setup>
import { ref, onMounted } from "vue";
import Swal from "sweetalert2";

import AdminLayout from "@/components/layout/AdminLayout.vue";
import DeleteModal from "@/components/DeleteButton.vue";

import Api from "@/services/api";
import Cookies from "js-cookie";
import { getImageUrl } from "@/utils/getImageUrl";
import { moneyFormat } from "@/utils/moneyFormat";

// State
const products = ref([]);
const keywords = ref("");
const isLoading = ref(true);

const pagination = ref({
  currentPage: 1,
  perPage: 5,
  total: 0,
  totalPages: 1, 
});

// Ambil data produk dari API
const fetchData = async (pageNumber = 1, search = "") => {
  const token = Cookies.get("token");

  if (!token) {
    await Swal.fire({
      icon: "error",
      title: "Sesi Berakhir",
      text: "Token tidak ditemukan, silakan login ulang.",
      confirmButtonText: "Login",
      confirmButtonColor: "#ef4444",
    });
    return;
  }

  Api.defaults.headers.common["Authorization"] = token;

  try {
    isLoading.value = true; 
    const response = await Api.get(
      `/api/products?page=${pageNumber}&search=${search}`
    );
    products.value = response.data.data;
    pagination.value = {
      currentPage: response.data.pagination.currentPage,
      perPage: response.data.pagination.perPage,
      total: response.data.pagination.total,
      totalPages: Math.ceil(response.data.pagination.total / response.data.pagination.perPage),
    };
  } catch (error) {
    console.error("Gagal ambil data:", error);
    await Swal.fire({
      icon: "error",
      title: "Gagal Memuat Data",
      text: error.response?.data?.meta?.message || "Gagal mengambil data produk. Silakan coba lagi.",
      confirmButtonText: "Tutup",
      confirmButtonColor: "#ef4444",
    });
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
  if (page < 1 || page > pagination.value.totalPages) return; 
  fetchData(page, keywords.value);
};

// Saat komponen di-mount
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
              Daftar Produk
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola data produk di sini
            </p>
          </div>

          <router-link
            to="/products/create"
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
            Tambah Produk
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
                placeholder="Cari produk..."
                class="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-all"
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

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="space-y-4">
          <div v-for="n in 5" :key="n" class="animate-pulse">
            <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>

        <!-- Table -->
        <div
          v-else-if="products.length > 0"
          class="overflow-x-auto w-full rounded-2xl border border-gray-200 dark:border-gray-700"
        >
          <table class="min-w-full w-full">
            <thead
              class="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50"
            >
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">No</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Gambar</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Nama Produk</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Kategori</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Harga Jual</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Harga Sewa</th>
                <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Stok</th>
                <th class="px-6 py-4 text-right text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Aksi</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(product, i) in products"
                :key="product.id"
                class="border-t border-gray-200 dark:border-gray-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ (pagination.currentPage - 1) * pagination.perPage + i + 1 }}
                </td>
                <td class="px-6 py-4">
                  <img
                    :src="getImageUrl(product.image)"
                    alt="product"
                    class="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                  />
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                  {{ product.title }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ product.category?.name || "-" }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ moneyFormat(product.sell_price) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ moneyFormat(product.rent_price ?? "-") }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                  {{ product.stock }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex justify-end gap-2">
                    <router-link
                      :to="`/products/edit/${product.uuid}`"
                      class="p-2.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-all"
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
                      :uuid="product.uuid"
                      endpoint="/api/products"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <div
            class="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <svg
              class="w-12 h-12 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-2-2m0 0l-2-2m2 2l-2 2m2-2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2m10 10v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2m16 0H4"
              />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400 font-medium">
            Belum ada data produk
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Tambahkan data produk baru untuk memulai
          </p>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.total > pagination.perPage && !isLoading"
          class="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">
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
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="goToPage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.totalPages"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
