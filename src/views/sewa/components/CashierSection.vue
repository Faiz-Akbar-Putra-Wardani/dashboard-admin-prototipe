<template>
  <div class="space-y-5 text-sm relative">

    <!-- INVOICE -->
    <div class="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs opacity-90 mb-1">NO. INVOICE</p>
          <p class="font-bold text-lg tracking-wide">{{ invoice }}</p>
        </div>
      </div>
    </div>

   <!-- PELANGGAN -->
    <div class="flex gap-2 items-end">
      <div class="flex-1">
        <label class="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          PELANGGAN
        </label>
        <input
          :value="selectedCustomer?.name ?? ''"
          type="text"
          readonly
          placeholder="Pilih pelanggan..."
          class="w-full px-4 py-3 border-2 border-blue-200 rounded-2xl text-sm bg-white cursor-default focus:outline-none focus:border-cyan-500 transition-all"
        />
      </div>

      <!-- SEARCH ICON -->
      <button
        @click="$emit('open-customer-modal')"
        class="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
        title="Cari Pelanggan"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <!-- HAPUS -->
      <button
        v-if="selectedCustomer"
        @click="clearCustomer"
        class="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
        title="Hapus Pelanggan"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- START DATE -->
    <div>
      <label class="block text-xs font-semibold text-gray-700 mb-2">TANGGAL MULAI</label>
      <input
        v-model="localStartDate"
        type="text"
        placeholder="dd/mm/yyyy"
        ref="startPicker"
        class="w-full px-4 py-3 border-2 border-blue-200 rounded-xl"
      />
    </div>

    <!-- END DATE -->
    <div>
      <label class="block text-xs font-semibold text-gray-700 mb-2">TANGGAL SELESAI</label>
      <input
        v-model="localEndDate"
        type="text"
        placeholder="dd/mm/yyyy"
        ref="endPicker"
        class="w-full px-4 py-3 border-2 border-blue-200 rounded-xl"
      />
    </div>

    <!-- CART -->
    <div
      v-if="!cart.length"
      class="text-center text-gray-400 py-12 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200"
    >
      <p class="font-medium">Belum ada paket dipilih</p>
    </div>

    <div v-else class="space-y-3 max-h-64 overflow-y-auto pr-2">
      <div
        v-for="item in cart"
        :key="item.id"
        class="flex flex-col gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200"
      >
        <div class="flex items-center gap-3">
          <p class="flex-1 font-semibold text-sm text-gray-800 truncate">{{ item.name }}</p>

          <!-- QTY CONTROL -->
          <div class="flex items-center gap-2 bg-white rounded-xl p-1">
            <button @click="changeQty(item.id, -1)" class="w-8 h-8 bg-blue-100 rounded-lg">−</button>
            <span class="w-8 text-center font-bold">{{ item.qty }}</span>
            <button
              @click="changeQty(item.id, 1)"
              class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white"
            >
              +
            </button>
          </div>

          <button
            @click="$emit('remove-item', item.id)"
            class="p-2 bg-red-500 text-white rounded-xl"
          >
            🗑
          </button>
        </div>

        <!-- MANUAL RENT PRICE -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Harga Sewa (Manual)</label>
          <input
            v-model.number="item.rent_price"
            type="number"
            placeholder="0"
            class="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white"
          />
        </div>
      </div>
    </div>

    <!-- DP -->
    <div>
      <label class="block text-xs font-semibold text-gray-700 mb-2">DP (Down Payment)</label>
      <input
        v-model.number="localDp"
        type="number"
        placeholder="0"
        class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl"
      />
    </div>

    <!-- STATUS -->
    <div>
      <label class="block text-xs font-semibold text-gray-700 mb-2">Status Pesanan</label>
     <select
  v-model="localStatus"
  @change="updateStatus"
  :class="[
    'w-full px-4 py-2 border-2 rounded-xl font-semibold',
    localStatus === 'ongoing'   ? 'bg-blue-100 border-blue-300 text-blue-700' :
    localStatus === 'returned'  ? 'bg-green-100 border-green-300 text-green-700' :
    localStatus === 'late'      ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
    localStatus === 'cancelled' ? 'bg-red-100 border-red-300 text-red-700' :
    'bg-white border-blue-200'
  ]"
>
  <option value="ongoing">🔄 Ongoing</option>
  <option value="returned">↩️ Returned</option>
  <option value="late">⏳ Late</option>
  <option value="cancelled">❌ Cancelled</option>
</select>

    </div>

    <!-- TOTAL -->
    <div class="flex justify-between items-center text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-4 py-3 rounded-2xl">
      <span>TOTAL BAYAR</span>
      <span>Rp {{ subtotal.toLocaleString("id-ID") }}</span>
    </div>

    <!-- CHECKOUT -->
    <button
      @click="$emit('checkout')"
      :disabled="!cart.length || !localStartDate || !localEndDate"
      class="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold"
    >
      Checkout Sekarang
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import flatpickr from "flatpickr"
import "flatpickr/dist/flatpickr.css"

/* --------------------
   PROPS & EMITS
---------------------- */
const props = defineProps({
  cart: Array,
  selectedCustomer: Object,
  invoice: String,
  status: String,
  dp: Number
})

const emit = defineEmits([
  "remove-item",
  "select-customer",
  "open-customer-modal",
  "checkout",
  "update-status"
])

/* --------------------
   REFS & MODELS
---------------------- */
const startPicker = ref(null)
const endPicker = ref(null)

const localStartDate = defineModel("start_date", { default: "" })
const localEndDate = defineModel("end_date", { default: "" })

const localDp = defineModel("dp", { default: 0 })
const localStatus = ref(props.status ?? "ongoing")

/* --------------------
   FLATPICKR INIT
---------------------- */
onMounted(() => {
  flatpickr(startPicker.value, {
    dateFormat: "d/m/Y",
    allowInput: true
  })

  flatpickr(endPicker.value, {
    dateFormat: "d/m/Y",
    allowInput: true
  })
})

/* --------------------
   METHODS
---------------------- */
const clearCustomer = () => emit("select-customer", null)

const changeQty = (id, delta) => {
  const item = props.cart.find(i => i.id === id)
  if (!item) return

  if (item.qty === 1 && delta === -1) {
    return emit("remove-item", id)
  }

  item.qty += delta
}

const updateStatus = () => emit("update-status", localStatus.value)

/* --------------------
   COMPUTED
---------------------- */
const subtotal = computed(() =>
  props.cart.reduce((t, i) => t + (Number(i.rent_price) * i.qty), 0)
)

</script>
