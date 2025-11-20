<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Api from "@/services/api";
import { handleErrors } from "@/utils/handleErrors";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import FormInput from "@/components/FormInput.vue";
import FormSelect from "@/components/FormSelect.vue";

const router = useRouter();
const route = useRoute(); 
const token = Cookies.get("token");
const currentPageTitle = ref("Ubah Detail Produk");
const activeTab = ref("general");
const isSubmitting = ref(false);
const errors = reactive({});
const products = ref([]);
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
const fetchProducts = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;
    const res = await Api.get("/api/products-all");
    products.value = res.data.data || [];
  } catch (err) {
    console.error("Gagal mengambil data produk:", err);
  }
};
const fetchDetailProduct = async () => {
  try {
    const id = route.params.id;
    Api.defaults.headers.common["Authorization"] = token;
    const res = await Api.get(`/api/detail-products/${id}`);
    const data = res.data.data;
    Object.keys(form).forEach((key) => {
      if (data[key] !== undefined) form[key] = data[key];
    });
  } catch (err) {
    console.error("Gagal mengambil detail produk:", err);
    Swal.fire({
      icon: "error",
      title: "Kesalahan!",
      text: "Gagal mengambil data detail produk.",
    });
    router.push("/detail-products");
  }
};
const updateDetailProduct = async () => {
  const confirm = await Swal.fire({
    title: "Perbarui Detail Produk?",
    text: "Apakah kamu yakin ingin memperbarui detail produk ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Perbarui",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
  });

  if (!confirm.isConfirmed) return;

  isSubmitting.value = true;
  Object.keys(errors).forEach((k) => (errors[k] = ""));

  try {
    const id = route.params.id;
    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.put(`/api/detail-products/${id}`, form);

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: response.data.meta?.message || "Detail produk berhasil diperbarui.",
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
        html: `<ul style='text-align:center; color:#e53e3e;'>${errorMessages}</ul>`,
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

onMounted(() => {
  fetchProducts();
  fetchDetailProduct();
});
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Ubah Detail Produk</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Perbarui data spesifikasi produk di bawah ini.</p>
      </div>

      <!-- Tabs -->
      <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-4">
          <button @click="activeTab='general'" :class="activeTab==='general'? 'border-primary text-primary dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200">Umum</button>
          <button @click="activeTab='engine'" :class="activeTab==='engine'? 'border-primary text-primary dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200">Mesin</button>
          <button @click="activeTab='capacity'" :class="activeTab==='capacity'? 'border-primary text-primary dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200">Kapasitas</button>
          <button @click="activeTab='power'" :class="activeTab==='power'? 'border-primary text-primary dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200">Daya</button>
          <button @click="activeTab='dimension'" :class="activeTab==='dimension'? 'border-primary text-primary dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200">Dimensi & Berat</button>
        </nav>
      </div>

      <form @submit.prevent="updateDetailProduct" class="space-y-6">
        <div v-if="activeTab==='general'" class="space-y-4">
          <FormSelect
            id="product_id"
            label="Produk"
            v-model="form.product_id"
            :error="errors.product_id"
            required
          >
            <option disabled value="">Pilih produk</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.title }}</option>
          </FormSelect>

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
          <button type="button" @click="goBack" class="px-5 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Batal</button>
          <button type="submit" :disabled="isSubmitting" class="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200">
            {{ isSubmitting ? 'Menyimpan...' : 'Perbarui Detail' }}
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>

