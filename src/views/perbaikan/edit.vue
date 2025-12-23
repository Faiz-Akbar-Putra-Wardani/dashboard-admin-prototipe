<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Api from "@/services/api";
import { handleErrors } from "@/utils/handleErrors";
import { getImageUrl } from "@/utils/getImageUrl";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";
import { useCurrencyInput } from "@/composables/useCurrencyInput";
import { useRepairCalculation } from "@/composables/useRepairCalculation";

const router = useRouter();
const route = useRoute();
const currentPageTitle = ref("Edit Perbaikan");
const token = Cookies.get("token");
const repairId = route.params.uuid;

// currency input untuk tampilan
const repairCostCurrency = useCurrencyInput();
const dpCurrency = useCurrencyInput();
const extraCurrency = useCurrencyInput();

// kalkulasi angka murni (sama seperti create)
const {
  repairCost,
  extraRepair,
  repairPph,
  repairDp,
  repairSubtotal,
  repairSubtotalPlusExtra,
  repairPphNominal,
  repairTotal,
} = useRepairCalculation();

const form = reactive({
  invoice: "",
  customer_id: "",
  item_repair: "",
  start_date: "",
  end_date: "",
  description: "",
  component: "",
  image: null,
  pic: "",
  status: "masuk",
});

const customers = ref([]);
const selectedCustomer = ref(null);
const errors = reactive({});
const isSubmitting = ref(false);
const isLoading = ref(true);
const startDateRef = ref(null);
const endDateRef = ref(null);
const previewUrl = ref(null);
const existingImageUrl = ref(null);
const fileInputRef = ref(null);
const fileName = ref("");
let startDatePicker = null;
let endDatePicker = null;

const fetchCustomers = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.get("/api/customers-all");

    customers.value = (response.data.data || []).map((c) => ({
      value: c.uuid || c.id,
      uuid: c.uuid || c.id,
      label: c.label || c.name,
      name: c.label || c.name,
      no_telp: c.no_telp,
      address: c.address,
    }));
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Customer",
      text: "Tidak dapat mengambil data customer.",
    });
  }
};

const fetchRepairData = async () => {
  try {
    isLoading.value = true;
    Api.defaults.headers.common["Authorization"] = token;

    const response = await Api.get(`/api/repairs/${repairId}`);
    const repair = response.data.data;

    // isi form
    form.invoice = repair.invoice;
    form.customer_id = repair.customer?.uuid || "";
    form.item_repair = repair.item_repair;
    form.start_date = repair.start_date.split("T")[0];
    form.end_date = repair.end_date.split("T")[0];
    form.description = repair.description;
    form.component = repair.component || "";
    form.pic = repair.pic;
    form.status = repair.status;

    // isi state kalkulasi (angka murni)
    repairCost.value = Number(repair.repair_cost) || 0;
    repairPph.value = Number(repair.pph) || 0;
    extraRepair.value = Number(repair.extra) || 0;
    repairDp.value = Number(repair.dp) || 0;

    // isi input tampilan currency
    repairCostCurrency.setValue(repairCost.value);
    dpCurrency.setValue(repairDp.value);
    extraCurrency.setValue(extraRepair.value);

    if (repair.image) {
      existingImageUrl.value = getImageUrl(repair.image);
    }

    if (repair.customer?.uuid && customers.value.length > 0) {
      const customer = customers.value.find(
        (c) => c.uuid === repair.customer.uuid || c.value === repair.customer.uuid
      );
      if (customer) {
        selectedCustomer.value = customer;
      }
    }

    if (startDatePicker) startDatePicker.setDate(form.start_date);
    if (endDatePicker) endDatePicker.setDate(form.end_date);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Data",
      text: "Tidak dapat mengambil data perbaikan.",
    }).then(() => {
      router.push("/repairs");
    });
  } finally {
    isLoading.value = false;
  }
};
const handleCustomerChange = (customer) => {
  if (customer) {
    const customerUuid = customer.uuid || customer.value || customer.id;

    if (typeof customerUuid !== "string") {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Customer ID tidak valid (harus UUID string)",
      });
      form.customer_id = "";
      selectedCustomer.value = null;
      return;
    }

    form.customer_id = customerUuid;
  } else {
    form.customer_id = "";
  }
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.match("image.*")) {
    Swal.fire({
      icon: "error",
      title: "Format Tidak Didukung",
      text: "Harap pilih file gambar (jpg, png, jpeg, webp).",
    });
    fileInputRef.value.value = "";
    form.image = null;
    fileName.value = "";
    return;
  }

  form.image = file;
  fileName.value = file.name;
  previewUrl.value = URL.createObjectURL(file);
};

