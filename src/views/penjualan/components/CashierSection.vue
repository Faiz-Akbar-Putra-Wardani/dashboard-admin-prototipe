<template>
  <div class="space-y-5 text-sm">
    <!-- INVOICE -->
    <div class="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs opacity-90 mb-1">NO. INVOICE</p>
          <p class="font-bold text-lg tracking-wide">{{ invoice }}</p>
        </div>
        <svg class="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
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
        class="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 hover:border-cyan-400 transition-all hover:shadow-md"
      >
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm text-gray-800 truncate">{{ item.name }}</p>
          <p class="text-sm font-bold text-cyan-600">Rp {{ (item.price * item.qty).toLocaleString('id-ID') }}</p>
        </div>
        <div class="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
          <button 
            @click="$emit('change-qty', { id: item.id, delta: -1 })"
            class="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center font-bold transition-all active:scale-90"
          >−</button>
          <span class="w-8 text-center font-bold text-gray-800">{{ item.qty }}</span>
          <button 
            @click="$emit('change-qty', { id: item.id, delta: 1 })"
            class="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md flex items-center justify-center font-bold transition-all active:scale-90"
          >+</button>
        </div>
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

    <!-- SUMMARY -->
    <div class="space-y-3 border-t-2 border-blue-200 pt-4">
      <div class="flex justify-between text-sm text-gray-700">
        <span class="font-medium">Subtotal</span>
        <span class="font-semibold">Rp {{ subtotal.toLocaleString('id-ID') }}</span>
      </div>

      <!-- PPH (%) -->
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
          PPH (%)
          <span class="text-gray-400 text-[10px]">(Optional)</span>
        </label>
        <input 
          v-model.number="localPph"
          type="number"
          min="0"
          max="100"
          step="0.01"
          placeholder="Masukkan persentase PPH (opsional)"
          class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-all" 
        />
      </div>

      <div class="flex justify-between text-sm text-gray-700">
        <span class="font-medium">PPH Nominal</span>
        <span class="font-semibold">Rp {{ pphNominal.toLocaleString('id-ID') }}</span>
      </div>

     <!-- Tambahan Biaya (Disabled jika PPH kosong) -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            Tambahan Biaya
            <span v-if="!isPphFilled" class="text-red-500 text-[10px]">
              (Isi PPH terlebih dahulu)
            </span>
          </label>
          <div class="relative">
            <span 
              :class="[
                'absolute left-3 top-1/2 -translate-y-1/2 text-sm z-10',
                isPphFilled ? 'text-gray-500' : 'text-gray-300'
              ]"
            >
              Rp
            </span>
            <input 
              v-model="localExtra"
              @input="handleExtraInput"
              type="text"
              :disabled="!isPphFilled"
              placeholder="0"
              :class="[
                'w-full pl-10 pr-4 py-2 border-2 rounded-xl text-sm transition-all',
                isPphFilled 
                  ? 'border-blue-200 focus:outline-none focus:border-cyan-500 bg-white' 
                  : 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
              ]"
            />
          </div>
          <p v-if="!isPphFilled" class="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Field ini akan aktif setelah PPH diisi
          </p>
          <p v-else class="mt-1 text-xs text-gray-500">
            Contoh: 100.000 (seratus ribu rupiah)
          </p>
        </div>


      <div class="flex justify-between text-sm text-gray-700">
        <span class="font-medium">Total Tambahan Biaya</span>
        <span class="font-semibold">Rp {{ subtotalPlusExtra.toLocaleString('id-ID') }}</span>
      </div>

      <div class="flex justify-between text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-2 rounded-xl">
        <span>Total Sebelum Nego</span>
        <span>Rp {{ totalBeforeNego.toLocaleString('id-ID') }}</span>
      </div>

     <!-- Harga Nego -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2">Harga Nego</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 z-10">
              Rp
            </span>
            <input 
              v-model="localNego"
              @input="handleNegoInput"
              type="text"
              placeholder="0"
              class="w-full pl-10 pr-4 py-2 border-2 border-blue-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-all" 
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">
            Contoh: 50.000 (lima puluh ribu rupiah)
          </p>
        </div>

      <div class="flex justify-between text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-2 rounded-xl">
        <span>Total Setelah Nego</span>
        <span>Rp {{ totalAfterNego.toLocaleString('id-ID') }}</span>
      </div>

     <!-- DP (Down Payment) -->
      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-2">DP (Down Payment)</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 z-10">
            Rp
          </span>
          <input 
            v-model="localDp"
            @input="handleDpInput"
            type="text"
            placeholder="0"
            class="w-full pl-10 pr-4 py-2 border-2 border-blue-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-all" 
          />
        </div>
        <p class="mt-1 text-xs text-gray-500">
          Contoh: 200.000 (dua ratus ribu rupiah)
        </p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-700 mb-2">Status Pesanan</label>
        <select
          v-model="localStatus"
          @change="$emit('update:status', $event.target.value)"
          class="w-full px-4 py-2 border-2 border-blue-200 rounded-xl text-sm bg-white focus:outline-none focus:border-cyan-500 transition-all"
        >
          <option value="proses">Proses</option>
          <option value="dikirim">Dikirim</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      <div class="flex justify-between items-center text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-4 py-3 rounded-2xl shadow-lg">
        <span>TOTAL BAYAR</span>
        <span>Rp {{ totalBayar.toLocaleString('id-ID') }}</span>
      </div>
    </div>

    <!-- CHECKOUT -->
    <button 
      @click="$emit('checkout')" 
      :disabled="!cart.length"
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

