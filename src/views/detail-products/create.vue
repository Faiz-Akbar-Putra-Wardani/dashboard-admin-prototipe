<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Api from "@/services/api";
import { handleErrors } from "@/utils/handleErrors";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import FormInput from "@/components/FormInput.vue";
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

const router = useRouter();
const currentPageTitle = ref("Tambah Detail Produk");
const activeTab = ref("general");
const token = Cookies.get("token");

// 🔹 State utama form
const form = reactive({
  product_id: "",
  brand: "",
  model: "",
  cylinder: "",
  piston_displ: "",
  rated_speed: "",
  bore_stroke: "",
  governor: "",
  aspiration: "",
  oil_capacity: "",
  fuel_capacity: "",
  cooling_system: "",
  load_100: "",
  load_75: "",
  load_50: "",
  prime_power: "",
  standby_power: "",
  voltage: "",
  alternator: "",
  dimension_open: "",
  weight_open: "",
  dimension_silent: "",
  weight_silent: "",
});

const products = ref([]); 
const selectedProduct = ref(null); 
const errors = reactive({});
const isSubmitting = ref(false);

// 🔹 Ambil semua produk untuk dropdown
const fetchProducts = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;
    const res = await Api.get("/api/products-all");
    
    console.log("=== FETCH PRODUCTS ===");
    console.log("API Response:", res.data.data);
    
    products.value = (res.data.data || []).map(p => ({
      value: p.id, 
      id: p.id,
      uuid: p.uuid,
      label: p.title, 
      title: p.title,
      price: p.price,
      category: p.category
    }));
    
    console.log("Products mapped:", products.value);
    
  } catch (err) {
    console.error("❌ Gagal mengambil data produk:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Produk",
      text: "Tidak dapat mengambil data produk.",
    });
  }
};

const handleProductChange = (product) => {
  console.log("=== PRODUCT CHANGE ===");
  console.log("Selected product:", product);
  
  if (product) {
    const productId = product.id || product.value;
    
    if (typeof productId !== 'number') {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Product ID tidak valid (harus berupa angka)",
      });
      form.product_id = "";
      selectedProduct.value = null;
      return;
    }
    
    form.product_id = productId;
    console.log("Product ID set to:", form.product_id);
  } else {
    form.product_id = "";
  }
};

