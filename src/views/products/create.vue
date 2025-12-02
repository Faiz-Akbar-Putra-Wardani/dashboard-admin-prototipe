<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Api from "@/services/api";
import { handleErrors } from "@/utils/handleErrors";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";

const router = useRouter();
const currentPageTitle = ref("Tambah Produk");
const token = Cookies.get("token");

const form = reactive({
  title: "",
  category_id: "",
  sell_price: "",
  rent_price: "",
  stock: "",
  description: "",
  image: null,
});

const categories = ref([]);
const errors = reactive({});
const isSubmitting = ref(false);
const previewUrl = ref(null);
const fileInputRef = ref(null);
const fileName = ref("");
const fetchCategories = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.get("/api/categories-all");
    categories.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);
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
    return;
  }

  form.image = file;
  fileName.value = file.name;
  previewUrl.value = URL.createObjectURL(file);
};

const storeProduct = async () => {
  const confirm = await Swal.fire({
    title: "Simpan Data?",
    text: "Apakah kamu yakin ingin menambahkan produk baru?",
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
    const formData = new FormData();

    for (const key in form) {
      if (key === "rent_price") {
        // Jika kosong → kirim NULL (bukan "-")
        if (form.rent_price === "" || form.rent_price === null) {
          formData.append("rent_price", null);
        } else {
          formData.append("rent_price", form.rent_price);
        }
      } else {
        formData.append(key, form[key]);
      }
    }

    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.post("/api/products", formData);

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text:
        response.data.meta?.message ||
        "Data produk berhasil disimpan.",
      timer: 2000,
      showConfirmButton: false,
    });

    router.push("/products");
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
        html: `<ul style="text-align: center; color: #e53e3e;">${errorMessages}</ul>`,
        confirmButtonText: "Tutup",
        confirmButtonColor: "#ef4444",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Kesalahan!",
        text: "Terjadi kesalahan, silakan coba lagi.",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => router.push("/products");

onMounted(fetchCategories);
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Tambah Produk Baru</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Isi kolom di bawah untuk menambahkan produk baru.</p>
      </div>

      <form @submit.prevent="storeProduct" class="space-y-6">
        <!-- Nama Produk -->
        <div class="group relative">
          <input
            id="title"
            v-model="form.title"
            type="text"
            :data-filled="form.title"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan nama produk"
          />
          <label
            for="title"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600">
            Nama Produk <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.title" class="mt-1 text-xs text-red-600">{{ errors.title }}</p>
        </div>

        <!-- Kategori -->
        <div class="group relative">
        <div class="relative">
            <select
            id="category_id"
            v-model="form.category_id"
            :data-filled="form.category_id"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
            <option disabled value="">Pilih merk</option>
            <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
            >
                {{ cat.name }}
            </option>
            </select>

            <!-- Label -->
            <label
            for="category_id"
            class="absolute left-3 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none z-20
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
            >
            <!-- Bungkus teks label dalam span berlatar -->
            <span class="relative z-10 bg-white dark:bg-gray-800 px-1">
                Kategori <span class="text-red-500">*</span>
            </span>
            </label>
        </div>

        <p v-if="errors.category_id" class="mt-1 text-xs text-red-600">
            {{ errors.category_id }}
        </p>
      </div>

        <!-- Harga -->
        <div class="group relative">
          <input
            id="sell_price"
            v-model="form.sell_price"
            type="number"
            :data-filled="form.sell_price"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan harga produk"
          />
          <label
            for="sell_price"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600">
            Harga Jual <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.sell_price" class="mt-1 text-xs text-red-600">{{ errors.sell_price }}</p>
        </div>

        <!-- Harga Sewa (OPSIONAL) -->
      <div class="group relative">
        <input
          id="rent_price"
          v-model="form.rent_price"
          type="number"
          min="0"
          :data-filled="form.rent_price"
          class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
          placeholder="Masukkan harga sewa (opsional)"
        />
        <label
          for="rent_price"
          class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
          peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
          peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
          peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600">
          Harga Sewa <span class="text-gray-400">(opsional)</span>
        </label>

        <p class="mt-1 text-xs text-gray-500">
          Kosongkan jika produk tidak disewakan
        </p>
        <p v-if="errors.rent_price" class="mt-1 text-xs text-red-600">
          {{ errors.rent_price }}
        </p>
      </div>

        <!-- Stok -->
        <div class="group relative">
          <input
            id="stock"
            v-model="form.stock"
            type="number"
            :data-filled="form.stock"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan stok produk"
          />
          <label
            for="stock"
            class="absolute left-4 top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-500 transition-all duration-200 ease-out pointer-events-none
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600">
            Stok <span class="text-red-500">*</span>
          </label>
          <p v-if="errors.stock" class="mt-1 text-xs text-red-600">{{ errors.stock }}</p>
        </div>

        <!-- Deskripsi -->
        <div class="group relative">
        <textarea
            id="description"
            v-model="form.description"
            :data-filled="form.description"
            rows="4"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Masukkan deskripsi produk"
        ></textarea>

        <!-- Label -->
        <label
            for="description"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20
            peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
            peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
            peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400">
            Deskripsi Produk <span class="text-red-500">*</span>
        </label>

            <p v-if="errors.description" class="mt-1 text-xs text-red-600">{{ errors.description }}</p>
            </div>


        <!-- Upload Gambar -->
        <div class="group relative">
          <label for="image" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Gambar <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="$refs.fileInputRef.click()"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:ring focus:ring-blue-300"
            >
              Pilih Gambar
            </button>
            <span v-if="fileName" class="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px]">
              {{ fileName }}
            </span>
          </div>
          <input id="image" type="file" accept="image/*" ref="fileInputRef" @change="handleFileChange" class="hidden" />
          <p v-if="errors.image" class="mt-1 text-xs text-red-600">{{ errors.image }}</p>

          <div v-if="previewUrl" class="mt-3">
            <img :src="previewUrl" alt="Preview" class="w-24 h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-700" />
          </div>
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
            <span>{{ isSubmitting ? "Menyimpan..." : "Simpan Produk" }}</span>
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>