const initDatePickers = () => {
  if (startDateRef.value) {
    startDatePicker = flatpickr(startDateRef.value, {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d-m-Y",
      allowInput: true,
      defaultDate: form.start_date,
      onChange: (_, dateStr) => {
        form.start_date = dateStr;
      },
    });
  }

  if (endDateRef.value) {
    endDatePicker = flatpickr(endDateRef.value, {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d-m-Y",
      allowInput: true,
      defaultDate: form.end_date,
      onChange: (_, dateStr) => {
        form.end_date = dateStr;
      },
    });
  }
};

// sama seperti create
const handleRepairCostInput = (event) => {
  repairCostCurrency.handleInput(event);
  const raw = repairCostCurrency.rawValue.value;
  const num = raw === "" ? 0 : Number(raw) || 0;
  repairCost.value = num;
};

const handleDpInput = (event) => {
  dpCurrency.handleInput(event);
  const rawDp = dpCurrency.rawValue.value;
  let dpNum = rawDp === "" ? null : Number(rawDp);

  const currentTotal = repairTotal.value || repairCost.value || 0;

  if (dpNum != null && currentTotal > 0 && dpNum >= currentTotal) {
    const newMax = Math.max(0, currentTotal - 1);
    dpNum = newMax;
    dpCurrency.setValue(newMax);
    repairDp.value = newMax;
    Swal.fire({
      icon: "warning",
      title: "DP tidak valid",
      text: "DP harus lebih kecil dari total biaya perbaikan.",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  if (dpNum != null && dpNum < 0) {
    dpNum = 0;
    dpCurrency.setValue(0);
  }

  repairDp.value = dpNum || 0;
};

const handleExtraInput = (event) => {
  extraCurrency.handleInput(event);
  const raw = extraCurrency.rawValue.value;
  const num = raw === "" ? 0 : Number(raw) || 0;
  extraRepair.value = num;
};
const updateRepair = async () => {
  if (!form.customer_id || form.customer_id === "") {
    Swal.fire({
      icon: "warning",
      title: "Customer Belum Dipilih",
      text: "Silakan pilih customer terlebih dahulu.",
    });
    return;
  }

  if (typeof form.customer_id !== "string") {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Customer ID tidak valid (bukan UUID string)",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Update Data?",
    text: "Apakah Anda yakin ingin memperbarui data perbaikan ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Update",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
  });

  if (!confirm.isConfirmed) return;

  const repairCostNum = Number(repairCost.value) || 0;
  const dpNum = Number(repairDp.value) || 0;
  const extraNum = Number(extraRepair.value) || 0;
  const pphNum = Number(repairPph.value) || 0;
  const totalAfterPph = Number(repairTotal.value) || 0;

  if (!repairCostNum || repairCostNum <= 0) {
    Swal.fire({
      icon: "warning",
      title: "Biaya perbaikan tidak valid",
      text: "Biaya perbaikan harus lebih besar dari 0.",
    });
    return;
  }

  if (dpNum < 0) {
    Swal.fire({
      icon: "warning",
      title: "DP tidak valid",
      text: "DP tidak boleh kurang dari 0.",
    });
    return;
  }

  if (totalAfterPph > 0 && dpNum >= totalAfterPph) {
    Swal.fire({
      icon: "warning",
      title: "DP tidak valid",
      text: "DP harus lebih kecil dari total biaya perbaikan.",
    });
    return;
  }

  isSubmitting.value = true;
  Object.keys(errors).forEach((key) => (errors[key] = ""));

  try {
    const formData = new FormData();

    formData.append("customer_id", String(form.customer_id));
    formData.append("item_repair", form.item_repair);
    formData.append("start_date", form.start_date);
    formData.append("end_date", form.end_date);
    formData.append("description", form.description);
    formData.append("component", form.component || "");
    formData.append("pic", form.pic);

    formData.append("dp", dpNum);
    formData.append("repair_cost", repairCostNum);
    formData.append("extra", extraNum);
    formData.append("pph", pphNum);
    formData.append("status", form.status);

    if (form.image) {
      formData.append("image", form.image);
    }

    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.put(`/api/repairs/${repairId}`, formData);

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: response.data.meta?.message || "Data perbaikan berhasil diperbarui.",
      timer: 2000,
      showConfirmButton: false,
    });

    router.push("/repairs");
  } catch (error) {
    if (error.response?.data) {
      const responseData = error.response.data;

      handleErrors(responseData, errors);

      let errorMessage = "";

      if (responseData.errors && Array.isArray(responseData.errors)) {
        errorMessage = responseData.errors
          .map((err) => `<li>${err.msg}</li>`)
          .join("");

        await Swal.fire({
          icon: "error",
          title: "Validasi Gagal!",
          html: `
            <ul style="text-align: center; margin: 0; padding-left: 1.2rem; color: #e53e3e;">
              ${errorMessage}
            </ul>
          `,
          confirmButtonText: "Tutup",
          confirmButtonColor: "#ef4444",
        });
      } else if (responseData.meta?.message) {
        await Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: responseData.meta.message,
          confirmButtonText: "Tutup",
          confirmButtonColor: "#ef4444",
        });
      } else {
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

onMounted(async () => {
  await fetchCustomers();
  await fetchRepairData();
  initDatePickers();
});
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <!-- Card -->
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <svg
            class="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
            />
          </svg>
          <p class="text-gray-600 dark:text-gray-400">
            Memuat data perbaikan...
          </p>
        </div>
      </div>

      <!-- Form Content -->
      <div v-else>
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Perbaikan
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Perbarui data perbaikan yang sudah ada.
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="updateRepair" class="space-y-6">
          <!-- Invoice (Disabled/Read-only) -->
          <div class="group relative">
            <label
              for="invoice"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nomor Invoice
            </label>
            <input
              id="invoice"
              v-model="form.invoice"
              type="text"
              disabled
              class="block w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Invoice tidak dapat diubah
            </p>
          </div>

          <!-- Customer (Vue Select) -->
          <div class="group relative">
            <label
              for="customer_id"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Customer <span class="text-red-500">*</span>
            </label>
            <v-select
              v-model="selectedCustomer"
              :options="customers"
              :reduce="(customer) => customer"
              label="label"
              placeholder="Pilih customer"
              @update:modelValue="handleCustomerChange"
              class="vue-select-custom"
            >
              <template #no-options> Tidak ada customer ditemukan </template>
            </v-select>
            <p
              v-if="errors.customer_id"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.customer_id }}
            </p>
          </div>

          <!-- Barang yang Diperbaiki -->
          <div class="group relative">
            <input
              id="item_repair"
              v-model="form.item_repair"
              type="text"
              :data-filled="form.item_repair"
              class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
              placeholder="Masukkan barang yang diperbaiki"
            />
            <label
              for="item_repair"
              class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
            >
              Barang Perbaikan <span class="text-red-500">*</span>
            </label>
            <p
              v-if="errors.item_repair"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.item_repair }}
            </p>
          </div>

          <!-- Tanggal Mulai -->
          <div class="group relative">
            <label
              for="start_date"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tanggal Mulai <span class="text-red-500">*</span>
            </label>
            <input
              id="start_date"
              ref="startDateRef"
              v-model="form.start_date"
              type="text"
              class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all"
              placeholder="Pilih tanggal mulai"
            />
            <p
              v-if="errors.start_date"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.start_date }}
            </p>
          </div>

          <!-- Tanggal Selesai -->
          <div class="group relative">
            <label
              for="end_date"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tanggal Estimasi Selesai <span class="text-red-500">*</span>
            </label>
            <input
              id="end_date"
              ref="endDateRef"
              v-model="form.end_date"
              type="text"
              class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all"
              placeholder="Pilih tanggal selesai"
            />
            <p
              v-if="errors.end_date"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.end_date }}
            </p>
          </div>

          <!-- Komponen (Opsional) -->
          <div class="group relative">
            <input
              id="component"
              v-model="form.component"
              type="text"
              :data-filled="form.component"
              class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
              placeholder="Masukkan komponen yang diganti"
            />
            <label
              for="component"
              class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
            >
              Komponen <span class="text-gray-400">(opsional)</span>
            </label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Komponen yang diganti/diperbaiki
            </p>
          </div>

          <!-- PIC -->
          <div class="group relative">
            <input
              id="pic"
              v-model="form.pic"
              type="text"
              :data-filled="form.pic"
              class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
              placeholder="Masukkan nama teknisi"
            />
            <label
              for="pic"
              class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
            >
              Teknisi (PIC) <span class="text-red-500">*</span>
            </label>
            <p
              v-if="errors.pic"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.pic }}
            </p>
          </div>

       <!-- Biaya Perbaikan -->
          <div class="group relative">
            <div class="relative">
              <span class="absolute left-4 top-2.5 text-sm text-gray-500 dark:text-gray-400 z-30">
                Rp
              </span>
              <input
                id="repair_cost"
                v-model="repairCostCurrency.displayValue.value"
                @input="handleRepairCostInput"
                type="text"
                :data-filled="repairCostCurrency.displayValue.value"
                class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 pl-12 pr-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
                placeholder="0"
              />
              <label
                for="repair_cost"
                class="absolute left-12 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:left-4 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:left-4 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
              >
                Biaya Perbaikan <span class="text-red-500">*</span>
              </label>
            </div>
            <p v-if="errors.repair_cost" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ errors.repair_cost }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Contoh: 900.000 (sembilan ratus ribu rupiah)
            </p>
          </div>

          <!-- DP -->
          <div class="group relative">
            <div class="relative">
              <span class="absolute left-4 top-2.5 text-sm text-gray-500 dark:text-gray-400 z-30">
                Rp
              </span>
              <input
                id="dp"
                v-model="dpCurrency.displayValue.value"
                @input="handleDpInput"
                type="text"
                :data-filled="dpCurrency.displayValue.value"
                placeholder="0"
                class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 pl-12 pr-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
              />
              <label
                for="dp"
                class="absolute left-12 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                  peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                  peer-focus:-top-3 peer-focus:left-4 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                  peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:left-4 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
              >
                DP <span class="text-gray-400">(opsional)</span>
              </label>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Down Payment / Uang Muka
            </p>
            <p
              v-if="errors.dp"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.dp }}
            </p>
          </div>

          <!-- PPH (%) -->
          <div class="group relative">
            <label
              for="repair_pph"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              PPH (%) jika ada
            </label>
            <input
              id="repair_pph"
              v-model.number="repairPph"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all"
              placeholder="0"
            />
          </div>

          <!-- Tambahan Biaya (Extra) -->
          <div class="group relative">
            <label
              for="extra_repair"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tambahan Biaya (jika ada PPH)
            </label>
            <div class="relative">
              <span
                class="absolute left-4 top-2.5 text-sm text-gray-500 dark:text-gray-400 z-30"
              >
                Rp
              </span>
              <input
                id="extra_repair"
                v-model="extraCurrency.displayValue.value"
                @input="handleExtraInput"
                type="text"
                :disabled="!repairPph || Number(repairPph) <= 0"
                :data-filled="extraCurrency.displayValue.value"
                class="peer block w-full rounded-lg border px-12 pr-4 py-2.5 text-sm text-gray-900
                      bg-gray-50 dark:bg-gray-800
                      border-gray-300 dark:border-gray-700
                      focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      dark:focus:bg-gray-800
                      transition-all
                      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                      dark:disabled:bg-gray-900 dark:disabled:text-gray-600"
                placeholder="0"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Contoh: 50.000 (lima puluh ribu rupiah), aktif jika PPH &gt; 0.
            </p>
          </div>

          <!-- Ringkasan Perhitungan -->
          <div
            class="mt-4 border-t pt-4 text-sm text-gray-700 dark:text-gray-200 space-y-1"
          >
            <p>
              Subtotal perbaikan:
              <span class="font-semibold">
                {{ repairSubtotal.toLocaleString("id-ID") }}
              </span>
            </p>
            <p>
              Subtotal + tambahan biaya:
              <span class="font-semibold">
                {{ repairSubtotalPlusExtra.toLocaleString("id-ID") }}
              </span>
            </p>
            <p>
              PPH (Rp):
              <span class="font-semibold">
                {{ repairPphNominal.toLocaleString("id-ID") }}
              </span>
            </p>
            <p>
              Total setelah PPH:
              <span class="font-semibold">
                {{ repairTotal.toLocaleString("id-ID") }}
              </span>
            </p>
          </div>
          <!-- Status -->
          <div class="group relative">
            <label
              for="status"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Status <span class="text-red-500">*</span>
            </label>
            <select
              id="status"
              v-model="form.status"
              class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all"
            >
              <option value="masuk">Masuk</option>
              <option value="dikerjakan">Dikerjakan</option>
              <option value="selesai">Selesai</option>
            </select>
            <p
              v-if="errors.status"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.status }}
            </p>
          </div>

          <!-- Upload Gambar -->
          <div class="group relative">
            <label
              for="image"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Upload Gambar
              <span class="text-gray-400"
                >(opsional - kosongkan jika tidak ingin mengubah)</span
              >
            </label>

            <!-- Tombol upload custom -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="$refs.fileInputRef.click()"
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:ring focus:ring-blue-300"
              >
                Pilih Gambar Baru
              </button>

              <!-- Nama file -->
              <span
                v-if="fileName"
                class="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px]"
              >
                {{ fileName }}
              </span>
            </div>

            <!-- Input file disembunyikan -->
            <input
              id="image"
              type="file"
              accept="image/*"
              ref="fileInputRef"
              @change="handleFileChange"
              class="hidden"
            />

            <!-- Pesan error -->
            <p
              v-if="errors.image"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.image }}
            </p>

            <!-- Preview Gambar Baru -->
            <div v-if="previewUrl" class="mt-3">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Preview Gambar Baru:
              </p>
              <img
                :src="previewUrl"
                alt="Preview Baru"
                class="w-32 h-32 object-cover rounded-lg border-2 border-indigo-500 dark:border-indigo-400"
              />
            </div>

            <!-- Gambar Existing -->
            <div v-else-if="existingImageUrl" class="mt-3">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Gambar Saat Ini:
              </p>
              <img
                :src="existingImageUrl"
                alt="Gambar Existing"
                class="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
              />
            </div>
          </div>

          <!-- Deskripsi -->
          <div class="group relative">
            <textarea
              id="description"
              v-model="form.description"
              :data-filled="form.description"
              rows="4"
              class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
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

            <p
              v-if="errors.description"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.description }}
            </p>
          </div>

          <!-- Tombol Aksi -->
          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              @click="goBack"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg
                v-if="isSubmitting"
                class="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{
                isSubmitting ? "Memperbarui..." : "Update Perbaikan"
              }}</span>
            </button>
          </div>
        </form>
      </div>
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
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
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

/* Dark mode support */
:deep(.dark) .vue-select-custom .vs__dropdown-toggle {
  background-color: #1f2937;
  border-color: #374151;
}

:deep(.dark) .vue-select-custom .vs__search,
:deep(.dark) .vue-select-custom .vs__selected {
  color: #fff;
}
</style>