const storeDetailProduct = async () => {
  if (!form.product_id || form.product_id === "") {
    Swal.fire({
      icon: "warning",
      title: "Produk Belum Dipilih",
      text: "Silakan pilih produk terlebih dahulu.",
    });
    return;
  }

  if (typeof form.product_id !== 'number') {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Product ID tidak valid (bukan angka)",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Simpan Detail Produk?",
    text: "Apakah kamu yakin ingin menambahkan detail produk baru?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
  });

  if (!confirm.isConfirmed) return;

  isSubmitting.value = true;
  Object.keys(errors).forEach((k) => (errors[k] = ""));

  try {
    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.post("/api/detail-products", form);

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text:
        response.data.meta?.message ||
        "Detail produk berhasil disimpan.",
      timer: 2000,
      showConfirmButton: false,
    });

    router.push("/detail-products");
  } catch (error) {
    if (error.response?.data) {
      handleErrors(error.response.data, errors);
      const errorMessages =
        error.response.data.errors
          ?.map((err) => `<li>${err.msg}</li>`)
          .join("") || "<li>Terjadi kesalahan validasi.</li>";

      await Swal.fire({
        icon: "error",
        title: "Validasi Gagal!",
        html: `<ul style='text-align:center; color:#e53e3e; padding-left: 1.2rem;'>${errorMessages}</ul>`,
        confirmButtonText: "Tutup",
        confirmButtonColor: "#ef4444",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Kesalahan!",
        text: "Terjadi kesalahan di server.",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => router.push("/detail-products");

onMounted(fetchProducts);
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Tambah Detail Produk</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Isi form di bawah untuk menambahkan spesifikasi produk baru.</p>
      </div>

      <!-- Tabs -->
      <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-4 overflow-x-auto">
          <button 
            @click="activeTab='general'" 
            :class="activeTab==='general'? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200"
          >
            Umum
          </button>
          <button 
            @click="activeTab='engine'" 
            :class="activeTab==='engine'? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200"
          >
            Mesin
          </button>
          <button 
            @click="activeTab='capacity'" 
            :class="activeTab==='capacity'? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200"
          >
            Kapasitas
          </button>
          <button 
            @click="activeTab='power'" 
            :class="activeTab==='power'? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200"
          >
            Daya
          </button>
          <button 
            @click="activeTab='dimension'" 
            :class="activeTab==='dimension'? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" 
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200"
          >
            Dimensi & Berat
          </button>
        </nav>
      </div>

      <form @submit.prevent="storeDetailProduct" class="space-y-6">
        <!-- Tab: General -->
        <div v-if="activeTab==='general'" class="space-y-4">
          <div class="group relative">
            <label
              for="product_id"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Produk <span class="text-red-500">*</span>
            </label>
            <v-select
              v-model="selectedProduct"
              :options="products"
              :reduce="(product) => product"
              label="label"
              placeholder="Pilih produk"
              @update:modelValue="handleProductChange"
              class="vue-select-custom"
            >
              <template #option="{ label, category }">
                <div class="flex flex-col">
                  <span class="font-medium">{{ label }}</span>
                  <span v-if="category" class="text-xs text-gray-500">{{ category.name }}</span>
                </div>
              </template>
              <template #no-options>
                Tidak ada produk ditemukan
              </template>
            </v-select>
            <p
              v-if="errors.product_id"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.product_id }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pilih produk yang akan ditambahkan detailnya
            </p>
          </div>

          <FormInput
            id="brand"
            label="Brand"
            v-model="form.brand"
            :error="errors.brand"
            placeholder="Masukkan brand produk"
          />

          <FormInput
            id="model"
            label="Model"
            v-model="form.model"
            :error="errors.model"
            placeholder="Masukkan model produk"
          />

          <FormInput
            id="cylinder"
            label="Cylinder"
            v-model="form.cylinder"
            :error="errors.cylinder"
            placeholder="Contoh: 4"
          />

          <FormInput
            id="piston_displ"
            label="Piston Displ"
            v-model="form.piston_displ"
            :error="errors.piston_displ"
            placeholder="Contoh: 4.5L"
          />
        </div>

        <!-- Tab: Engine -->
        <div v-if="activeTab==='engine'" class="space-y-4">
          <FormInput
            id="rated_speed"
            label="Rated Speed"
            v-model="form.rated_speed"
            :error="errors.rated_speed"
            placeholder="Contoh: 1500 rpm"
          />

          <FormInput
            id="bore_stroke"
            label="Bore & Stroke"
            v-model="form.bore_stroke"
            :error="errors.bore_stroke"
            placeholder="Contoh: 108 x 130 mm"
          />

          <FormInput
            id="governor"
            label="Governor"
            v-model="form.governor"
            :error="errors.governor"
            placeholder="Contoh: Electronic"
          />

          <FormInput
            id="aspiration"
            label="Aspiration"
            v-model="form.aspiration"
            :error="errors.aspiration"
            placeholder="Contoh: Turbocharged"
          />
        </div>

        <!-- Tab: Capacity -->
        <div v-if="activeTab==='capacity'" class="space-y-4">
          <FormInput
            id="oil_capacity"
            label="Oil Capacity"
            v-model="form.oil_capacity"
            :error="errors.oil_capacity"
            placeholder="Contoh: 13.5 L"
          />

          <FormInput
            id="fuel_capacity"
            label="Fuel Capacity"
            v-model="form.fuel_capacity"
            :error="errors.fuel_capacity"
            placeholder="Contoh: 200 L"
          />

          <FormInput
            id="cooling_system"
            label="Cooling System"
            v-model="form.cooling_system"
            :error="errors.cooling_system"
            placeholder="Contoh: 15 L"
          />
        </div>

        <!-- Tab: Power -->
        <div v-if="activeTab==='power'" class="space-y-4">
          <FormInput
            id="load_100"
            label="Load 100%"
            v-model="form.load_100"
            :error="errors.load_100"
            placeholder="Contoh: 100 kVA"
          />

          <FormInput
            id="load_75"
            label="Load 75%"
            v-model="form.load_75"
            :error="errors.load_75"
            placeholder="Contoh: 75 kVA"
          />

          <FormInput
            id="load_50"
            label="Load 50%"
            v-model="form.load_50"
            :error="errors.load_50"
            placeholder="Contoh: 50 kVA"
          />

          <FormInput
            id="prime_power"
            label="Prime Power"
            v-model="form.prime_power"
            :error="errors.prime_power"
            placeholder="Contoh: 100 kVA / 80 kW"
          />

          <FormInput
            id="standby_power"
            label="Standby Power"
            v-model="form.standby_power"
            :error="errors.standby_power"
            placeholder="Contoh: 110 kVA / 88 kW"
          />

          <FormInput
            id="voltage"
            label="Voltage"
            v-model="form.voltage"
            :error="errors.voltage"
            placeholder="Contoh: 400/230 V"
          />

          <FormInput
            id="alternator"
            label="Alternator"
            v-model="form.alternator"
            :error="errors.alternator"
            placeholder="Contoh: Stamford / Leroy Somer"
          />
        </div>

        <!-- Tab: Dimension -->
        <div v-if="activeTab==='dimension'" class="space-y-4">
          <FormInput
            id="dimension_open"
            label="Dimension Open (P x L x T)"
            v-model="form.dimension_open"
            :error="errors.dimension_open"
            placeholder="Contoh: 2500 x 1000 x 1500 mm"
          />

          <FormInput
            id="weight_open"
            label="Weight Open"
            v-model="form.weight_open"
            :error="errors.weight_open"
            placeholder="Contoh: 1500 kg"
          />

          <FormInput
            id="dimension_silent"
            label="Dimension Silent (P x L x T)"
            v-model="form.dimension_silent"
            :error="errors.dimension_silent"
            placeholder="Contoh: 3000 x 1200 x 1800 mm"
          />

          <FormInput
            id="weight_silent"
            label="Weight Silent"
            v-model="form.weight_silent"
            :error="errors.weight_silent"
            placeholder="Contoh: 2000 kg"
          />
        </div>

        <!-- Tombol aksi -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end mt-6">
          <button 
            type="button" 
            @click="goBack" 
            class="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Batal
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting" 
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Detail' }}</span>
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
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.vue-select-custom :deep(.vs__search::placeholder) {
  color: #9ca3af;
}

.vue-select-custom :deep(.vs__dropdown-menu) {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  max-height: 250px;
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
