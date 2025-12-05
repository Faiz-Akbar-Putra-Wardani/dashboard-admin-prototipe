<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { moneyFormat } from "@/utils/moneyFormat"
import flatpickr from "flatpickr"
import "flatpickr/dist/flatpickr.css"
import dayjs from "dayjs"

const props = defineProps({
  cart: Array,
  selectedCustomer: Object,
  invoice: String,
  status: String,
  dp: { type: [Number, null], default: null },
  totalPreview: {
    type: Number,
    required: true
  },
  buttonText: { 
    type: String, 
    default: 'Checkout Sekarang' 
  } // TAMBAHKAN INI
});

const flatpickrInstances = ref({})

const calculateMonths = (item) => {
  if (!item.start_date || !item.end_date) {
    item.months = 0;
    return;
  }

  const s = dayjs(item.start_date);
  const e = dayjs(item.end_date);

  // Hitung selisih bulan
  let months = (e.year() - s.year()) * 12 + (e.month() - s.month());

  // Jika tanggal end > tanggal start, tambah 1 bulan
  if (e.date() > s.date()) {
    months += 1;
  }

  // Minimal 1 bulan
  if (months < 1) months = 1;

  item.months = months;
};

const initItemStartDate = (el, item) => {
  if (!el) return;
  
  // Destroy instance lama jika ada
  if (flatpickrInstances.value[`start_${item.id}`]) {
    flatpickrInstances.value[`start_${item.id}`].destroy();
  }

  // Format tanggal untuk flatpickr (DD-MM-YYYY)
  let defaultDate = null;
  if (item.start_date) {
    // Jika format YYYY-MM-DD, convert ke DD-MM-YYYY
    if (item.start_date.includes('-') && item.start_date.split('-')[0].length === 4) {
      const parts = item.start_date.split('-');
      defaultDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      defaultDate = item.start_date;
    }
  }

  flatpickrInstances.value[`start_${item.id}`] = flatpickr(el, {
    dateFormat: "d-m-Y",
    defaultDate: defaultDate,
    onChange: (dates, str) => {
      // Simpan dalam format YYYY-MM-DD untuk backend
      if (dates[0]) {
        item.start_date = dayjs(dates[0]).format('YYYY-MM-DD');
      } else {
        item.start_date = str;
      }
      calculateMonths(item);
    }
  });
};

const initItemEndDate = (el, item) => {
  if (!el) return;
  
  // Destroy instance lama jika ada
  if (flatpickrInstances.value[`end_${item.id}`]) {
    flatpickrInstances.value[`end_${item.id}`].destroy();
  }

  // Format tanggal untuk flatpickr
  let defaultDate = null;
  if (item.end_date) {
    if (item.end_date.includes('-') && item.end_date.split('-')[0].length === 4) {
      const parts = item.end_date.split('-');
      defaultDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      defaultDate = item.end_date;
    }
  }

  flatpickrInstances.value[`end_${item.id}`] = flatpickr(el, {
    dateFormat: "d-m-Y",
    defaultDate: defaultDate,
    onChange: (dates, str) => {
      if (dates[0]) {
        item.end_date = dayjs(dates[0]).format('YYYY-MM-DD');
      } else {
        item.end_date = str;
      }
      calculateMonths(item);
    }
  });
};

// Watch cart untuk reinitialize flatpickr ketika data berubah (untuk mode edit)
watch(() => props.cart, (newCart) => {
  nextTick(() => {
    newCart.forEach(item => {
      calculateMonths(item);
    });
  });
}, { deep: true, immediate: true });

const emit = defineEmits([
  "remove-item",
  "select-customer",
  "open-customer-modal",
  "checkout",
  "update:dp",
  "update:status"
])

const localDp = computed({
  get: () => {
    // Jika dp adalah 0 atau null, tampilkan string kosong
    if (props.dp === null || props.dp === 0 || props.dp === '') {
      return '';
    }
    return props.dp;
  },
  set: v => {
    // Jika input kosong atau 0, emit null
    if (v === '' || v === 0 || v === '0') {
      emit("update:dp", null);
    } else {
      emit("update:dp", Number(v));
    }
  }
})


const localStatus = computed({
  get: () => props.status ?? "ongoing",
  set: v => emit("update:status", v)
})

const clearCustomer = () => emit("select-customer", null)

const changeQty = (id, delta) => {
  const item = props.cart.find(i => i.id === id)
  if (!item) return

  if (item.qty === 1 && delta === -1) {
    emit("remove-item", id)
    return
  }

  item.qty += delta
}

const updateRentPrice = (item, value) => {
  item.rent_price = value === "" ? null : Number(value)
}

