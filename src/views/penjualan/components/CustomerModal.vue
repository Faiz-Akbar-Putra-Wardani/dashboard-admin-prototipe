<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border-2 border-cyan-200">
      <!-- Header -->
      <div class="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-bold flex items-center gap-2">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pilih Pelanggan
          </h3>
          <button 
            @click="$emit('close')" 
            class="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama pelanggan..."
            class="w-full pl-12 pr-4 py-3 border-2 border-white/30 rounded-2xl focus:outline-none focus:border-white bg-white/20 text-white placeholder-white/70 transition-all"
          />
        </div>
      </div>

      <!-- Customer List -->
      <div class="p-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-blue-100">
        <div v-if="filtered.length === 0" class="text-center py-8 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="font-medium">Pelanggan tidak ditemukan</p>
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="c in filtered"
            :key="c.id"
            @click="$emit('select', c); $emit('close')"
            class="w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 rounded-2xl cursor-pointer transition-all border-2 border-transparent hover:border-cyan-300 hover:shadow-md group"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {{ c.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1">
                <p class="font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors">{{ c.name }}</p>
                <p class="text-xs text-gray-500">Alamat: {{ c.address }}</p>
              </div>
              <svg class="w-5 h-5 text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 bg-gray-50 border-t-2 border-blue-100">
        <button 
          @click="$emit('close')" 
          class="w-full py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 font-semibold transition-all active:scale-95"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  customers: {
    type: Array,
    required: true
  }
})
defineEmits(['select', 'close'])

const search = ref('')
const filtered = computed(() => {
  if (!search.value) return props.customers
  return props.customers.filter(c =>
    c.name.toLowerCase().includes(search.value.toLowerCase()) ||
    c.address.toLowerCase().includes(search.value.toLowerCase())
  )
})
</script>

<style scoped>
@keyframes fade-in {
  from { 
    opacity: 0;
  }
  to { 
    opacity: 1;
  }
}

@keyframes scale-in {
  from { 
    opacity: 0; 
    transform: scale(0.9);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
}

.animate-fade-in { 
  animation: fade-in 0.2s ease-out; 
}

.animate-scale-in { 
  animation: scale-in 0.3s ease-out; 
}

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
