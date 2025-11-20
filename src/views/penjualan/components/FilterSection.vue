<template>
  <div class="space-y-4">
    <!-- Search Bar -->
    <div class="flex gap-2">
      <div class="flex-1 relative">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="localSearch"
          type="text"
          placeholder="Cari paket..."
          class="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all bg-white"
        />
      </div>
      <button class="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 font-semibold">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>

    <!-- Brand Filter Chips -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="b in brands"
        :key="b"
        @click="$emit('update:brand', b)"
        :class="[
          'px-5 py-2 rounded-full text-sm font-semibold transition-all transform hover:scale-105 active:scale-95',
          selectedBrand === b
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
            : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-200 hover:border-cyan-400'
        ]"
      >
        {{ b }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps(['selectedBrand'])
defineEmits(['update:brand'])
const localSearch = defineModel('search')
const brands = defineModel('brands')
</script>
