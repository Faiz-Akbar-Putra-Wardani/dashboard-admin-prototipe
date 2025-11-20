<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";
import Api from "@/services/api";
import Cookies from "js-cookie";

const props = defineProps({
  id: [Number, String],
  endpoint: String,
  fetchData: Function,
  title: {
    type: String,
    default: "Hapus Data",
  },
  message: {
    type: String,
    default:
      "Apakah kamu yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
  },
});

const deleteData = async () => {
  const token = Cookies.get("token");
  Api.defaults.headers.common["Authorization"] = token;

  // 🔥 Konfirmasi Hapus menggunakan SweetAlert2
  const result = await Swal.fire({
    title: props.title,
    text: props.message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e3342f",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await Api.delete(`${props.endpoint}/${props.id}`);
      props.fetchData();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: " Berhasil dihapus.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat menghapus data.",
      });
    }
  }
};
</script>

<template>
  <button
    @click="deleteData"
    class="flex items-center justify-center p-2 text-red-600 hover:text-red-700 transition-colors duration-150 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 w-8 h-8 sm:w-9 sm:h-9"
    title="Hapus"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 sm:h-6 sm:w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 
        4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 
        1v3M4 7h16"
      />
    </svg>
  </button>
</template>
