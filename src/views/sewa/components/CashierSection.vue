<script setup>
import { ref, computed, onMounted } from "vue"
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
  }
});

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
  flatpickr(el, {
    dateFormat: "Y-m-d",        
    altInput: true,              
    altFormat: "d-m-Y",      
    defaultDate: item.start_date,
    onChange: (dates, str) => {
      item.start_date = str;     
      calculateMonths(item); 
    }
  });
};

const initItemEndDate = (el, item) => {
  if (!el) return;
  flatpickr(el, {
    dateFormat: "Y-m-d",        
    altInput: true,             
    altFormat: "d-m-Y",         
    defaultDate: item.end_date,
    onChange: (dates, str) => {
      item.end_date = str;       
      calculateMonths(item); 
    }
  });
};



const emit = defineEmits([
  "remove-item",
  "select-customer",
  "open-customer-modal",
  "checkout",
  "update:dp",
    "update:status"
])



const localDp = computed({
  get: () => props.dp === null ? "" : props.dp,
  set: v => emit("update:dp", v === "" ? null : Number(v))
})

const localStatus = computed({
  get: () => props.status ?? "berlangsung",
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
          class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <button
        @click="$emit('open-customer-modal')"
        class="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl"
      >🔍</button>

      <button
        v-if="selectedCustomer"
        @click="clearCustomer"
        class="p-3 bg-red-500 text-white rounded-2xl"
      >🗑</button>
    </div>
    
    <!-- DURASI SEWA -->
<div
  v-if="cart.length > 0 && cart.some(i => i.months > 0)"
  class="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-sm"
>
  <p class="font-semibold text-blue-700">Durasi Sewa</p>
  <div v-for="item in cart" :key="item.id">
    <p v-if="item.months > 0" class="text-gray-700">
      {{ item.name }}: {{ item.months }} bulan
    </p>
  </div>
</div>


    <!-- CART -->
    <div v-if="!cart.length" class="text-center py-10 text-gray-400">
      Belum ada paket dipilih
    </div>

    <div v-else class="space-y-3 max-h-64 overflow-y-auto">
      <div
        v-for="item in cart"
        :key="item.id"
        class="p-3 border-2 border-blue-200 rounded-2xl bg-blue-50"
        
      >

        <div class="flex justify-between items-center">
          <p class="font-semibold truncate">{{ item.name }}</p>
          <div class="flex gap-2 items-center">
            <button class="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center font-bold transition-all active:scale-90" 
            @click="changeQty(item.id, -1)">−</button>
            <span>{{ item.qty }}</span>
            <button  class="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md flex items-center justify-center font-bold transition-all active:scale-90"
            @click="changeQty(item.id, 1)">+</button>
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

         <div class="mt-3">
  <label class="text-xs font-semibold">Tanggal Mulai</label>
<input
  :ref="el => initItemStartDate(el, item)"
  :value="item.start_date"
   class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
 placeholder="Masukan tanggal mulai"
/>

  <label class="text-xs font-semibold mt-2">Tanggal Selesai</label>
  
<input
  :ref="el => initItemEndDate(el, item)"
  :value="item.end_date"
 class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
 placeholder="Masukan tanggal selesai"
/>

</div>

       
      </div>
    </div>

    <!-- DP -->
    <div>
      <label class="block text-xs font-semibold mb-2">DP</label>
      <input
        v-model="localDp"
        placeholder="0"
        type="number"
        class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>

    <!-- STATUS -->
<div>
  <label class="block text-xs font-semibold text-gray-700 mb-2">STATUS SEWA</label>
  <select
    v-model="localStatus"
    class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
  >
    <option value="berlangsung">Berlangsung</option>
    <option value="selesai">Selesai</option>
  </select>
</div>

    <!-- TOTAL -->
   <div class="flex justify-between text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-4 py-3 rounded-2xl">
  <span>TOTAL BAYAR</span>
  <span> {{ moneyFormat(totalPreview || 0) }}</span>
</div>


    <button
      @click="$emit('checkout')"
     :disabled="!cart.length || cart.some(i => !i.start_date || !i.end_date)"

      class="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold"
    >
      Checkout Sekarang
    </button>
  </div>
</template>