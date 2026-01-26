<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSaleStore } from '@/stores/useSaleStore'
import { useRentalStore } from '@/stores/useRentalStore'
import { useFilter } from '@/composables/useFilter'
import { useRentalCalculation } from '@/composables/useRentalCalculation'
import { useRentalCheckout } from '@/composables/useRentalCheckout'

import FilterSection from './components/FilterSection.vue'
import ProductGrid from './components/ProductGrid.vue'
import CashierSection from './components/CashierSection.vue'
import CustomerModal from './components/CustomerModal.vue'

const router = useRouter()
const saleStore = useSaleStore() // Products, Categories, Customers
const rentalStore = useRentalStore() // Cart, Invoice, Customer rental

// Filter products (reuse dari penjualan)
const productsRef = computed(() => {
  return (saleStore.products || []).map(p => ({
    ...p,
    price: p.rent_price || 0, 
  }))
})

const { searchQuery, selectedBrand, filteredItems: filteredProducts } = useFilter(productsRef)

// Rental calculation
const cartRef = computed(() => rentalStore.cart)
const dpRef = computed({
  get: () => rentalStore.dp,
  set: (val) => rentalStore.dp = val,
})

const calculation = useRentalCalculation(cartRef, dpRef)

// Checkout
const { checkout: performCheckout } = useRentalCheckout()

const activeTab = ref('products')
const showCustomerModal = ref(false)

const cartCount = computed(() => rentalStore.cartCount)

const goToDashboard = () => {
  router.push('/dashboard')
}

const chooseCustomer = (customer) => {
  rentalStore.setCustomer(customer)
  showCustomerModal.value = false
}

const handleCheckout = async () => {
  const success = await performCheckout({
    totalRentPrice: calculation.totalRentPrice.value,
    dpSafe: calculation.dpSafe.value,
  })

  if (success) {
    rentalStore.reset()
    await rentalStore.fetchInvoice()
    window.location.href = '/halaman-data-sewa'
  }
}

onMounted(async () => {
  // Load shared data (products, categories, customers)
  await saleStore.init()
  // Load rental invoice
  await rentalStore.fetchInvoice()
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
    <!-- Back Button - Fixed Top -->
    <div class="bg-white/90 backdrop-blur-md shadow-md border-b border-cyan-100 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <button
          @click="goToDashboard"
          class="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-white hover:bg-blue-50 text-gray-700 border-2 border-blue-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Dashboard</span>
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
      <div v-if="saleStore.isLoading" class="flex items-center justify-center min-h-[400px]">
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
            <ProductGrid :products="filteredProducts" @add-to-cart="rentalStore.addToCart" />
          </div>

          <div v-show="activeTab === 'cart'" class="animate-fade-in">
            <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 border border-blue-200">
              <CashierSection
                :cart="rentalStore.cart"
                :selected-customer="rentalStore.selectedCustomer"
                :invoice="rentalStore.invoice"
                :total-preview="calculation.totalRentPrice.value"
                v-model:dp="rentalStore.dp"
                v-model:status="rentalStore.status"
                @remove-item="rentalStore.removeFromCart"
                 @select-customer="chooseCustomer"
                @open-customer-modal="showCustomerModal = true"
                @checkout="handleCheckout"
                @change-qty="({ id, delta }) => rentalStore.updateCartQty(id, delta)"
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
              <ProductGrid :products="filteredProducts" @add-to-cart="rentalStore.addToCart" />
            </div>
          </div>

          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 sticky top-32 h-fit animate-slide-in">
            <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
              <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Keranjang Sewa
            </h2>
            <CashierSection
              :cart="rentalStore.cart"
              :selected-customer="rentalStore.selectedCustomer"
              :invoice="rentalStore.invoice"
              :total-preview="calculation.totalRentPrice.value"
              v-model:dp="rentalStore.dp"
              v-model:status="rentalStore.status"
              @remove-item="rentalStore.removeFromCart"
               @select-customer="chooseCustomer"
              @open-customer-modal="showCustomerModal = true"
              @checkout="handleCheckout"
              @change-qty="({ id, delta }) => rentalStore.updateCartQty(id, delta)"
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
