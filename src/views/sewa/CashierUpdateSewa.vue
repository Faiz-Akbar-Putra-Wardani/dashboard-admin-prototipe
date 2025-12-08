<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import Swal from "sweetalert2"
import dayjs from "dayjs"

import FilterSection from "./components/FilterSection.vue"
import ProductGrid from "./components/ProductGrid.vue"
import CashierSection from "./components/CashierSection.vue"
import CustomerModal from "./components/CustomerModal.vue"

import Api from "@/services/api"
import Cookies from "js-cookie"

const route = useRoute()
const router = useRouter()
const token = Cookies.get("token")
const rentalId = ref(parseInt(route.params.id))

const activeTab = ref("products")
const showCustomerModal = ref(false)

const products = ref([])
const categories = ref([])
const customers = ref([])
const cart = ref([])
const selectedCustomer = ref(null)

const dp = ref(null)
const invoice = ref("")
const status = ref("berlangsung")

// FETCH RENTAL DETAIL UNTUK EDIT
const fetchRentalDetail = async () => {
  if (!token || !rentalId.value) return

  Api.defaults.headers.common["Authorization"] = token

  try {
    const res = await Api.get(`/api/rentals/${rentalId.value}`)
    const rental = res.data.data

    // ISI DATA YANG ADA
    invoice.value = rental.invoice
    dp.value = rental.dp
    status.value = rental.status

    selectedCustomer.value = rental.customer ? {
      id: rental.customer.id,
      name: rental.customer.name_perusahaan,
      address: rental.customer.address
    } : null

    // ISI CART DARI RENTAL DETAILS
    cart.value = rental.details.map(d => ({
      id: d.id,
      product_id: d.product_id,
      name: d.product.title,
      qty: d.qty,
      rent_price: Number(d.rent_price),
      icon: d.product.image,
      start_date: dayjs(d.start_date).format("YYYY-MM-DD"),
      end_date: dayjs(d.end_date).format("YYYY-MM-DD")
    }))

  } catch (err) {
    console.error("Gagal fetch rental:", err.response?.data || err)
    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: "Rental tidak ditemukan"
    }).then(() => {
      router.push('/halaman-data-sewa')
    })
  }
}

const fetchProducts = async () => {
  const res = await Api.get("/api/products-all", {
    headers: { Authorization: token }
  })

  products.value = res.data.data.map((p) => ({
    id: p.id,
    name: p.title,
    price: p.rent_price || 0,
    brand: p.category?.name ?? "Umum",
    icon: p.image
  }))
}

