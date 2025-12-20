<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
  >
    <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
          Transaksi Terbaru
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ transactions.length }} transaksi terakhir
        </p>
      </div>

      <div class="flex items-center gap-3">
      <label for="source-filter" class="sr-only">Filter Sumber Transaksi</label>
      <select
        id="source-filter"
        v-model="selectedSource"
        @change="fetchTransactions"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
      >
        <option value="">Semua</option>
        <option value="penjualan">Penjualan</option>
        <option value="sewa">Sewa</option>
        <option value="perbaikan">Perbaikan</option>
      </select>
    </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="ml-3 text-sm text-gray-500">Memuat data...</p>
    </div>

    <!-- Table -->
    <div v-else-if="transactions.length > 0" class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full table-fixed">
        <colgroup>
          l style="width: 15%;">  <!-- Invoice -->
          l style="width: 15%;">  <!-- Pelanggan -->
          l style="width: 30%;">  <!-- Item (LEBIH LEBAR) -->
          l style="width: 12%;">  <!-- Kategori -->
          l style="width: 15%;">  <!-- Total -->
          l style="width: 13%;">  <!-- Status -->
        </colgroup>
        <thead>
          <tr class="border-t border-gray-100 dark:border-gray-800">
            <th class="py-3 px-2 text-left">
              <p class="font-medium text-gray-500 text-xs dark:text-gray-400">Invoice</p>
            </th>
            <th class="py-3 px-2 text-left">
              <p class="font-medium text-gray-500 text-xs dark:text-gray-400">Pelanggan</p>
            </th>
            <th class="py-3 px-2 text-left">
              <p class="font-medium text-gray-500 text-xs dark:text-gray-400">Item</p>
            </th>
            <th class="py-3 px-2 text-left">
              <p class="font-medium text-gray-500 text-xs dark:text-gray-400">Kategori</p>
            </th>
            <th class="py-3 px-2 text-left">
              <p class="font-medium text-gray-500 text-xs dark:text-gray-400">Total</p>
            </th>
            <th class="py-3 px-2 text-left">
              <p class="font-medium text-gray-500 text-xs dark:text-gray-400">Status</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="transaction in transactions"
            :key="transaction.id"
            class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
            
          >
            <!-- Invoice -->
            <td class="py-3 px-2">
              <p class="font-medium text-gray-800 text-sm dark:text-white/90 truncate">
                {{ transaction.invoice }}
              </p>
              <span class="text-gray-500 text-xs dark:text-gray-400">
                {{ formatDate(transaction.date) }}
              </span>
            </td>
            
            <!-- Pelanggan -->
            <td class="py-3 px-2">
              <p class="text-gray-800 text-sm dark:text-white/90 truncate" :title="transaction.customer">
                {{ transaction.customer }}
              </p>
            </td>

            <!-- Item (LEBAR) -->
            <td class="py-3 px-2">
              <div class="flex items-center gap-3">
                <div class="h-[50px] w-[50px] flex-shrink-0 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                  <img 
                    v-if="transaction.items[0]?.image" 
                    :src="getImageUrl(transaction.items[0].image)" 
                    :alt="transaction.items[0]?.name"
                    class="w-full h-full object-cover"
                  />
                  <svg v-else class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-800 text-sm dark:text-white/90" :title="transaction.items[0]?.name || 'N/A'">
                    {{ transaction.items[0]?.name || 'N/A' }}
                  </p>
                  <span class="text-gray-500 text-xs dark:text-gray-400">
                    {{ transaction.items.length > 1 ? `+${transaction.items.length - 1} item lainnya` : '1 item' }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Kategori -->
            <td class="py-3 px-2">
              <span 
                :class="getSourceBadgeClass(transaction.source)"
                class="inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                {{ getSourceLabel(transaction.source) }}
              </span>
            </td>

            <!-- Total -->
            <td class="py-3 px-2">
              <p class="font-semibold text-gray-800 text-sm dark:text-white/90 whitespace-nowrap">
                {{ moneyFormat(transaction.total) }}
              </p>
            </td>

            <!-- Status -->
            <td class="py-3 px-2">
              <span
                :class="getStatusBadgeClass(transaction.status)"
                class="inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                {{ getStatusLabel(transaction.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Belum ada transaksi</p>
      <button 
        @click="fetchTransactions"
        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
      >
        Refresh Data
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getImageUrl } from '@/utils/getImageUrl'
import { moneyFormat } from '@/utils/moneyFormat'
import Api from '@/services/api'
import Cookies from 'js-cookie'

const transactions = ref([])
const isLoading = ref(false)
const selectedSource = ref('')

const fetchTransactions = async () => {
  try {
    isLoading.value = true
    const token = Cookies.get('token')
    
    if (!token) {
      console.error(' Token not found')
      return
    }
    
    Api.defaults.headers.common.Authorization = token

    const params = { limit: 5 }
    if (selectedSource.value) {
      params.source = selectedSource.value
    }

    const response = await Api.get('/api/profits/recent-transactions', { params })

    if (response.data?.success) {
      transactions.value = response.data.data
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getSourceLabel = (source) => {
  const labels = {
    penjualan: 'Penjualan',
    sewa: 'Sewa',
    perbaikan: 'Perbaikan'
  }
  return labels[source] || source
}

const getSourceBadgeClass = (source) => {
  const classes = {
    penjualan: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    sewa: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
    perbaikan: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400'
  }
  return classes[source] || 'bg-gray-50 text-gray-600'
}

const getStatusLabel = (status) => {
  const labels = {
    // Penjualan: proses, dikirim, selesai
    proses: 'Proses',
    dikirim: 'Dikirim',
    
    // Sewa: proses, disewa, selesai
    disewa: 'Disewa',
    
    // Perbaikan: masuk, dikerjakan, selesai
    masuk: 'Masuk',
    dikerjakan: 'Dikerjakan',
    
    // Universal
    selesai: 'Selesai'
  }
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
}



// 
const getStatusBadgeClass = (status) => {
  const classes = {
    // Penjualan
    proses: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    dikirim: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    
    // Sewa
    disewa: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    
    // Perbaikan
    masuk: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    dikerjakan: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    
    // Universal
    selesai: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-500'
  }
  return classes[status] || 'bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400'
}



// const viewDetail = (transaction) => {
//   const routes = {
//     penjualan: `/halaman-data-penjualan/detail/${t.uuid}`,
//     sewa: `/sewa-detail/${transaction.invoice}`,
//     perbaikan: `/perbaikan-detail/${transaction.invoice}`
//   }
  
//   const route = routes[transaction.source]
//   if (route) {
//     window.location.href = route
//   }
// }

const goToTransactionList = () => {
  window.location.href = '/laporan-transaksi'
}

onMounted(() => {
  fetchTransactions()
});
</script>


<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
