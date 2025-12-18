<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSaleStore } from '@/stores/useSaleStore'
import { useFilter } from '@/composables/useFilter'
import { useRentalCalculation } from '@/composables/useRentalCalculation'
import { useRentalEdit } from '@/composables/useRentalEdit'
import { useRentalUpdate } from '@/composables/useRentalUpdate'

import FilterSection from './components/FilterSection.vue'
import ProductGrid from './components/ProductGrid.vue'
import CashierSection from './components/CashierSection.vue'
import CustomerModal from './components/CustomerModal.vue'

const route = useRoute()
const router = useRouter()
const rentalUuid = route.params.uuid

const saleStore = useSaleStore() // Products, Categories, Customers

// Edit rental composable
const rentalEdit = useRentalEdit(rentalUuid)

// Products filter (reuse from sale)
const productsRef = computed(() => {
  // Map products untuk rental (gunakan rent_price)
  return (saleStore.products || []).map(p => ({
    ...p,
    price: p.rent_price || 0,
  }))
})

const { searchQuery, selectedBrand, filteredItems: filteredProducts } = useFilter(productsRef)

// Rental calculation dengan data dari rentalEdit
const cartRef = computed(() => rentalEdit.cart.value)
const dpRef = computed({
  get: () => rentalEdit.dp.value,
  set: (val) => rentalEdit.dp.value = val,
})

const calculation = useRentalCalculation(cartRef, dpRef)

// Update handler
const { processUpdate } = useRentalUpdate()

const activeTab = ref('products')
const showCustomerModal = ref(false)

const cartCount = computed(() => (rentalEdit.cart.value || []).length)

const goToRentalPage = () => {
  router.push('/halaman-data-sewa')
}

const chooseCustomer = (customer) => {
  rentalEdit.setCustomer(customer)
  showCustomerModal.value = false
}

const handleUpdate = async () => {
  const success = await processUpdate(rentalEdit, {
    totalRentPrice: calculation.totalRentPrice.value,
    dpSafe: calculation.dpSafe.value,
  })

  if (success) {
    console.log('Rental updated successfully')
  }
}

onMounted(async () => {
  await saleStore.init()
  await rentalEdit.fetchRentalDetail()
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
    <!-- Back Button - Fixed Top -->
    <div class="bg-white/90 backdrop-blur-md shadow-md border-b border-cyan-100 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <button
          @click="goToRentalPage"
          class="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-white hover:bg-blue-50 text-gray-700 border-2 border-blue-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Data Sewa</span>
        </button>
      </div>
    </div>

    <!-- HEADER TABS -->
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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
      <div v-if="rentalEdit.isLoading.value || saleStore.isLoading" class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Memuat data...</p>
        </div>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- MOBILE -->
        <div class="md:hidden">
          <div v-show="activeTab === 'products'" class="animate-fade-in">
            <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 mb-4 border border-blue-200">
              <FilterSection
                v-model:search="searchQuery"
                v-model:brand="selectedBrand"
                :brands="saleStore.categories"
              />
            </div>
            <ProductGrid 
              :products="filteredProducts"
              @add-to-cart="rentalEdit.addToLocalCart"
            />
          </div>

          <div v-show="activeTab === 'cart'" class="animate-fade-in">
            <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 border border-blue-200">
              <CashierSection
                :cart="rentalEdit.cart.value"
                :selected-customer="rentalEdit.selectedCustomer.value"
                :invoice="rentalEdit.invoice.value"
                :total-preview="calculation.totalRentPrice.value"
                v-model:dp="rentalEdit.dp.value"
                v-model:status="rentalEdit.status.value"
                @remove-item="rentalEdit.removeFromLocalCart"
                @open-customer-modal="showCustomerModal = true"
                @checkout="handleUpdate"
                @change-qty="({ id, delta }) => rentalEdit.updateLocalCartQty(id, delta)"
                button-text="Update Rental"
              />
            </div>
          </div>
        </div>

        <!-- DESKTOP -->
        <div class="hidden md:grid md:grid-cols-3 gap-6">
          <div class="md:col-span-2 space-y-5">
            <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 animate-slide-in">
              <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
                Daftar Produk
              </h2>
              <FilterSection
                v-model:search="searchQuery"
                v-model:brand="selectedBrand"
                :brands="saleStore.categories"
              />
              <ProductGrid 
                :products="filteredProducts"
                @add-to-cart="rentalEdit.addToLocalCart"
              />
            </div>
          </div>

          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 sticky top-32 h-fit animate-slide-in">
            <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
              <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Rental
            </h2>
            <CashierSection
              :cart="rentalEdit.cart.value"
              :selected-customer="rentalEdit.selectedCustomer.value"
              :invoice="rentalEdit.invoice.value"
              :total-preview="calculation.totalRentPrice.value"
              v-model:dp="rentalEdit.dp.value"
              v-model:status="rentalEdit.status.value"
              @remove-item="rentalEdit.removeFromLocalCart"
              @open-customer-modal="showCustomerModal = true"
              @checkout="handleUpdate"
              @change-qty="({ id, delta }) => rentalEdit.updateLocalCartQty(id, delta)"
              button-text="Update Rental"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- CUSTOMER MODAL -->
    <CustomerModal
      v-if="showCustomerModal"
      :customers="saleStore.customers || []"
      @select="chooseCustomer"
      @close="showCustomerModal = false"
    />
  </div>
</template>
