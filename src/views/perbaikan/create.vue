<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Api from "@/services/api";
import { handleErrors } from "@/utils/handleErrors";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

const router = useRouter();
const currentPageTitle = ref("Tambah Perbaikan");
const token = Cookies.get("token");

const form = reactive({
  invoice: "", // Tambah field invoice
  customer_id: "",
  item_repair: "",
  start_date: "",
  end_date: "",
  description: "",
  component: "",
  pic: "",
  dp: 0,
  repair_cost: "",
  status: "process",
});

const customers = ref([]);
const selectedCustomer = ref(null);
const errors = reactive({});
const isSubmitting = ref(false);
const isLoadingInvoice = ref(true); // Loading state untuk invoice
const startDateRef = ref(null);
const endDateRef = ref(null);

// Fetch Invoice Baru
const fetchNewInvoice = async () => {
  try {
    isLoadingInvoice.value = true;
    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.get("/api/repairs/invoice/new");
    form.invoice = response.data.data.invoice;
    console.log("Invoice generated:", form.invoice); // Debug
  } catch (error) {
    console.error("Gagal mengambil invoice:", error);
    Swal.fire({
      icon: "error",
      title: "Gagal Generate Invoice",
      text: "Tidak dapat membuat invoice baru.",
    });
  } finally {
    isLoadingInvoice.value = false;
  }
};

// Fetch Customers
const fetchCustomers = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.get("/api/customers-all");
    customers.value = response.data.data || [];
    
    console.log("Customers loaded:", customers.value); // Debug
  } catch (error) {
    console.error("Gagal mengambil customer:", error);
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Customer",
      text: "Tidak dapat mengambil data customer.",
    });
  }
};

// Handle customer selection
const handleCustomerChange = (customer) => {
  if (customer) {
    form.customer_id = customer.value;
    console.log("Customer selected:", customer.value); // Debug
  } else {
    form.customer_id = "";
  }
};

// Initialize Flatpickr untuk tanggal
const initDatePickers = () => {
  if (startDateRef.value) {
    flatpickr(startDateRef.value, {
      dateFormat: "Y-m-d",
      onChange: (selectedDates, dateStr) => {
        form.start_date = dateStr;
      },
    });
  }

  if (endDateRef.value) {
    flatpickr(endDateRef.value, {
      dateFormat: "Y-m-d",
      onChange: (selectedDates, dateStr) => {
        form.end_date = dateStr;
      },
    });
  }
};

