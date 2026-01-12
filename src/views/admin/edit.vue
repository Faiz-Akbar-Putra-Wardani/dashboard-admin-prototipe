<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Api from "@/services/api";
import { handleErrors } from "@/utils/handleErrors";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";


const router = useRouter();
const route = useRoute();

// UUID dari route
const uuid = route.params.uuid;

const currentPageTitle = ref("Edit Admin");
const token = Cookies.get("token");

const form = reactive({
  name: "",
  email: "",
  password: "",
  role: "",
});

const errors = reactive({});
const isSubmitting = ref(false);
const isLoading = ref(true);

// Fetch admin by UUID
const fetchAdmin = async () => {
  try {
    Api.defaults.headers.common["Authorization"] = token;

    const response = await Api.get(`/api/admins/${uuid}`);

    const admin = response.data.data;

    form.name = admin.name;
    form.email = admin.email;
    form.role = admin.role;

  } catch (error) {
    console.error("Gagal mengambil data admin:", error);

    Swal.fire({
      icon: "error",
      title: "Kesalahan!",
      text: "Gagal mengambil data admin.",
    });

    router.push("/data-admin");
  } finally {
    isLoading.value = false;
  }
};

const updateAdmin = async () => {
  const confirm = await Swal.fire({
    title: "Update Data?",
    text: "Apakah kamu yakin ingin mengupdate data admin ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Update",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
  });

  if (!confirm.isConfirmed) return;

  isSubmitting.value = true;

  // Reset error
  Object.keys(errors).forEach((key) => (errors[key] = ""));

  try {
    Api.defaults.headers.common["Authorization"] = token;

    const updateData = {
      name: form.name,
      email: form.email,
      role: form.role,
    };

    if (form.password?.trim()) {
      updateData.password = form.password;
    }

    const response = await Api.put(`/api/admins/${uuid}`, updateData);

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: response.data.meta?.message || "Data admin berhasil diupdate.",
      timer: 2000,
      showConfirmButton: false,
    });

    router.push("/data-admin");
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
        html: `<ul style="text-align: center; padding-left: 1.2rem; color: #e53e3e;">${errorMessages}</ul>`,
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

const goBack = () => router.push("/data-admin");

onMounted(() => {
  fetchAdmin();
});
</script>


<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <!-- Loading State -->
    <div v-if="isLoading" class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>

    <!-- Card -->
    <div
      v-else
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Admin
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Update informasi admin di bawah ini.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="updateAdmin" class="space-y-6">
        <!-- Nama -->
        <div class="group relative">
          <input
            id="name"
            v-model="form.name"
            type="text"
            :data-filled="form.name"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
            placeholder="Masukkan nama admin"
          />
          <label
            for="name"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
              peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
              peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
              peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Nama <span class="text-red-500">*</span>
          </label>
          <p
            v-if="errors.name"
            class="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div class="group relative">
          <input
            id="email"
            v-model="form.email"
            type="email"
            :data-filled="form.email"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
            placeholder="Masukkan email"
          />
          <label
            for="email"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
              peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
              peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
              peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Email <span class="text-red-500">*</span>
          </label>
          <p
            v-if="errors.email"
            class="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {{ errors.email }}
          </p>
        </div>

        <!-- Password (Optional) -->
        <div class="group relative">
          <input
            id="password"
            v-model="form.password"
            type="password"
            :data-filled="form.password"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
            placeholder="Masukkan password baru"
          />
          <label
            for="password"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20 
              peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
              peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
              peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Password Baru <span class="text-gray-400">(opsional)</span>
          </label>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Kosongkan jika tidak ingin mengubah password. Minimal 6 karakter jika diisi.
          </p>
          <p
            v-if="errors.password"
            class="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {{ errors.password }}
          </p>
        </div>

        <!-- Role -->
        <div class="group relative">
          <select
            id="role"
            v-model="form.role"
            :data-filled="form.role"
            class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 appearance-none focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all z-10 relative"
          >
            <option disabled value="">Pilih</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <label
            for="role"
            class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800 z-20
              peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
              peer-focus:-top-3 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
              peer-[&:not([data-filled=''])]:-top-3 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
          >
            Role <span class="text-red-500">*</span>
          </label>

          <!-- Custom Arrow Icon -->
          <svg
            class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>

          <p
            v-if="errors.role"
            class="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {{ errors.role }}
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
            <span>{{ isSubmitting ? "Mengupdate..." : "Perbarui Admin" }}</span>
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>