<script setup>
import { ref, computed, watch } from 'vue'
import { useCurrencyInput } from "@/composables/useCurrencyInput" 

const props = defineProps({
  cart: { type: Array, required: true },
  selectedCustomer: { type: Object, default: null },
  invoice: { type: String, default: '' },

  subtotal: { type: Number, required: true },
  subtotalPlusExtra: { type: Number, required: true },
  pphNominal: { type: Number, required: true },
  totalBeforeNego: { type: Number, required: true },
  totalAfterNego: { type: Number, required: true },
  totalBayar: { type: Number, required: true },

  extra: Number,
  pph: Number,
  nego: Number,
  dp: Number,
  status: String,
  buttonText: { type: String, default: 'Checkout Sekarang' }
})

const emit = defineEmits([
  'remove-item',
  'open-customer-modal',
  'checkout',
  'change-qty',
  'update:extra',
  'update:pph',
  'update:nego',
  'update:dp',
  'update:status',
  'select-customer',
])

const extraCurrency = useCurrencyInput();
const negoCurrency = useCurrencyInput();
const dpCurrency = useCurrencyInput();

const isPphFilled = computed(() => {
  return props.pph !== null && props.pph !== 0 && props.pph !== '' && props.pph !== undefined
})

const handleExtraInput = (event) => {
  if (!isPphFilled.value) {
    extraCurrency.reset();
    emit('update:extra', null);
    return;
  }
  
  extraCurrency.handleInput(event);
  const rawVal = extraCurrency.rawValue.value;
  emit('update:extra', rawVal === "" ? null : Number(rawVal));
};

const localExtra = computed({
  get: () => {
    if (!isPphFilled.value) {
      return '';
    }
    // Sinkronkan dengan props
    if (props.extra && extraCurrency.rawValue.value !== props.extra.toString()) {
      extraCurrency.setValue(props.extra);
    }
    return extraCurrency.displayValue.value;
  },
  set: (v) => {
    if (!isPphFilled.value) {
      extraCurrency.reset();
      return;
    }
    extraCurrency.displayValue.value = v;
  }
});

const handleNegoInput = (event) => {
  negoCurrency.handleInput(event);
  const rawVal = negoCurrency.rawValue.value;
  emit('update:nego', rawVal === "" ? null : Number(rawVal));
};

const localNego = computed({
  get: () => {
    // Sinkronkan dengan props
    if (props.nego && negoCurrency.rawValue.value !== props.nego.toString()) {
      negoCurrency.setValue(props.nego);
    }
    return negoCurrency.displayValue.value;
  },
  set: (v) => {
    negoCurrency.displayValue.value = v;
  }
});

const handleDpInput = (event) => {
  dpCurrency.handleInput(event);
  const rawVal = dpCurrency.rawValue.value;
  emit('update:dp', rawVal === "" ? null : Number(rawVal));
};

const localDp = computed({
  get: () => {
    // Sinkronkan dengan props
    if (props.dp && dpCurrency.rawValue.value !== props.dp.toString()) {
      dpCurrency.setValue(props.dp);
    }
    return dpCurrency.displayValue.value;
  },
  set: (v) => {
    dpCurrency.displayValue.value = v;
  }
});

// PPH - Tetap menggunakan input number biasa
const localPph = computed({
  get: () => {
    if (props.pph === null || props.pph === 0 || props.pph === '') {
      return '';
    }
    return props.pph;
  },
  set: v => {
    if (v === '' || v === 0 || v === '0') {
      emit('update:pph', null);
      // Reset extra ketika PPH dikosongkan
      extraCurrency.reset();
      emit('update:extra', null);
    } else {
      emit('update:pph', Number(v));
    }
  },
})

const localStatus = computed({
  get: () => props.status || 'proses',
  set: v => emit('update:status', v),
})

const clearCustomer = () => emit('select-customer', null);
</script>


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