// Submit Form
const storeRepair = async () => {
  // Debug: Log form data sebelum submit
  console.log("Form data:", form);

  // Validasi manual customer_id
  if (!form.customer_id || form.customer_id === "") {
    Swal.fire({
      icon: "warning",
      title: "Customer Belum Dipilih",
      text: "Silakan pilih customer terlebih dahulu.",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Simpan Data?",
    text: "Apakah Anda yakin ingin menambahkan data perbaikan baru?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
  });

  if (!confirm.isConfirmed) return;

  isSubmitting.value = true;
  Object.keys(errors).forEach((key) => (errors[key] = ""));

  try {
    const payload = {
      customer_id: parseInt(form.customer_id),
      item_repair: form.item_repair,
      start_date: form.start_date,
      end_date: form.end_date,
      description: form.description,
      component: form.component || null,
      pic: form.pic,
      dp: parseFloat(form.dp) || 0,
      repair_cost: parseFloat(form.repair_cost),
      status: form.status,
    };

    console.log("Payload to send:", payload); // Debug

    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.post("/api/repairs", payload);

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: response.data.meta?.message || "Data perbaikan berhasil disimpan.",
      timer: 2000,
      showConfirmButton: false,
    });

    router.push("/repairs");
  } catch (error) {
    console.error("Error submit:", error.response); // Debug
    
    if (error.response?.data) {
      const responseData = error.response.data;
      
      // Call handleErrors (will handle array errors only)
      handleErrors(responseData, errors);
      
      let errorMessage = "";
      
      // Check if validation errors exist (422 error with array)
      if (responseData.errors && Array.isArray(responseData.errors)) {
        errorMessage = responseData.errors
          .map((err) => `<li>${err.msg}</li>`)
          .join("");
          
        await Swal.fire({
          icon: "error",
          title: "Validasi Gagal!",
          html: `<ul style="text-align: left; color: #e53e3e;">${errorMessage}</ul>`,
          confirmButtonText: "Tutup",
          confirmButtonColor: "#ef4444",
        });
      }
      // Check if meta message exists (400, 422, 500 errors)
      else if (responseData.meta?.message) {
        await Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: responseData.meta.message,
          confirmButtonText: "Tutup",
          confirmButtonColor: "#ef4444",
        });
      }
      // Check if errors is a string (500 server error)
      else if (typeof responseData.errors === 'string') {
        await Swal.fire({
          icon: "error",
          title: "Kesalahan Server!",
          text: responseData.errors,
          confirmButtonText: "Tutup",
          confirmButtonColor: "#ef4444",
        });
      }
      // Default error message
      else {
        await Swal.fire({
          icon: "error",
          title: "Kesalahan!",
          text: "Terjadi kesalahan, silakan coba lagi.",
          confirmButtonText: "Tutup",
          confirmButtonColor: "#ef4444",
        });
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Kesalahan!",
        text: "Tidak dapat terhubung ke server.",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => router.push("/repairs");

onMounted(() => {
  fetchNewInvoice(); // Fetch invoice pertama kali
  fetchCustomers();
  initDatePickers();
});
</script>


<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Tambah Perbaikan Baru</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Isi kolom di bawah untuk menambahkan data perbaikan baru.
        </p>
      </div>

      <form @submit.prevent="storeRepair" class="space-y-6">
       <!-- Invoice (Disabled/Read-only) -->
        <div class="group relative">
          <label for="invoice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nomor Invoice
          </label>
          <div class="relative">
            <input
              id="invoice"
              v-model="form.invoice"
              type="text"
              disabled
              class="block w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
              :placeholder="isLoadingInvoice ? 'Generating invoice...' : 'Invoice'"
            />
            <!-- Loading Spinner -->
            <div v-if="isLoadingInvoice" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg class="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z" />
              </svg>
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500">Invoice dibuat otomatis oleh sistem</p>
        </div>

        <!-- Customer (Vue Select) -->
        <div class="group relative">
          <label for="customer_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Customer <span class="text-red-500">*</span>
          </label>
          <v-select
            v-model="selectedCustomer"
            :options="customers"
            :reduce="customer => customer"
            label="label"
            placeholder="Pilih customer"
            @update:modelValue="handleCustomerChange"
            class="vue-select-custom"
          >
            <template #no-options>
              Tidak ada customer ditemukan
            </template>
          </v-select>
          <p v-if="errors.customer_id" class="mt-1 text-xs text-red-600">{{ errors.customer_id }}</p>
        </div>

        <!-- Barang yang Diperbaiki -->
        <div class="group relative">
          <input
            id="item_repair"
            v-model="form.item_repair"
            type="text"
            :data-filled="form.item_repair"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan barang yang diperbaiki"
          />
          <label
            for="item_repair"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600"
          >
            Barang Perbaikan <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.item_repair" class="mt-1 text-xs text-red-600">{{ errors.item_repair }}</p>
        </div>

        <!-- Tanggal Mulai -->
        <div class="group relative">
          <label for="start_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tanggal Mulai <span class="text-red-500">*</span>
          </label>
          <input
            id="start_date"
            ref="startDateRef"
            type="text"
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Pilih tanggal mulai"
          />
          <p v-if="errors.start_date" class="mt-1 text-xs text-red-600">{{ errors.start_date }}</p>
        </div>

        <!-- Tanggal Selesai -->
        <div class="group relative">
          <label for="end_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tanggal Estimasi Selesai <span class="text-red-500">*</span>
          </label>
          <input
            id="end_date"
            ref="endDateRef"
            type="text"
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Pilih tanggal selesai"
          />
          <p v-if="errors.end_date" class="mt-1 text-xs text-red-600">{{ errors.end_date }}</p>
        </div>

        <!-- Komponen (Opsional) -->
        <div class="group relative">
          <input
            id="component"
            v-model="form.component"
            type="text"
            :data-filled="form.component"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan komponen yang diganti"
          />
          <label
            for="component"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600"
          >
            Komponen <span class="text-gray-400">(opsional)</span>
          </label>
          <p class="mt-1 text-xs text-gray-500">Komponen yang diganti/diperbaiki</p>
        </div>

        <!-- PIC -->
        <div class="group relative">
          <input
            id="pic"
            v-model="form.pic"
            type="text"
            :data-filled="form.pic"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan nama teknisi"
          />
          <label
            for="pic"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600"
          >
            Teknisi (PIC) <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.pic" class="mt-1 text-xs text-red-600">{{ errors.pic }}</p>
        </div>

        <!-- Biaya Perbaikan -->
        <div class="group relative">
          <input
            id="repair_cost"
            v-model="form.repair_cost"
            type="number"
            min="0"
            :data-filled="form.repair_cost"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan biaya perbaikan"
          />
          <label
            for="repair_cost"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600"
          >
            Biaya Perbaikan <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.repair_cost" class="mt-1 text-xs text-red-600">{{ errors.repair_cost }}</p>
        </div>

        <!-- DP -->
        <div class="group relative">
          <input
            id="dp"
            v-model="form.dp"
            type="number"
            min="0"
            :data-filled="form.dp"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan DP"
          />
          <label
            for="dp"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600"
          >
            DP <span class="text-gray-400">(opsional)</span>
          </label>
          <p class="mt-1 text-xs text-gray-500">Down Payment / Uang Muka</p>
          <p v-if="errors.dp" class="mt-1 text-xs text-red-600">{{ errors.dp }}</p>
        </div>

        <!-- Status -->
        <div class="group relative">
          <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status <span class="text-red-500">*</span>
          </label>
          <select
            id="status"
            v-model="form.status"
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="process">Process</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <p v-if="errors.status" class="mt-1 text-xs text-red-600">{{ errors.status }}</p>
        </div>

        <!-- Deskripsi -->
        <div class="group relative">
          <textarea
            id="description"
            v-model="form.description"
            :data-filled="form.description"
            rows="4"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan deskripsi perbaikan"
          ></textarea>
          <label
            for="description"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Deskripsi Perbaikan <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.description" class="mt-1 text-xs text-red-600">{{ errors.description }}</p>
        </div>

        <!-- Tombol Aksi -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            @click="goBack"
            class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z" />
            </svg>
            <span>{{ isSubmitting ? "Menyimpan..." : "Simpan Perbaikan" }}</span>
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>

<style scoped>
/* Custom styling untuk vue-select */
.vue-select-custom :deep(.vs__dropdown-toggle) {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  background-color: #f9fafb;
}

.vue-select-custom :deep(.vs__dropdown-toggle:focus-within) {
  border-color: #6366f1;
  ring: 2px;
  ring-color: #6366f1;
}

.vue-select-custom :deep(.vs__search::placeholder) {
  color: #9ca3af;
}

.vue-select-custom :deep(.vs__dropdown-menu) {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
}

.vue-select-custom :deep(.vs__dropdown-option--highlight) {
  background-color: #6366f1;
  color: white;
}
</style>
