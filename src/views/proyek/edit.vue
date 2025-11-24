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

const route = useRoute();
const router = useRouter();

const currentPageTitle = ref("Edit Proyek");

const token = Cookies.get("token");

const projectId = route.params.id;

const form = reactive({
  project_name: "",
  location: "",
  image: null,      
});

const errors = reactive({});
const isSubmitting = ref(false);
const previewUrl = ref(null);
const fileInputRef = ref(null);
const fileName = ref("");
const oldImage = ref(null);

const fetchProject = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;

    const response = await Api.get(`/api/projects/${projectId}`);
    const project = response.data.data;

    form.project_name = project.project_name;
    form.location = project.location;

    oldImage.value = project.image ? getImageUrl(project.image) : null;

    previewUrl.value = oldImage.value;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Data proyek tidak ditemukan.",
    });

    router.push("/projects");
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
  errors.image = "";

  try {
    const formData = new FormData();
    formData.append("project_name", form.project_name);
    formData.append("location", form.location);

    if (form.image) formData.append("image", form.image);

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

// On Mounted
onMounted(fetchProject);
</script>


<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 class="text-xl font-semibold mb-6">Edit Proyek</h2>

      <form @submit.prevent="updateProject" class="space-y-6">

        <!-- NAMA -->
        <div class="group relative">
          <input
            id="project_name"
            v-model="form.project_name"
            type="text"
            :data-filled="form.project_name"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
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
          <p v-if="errors.project_name" class="text-xs text-red-600">
            {{ errors.project_name }}
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
          <p v-if="errors.location" class="text-xs text-red-600">
            {{ errors.location }}
          </p>
        </div>

        <!-- GAMBAR -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Upload Gambar</label>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="$refs.fileInputRef.click()"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
            >
              Pilih Gambar
            </button>

            <span v-if="fileName" class="text-sm text-gray-600 truncate max-w-[150px]">
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

          <p v-if="errors.image" class="text-xs text-red-600">
            {{ errors.image }}
          </p>

          <div v-if="previewUrl" class="mt-3">
            <img :src="previewUrl" class="w-24 h-24 rounded-lg border object-cover" />
          </div>
        </div>

        <!-- BUTTON -->
        <div class="flex justify-end gap-4">
          <button type="button" @click="goBack" class="border px-5 py-2.5 rounded-lg">
            Batal
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="bg-indigo-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {{ isSubmitting ? "Menyimpan..." : "Update Proyek" }}
          </button>
        </div>

      </form>
    </div>
  </admin-layout>
</template>
