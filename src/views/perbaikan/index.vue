<script setup>
import { ref, onMounted } from "vue";
import dayjs from "dayjs";

import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

import AdminLayout from "@/components/layout/AdminLayout.vue";
import DeleteModal from "@/components/DeleteButton.vue";
import Api from "@/services/api";
import Cookies from "js-cookie";

const repairs = ref([]);
const keywords = ref("");

const isLoading = ref(false);

const pagination = ref({
  currentPage: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
});

const formatDate = (date) => {
  if (!date) return "-";

  const parsed = dayjs(date);

  if (!parsed.isValid()) return "-";

  return parsed.format("DD MMM YYYY");
};

const getRepairDates = (repair) => {
  if (!repair.start_date || !repair.end_date) {
    return { start: "-", end: "-" };
  }

  return {
    start: formatDate(repair.start_date),
    end: formatDate(repair.end_date),
  };
};

const fetchData = async (pageNumber = 1, search = "") => {
  const token = Cookies.get("token");
  if (!token) {
    toast.error("Token tidak ditemukan, silakan login ulang.");
    return;
  }

  Api.defaults.headers.common["Authorization"] = token;

  try {
    isLoading.value = true;
    const res = await Api.get(`/api/repairs?page=${pageNumber}&search=${search}`);

    repairs.value = res.data.data;

    pagination.value = {
      currentPage: res.data.meta.pagination.currentPage,
      perPage: res.data.meta.pagination.perPage,
      total: res.data.meta.pagination.total,
      totalPages: res.data.meta.pagination.totalPages,
    };

  } catch (error) {
    console.error("Gagal ambil data perbaikan:", error);
    toast.error("Gagal mengambil data perbaikan.");
  } finally {
    isLoading.value = false;
  }
};

const searchHandler = () => fetchData(1, keywords.value);

const goToPage = (page) => {
  pagination.value.currentPage = page;
  fetchData(page, keywords.value);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <admin-layout>
    <div class="mx-auto w-full max-w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div class="rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-indigo-100 dark:bg-gray-900/90 dark:border-indigo-900/50 p-6 lg:p-8">

        <!-- HEADER -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Data Perbaikan
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Daftar semua transaksi perbaikan barang
            </p>
          </div>

          <!-- BUTTON TAMBAH PERBAIKAN -->
          <router-link
            to="/repairs/create"
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
            Tambah Perbaikan
          </router-link>
        </div>

        <!-- SEARCH -->
        <div class="relative mb-6">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <input
                v-model="keywords"
                @keydown.enter="searchHandler"
                type="text"
                placeholder="Cari invoice, barang, atau customer..."
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

        <!-- LOADING -->
        <div v-if="isLoading" class="space-y-4">
          <div v-for="n in 5" :key="n" class="animate-pulse">
            <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>

        <!-- EMPTY STATE -->
        <div
          v-else-if="repairs.length === 0"
          class="text-center py-16"
        >
          <div
            class="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Belum ada transaksi perbaikan
          </p>
        </div>

        <!-- TABEL DESKTOP -->
        <div
          v-else
          class="w-full rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div class="w-full overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <div class="max-h-[420px] overflow-y-auto">
              <table class="min-w-max w-full">
                <thead
                  class="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50 sticky top-0 z-10"
                >
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">No</th>
                    <th class="px-6 py-4 text-center text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Invoice</th>
                    <th class="px-6 py-4 text-center text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Pelanggan</th>
                    <th class="px-6 py-4 text-center text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Tanggal Estimasi</th>
                    <th class="px-6 py-4 text-center text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Barang Perbaikan</th>
                    <th class="px-6 py-4 text-center text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Total Biaya</th>
                    <th class="px-6 py-4 text-center text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Status</th>
                    <th class="px-6 py-4 text-right text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">Aksi</th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr
                    v-for="(r, i) in repairs"
                    :key="r.id"
                    class="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {{ (pagination.currentPage - 1) * pagination.perPage + i + 1 }}
                    </td>

                    <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-center">
                      {{ r.invoice }}
                    </td>

                    <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-center">
                      {{ r.customer?.name_perusahaan ?? "-" }}
                    </td>

                    <td class="px-6 py-4 text-center whitespace-nowrap">
                      <div class="flex flex-col items-center">
                        <div class="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {{ getRepairDates(r).start }}
                        </div>
                        <div class="text-xs text-gray-500">
                          s/d {{ getRepairDates(r).end }}
                        </div>
                      </div>
                    </td>

                    <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-center">
                      {{ r.item_repair ?? "-" }}
                    </td>

                    <td class="px-6 py-4 text-sm font-bold text-green-600 text-center">
                      Rp {{ new Intl.NumberFormat("id-ID").format(r.repair_cost) }}
                    </td>

                    <td class="px-6 py-4 text-center">
                      <span
                        :class="[
                          'px-3 py-1 rounded-xl text-xs font-semibold',
                          r.status === 'process'
                            ? 'bg-blue-100 text-blue-700'
                            : r.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : r.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-200 text-gray-700'
                        ]"
                      >
                        {{ r.status }}
                      </span>
                    </td>

                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <!-- TOMBOL DETAIL (BARU) -->
                        <router-link
                          :to="`/repairs/detail/${r.id}`"
                          class="p-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Detail"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </router-link>

                        <!-- TOMBOL EDIT -->
                        <router-link
                          :to="`/repairs/edit/${r.id}`"
                          class="p-2.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 
                                112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </router-link>

                        <!-- TOMBOL DELETE -->
                        <delete-modal
                          :id="r.id"
                          endpoint="/api/repairs"
                          :fetchData="fetchData"
                          class="text-red-600 hover:text-red-700 hover:bg-red-50 p-2.5 rounded-xl transition-all"
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
                        </delete-modal>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="pagination.total > pagination.perPage && !isLoading"
          class="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan
            {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} -
            {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }}
            dari {{ pagination.total }} data
          </p>

          <div class="flex items-center gap-2">
            <button
              @click="goToPage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              v-for="page in pagination.totalPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'w-11 h-11 rounded-xl border flex items-center justify-center text-sm font-medium transition-all',
                page === pagination.currentPage
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50',
              ]"
            >
              {{ page }}
            </button>

            <button
              @click="goToPage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.totalPages"
              class="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>
