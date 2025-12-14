<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Api from "@/services/api";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

import AdminLayout from "@/components/layout/AdminLayout.vue";

const route = useRoute();
const router = useRouter();
const uuid = route.params.uuid;

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

const getMonths = (start, end) => {
  if (!start || !end) return 1;

  const s = new Date(start);
  const e = new Date(end);

  // Hitung selisih bulan dari tahun dan bulan
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());

  // Jika tanggal end LEBIH BESAR dari tanggal start, tambah 1 bulan
  if (e.getDate() > s.getDate()) {
    months += 1;
  }

  return months < 1 ? 1 : months;
};



// Cek apakah tanggal tiap produk berbeda
const hasMultipleDates = (details) => {
  if (!details || details.length === 0) return false;

  const s = details.map(d => d.start_date);
  const e = details.map(d => d.end_date);

  return new Set(s).size > 1 || new Set(e).size > 1;
};

// rentang tanggal utama
const getRentalDateRange = (details) => {
  if (!details || details.length === 0) return "-";

  const dates = details.map(d => ({
    start: new Date(d.start_date),
    end: new Date(d.end_date)
  }));

  const minStart = new Date(Math.min(...dates.map(d => d.start)));
  const maxEnd = new Date(Math.max(...dates.map(d => d.end)));

  return `${formatDate(minStart)} - ${formatDate(maxEnd)}`;
};

// tooltip detail tanggal per-produk
const getTooltipDates = (details) => {
  return details.map(d =>
    `${d.product?.title} : ${formatDate(d.start_date)} → ${formatDate(d.end_date)}`
  ).join("\n");
};


// Ambil Detail Rental
const fetchDetail = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get(`/api/rentals/${uuid}`);
    rental.value = res.data.data;

    newStatus.value = rental.value.status;
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Gagal mengambil detail rental",
      confirmButtonColor: "#e3342f",
    });
  } finally {
    loading.value = false;
  }
};

// Update status rental
const updateStatus = async () => {
  if (!newStatus.value) {
    Swal.fire({
      icon: "warning",
      title: "Status belum dipilih",
      text: "Pilih status sebelum memperbarui!",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  try {
    statusUpdating.value = true;

    await Api.patch(`/api/rentals/${rental.value.uuid}/status`, {
      status: newStatus.value,
    });

    rental.value.status = newStatus.value;

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Status rental berhasil diperbarui",
      confirmButtonColor: "#4f46e5",
    });

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Gagal mengubah status rental",
      confirmButtonColor: "#e3342f",
    });
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
        <svg class="animate-spin h-10 w-10 mx-auto text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Memuat detail rental...
      </div>

      <!-- ✅ PERBAIKAN: Tambah v-if untuk memastikan rental sudah ada -->
      <div v-else-if="rental">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            Detail Rental / 
            <!-- ✅ Gunakan optional chaining -->
            <span class="text-indigo-600">#{{ rental?.invoice }}</span>
          </h1>

          <button
            @click="openPrintPage"
            class="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-all"
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
          class="mb-8 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl flex items-center gap-2 transition-all"
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
                <span class="font-medium">#{{ rental?.invoice }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Customer</span>
                <span class="font-medium">
                  {{ rental?.customer?.name_perusahaan ?? "-" }}
                </span>
              </div>

              <!-- Tanggal Sewa -->
              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal Sewa</span>

                <!-- ✅ Tambah check untuk rental.details -->
                <span v-if="rental?.details && !hasMultipleDates(rental.details)" class="font-medium">
                  {{ formatDate(rental.details[0]?.start_date) }} - 
                  {{ formatDate(rental.details[0]?.end_date) }}
                </span>

                <span
                  v-else-if="rental?.details"
                  class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full cursor-pointer"
                  :title="getTooltipDates(rental.details)"
                >
                  Multiple Dates
                </span>
                <span v-else>-</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">DP</span>
                <span class="font-medium">Rp {{ formatRupiah(rental?.dp ?? 0) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-600">Status</span>
                <span 
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-full',
                    newStatus === 'berlangsung' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  ]"
                >
                  {{ newStatus?.toUpperCase() }}
                </span>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <div class="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span class="text-indigo-600">
                    Rp {{ formatRupiah(rental?.total_rent_price ?? 0) }}
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
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="berlangsung">Berlangsung</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <button
                @click="updateStatus"
                :disabled="statusUpdating"
                class="w-full mt-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                <svg v-if="statusUpdating" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ statusUpdating ? "Memperbarui..." : "Perbarui Status" }}
              </button>
            </div>
          </div>

          <!-- Kanan: Detail Produk -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-6">Produk Disewa</h2>

            <div class="overflow-x-auto">
              <!-- ✅ Tambah v-if untuk cek rental.details -->
              <table v-if="rental?.details && rental.details.length > 0" class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="py-3 text-left">No</th>
                    <th class="py-3 text-left">Produk</th>
                    <th class="py-3 text-center">Qty</th>
                    <th class="py-3 text-right">Harga / Bulan</th>
                    <th class="py-3 text-center">Durasi</th>
                    <th class="py-3 text-right">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  <tr 
                    v-for="(item, index) in rental.details" 
                    :key="item.id"
                    class="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td class="py-4">{{ index + 1 }}</td>
                    <td class="py-4 font-medium">{{ item.product?.title ?? "-" }}</td>
                    <td class="py-4 text-center">{{ item.qty ?? 0 }}</td>

                    <td class="py-4 text-right">
                      Rp {{ formatRupiah(item.rent_price ?? 0) }}
                    </td>

                    <td class="py-4 text-center">
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {{ getMonths(item.start_date, item.end_date) }} bulan
                      </span>
                    </td>

                    <td class="py-4 text-right font-semibold">
                      Rp {{ formatRupiah((item.qty ?? 0) * (item.rent_price ?? 0) * getMonths(item.start_date, item.end_date)) }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- ✅ Tampilkan pesan jika tidak ada data -->
              <div v-else class="text-center py-10 text-gray-500">
                Tidak ada detail produk
              </div>
            </div>

            <div class="mt-8 text-right border-t pt-6">
              <div class="text-lg font-bold text-gray-800">Total</div>
              <div class="text-2xl font-bold text-indigo-600">
                Rp {{ formatRupiah(rental?.total_rent_price ?? 0) }}
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ✅ TAMBAHAN: Tampilkan pesan jika rental tidak ditemukan -->
      <div v-else class="text-center py-20">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600">Data rental tidak ditemukan</p>
        <button 
          @click="router.back()" 
          class="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
        >
          Kembali
        </button>
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
