<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSaleStore } from '@/stores/useSaleStore'
import { useCalculation } from '@/composables/useCalculation'
import { useFilter } from '@/composables/useFilter'
import { useTransactionEdit } from '@/composables/useTransactionEdit'
import { useTransactionUpdate } from '@/composables/useTransactionUpdate'

import FilterSection from './components/FilterSection.vue'
import ProductGrid from './components/ProductGrid.vue'
import CashierSection from './components/CashierSection.vue'
import CustomerModal from './components/CustomerModal.vue'

const route = useRoute()
const router = useRouter()
const store = useSaleStore()
const transactionUuid = route.params.uuid

// Edit transaction composable
const transactionEdit = useTransactionEdit(transactionUuid)

// Calculation menggunakan cart dari transactionEdit
const cartRef = computed(() => transactionEdit.cart.value)
const calculation = useCalculation(cartRef)

// Sync financial data from transactionEdit to calculation (PPN, nego, dp)
const syncFinancialData = () => {
  if (transactionEdit.ppn.value !== null) {
    calculation.ppn.value = transactionEdit.ppn.value
  }
  if (transactionEdit.nego.value !== null) {
    calculation.nego.value = transactionEdit.nego.value
  }
  if (transactionEdit.dp.value !== null) {
    calculation.dp.value = transactionEdit.dp.value
  }
}

// Products filter
const productsRef = computed(() => store.products || [])
const { searchQuery, selectedBrand, filteredItems: filteredProducts } =
  useFilter(productsRef)

// Update handler
const { processUpdate } = useTransactionUpdate()

const activeTab = ref('products')
const showCustomerModal = ref(false)

const cartCount = computed(() => (transactionEdit.cart.value || []).length)

// HANDLERS
const goToSalesPage = () => {
  router.push('/halaman-data-penjualan')
}

const chooseCustomer = (customer) => {
  transactionEdit.setCustomer(customer)
  showCustomerModal.value = false
}

const handleUpdate = async () => {
  const success = await processUpdate(transactionEdit, {
    subtotal: calculation.subtotal.value,
    ppnSafe: calculation.ppnSafe.value,
    ppnNominal: calculation.ppnNominal.value,
    negoSafe: calculation.negoSafe.value,
    dpSafe: calculation.dpSafe.value,
    totalBayar: calculation.totalBayar.value,
  })

  if (success) {
    console.log('Transaction updated successfully')
  }
}

onMounted(async () => {
  await store.init()
  await transactionEdit.fetchTransactionDetail()
  syncFinancialData()
});
</script>


<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
    <!-- Back Button - Fixed Top -->
    <div class="bg-white/90 backdrop-blur-md shadow-md border-b border-cyan-100 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <button
          @click="goToSalesPage"
          class="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-white hover:bg-blue-50 text-gray-700 border-2 border-blue-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Data Penjualan</span>
        </button>
      </div>
    </div>

    <!-- Header Tabs -->
    <div class="bg-white/80 backdrop-blur-md shadow-lg sticky top-[57px] z-30 border-b-2 border-cyan-100">
      <div class="max-w-7xl mx-auto flex gap-3 p-4 overflow-x-auto">
        <button
          @click="activeTab = 'products'"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform',
            activeTab === 'products'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-200'
          ]"
        >
          <span>Daftar Produk</span>
        </button>
        <button
          @click="activeTab = 'cart'"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform relative',
            activeTab === 'cart'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-200'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Keranjang</span>
          <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
            {{ cartCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="max-w-7xl mx-auto p-4 md:p-6">
      <!-- Loading State -->
      <div v-if="transactionEdit.isLoading.value || store.isLoading" class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Memuat data...</p>
        </div>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- MOBILE – stacked -->
        <div class="md:hidden">
          <div v-show="activeTab === 'products'" class="animate-fade-in">
            <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 mb-4 border border-blue-200">
              <FilterSection 
                v-model:search="searchQuery" 
                v-model:brand="selectedBrand"
                :brands="store.categories"
              />
            </div>
            <ProductGrid 
              :products="filteredProducts" 
              @add-to-cart="transactionEdit.addToLocalCart" 
            />
          </div>
          <div v-show="activeTab === 'cart'" class="animate-fade-in">
            <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 border border-blue-200">
             <!-- MOBILE – CART TAB -->
              <CashierSection
                :cart="transactionEdit.cart.value"
                :selected-customer="transactionEdit.selectedCustomer.value"
                :invoice="transactionEdit.invoice.value"
                :subtotal="calculation.subtotal.value"
                :ppn-nominal="calculation.ppnNominal.value"
                :total-before-nego="calculation.totalBeforeNego.value"
                :total-after-nego="calculation.totalAfterNego.value"
                :total-bayar="calculation.totalBayar.value"
                v-model:ppn="calculation.ppn.value"
                v-model:nego="calculation.nego.value"
                v-model:dp="calculation.dp.value"
                v-model:status="transactionEdit.status.value"
                @checkout="handleUpdate"
                @remove-item="transactionEdit.removeFromLocalCart"
                @change-qty="({ id, delta }) => transactionEdit.updateLocalCartQty(id, delta)"
                @open-customer-modal="showCustomerModal = true"
                button-text="Update Transaksi"
              />
            </div>
          </div>
        </div>

        <!-- DESKTOP – side-by-side -->
        <div class="hidden md:grid md:grid-cols-3 gap-6">
          <div class="md:col-span-2 space-y-5">
            <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 animate-slide-in">
              <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
                Daftar Produk
              </h2>
              <FilterSection 
                v-model:search="searchQuery" 
                v-model:brand="selectedBrand"
                :brands="store.categories"
              />
              <ProductGrid 
                :products="filteredProducts" 
                @add-to-cart="transactionEdit.addToLocalCart" 
              />
            </div>
          </div>

          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 sticky top-32 h-fit animate-slide-in">
            <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
              <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Transaksi
            </h2>
          <CashierSection
          :cart="transactionEdit.cart.value"
          :selected-customer="transactionEdit.selectedCustomer.value"
          :invoice="transactionEdit.invoice.value"
          :subtotal="calculation.subtotal.value"
          :ppn-nominal="calculation.ppnNominal.value"
          :total-before-nego="calculation.totalBeforeNego.value"
          :total-after-nego="calculation.totalAfterNego.value"
          :total-bayar="calculation.totalBayar.value"
          v-model:ppn="calculation.ppn.value"
          v-model:nego="calculation.nego.value"
          v-model:dp="calculation.dp.value"
          v-model:status="transactionEdit.status.value"
          @checkout="handleUpdate"
          @remove-item="transactionEdit.removeFromLocalCart"
          @change-qty="({ id, delta }) => transactionEdit.updateLocalCartQty(id, delta)"
          @open-customer-modal="showCustomerModal = true"
          button-text="Update Transaksi"
        />
          </div>
        </div>
      </template>
    </div>

    <!-- MODAL PELANGGAN -->
    <CustomerModal
      v-if="showCustomerModal"
      :customers="store.customers || []"
      @select="chooseCustomer"
      @close="showCustomerModal = false"
    />
  </div>
</template>
