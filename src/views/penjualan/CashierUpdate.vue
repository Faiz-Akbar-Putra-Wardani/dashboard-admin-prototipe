<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FilterSection from './components/FilterSection.vue'
import ProductGrid from './components/ProductGrid.vue'
import CashierSection from './components/CashierSection.vue'
import CustomerModal from './components/CustomerModal.vue'
import Swal from "sweetalert2"
import Api from "@/services/api"
import Cookies from "js-cookie"

const route = useRoute()
const router = useRouter()
const token = Cookies.get("token")
const transactionId = ref(parseInt(route.params.id))

// STATE AWAL
const activeTab = ref('products')
const showCustomerModal = ref(false)
const products = ref([])
const categories = ref([])
const customers = ref([])
const selectedCustomer = ref(null)
const invoice = ref("")
const cart = ref([])

// FINANCIAL INPUTS
const nego = ref(null)
const dp = ref(null)
const extra = ref(null)
const pph = ref(null)
const selectedStatus = ref(null)

// FETCH TRANSACTION DETAIL UNTUK EDIT
const fetchTransactionDetail = async () => {
  if (!token || !transactionId.value) return

  Api.defaults.headers.common["Authorization"] = token

  try {
    const res = await Api.get(`/api/transactions/${transactionId.value}`)
    const trx = res.data.data

    // ISI DATA YANG ADA
    invoice.value = trx.invoice
    selectedCustomer.value = trx.customer ? {
      id: trx.customer.id,
      name: trx.customer.name_perusahaan,
      address: trx.customer.address
    } : null

    extra.value = trx.extra
    pph.value = trx.pph
    nego.value = trx.nego
    dp.value = trx.dp
    selectedStatus.value = trx.status

    // ISI CART DARI TRANSACTION DETAILS
    cart.value = trx.transaction_details.map(d => ({
      id: d.id,
      qty: d.qty,
      name: d.product.title,
      price: d.product.sell_price,
      icon: d.product.image,
      product_id: d.product_id
    }))

  } catch (err) {
    console.error("Gagal fetch transaksi:", err.response?.data || err)
    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: "Transaksi tidak ditemukan"
    }).then(() => {
      router.push('/halaman-data-penjualan')
    })
  }
}

// REUSE FUNGSI DARI CASHIERAPP
const fetchProducts = async () => {
  if (token) {
    Api.defaults.headers.common["Authorization"] = token
    await Api.get(`/api/products-all`)
      .then((res) => {
        products.value = res.data.data.map(p => ({
          id: p.id,
          name: p.title,
          price: p.sell_price,
          brand: p.category?.name ?? 'Umum',
          icon: p.image,
        }))
      })
      .catch((err) => console.error(err))
  }
}

const fetchCategories = async () => {
  Api.defaults.headers.common["Authorization"] = token
  const res = await Api.get("/api/categories-all")
  categories.value = ["Semua", ...res.data.data.map(c => c.name)]
}

const fetchCustomers = async () => {
  if (token) {
    Api.defaults.headers.common["Authorization"] = token
    await Api.get("/api/customers-all")
      .then((res) => {
        customers.value = res.data.data.map(c => ({
          id: c.value,
          name: c.label,
          address: c.address
        }))
      })
      .catch((err) => console.error(err))
  }
}

const chooseCustomer = c => {
  selectedCustomer.value = c
  showCustomerModal.value = false
}

// CART MANAGEMENT UNTUK UPDATE (LOCAL ONLY)
const addToCart = (p) => {
  const existing = cart.value.find(c => c.product_id === p.id)
  
  if (existing) {
    existing.qty += 1
  } else {
    cart.value.push({
      id: Date.now(), // temporary ID
      product_id: p.id,
      qty: 1,
      name: p.name,
      price: p.price,
      icon: p.icon
    })
  }
}

const removeFromCart = (id) => {
  cart.value = cart.value.filter(c => c.id !== id)
}

const changeQty = ({ id, delta }) => {
  const item = cart.value.find(c => c.id === id)
  if (!item) return

  const newQty = item.qty + delta

  if (newQty < 1) {
    removeFromCart(id)
  } else {
    item.qty = newQty
  }
}

