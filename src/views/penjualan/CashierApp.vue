<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import FilterSection from './components/FilterSection.vue'
import ProductGrid from './components/ProductGrid.vue'
import CashierSection from './components/CashierSection.vue'
import CustomerModal from './components/CustomerModal.vue'
import Swal from "sweetalert2";

import Api from "@/services/api";
import Cookies from "js-cookie";

const activeTab = ref('products')
const showCustomerModal = ref(false)

const token = Cookies.get("token");
const products = ref([]);

const fetchProducts = async () => {
  if (token) {
    Api.defaults.headers.common["Authorization"] = token;

    await Api.get(`/api/products-all`)
      .then((res) => {
       
        products.value = res.data.data.map(p => ({
          id: p.id,
          name: p.title,               
          price: p.sell_price,         
          brand: p.category?.name ?? 'Umum',
          icon: p.image,               
        }));
      })
      .catch((err) => console.error(err));
  }
};

const categories = ref([])
const fetchCategories = async () => {
  Api.defaults.headers.common["Authorization"] = token;
  const res = await Api.get("/api/categories-all")
  categories.value = ["Semua", ...res.data.data.map(c => c.name)]
};

const customers = ref([]);
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


const selectedCustomer = ref(null)
const selectCustomer = c => selectedCustomer.value = c
const chooseCustomer = c => {
  selectedCustomer.value = c
  showCustomerModal.value = false
}


const invoice = ref("");
const fetchInvoice = async () => {
  if (token) {
    Api.defaults.headers.common["Authorization"] = token;
    try {
    const res = await Api.get("/api/transactions/invoice");
    invoice.value = res.data.data.invoice;
  } catch (error) {
    console.error("Gagal ambil invoice:", error.response?.data || error);
  }
  }

  
};
const cart = ref([]);

const fetchCarts = async () => {
  if (!token) return;

  Api.defaults.headers.common["Authorization"] = token;

  try {
    const res = await Api.get("/api/carts");

    cart.value = res.data.data.map(c => ({
      id: c.id,
      qty: c.qty,
      name: c.product.title,
      price: c.product.sell_price,
      icon: c.product.image,
    }));

  } catch (err) {
    console.error("Gagal fetch carts:", err.response?.data || err);
  }
};

const addToCart = async (p) => {
  if (!token) return;

  Api.defaults.headers.common["Authorization"] = token;

  try {
    await Api.post("/api/carts", {
      product_id: p.id,
      qty: 1,
    });

    await fetchCarts(); 

  } catch (err) {
    console.error("Error add to cart:", err.response?.data || err);
  }
};

const removeFromCart = async (id) => {
  if (!token) return;

  try {
    await Api.delete(`/api/carts/${id}`, {
      headers: { Authorization: token }
    });

    await fetchCarts();
  } catch (err) {
    console.error("Gagal hapus cart:", err.response?.data || err);
  }
};

const changeQty = async ({ id, delta }) => {
  if (!token) return;

  const item = cart.value.find(i => i.id === id);
  if (!item) return;

  if (item.qty === 1 && delta === -1) {
    return removeFromCart(id);
  }

  try {
    await Api.put(`/api/carts/${id}`, {
      qty: item.qty + delta
    }, {
      headers: { Authorization: token }
    });

    // refresh cart
    await fetchCarts();

  } catch (err) {
    console.error("Gagal update qty:", err.response?.data || err);
  }
};

const selectedStatus = ref(null);

const updateStatus = async (newStatus) => {
  selectedStatus.value = newStatus; 

  if (!invoice.value) return;

  try {
    await Api.put("/api/transactions/status", {
      invoice: invoice.value,
      status: newStatus,
    }, {
      headers: { Authorization: token }
    });
  } catch (error) {
    console.error("Gagal update status:", error.response?.data || error);
  }
};


const nego = ref(0)
const dp   = ref(0)
const extra = ref(0)   // tambahan biaya
const pph   = ref(0)

const subtotal = computed(() =>
  cart.value.reduce((sum, c) => sum + c.price * c.qty, 0)
);

const subtotalPlusExtra = computed(() => subtotal.value + extra.value)
const pphNominal = computed(() => subtotalPlusExtra.value * (pph.value / 100))
const totalBeforeNego = computed(() => subtotalPlusExtra.value - pphNominal.value)
const totalAfterNego = computed(() => Math.max(0, totalBeforeNego.value - nego.value))
const totalBayar = computed(() => Math.max(0, totalAfterNego.value))

