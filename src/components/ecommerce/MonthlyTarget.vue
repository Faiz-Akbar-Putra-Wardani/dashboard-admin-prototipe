<template>
  <div
    class="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div
      class="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6"
    >
      <div class="flex justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Total Pemasukan</h3>
          <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Total pemasukan dari semua sumber transaksi
          </p>
        </div>
        <div>
          <DropdownMenu :menu-items="menuItems">
            <template #icon>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                  fill="currentColor"
                />
              </svg>
            </template>
          </DropdownMenu>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="relative max-h-[195px] flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Chart Display -->
      <div v-else class="relative max-h-[195px]">
        <div id="chartTwo" class="h-full">
          <div class="radial-bar-chart">
            <VueApexCharts type="radialBar" :height="330" :options="chartOptions" :series="series" />
          </div>
        </div>
        <span
          class="absolute left-1/2 top-[85%] -translate-x-1/2 -translate-y-[85%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500"
        >
          Total: Rp {{ revenue.total.toLocaleString("id-ID") }}
        </span>
      </div>
      
      <p class="mx-auto mt-1.5 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
        Total pemasukan dari {{ totalTransactions }} transaksi
      </p>
    </div>

    <div class="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
      <!-- PERBAIKAN -->
      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Perbaikan
        </p>
        <p
          class="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
        >
          <span v-if="isLoading" class="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
          <span v-else>Rp {{ formatCurrency(revenue.perbaikan) }}</span>
        </p>
        <p class="text-center text-xs text-gray-400 mt-1">
          {{ revenuePercentage.perbaikan }}%
        </p>
      </div>

      <div class="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

      <!-- PENJUALAN -->
      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Penjualan
        </p>
        <p
          class="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
        >
          <span v-if="isLoading" class="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
          <span v-else>Rp {{ formatCurrency(revenue.penjualan) }}</span>
        </p>
        <p class="text-center text-xs text-gray-400 mt-1">
          {{ revenuePercentage.penjualan }}%
        </p>
      </div>

      <div class="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

      <!-- SEWA -->
      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Sewa
        </p>
        <p
          class="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
        >
          <span v-if="isLoading" class="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
          <span v-else>Rp {{ formatCurrency(revenue.sewa) }}</span>
        </p>
        <p class="text-center text-xs text-gray-400 mt-1">
          {{ revenuePercentage.sewa }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DropdownMenu from '../common/DropdownMenu.vue'
import VueApexCharts from 'vue3-apexcharts'
import Api from '@/services/api'
import Cookies from 'js-cookie'

const menuItems = [
  { label: 'Refresh Data', onClick: () => fetchRevenue() },
  { label: 'View Details', onClick: () => console.log('View Details') },
]

const isLoading = ref(true)
const revenue = ref({
  penjualan: 0,
  sewa: 0,
  perbaikan: 0,
  total: 0
})

const stats = ref({
  penjualan: { count: 0 },
  sewa: { count: 0 },
  perbaikan: { count: 0 }
})

// Hitung total transaksi
const totalTransactions = computed(() => {
  return stats.value.penjualan.count + stats.value.sewa.count + stats.value.perbaikan.count
})

// Hitung persentase revenue per sumber
const revenuePercentage = computed(() => {
  if (revenue.value.total === 0) {
    return { penjualan: '0.0', sewa: '0.0', perbaikan: '0.0' }
  }
  
  return {
    penjualan: ((revenue.value.penjualan / revenue.value.total) * 100).toFixed(1),
    sewa: ((revenue.value.sewa / revenue.value.total) * 100).toFixed(1),
    perbaikan: ((revenue.value.perbaikan / revenue.value.total) * 100).toFixed(1),
  }
})

// Series untuk chart - menggunakan persentase tertinggi
const series = computed(() => {
  const percentages = [
    parseFloat(revenuePercentage.value.penjualan),
    parseFloat(revenuePercentage.value.sewa),
    parseFloat(revenuePercentage.value.perbaikan)
  ]
  return [Math.max(...percentages)]
})

// Format currency
const formatCurrency = (value) => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'M'
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'jt'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'rb'
  }
  return value.toLocaleString('id-ID')
}

// Fetch revenue data
const fetchRevenue = async () => {
  try {
    isLoading.value = true
    const token = Cookies.get('token')
    Api.defaults.headers.common.Authorization = token

    // Fetch revenue stats
    const revenueRes = await Api.get('/api/profits/revenue-stats')
    
    if (revenueRes.data?.success) {
      const data = revenueRes.data.data
      revenue.value = {
        penjualan: data.bySource.penjualan?.total || 0,
        sewa: data.bySource.sewa?.total || 0,
        perbaikan: data.bySource.perbaikan?.total || 0,
        total: data.totalRevenue || 0
      }
      
      stats.value = {
        penjualan: { count: data.bySource.penjualan?.count || 0 },
        sewa: { count: data.bySource.sewa?.count || 0 },
        perbaikan: { count: data.bySource.perbaikan?.count || 0 }
      }
    }
  } catch (error) {
    console.error('Error fetching revenue:', error)
  } finally {
    isLoading.value = false
  }
}

// Chart options
const chartOptions = {
  colors: ['#465FFF'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    sparkline: {
      enabled: true,
    },
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: {
        size: '80%',
      },
      track: {
        background: '#E4E7EC',
        strokeWidth: '100%',
        margin: 5,
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          fontSize: '36px',
          fontWeight: '600',
          offsetY: 60,
          color: '#1D2939',
          formatter: function (val) {
            return val.toFixed(1) + '%'
          },
        },
      },
    },
  },
  fill: {
    type: 'solid',
    colors: ['#465FFF'],
  },
  stroke: {
    lineCap: 'round',
  },
  labels: ['Progress'],
}

onMounted(() => {
  fetchRevenue()
})
</script>

<style scoped>
.radial-bar-chart {
  width: 100%;
  max-width: 330px;
  margin: 0 auto;
}
</style>