// COMPUTED VALUES (SAMA SEPERTI CREATE)
const extraSafe = computed(() => Number(extra.value) || 0)
const pphSafe = computed(() => Number(pph.value) || 0)
const negoSafe = computed(() => Number(nego.value) || 0)
const dpSafe = computed(() => Number(dp.value) || 0)

const subtotal = computed(() =>
  cart.value.reduce((sum, c) => sum + c.price * c.qty, 0)
)

const subtotalPlusExtra = computed(() =>
  subtotal.value + extraSafe.value
)

const pphNominal = computed(() =>
  subtotalPlusExtra.value * (pphSafe.value / 100)
)

const totalBeforeNego = computed(() =>
  subtotalPlusExtra.value - pphNominal.value
)

const totalAfterNego = computed(() =>
  Math.max(0, totalBeforeNego.value - negoSafe.value)
)

const totalBayar = computed(() =>
  Math.max(0, totalAfterNego.value)
)

// VALIDASI WATCHES (SAMA SEPERTI CREATE)
// VALIDASI WATCHES
watch([nego, totalBeforeNego], () => {
  if (nego.value === null || nego.value === undefined) return
  
  const negoValue = Number(nego.value)
  
  if (negoValue > totalBeforeNego.value) {
    nego.value = totalBeforeNego.value
    Swal.fire({
      icon: "warning",
      title: "Nego tidak valid",
      text: "Harga nego tidak boleh melebihi total sebelum nego",
      timer: 1500,
      showConfirmButton: false,
    })
  }
  if (negoValue < 0) nego.value = 0
})

watch([dp, totalBayar], () => {
  if (dp.value === null || dp.value === undefined) return
  
  const dpValue = Number(dp.value)
  
  if (dpValue > totalBayar.value) {
    dp.value = totalBayar.value
    Swal.fire({
      icon: "warning",
      title: "DP tidak valid",
      text: "DP tidak boleh melebihi total bayar",
      timer: 1500,
      showConfirmButton: false,
    })
  }
  if (dpValue < 0) dp.value = 0
})

watch([pph, subtotalPlusExtra], () => {
  if (pph.value === null || pph.value === undefined) return
  
  const pphValue = Number(pph.value)
  
  if (pphValue > 100) {
    pph.value = 100
    Swal.fire({
      icon: "warning",
      title: "PPH tidak valid",
      text: "PPH tidak boleh melebihi 100%",
      timer: 1500,
      showConfirmButton: false,
    })
  }
  if (pphValue < 0) pph.value = 0
})