const checkout = async () => {
  if (!cart.value.length) {
    Swal.fire({
      icon: "warning",
      title: "Keranjang masih kosong",
      text: "Tambahkan produk sebelum checkout!",
    });
    return;
  }

    if (!selectedCustomer.value) {
    Swal.fire({
      icon: "warning",
      title: "Customer belum dipilih",
      text: "Silakan pilih customer sebelum checkout!",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Konfirmasi Checkout",
    html: `
      <div class="text-center">
        <p><strong>Subtotal:</strong> Rp ${subtotal.value.toLocaleString()}</p>
        <p><strong>Tambahan Biaya:</strong> Rp ${extra.value.toLocaleString()}</p>
         <p><strong>Total Tambahan Biaya:</strong> Rp ${subtotalPlusExtra.value.toLocaleString()}</p>
      <p><strong>PPH (%):</strong> ${pph.value}%</p>
      <p><strong>PPH Nominal:</strong> Rp ${pphNominal.value.toLocaleString()}</p>
        <p><strong>Nego:</strong> Rp ${nego.value.toLocaleString()}</p>
        <p><strong>DP:</strong> Rp ${dp.value.toLocaleString()}</p>
        <hr class="my-2" />
        <p class="text-lg font-bold" style="color: #06b6d4;">
          Total Dibayar: Rp ${totalBayar.value.toLocaleString()}
        </p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Checkout",
    cancelButtonText: "Batal",
    confirmButtonColor: "#06b6d4", 
    cancelButtonColor: "#EF4444",  
  });

  if (!result.isConfirmed) return;

  Api.defaults.headers.common["Authorization"] = token;

  try {
    
    Swal.fire({
      title: "Memproses transaksi...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await Api.post("/api/transactions", {
      customer_id: selectedCustomer.value?.id || null,
      subtotal: subtotal.value,
      subtotalPlusExtra: subtotalPlusExtra.value, 
      extra: extra.value,
      pph: pph.value,
      pph_nominal: pphNominal.value,
      dp: dp.value,
      nego: nego.value,
      grand_total: totalBayar.value,
      status: selectedStatus.value || "proses",

    });

    await Swal.fire({
      icon: "success",
      title: "Transaksi Berhasil!",
      text: `Invoice: ${res.data.data.invoice}`,
      timer: 2000,
      showConfirmButton: false,
    });

    await fetchCarts();
    await fetchInvoice();

    window.location.href = "/halaman-data-penjualan";

  } catch (error) {
    console.error("Checkout gagal:", error.response?.data || error);

    Swal.fire({
      icon: "error",
      title: "Gagal melakukan checkout",
      text: error.response?.data?.meta?.message || "Terjadi kesalahan saat memproses transaksi.",
    });
  }
};

onMounted(() => {
  fetchProducts();
  fetchCategories();
  fetchCustomers();
  fetchInvoice();
  fetchCarts();

  
});

const searchQuery = ref('')
const selectedBrand = ref('Semua')
const filteredProducts = computed(() => products.value.filter(p => {
  const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  const matchBrand = selectedBrand.value === 'Semua' || p.brand === selectedBrand.value
  return matchSearch && matchBrand
}))

</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
    <!-- Header Tabs -->
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
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
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

    <!-- CONTENT -->
    <div class="max-w-7xl mx-auto p-4 md:p-6">
      <!-- MOBILE – stacked -->
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
              :total-bayar="totalBayar"
              v-model:nego="nego"
              v-model:dp="dp"
              v-model:extra="extra"
              v-model:pph="pph"
                 v-model:status="selectedStatus"
              @select-customer="selectCustomer"
              @remove-item="removeFromCart"
              @open-customer-modal="showCustomerModal = true"
              @update-status="updateStatus"
                @change-qty="changeQty"
              @checkout="checkout"
            />
          </div>
        </div>
      </div>

      <!-- DESKTOP – side-by-side -->
      <div class="hidden md:grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-5">
          <div class="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-blue-200 animate-slide-in">
            <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-5 flex items-center gap-2">
              <svg class="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Daftar Paket
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
            Keranjang
          </h2>
          <CashierSection
            :cart="cart"
            :selected-customer="selectedCustomer"
            :invoice="invoice"
              :subtotal="subtotal"
            :subtotal-plus-extra="subtotalPlusExtra"
            :pph-nominal="pphNominal"
            :total-bayar="totalBayar"
            v-model:nego="nego"
            v-model:dp="dp"
            v-model:extra="extra"
            v-model:pph="pph"
               v-model:status="selectedStatus"
            @select-customer="selectCustomer"
            @remove-item="removeFromCart"
            @open-customer-modal="showCustomerModal = true"
            @update-status="updateStatus"
              @change-qty="changeQty"
            @checkout="checkout"
          />
        </div>
      </div>
    </div>

    <!-- MODAL PELANGGAN -->
    <CustomerModal
      v-if="showCustomerModal"
      :customers="customers"
      @select="chooseCustomer"
      @close="showCustomerModal = false"
    />
  </div>
</template>
