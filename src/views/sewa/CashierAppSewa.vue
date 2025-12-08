<script setup>
import { ref, computed, onMounted, watch} from "vue"
import Swal from "sweetalert2"
import dayjs from "dayjs"

import customParseFormat from "dayjs/plugin/customParseFormat"

dayjs.extend(customParseFormat)


import FilterSection from "./components/FilterSection.vue"
import ProductGrid from "./components/ProductGrid.vue"
import CashierSection from "./components/CashierSection.vue"
import CustomerModal from "./components/CustomerModal.vue"
import { toISO } from "@/utils/date"

import Api from "@/services/api"
import Cookies from "js-cookie"

const token = Cookies.get("token")

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

const fetchInvoice = async () => {
  try {
    const res = await Api.get("/api/rentals/invoice/new", {
      headers: { Authorization: token }
    })

    invoice.value = res.data.data.invoice
  } catch (e) {
    console.error("Gagal ambil invoice", e)
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
const chooseCustomer = (customer) => {
  selectedCustomer.value = customer;
  showCustomerModal.value = false;
};

const fetchCustomers = async () => {
  if (token) {
    Api.defaults.headers.common["Authorization"] = token;
    await Api.get("/api/customers-all")
      .then((res) => {
        customers.value = res.data.data.map(c => ({
          id: c.value,
          name: c.label,
          address: c.address
        }));
      })
      .catch((err) => console.error(err));
  }
};
const addToCart = (p) => {
  const exist = cart.value.find(i => i.id === p.id)
  if (exist) return exist.qty++

  cart.value.push({
    id: p.id,
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

const rentPrice = computed(() =>
  cart.value.reduce(
    (t, i) => t + (Number(i.rent_price || 0) * i.qty),
    0
  )
)

// const months = computed(() => {
//   if (!startDate.value || !endDate.value) return 0

//   const start = dayjs(startDate.value, "DD/MM/YYYY").toDate()
//   const end = dayjs(endDate.value, "DD/MM/YYYY").toDate()

//   if (end < start) return 0

//   let months = 1
//   const cursor = new Date(start)

//   while (true) {
//     cursor.setMonth(cursor.getMonth() + 1)

//     if (end > cursor) {
//       months++
//     } else {
//       break
//     }
//   }

//   return months
// })


const totalPreview = computed(() => {
  let total = 0;

  cart.value.forEach(item => {
    if (!item.start_date || !item.end_date || !item.rent_price) return;

    const s = dayjs(item.start_date);
    const e = dayjs(item.end_date);

    // Hitung selisih bulan
    let months = (e.year() - s.year()) * 12 + (e.month() - s.month());

    // Jika tanggal end > tanggal start, tambah 1 bulan
    if (e.date() > s.date()) {
      months += 1;
    }

    if (months < 1) months = 1;

    total += (item.rent_price * months * item.qty);
  });

  return total;
});




watch(dp, () => {
  if (dp.value == null) return

  if (dp.value > totalPreview.value) {
    dp.value = totalPreview.value

    Swal.fire({
      icon: "warning",
      title: "DP tidak valid",
      text: "DP tidak boleh melebihi total bayar",
      timer: 1500,
      showConfirmButton: false,
    })
  }

  if (dp.value < 0) {
    dp.value = 0
  }
})

const checkout = async () => {
  if (!selectedCustomer.value)
    return Swal.fire("Customer belum dipilih", "", "warning")

 if (cart.value.some(i => !i.start_date || !i.end_date))
  return Swal.fire("Tanggal sewa wajib diisi di setiap item!", "", "warning")

  for (const item of cart.value) {
    const start = dayjs(item.start_date);
    const end = dayjs(item.end_date);

    if (end.isBefore(start)) {
      return Swal.fire({
        icon: "error",
        title: "Tanggal Tidak Valid",
        text: `Tanggal selesai tidak boleh lebih awal dari tanggal mulai untuk ${item.name}`,
      });
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
    title: "Konfirmasi Checkout",
    html: `
      <div class="text-center">
      <p><strong>Total Harga Sewa:</strong> Rp ${(totalPreview.value ?? 0).toLocaleString("id-ID")}</p>
      <p><strong>DP:</strong> Rp ${(dp.value ?? 0).toLocaleString("id-ID")}</p>
      
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Proses",
    cancelButtonText: "Batal",
    confirmButtonColor: "#06b6d4",
    cancelButtonColor: "#ef4444",
  });

  if (!result.isConfirmed) return;

  const payload = {
  invoice: invoice.value,
  customer_id: selectedCustomer.value.id,
  dp: dp.value || 0,
  status: status.value,
  total_rent_price: totalPreview.value,
  
  details: cart.value.map(c => ({
    product_id: c.id,
    qty: c.qty,
    rent_price: c.rent_price,
  start_date: c.start_date,
  end_date: c.end_date
  })),
};


  try {
    Swal.fire({
      title: "Memproses data...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await Api.post("/api/rentals", payload, {
      headers: { Authorization: token }
    });

    await Swal.fire({
      icon: "success",
      title: "Rental berhasil dibuat",
      text: `Invoice: ${res.data.data.invoice}`,
      timer: 1800,
      showConfirmButton: false,
    });

    // reset
    cart.value = []
    selectedCustomer.value = null
    dp.value = null

    window.location.href = "/halaman-data-sewa"

  } catch (err) {
  const message =
    err.response?.data?.message ||
    err.response?.data?.errors?.[0]?.msg ||
    "Terjadi kesalahan";

  Swal.fire("Gagal checkout", message, "error");
}

};

const searchQuery = ref("")
const selectedBrand = ref("Semua")

const filteredProducts = computed(() =>
  products.value.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchBrand = selectedBrand.value === "Semua" || p.brand === selectedBrand.value
    return matchName && matchBrand
  })
)

/* -----------------------------
   ON MOUNT
------------------------------ */
onMounted(() => {
  fetchInvoice()
  fetchProducts()
  fetchCategories()
  fetchCustomers()
});
</script>


<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">

    <!-- HEADER TABS -->
    <div class="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-30 border-b-2 border-cyan-100">
      <div class="max-w-7xl mx-auto flex gap-3 p-4 overflow-x-auto">

        <!-- TAB: PRODUCTS -->
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

        <!-- TAB: CART -->
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

    <!-- CONTENT -->
    <div class="max-w-7xl mx-auto p-4 md:p-6">

      <!-- MOBILE -->
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
             :months="months"
             :total-preview="totalPreview"
            v-model:dp="dp"
            v-model:status="status"

          @select-customer="chooseCustomer"

            @remove-item="removeFromCart"
            @open-customer-modal="showCustomerModal = true"
            @checkout="checkout"
           
            @change-qty="changeQty"
          />
            

          </div>
        </div>

      </div>

      <!-- DESKTOP -->
      <div class="hidden md:grid md:grid-cols-3 gap-6">

        <!-- PRODUCT SIDE -->
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

        <!-- CART SIDE -->
        <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 sticky top-24 h-fit">

          <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
            <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Keranjang
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
            @checkout="checkout"
            @change-qty="changeQty"
          />

        </div>
      </div>

    </div>

    <!-- CUSTOMER MODAL -->
    <CustomerModal
      v-if="showCustomerModal"
      :customers="customers"
      @select="chooseCustomer"
      @close="showCustomerModal = false"
    />

  </div>
</template>