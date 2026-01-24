<script setup>
import { ref, onMounted } from "vue";
import Api from "@/services/api";
import Cookies from "js-cookie";

const stats = ref({
  penjualan: 0,
  sewa: 0,
  perbaikan: 0,
  total: 0
});

const isLoading = ref(true);

const fetchStats = async () => {
  try {
    isLoading.value = true;
    const token = Cookies.get("token");
    Api.defaults.headers.common.Authorization = token;

    const res = await Api.get("/api/reports/transaction-stats");
    
    if (res.data?.success) {
      stats.value = res.data.data;
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
    
    <!-- CARD PERBAIKAN -->
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div
        class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-900/30"
      >
        <svg
          class="fill-orange-600 dark:fill-orange-400"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M14.2788 2.15224C14.3723 1.97033 14.5515 1.84614 14.7537 1.82094C14.9559 1.79574 15.1582 1.87281 15.2961 2.02709L17.7961 4.82709C17.9341 4.98137 18 5.18935 18 5.4V16.6C18 16.8106 17.9341 17.0186 17.7961 17.1729L15.2961 19.9729C15.1582 20.1272 14.9559 20.2043 14.7537 20.1791C14.5515 20.1539 14.3723 20.0297 14.2788 19.8478L2.27885 1.84775C2.17569 1.6518 2.18146 1.41699 2.29381 1.22598C2.40617 1.03497 2.61229 0.916748 2.83618 0.916748H13.1638C13.3877 0.916748 13.5938 1.03497 13.7062 1.22598L14.2788 2.15224ZM3.36502 2.41675L13.9462 17.4167H15.9615L14.7115 16.0667V5.6L15.9615 4.25H13.9462L3.36502 2.41675ZM19.2961 6.32709C19.1582 6.18281 19 6.10574 18.7961 6.10574C18.5923 6.10574 18.4341 6.18281 18.2961 6.32709L16.7961 8.32709C16.6582 8.48137 16.5923 8.68935 16.5923 8.9V15.1C16.5923 15.3106 16.6582 15.5186 16.7961 15.6729L18.2961 17.6729C18.4341 17.8272 18.5923 17.9043 18.7961 17.9043C19 17.9043 19.1582 17.8272 19.2961 17.6729L20.7961 15.6729C20.9341 15.5186 21 15.3106 21 15.1V8.9C21 8.68935 20.9341 8.48137 20.7961 8.32709L19.2961 6.32709Z"
            fill=""
          />
        </svg>
      </div>

      <div class="flex items-end justify-between mt-5">
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-300">Total Perbaikan</span>
          <p class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            <span v-if="isLoading" class="inline-block w-20 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            <span v-else>{{ stats.perbaikan.toLocaleString("id-ID") }} transaksi</span>
          </p>
        </div>
      </div>
    </div>

    <!-- CARD PENJUALAN -->
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div
        class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/30"
      >
        <svg
          class="fill-blue-600 dark:fill-blue-400"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M11.665 3.75621C11.8762 3.65064 12.1247 3.65064 12.3358 3.75621L18.7807 6.97856L12.3358 10.2009C12.1247 10.3065 11.8762 10.3065 11.665 10.2009L5.22014 6.97856L11.665 3.75621ZM4.29297 8.19203V16.0946C4.29297 16.3787 4.45347 16.6384 4.70757 16.7654L11.25 20.0366V11.6513C11.1631 11.6205 11.0777 11.5843 10.9942 11.5426L4.29297 8.19203ZM12.75 20.037L19.2933 16.7654C19.5474 16.6384 19.7079 16.3787 19.7079 16.0946V8.19202L13.0066 11.5426C12.9229 11.5844 12.8372 11.6208 12.75 11.6516V20.037ZM13.0066 2.41456C12.3732 2.09786 11.6277 2.09786 10.9942 2.41456L4.03676 5.89319C3.27449 6.27432 2.79297 7.05342 2.79297 7.90566V16.0946C2.79297 16.9469 3.27448 17.726 4.03676 18.1071L10.9942 21.5857L11.3296 20.9149L10.9942 21.5857C11.6277 21.9024 12.3732 21.9024 13.0066 21.5857L19.9641 18.1071C20.7264 17.726 21.2079 16.9469 21.2079 16.0946V7.90566C21.2079 7.05342 20.7264 6.27432 19.9641 5.89319L13.0066 2.41456Z"
            fill=""
          />
        </svg>
      </div>

      <div class="flex items-end justify-between mt-5">
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-300">Total Penjualan</span>
          <p class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            <span v-if="isLoading" class="inline-block w-20 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            <span v-else>{{ stats.penjualan.toLocaleString("id-ID") }} transaksi</span>
          </p>
        </div>
      </div>
    </div>

    <!-- CARD SEWA -->
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div
        class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30"
      >
         <svg
          class="fill-green-600 dark:fill-green-400"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75ZM1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V11.6893L15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2626 15.3232 13.9697 15.0303L11.4697 12.5303C11.329 12.3897 11.25 12.1989 11.25 12V8C11.25 7.58579 11.5858 7.25 12 7.25Z"
            fill=""
          />
        </svg>
      </div>

      <div class="flex items-end justify-between mt-5">
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-300">Total Sewa</span>
          <p class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            <span v-if="isLoading" class="inline-block w-20 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            <span v-else>{{ stats.sewa.toLocaleString("id-ID") }} transaksi</span>
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

