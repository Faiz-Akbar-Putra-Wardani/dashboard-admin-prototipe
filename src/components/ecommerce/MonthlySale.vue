<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
  >
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
          Statistik Pemasukan Bulanan
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Total pemasukan per bulan tahun {{ selectedYear }}
        </p>
      </div>

      <div class="flex items-center gap-3">
         <label for="year-select" class="sr-only">Pilih Tahun</label>
        <select
          id="year-select"
          v-model="selectedYear"
          @change="fetchMonthlyData"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm"
        >
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>


        <!-- <DropdownMenu :menu-items="menuItems">
          <template #icon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z" fill="currentColor"/>
            </svg>
          </template>
        </DropdownMenu> -->
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Chart - PERBAIKAN: Tambah v-if untuk cek data ready -->
    <div v-else-if="chartReady && series.length > 0" class="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" class="-ml-5 min-w-[650px] xl:min-w-full pl-2">
        <VueApexCharts type="bar" height="280" :options="chartOptions" :series="series" />
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-3 gap-4 mt-4 pb-5">
      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p class="text-xs text-gray-500 dark:text-gray-400">Total Tahun Ini</p>
        <p class="text-lg font-bold text-gray-800 dark:text-white mt-1">
          Rp {{ formatCurrency(totalYearly) }}
        </p>
      </div>
      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p class="text-xs text-gray-500 dark:text-gray-400">Rata-rata/Bulan</p>
        <p class="text-lg font-bold text-gray-800 dark:text-white mt-1">
          Rp {{ formatCurrency(averageMonthly) }}
        </p>
      </div>
      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p class="text-xs text-gray-500 dark:text-gray-400">Bulan Tertinggi</p>
        <p class="text-lg font-bold text-gray-800 dark:text-white mt-1">
          {{ highestMonth }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, defineAsyncComponent } from 'vue'
import DropdownMenu from '../common/DropdownMenu.vue'
// ✅ LAZY LOAD: Ganti import biasa dengan defineAsyncComponent
const VueApexCharts = defineAsyncComponent(() => 
  import('vue3-apexcharts')
)
import Api from '@/services/api'
import Cookies from 'js-cookie'

const isLoading = ref(false)
const chartReady = ref(false)
const selectedYear = ref(new Date().getFullYear())

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)
})

const menuItems = [
  { label: 'Refresh Data', onClick: () => fetchMonthlyData() },
  { label: 'Download Report', onClick: () => console.log('Download report for', selectedYear.value) },
]

const monthlyRevenue = ref(Array(12).fill(0))

const series = computed(() => [
  {
    name: 'Pemasukan',
    data: monthlyRevenue.value,
  },
])

const totalYearly = computed(() => {
  return monthlyRevenue.value.reduce((sum, val) => sum + val, 0)
})

const averageMonthly = computed(() => {
  return totalYearly.value / 12
})

const highestMonth = computed(() => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const maxValue = Math.max(...monthlyRevenue.value)
  const maxIndex = monthlyRevenue.value.indexOf(maxValue)
  return months[maxIndex]
})

const chartOptions = {
  colors: ['#465fff'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'bar',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 6,
      borderRadiusApplication: 'end',
    },
  },
  dataLabels: { enabled: false },
  stroke: {
    show: true,
    width: 4,
    colors: ['transparent'],
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    fontFamily: 'Outfit',
    markers: { radius: 99 },
  },
  yaxis: {
    title: false,
    labels: {
      formatter: function (val) {
        if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + 'jt'
        return 'Rp ' + (val / 1000).toFixed(0) + 'rb'
      },
    },
  },
  grid: {
    yaxis: { lines: { show: true } },
  },
  fill: { opacity: 1 },
  tooltip: {
    y: {
      formatter: function (val) {
        return 'Rp ' + val.toLocaleString('id-ID')
      },
    },
  },
}

const formatCurrency = (value) => {
  if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'M'
  else if (value >= 1000000) return (value / 1000000).toFixed(1) + 'jt'
  else if (value >= 1000) return (value / 1000).toFixed(0) + 'rb'
  return value.toLocaleString('id-ID')
}

const fetchMonthlyData = async () => {
  try {
    chartReady.value = false
    isLoading.value = true
    
    const token = Cookies.get('token')
    Api.defaults.headers.common.Authorization = token

    const response = await Api.get('/api/profits/monthly-revenue', {
      params: { year: selectedYear.value }
    })

    if (response.data?.success) {
      monthlyRevenue.value = response.data.data.monthlyRevenue
      
      await nextTick()
      chartReady.value = true
    }
  } catch (error) {
    console.error('Error fetching monthly data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchMonthlyData()
});
</script>



