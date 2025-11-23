<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Api from "@/services/api";
import Cookies from "js-cookie";
import { toast } from "vue3-toastify";

import AdminLayout from "@/components/layout/AdminLayout.vue";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const rental = ref(null);
const loading = ref(true);

// status
const newStatus = ref("");
const statusUpdating = ref(false);

// Format Rupiah
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID").format(value);

// Format Tanggal
const formatDate = (val) => {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Ambil Detail Rental
const fetchDetail = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get(`/api/rentals/${id}`);
    rental.value = res.data.data;

    newStatus.value = rental.value.status;
  } catch (err) {
    toast.error("Gagal mengambil detail rental");
  } finally {
    loading.value = false;
  }
};

// Update status rental
const updateStatus = async () => {
  try {
    statusUpdating.value = true;

    await Api.put("/api/rentals/status", {
      invoice: rental.value.invoice,
      status: newStatus.value
    });

    rental.value.status = newStatus.value;

    toast.success("Status berhasil diperbarui");
  } catch (err) {
    toast.error("Gagal mengubah status");
  } finally {
    statusUpdating.value = false;
  }
};

// Print halaman rental
const openPrintPage = () => {
  window.open(`/rental/print?invoice=${rental.value.invoice}`, "_blank");
};

onMounted(() => fetchDetail());
</script>

<template>
  <admin-layout>
    <div class="max-w-7xl mx-auto p-6">

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-500">
        Memuat detail rental...
      </div>

      <div v-else>
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            Detail Rental / 
            <span class="text-indigo-600">#{{ rental.invoice }}</span>
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

          <!-- Kiri: Info Rental -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6">Informasi Rental</h2>

            <div class="space-y-4 text-sm">

              <div class="flex justify-between">
                <span class="text-gray-600">Invoice</span>
                <span class="font-medium">#{{ rental.invoice }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Customer</span>
                <span class="font-medium">
                  {{ rental.customer?.name_perusahaan ?? "-" }}
                </span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal Mulai</span>
                <span>{{ formatDate(rental.start_date) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal Selesai</span>
                <span>{{ formatDate(rental.end_date) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">DP</span>
                <span>Rp {{ formatRupiah(rental.dp) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Harga Sewa</span>
                <span>Rp {{ formatRupiah(rental.rent_price) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-600">Status</span>
                <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  {{ newStatus.toUpperCase() }}
                </span>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <div class="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span class="text-indigo-600">
                    Rp {{ formatRupiah(rental.rent_price) }}
                  </span>
                </div>
              </div>

            </div>

            <!-- Update Status -->
            <div class="mt-8 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ubah Status</label>

                <select 
                  v-model="newStatus"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="returned">Returned</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button
                @click="updateStatus"
                :disabled="statusUpdating"
                class="w-full mt-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {{ statusUpdating ? "Memperbarui..." : "Perbarui" }}
              </button>
            </div>
          </div>

          <!-- Kanan: Detail Produk -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6">Produk Disewa</h2>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="py-3 text-left">No</th>
                    <th class="py-3 text-left">Produk</th>
                    <th class="py-3 text-center">Qty</th>
                    <th class="py-3 text-right">Harga Sewa</th>
                  </tr>
                </thead>

                <tbody>
                  <tr 
                    v-for="(item, index) in rental.details" 
                    :key="item.id"
                    class="border-b"
                  >
                    <td class="py-4">{{ index + 1 }}</td>
                    <td class="py-4 font-medium">{{ item.product?.title }}</td>
                    <td class="py-4 text-center">{{ item.qty }}</td>
                    <td class="py-4 text-right">
                      Rp {{ formatRupiah(item.rent_price) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-8 text-right">
              <div class="text-lg font-bold text-gray-800">Total</div>
              <div class="text-2xl font-bold text-indigo-600">
                Rp {{ formatRupiah(rental.rent_price) }}
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
