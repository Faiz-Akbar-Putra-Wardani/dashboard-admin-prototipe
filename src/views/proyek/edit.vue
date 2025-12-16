<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

import Api from "@/services/api";
import { handleErrors } from "@/utils/handleErrors";
import { getImageUrl } from "@/utils/getImageUrl";

import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

const route = useRoute();
const router = useRouter();

const currentPageTitle = ref("Edit Proyek");

const token = Cookies.get("token");

const projectId = route.params.uuid;

const form = reactive({
  project_name: "",
  location: "",
  project_category_id: "", 
  image: null,
});

const projectCategories = ref([]); 
const selectedCategory = ref(null); 
const errors = reactive({});
const isSubmitting = ref(false);
const isLoading = ref(true); 
const previewUrl = ref(null);
const fileInputRef = ref(null);
const fileName = ref("");
const oldImage = ref(null);

const fetchProjectCategories = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;
    const response = await Api.get("/api/project-categories-all");
    
    projectCategories.value = (response.data.data || []).map(cat => ({
      value: cat.id, 
      id: cat.id,
      uuid: cat.uuid,
      label: cat.name, 
      name: cat.name,
      slug: cat.slug
    }));
    
    console.log("Categories mapped:", projectCategories.value);
    
  } catch (error) {
    console.error("❌ Gagal mengambil kategori proyek:", error);
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Kategori",
      text: "Tidak dapat mengambil data kategori proyek.",
    });
  }
};
const fetchProject = async () => {
  try {
    isLoading.value = true;
    Api.defaults.headers.common["Authorization"] = token;

    const response = await Api.get(`/api/projects/${projectId}`);
    const project = response.data.data;

    console.log("=== FETCH PROJECT ===");
    console.log("Project data:", project);

    form.project_name = project.project_name;
    form.location = project.location;
    form.project_category_id = project.category?.id || ""; 
    oldImage.value = project.image ? getImageUrl(project.image) : null;
    previewUrl.value = oldImage.value;

    if (project.category) {
      selectedCategory.value = {
        value: project.category.id,
        id: project.category.id,
        uuid: project.category.uuid,
        label: project.category.name,
        name: project.category.name,
        slug: project.category.slug
      };
      
      console.log("Selected category set to:", selectedCategory.value);
    }

  } catch (error) {
    console.error("❌ Error fetching project:", error);
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Data proyek tidak ditemukan.",
    });

    router.push("/projects");
  } finally {
    isLoading.value = false;
  }
};

const handleCategoryChange = (category) => {
 
  if (category) {
    const categoryId = category.id || category.value;
    
    if (typeof categoryId !== 'number') {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Category ID tidak valid (harus berupa angka)",
      });
      form.project_category_id = "";
      selectedCategory.value = null;
      return;
    }
    
    form.project_category_id = categoryId;
    console.log("Category ID set to:", form.project_category_id);
  } else {
    form.project_category_id = "";
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

const updateProject = async () => {
  if (!form.project_category_id || form.project_category_id === "") {
    Swal.fire({
      icon: "warning",
      title: "Kategori Belum Dipilih",
      text: "Silakan pilih kategori proyek terlebih dahulu.",
    });
    return;
  }

  if (typeof form.project_category_id !== 'number') {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Category ID tidak valid (bukan angka)",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Simpan Perubahan?",
    text: "Apakah kamu yakin ingin menyimpan perubahan ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
  });

  if (!confirm.isConfirmed) return;

  isSubmitting.value = true;
  errors.project_name = "";
  errors.location = "";
  errors.project_category_id = "";
  errors.image = "";

  try {
    const formData = new FormData();
    formData.append("project_name", form.project_name);
    formData.append("location", form.location);
    formData.append("project_category_id", form.project_category_id); 

    if (form.image) formData.append("image", form.image);

    // Debug formData
    for (let pair of formData.entries()) {
      console.log(pair[0], ":", pair[1], typeof pair[1]);
    }

    Api.defaults.headers.common["Authorization"] = token;

    const response = await Api.put(`/api/projects/${projectId}`, formData);

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text:
        response.data.meta?.message ||
        "Perubahan data proyek berhasil disimpan.",
      timer: 2000,
      showConfirmButton: false,
    });

    router.push("/projects");
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
        html: `
          <ul style="text-align: center; margin: 0; padding-left: 1.2rem; color: #e53e3e;">
            ${errorMessages}
          </ul>
        `,
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

const goBack = () => router.push("/projects");
onMounted(async () => {
  await fetchProjectCategories();
  await fetchProject();
});
</script>

<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div class="space-y-4 mt-6">
          <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      <!-- Form Content -->
      <div v-else>
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Proyek
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Perbarui informasi proyek di bawah ini.
          </p>
        </div>

        <form @submit.prevent="updateProject" class="space-y-6">

          <!-- NAMA PROYEK -->
          <div class="group relative">
            <input
              id="project_name"
              v-model="form.project_name"
              type="text"
              :data-filled="form.project_name"
              class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
              placeholder="Masukkan nama proyek"
            />
            <label
              for="project_name"
              class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
            >
              Nama Proyek <span class="text-red-500">*</span>
            </label>
            <p v-if="errors.project_name" class="mt-1 text-xs text-red-600">
              {{ errors.project_name }}
            </p>
          </div>
          
          <div class="group relative">
            <label
              for="project_category_id"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Kategori Proyek <span class="text-red-500">*</span>
            </label>
            <v-select
              v-model="selectedCategory"
              :options="projectCategories"
              :reduce="(category) => category"
              label="label"
              placeholder="Pilih kategori proyek"
              @update:modelValue="handleCategoryChange"
              class="vue-select-custom"
            >
              <template #no-options>
                Tidak ada kategori ditemukan
              </template>
            </v-select>
            <p
              v-if="errors.project_category_id"
              class="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.project_category_id }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ubah kategori untuk proyek ini (Perbaikan, Instalasi, dll)
            </p>
          </div>

          <!-- LOKASI -->
          <div class="group relative">
            <input
              id="location"
              v-model="form.location"
              type="text"
              :data-filled="form.location"
              class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
              placeholder="Masukkan lokasi proyek"
            />
            <label
              for="location"
              class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
            >
              Lokasi <span class="text-red-500">*</span>
            </label>
            <p v-if="errors.location" class="mt-1 text-xs text-red-600">
              {{ errors.location }}
            </p>
          </div>

          <!-- GAMBAR -->
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Gambar <span class="text-gray-400">(opsional)</span>
            </label>

            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="$refs.fileInputRef.click()"
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:ring focus:ring-blue-300 transition-all"
              >
                Pilih Gambar
              </button>

              <span v-if="fileName" class="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                {{ fileName }}
              </span>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleFileChange"
            />

            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Kosongkan jika tidak ingin mengubah gambar
            </p>

            <p v-if="errors.image" class="mt-1 text-xs text-red-600">
              {{ errors.image }}
            </p>

            <!-- Preview Gambar -->
            <div v-if="previewUrl" class="mt-3">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {{ form.image ? 'Gambar Baru:' : 'Gambar Saat Ini:' }}
              </p>
              <img 
                :src="previewUrl" 
                alt="Preview"
                class="w-32 h-32 rounded-lg border border-gray-300 dark:border-gray-700 object-cover" 
              />
            </div>
          </div>

          <!-- BUTTON -->
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
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isSubmitting ? "Menyimpan..." : "Update Proyek" }}</span>
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