// Format tanggal untuk display (DD-MM-YYYY)
const formatDateDisplay = (date) => {
  if (!date) return '';
  
  // Jika sudah format DD-MM-YYYY
  if (date.includes('-') && date.split('-')[2].length === 4) {
    return date;
  }
  
  // Jika format YYYY-MM-DD, convert ke DD-MM-YYYY
  if (date.includes('-') && date.split('-')[0].length === 4) {
    return dayjs(date).format('DD-MM-YYYY');
  }
  
  return date;
}
</script>

<template>
  <div class="space-y-5 text-sm relative">
    <!-- INVOICE -->
    <div class="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg">
      <p class="text-xs opacity-90 mb-1">NO. INVOICE</p>
      <p class="font-bold text-lg tracking-wide">{{ invoice }}</p>
    </div>

    <!-- PELANGGAN -->
    <div class="flex gap-2 items-end">
      <div class="flex-1">
        <label class="block text-xs font-semibold text-gray-700 mb-2">PELANGGAN</label>
        <input
          :value="selectedCustomer?.name ?? ''"
          readonly
          placeholder="Pilih pelanggan..."
          class="w-full px-4 py-3 border-2 border-blue-200 rounded-2xl bg-white"
        />
      </div>

      <button
        @click="$emit('open-customer-modal')"
        class="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
        title="Cari Pelanggan"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

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
    
    <!-- DURASI SEWA -->
    <div
      v-if="cart.length > 0 && cart.some(i => i.months > 0)"
      class="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-sm"
    >
      <p class="font-semibold text-blue-700 mb-2 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Durasi Sewa
      </p>
      <div v-for="item in cart" :key="item.id">
        <p v-if="item.months > 0" class="text-gray-700 text-xs ml-7">
          {{ item.name }}: <span class="font-semibold">{{ item.months }} bulan</span>
        </p>
      </div>
    </div>

    <!-- CART -->
    <div v-if="!cart.length" class="text-center text-gray-400 py-12 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200">
      <svg class="w-16 h-16 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="font-medium">Belum ada paket dipilih</p>
    </div>

    <div v-else class="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-blue-100">
      <div
        v-for="item in cart"
        :key="item.id"
        class="p-3 border-2 border-blue-200 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:border-cyan-400 transition-all"
      >
        <div class="flex justify-between items-center mb-3">
          <p class="font-semibold truncate text-gray-800">{{ item.name }}</p>
          <div class="flex gap-2 items-center bg-white rounded-xl p-1 shadow-sm">
            <button 
              class="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center font-bold transition-all active:scale-90" 
              @click="changeQty(item.id, -1)"
            >−</button>
            <span class="w-8 text-center font-bold text-gray-800">{{ item.qty }}</span>
            <button  
              class="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md flex items-center justify-center font-bold transition-all active:scale-90"
              @click="changeQty(item.id, 1)"
            >+</button>
            <button 
              @click="$emit('remove-item', item.id)" 
              class="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 hover:shadow-md transition-all active:scale-90"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div>
            <label class="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1">
              <svg class="w-3 h-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Tanggal Mulai
            </label>
            <input
              :ref="el => initItemStartDate(el, item)"
              :value="formatDateDisplay(item.start_date)"
              class="w-full px-3 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="Pilih tanggal mulai"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-700 mb-1 block flex items-center gap-1">
              <svg class="w-3 h-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Tanggal Selesai
            </label>
            <input
              :ref="el => initItemEndDate(el, item)"
              :value="formatDateDisplay(item.end_date)"
              class="w-full px-3 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="Pilih tanggal selesai"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- DP -->
    <div>
      <label class="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        DP (Down Payment)
      </label>
      <input
        v-model.number="localDp"
        placeholder="0"
        type="number"
        min="0"
        class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
      />
    </div>

    <!-- STATUS -->
    <div>
      <label class="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Status Pesanan
      </label>
      <select
        v-model="localStatus"
        class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl bg-white focus:outline-none focus:border-cyan-500 transition-all"
      >
        <option value="ongoing">🔄 Ongoing</option>
        <option value="returned">✅ Returned</option>
        <option value="late">⏰ Late</option>
        <option value="cancelled">❌ Cancelled</option>
      </select>
    </div>

    <!-- TOTAL -->
    <div class="flex justify-between items-center text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-4 py-3 rounded-2xl shadow-lg">
      <span>TOTAL BAYAR</span>
      <span>{{ moneyFormat(totalPreview || 0) }}</span>
    </div>

    <!-- CHECKOUT BUTTON -->
    <button
      @click="$emit('checkout')"
      :disabled="!cart.length || cart.some(i => !i.start_date || !i.end_date)"
      class="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-base hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
    >
      <span class="flex items-center justify-center gap-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {{ buttonText }}
      </span>
    </button>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thumb-cyan-400::-webkit-scrollbar-thumb {
  background-color: #22d3ee;
  border-radius: 10px;
}

.scrollbar-track-blue-100::-webkit-scrollbar-track {
  background-color: #dbeafe;
  border-radius: 10px;
}
</style>
