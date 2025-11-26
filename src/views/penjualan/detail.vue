<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import Api from "@/services/api";
import Cookies from "js-cookie";

import AdminLayout from "@/components/layout/AdminLayout.vue";
import { moneyFormat } from "@/utils/moneyFormat";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const transaction = ref(null);
const loading = ref(true);
const newStatus = ref("");
const statusUpdating = ref(false);

const fetchDetail = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get(`/api/transactions/${id}`);
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

    await Api.put("/api/transactions/status", {
      invoice: transaction.value.invoice,
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
            <h2 class="text-lg font-semibold mb-6">Informasi Pesanan</h2>

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

              <div class="flex justify-between">
                <span class="text-gray-600">pph</span>
                <span>{{ transaction.pph }}%</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">pph</span>
                <span>{{ moneyFormat(transaction.pph_nominal) }} </span>
              </div>

               <div class="flex justify-between">
                <span class="text-gray-600">Subtotal</span>
                <span>{{ moneyFormat(transaction.subtotal) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Tambahan Biaya</span>
                <span>{{ moneyFormat(transaction.extra) }}</span>
              </div>

               <div class="flex justify-between">
                <span class="text-gray-600">Total Tambahan Biaya</span>
                <span>{{ moneyFormat(transaction.subtotalPlusExtra) }}</span>
              </div>

               <div class="flex justify-between">
                <span class="text-gray-600">Nego</span>
                <span>{{ moneyFormat(transaction.nego) }}</span>
              </div>

               <div class="flex justify-between">
                <span class="text-gray-600">Dp</span>
                <span>{{ moneyFormat(transaction.dp) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-600">Status</span>
                <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  {{ newStatus.toUpperCase() }}
                </span>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <!-- <div class="flex justify-between text-base font-semibold">
                  <span>Total Biaya</span>
                  <span class="text-indigo-600">Rp {{ formatRupiah(transaction.subtotalPlusExtra) }}</span>
                </div> -->
                <div class="flex justify-between text-base font-semibold">
                  <span>Total/Sisa bayar</span>
                  <span class="text-indigo-600">Rp {{ formatRupiah(transaction.grand_total) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-8 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
                {{ statusUpdating ? 'Memperbarui...' : 'Perbarui' }}
              </button>
            </div>
          </div>

          <!-- Kanan: Daftar Paket (persis seperti gambar) -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6">Daftar Paket</h2>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="py-3 text-left text-gray-700">No.</th>
                    <th class="py-3 text-left text-gray-700">NAMA PRODUK</th>
                    <th class="py-3 text-center text-gray-700">QTY</th>
                    <th class="py-3 text-right text-gray-700">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in transaction.transaction_details" :key="item.id" class="border-b">
                    <td class="py-4">{{ i + 1 }}</td>
                    <td class="py-4 font-medium">{{ item.product?.title ?? 'In repellendus iste.' }}</td>
                    <td class="py-4 text-center">{{ item.qty }}</td>
                    <td class="py-4 text-right">Rp {{ formatRupiah(item.price) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-8 flex justify-end">
              <div class="text-right">
                <div class="text-lg font-bold text-gray-800">Total/Sisa Bayar</div>
                <div class="text-2xl font-bold text-indigo-600">
                  Rp {{ formatRupiah(transaction.grand_total) }}
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
</style>