// UPDATE FUNCTION (GANTI CHECKOUT DENGAN UPDATE)
const updateTransaction = async () => {
  if (!cart.value.length) {
    Swal.fire({
      icon: "warning",
      title: "Keranjang masih kosong",
      text: "Tambahkan produk sebelum update!",
    })
    return
  }

  if (!selectedCustomer.value) {
    Swal.fire({
      icon: "warning",
      title: "Customer belum dipilih",
      text: "Silakan pilih customer sebelum update!",
    })
    return
  }

  const result = await Swal.fire({
    title: "Konfirmasi Update",
    html: `
      <div class="text-center">
        <p><strong>Invoice:</strong> ${invoice.value}</p>
        <p><strong>Subtotal:</strong> Rp ${subtotal.value.toLocaleString('id-ID')}</p>
        <p><strong>Total Bayar:</strong> Rp ${totalBayar.value.toLocaleString('id-ID')}</p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Update",
    cancelButtonText: "Batal",
    confirmButtonColor: "#06b6d4",
    cancelButtonColor: "#EF4444",
  })

  if (!result.isConfirmed) return

  Api.defaults.headers.common["Authorization"] = token

  try {
    Swal.fire({
      title: "Memproses update...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    await Api.put(`/api/transactions/${transactionId.value}`, {
      customer_id: selectedCustomer.value?.id || null,
      subtotal: subtotal.value,
      subtotalPlusExtra: subtotalPlusExtra.value,
      extra: extraSafe.value,
      pph: pphSafe.value,
      pph_nominal: pphNominal.value,
      nego: negoSafe.value,
      dp: dpSafe.value,
      grand_total: totalBayar.value,
      status: selectedStatus.value || "proses",
    })

    await Swal.fire({
      icon: "success",
      title: "Update Berhasil!",
      text: `Invoice: ${invoice.value}`,
      timer: 2000,
      showConfirmButton: false,
    })

    router.push("/halaman-data-penjualan")

  } catch (error) {
    console.error("Update gagal:", error.response?.data || error)
    Swal.fire({
      icon: "error",
      title: "Gagal update transaksi",
      text: error.response?.data?.meta?.message || "Terjadi kesalahan",
    })
  }
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
  fetchCustomers()
  fetchTransactionDetail() // LOAD DATA TRANSAKSI
})

const searchQuery = ref('')
const selectedBrand = ref('Semua')
const filteredProducts = computed(() => products.value.filter(p => {
  const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  const matchBrand = selectedBrand.value === 'Semua' || p.brand === selectedBrand.value
  return matchSearch && matchBrand
}))
</script>

<template>
  <!-- SAMA SEPERTI CASHIERAPP.VUE TAPI GANTI @checkout JADI @update -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
    <div class="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-30 border-b-2 border-cyan-100">
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
          <span v-if="cart.length > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
            {{ cart.length }}
          </span>
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-4 md:p-6">
      <div class="md:hidden">
        <div v-show="activeTab === 'products'" class="animate-fade-in">
          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 mb-4 border border-blue-200">
            <FilterSection 
              v-model:search="searchQuery" 
              v-model:brand="selectedBrand"
              v-model:brands="categories"
            />
          </div>
          <ProductGrid :products="filteredProducts" @add-to-cart="addToCart" />
        </div>
        <div v-show="activeTab === 'cart'" class="animate-fade-in">
          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 border border-blue-200">
            <CashierSection
              :cart="cart"
              :selected-customer="selectedCustomer"
              :invoice="invoice"
              :subtotal="subtotal"
              :subtotal-plus-extra="subtotalPlusExtra"
              :pph-nominal="pphNominal"
              :total-before-nego="totalBeforeNego"
              :total-after-nego="totalAfterNego"
              :total-bayar="totalBayar"
              v-model:extra="extra"
              v-model:pph="pph"
              v-model:nego="nego"
              v-model:dp="dp"
              v-model:status="selectedStatus"
              @checkout="updateTransaction"
              @remove-item="removeFromCart"
              @change-qty="changeQty"
              @open-customer-modal="showCustomerModal = true"
              button-text="Update Transaksi"
            />
          </div>
        </div>
      </div>

      <div class="hidden md:grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-5">
          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 animate-slide-in">
            <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
              Daftar Produk
            </h2>
            <FilterSection 
              v-model:search="searchQuery" 
              v-model:brand="selectedBrand"
              v-model:brands="categories"
            />
            <ProductGrid :products="filteredProducts" @add-to-cart="addToCart" />
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 sticky top-24 h-fit animate-slide-in">
          <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
            <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Edit Transaksi
          </h2>
          <CashierSection
            :cart="cart"
            :selected-customer="selectedCustomer"
            :invoice="invoice"
            :subtotal="subtotal"
            :subtotal-plus-extra="subtotalPlusExtra"
            :pph-nominal="pphNominal"
            :total-before-nego="totalBeforeNego"
            :total-after-nego="totalAfterNego"
            :total-bayar="totalBayar"
            v-model:extra="extra"
            v-model:pph="pph"
            v-model:nego="nego"
            v-model:dp="dp"
            v-model:status="selectedStatus"
            @checkout="updateTransaction"
            @remove-item="removeFromCart"
            @change-qty="changeQty"
            @open-customer-modal="showCustomerModal = true"
          />
        </div>
      </div>
    </div>

    <CustomerModal
      v-if="showCustomerModal"
      :customers="customers"
      @select="chooseCustomer"
      @close="showCustomerModal = false"
    />
  </div>
</template>