const fetchCategories = async () => {
  const res = await Api.get("/api/categories-all", {
    headers: { Authorization: token }
  })
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

const chooseCustomer = (customer) => {
  selectedCustomer.value = customer
  showCustomerModal.value = false
}

const addToCart = (p) => {
  const exist = cart.value.find(i => i.product_id === p.id)
  if (exist) return exist.qty++

  cart.value.push({
    id: Date.now(), // temporary ID
    product_id: p.id,
    name: p.name,
    qty: 1,
    rent_price: Number(p.price || 0),
    icon: p.icon,
    start_date: "",
    end_date: ""
  })
}

const removeFromCart = (id) => {
  cart.value = cart.value.filter(i => i.id !== id)
}

const changeQty = ({ id, delta }) => {
  const item = cart.value.find(i => i.id === id)
  if (!item) return

  if (item.qty === 1 && delta === -1) {
    return removeFromCart(id)
  }

  item.qty += delta
}

const totalPreview = computed(() => {
  let total = 0

  cart.value.forEach(item => {
    if (!item.start_date || !item.end_date || !item.rent_price) return

    const s = dayjs(item.start_date)
    const e = dayjs(item.end_date)

    let months = (e.year() - s.year()) * 12 + (e.month() - s.month())

    if (e.date() > s.date()) {
      months += 1
    }

    if (months < 1) months = 1

    total += (item.rent_price * months * item.qty)
  })

  return total
})

watch(dp, () => {
  // Skip validasi jika dp null atau undefined
  if (dp.value === null || dp.value === undefined) return

  // Konversi ke number untuk validasi
  const dpValue = Number(dp.value)

  if (dpValue > totalPreview.value) {
    dp.value = totalPreview.value

    Swal.fire({
      icon: "warning",
      title: "DP tidak valid",
      text: "DP tidak boleh melebihi total bayar",
      timer: 1500,
      showConfirmButton: false,
    })
  }

  if (dpValue < 0) {
    dp.value = 0
  }
})


// UPDATE FUNCTION (GANTI CHECKOUT DENGAN UPDATE)
const updateRental = async () => {
  if (!selectedCustomer.value)
    return Swal.fire("Customer belum dipilih", "", "warning")

  if (cart.value.some(i => !i.start_date || !i.end_date))
    return Swal.fire("Tanggal sewa wajib diisi di setiap item!", "", "warning")

  for (const item of cart.value) {
    const start = dayjs(item.start_date)
    const end = dayjs(item.end_date)

    if (end.isBefore(start)) {
      return Swal.fire({
        icon: "error",
        title: "Tanggal Tidak Valid",
        text: `Tanggal selesai tidak boleh lebih awal dari tanggal mulai untuk ${item.name}`,
      })
    }
  }

  if (!cart.value.length)
    return Swal.fire("Keranjang kosong!", "", "warning")

  if ((dp.value ?? 0) > totalPreview.value) {
    return Swal.fire(
      "DP tidak valid",
      "DP tidak boleh melebihi total bayar",
      "warning"
    )
  }

  const result = await Swal.fire({
    title: "Konfirmasi Update",
    html: `
      <div class="text-center">
        <p><strong>Invoice:</strong> ${invoice.value}</p>
        <p><strong>Total Harga Sewa:</strong> Rp ${(totalPreview.value ?? 0).toLocaleString("id-ID")}</p>
        <p><strong>DP:</strong> Rp ${(dp.value ?? 0).toLocaleString("id-ID")}</p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Update",
    cancelButtonText: "Batal",
    confirmButtonColor: "#06b6d4",
    cancelButtonColor: "#ef4444",
  })

  if (!result.isConfirmed) return

  const payload = {
    customer_id: selectedCustomer.value.id,
    dp: dp.value || 0,
    status: status.value,
    total_rent_price: totalPreview.value,
    
    details: cart.value.map(c => ({
      product_id: c.product_id,
      qty: c.qty,
      rent_price: c.rent_price,
      start_date: c.start_date,
      end_date: c.end_date
    })),
  }

  try {
    Swal.fire({
      title: "Memproses update...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    })

    await Api.put(`/api/rentals/${rentalId.value}`, payload, {
      headers: { Authorization: token }
    })

    await Swal.fire({
      icon: "success",
      title: "Rental berhasil diperbarui",
      text: `Invoice: ${invoice.value}`,
      timer: 1800,
      showConfirmButton: false,
    })

    router.push("/halaman-data-sewa")

  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      "Terjadi kesalahan"

    Swal.fire("Gagal update", message, "error")
  }
}

const searchQuery = ref("")
const selectedBrand = ref("Semua")

const filteredProducts = computed(() =>
  products.value.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchBrand = selectedBrand.value === "Semua" || p.brand === selectedBrand.value
    return matchName && matchBrand
  })
)

onMounted(() => {
  fetchProducts()
  fetchCategories()
  fetchCustomers()
  fetchRentalDetail() // LOAD DATA RENTAL
});
</script>

<template>
  <!-- SAMA SEPERTI RENTALAPP.VUE TAPI GANTI @checkout JADI @update -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
    <div class="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-30 border-b-2 border-cyan-100">
      <div class="max-w-7xl mx-auto flex gap-3 p-4 overflow-x-auto">
        <button
          @click="activeTab = 'products'"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300',
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
            'flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 relative',
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
          <span
            v-if="cart.length > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
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
          <ProductGrid 
            :products="filteredProducts"
            @add-to-cart="addToCart"
          />
        </div>

        <div v-show="activeTab === 'cart'" class="animate-fade-in">
          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-5 border border-blue-200">
            <CashierSection
              :cart="cart"
              :selected-customer="selectedCustomer"
              :invoice="invoice"
              :total-preview="totalPreview"
              v-model:dp="dp"
              v-model:status="status"
              @select-customer="chooseCustomer"
              @remove-item="removeFromCart"
              @open-customer-modal="showCustomerModal = true"
              @checkout="updateRental"
              @change-qty="changeQty"
              button-text="Update Rental"
            />
          </div>
        </div>
      </div>

      <div class="hidden md:grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-5">
          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200">
            <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
              Daftar Produk
            </h2>
            <FilterSection
              v-model:search="searchQuery"
              v-model:brand="selectedBrand"
              v-model:brands="categories"
            />
            <ProductGrid 
              :products="filteredProducts"
              @add-to-cart="addToCart"
            />
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 sticky top-24 h-fit">
          <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
            <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Edit Rental
          </h2>
          <CashierSection
            :cart="cart"
            :selected-customer="selectedCustomer"
            :invoice="invoice"
            :total-preview="totalPreview"
            v-model:dp="dp"
            v-model:status="status"
            @select-customer="chooseCustomer"
            @remove-item="removeFromCart"
            @open-customer-modal="showCustomerModal = true"
            @checkout="updateRental"
            @change-qty="changeQty"
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
