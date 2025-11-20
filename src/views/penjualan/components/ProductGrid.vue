<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-5">
    <div
      v-for="p in products"
      :key="p.id"
      class="bg-white p-4 rounded-2xl shadow-md hover:shadow-2xl transition-all cursor-pointer border-2 border-blue-100 hover:border-cyan-400 transform hover:scale-105 hover:-translate-y-1 group"
      @click="$emit('add-to-cart', p)"
    >
      <!-- Product Image -->
      <div class="w-full mb-3 flex justify-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-3">
        <img
          :src="getImageUrl(p.icon)"
          class="h-24 w-24 object-cover rounded-xl shadow-md group-hover:scale-110 transition-transform"
          :alt="p.name"
        />
      </div>

      <!-- Product Info -->
      <h3 class="font-bold text-sm line-clamp-2 text-gray-800 group-hover:text-cyan-700 transition-colors mb-2">
        {{ p.name }}
      </h3>

      <p class="text-cyan-600 font-bold text-base mb-3">
        {{ moneyFormat(p.price) }}
      </p>

      <!-- Add Button -->
      <button class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all transform group-hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Tambah
      </button>
    </div>
  </div>
</template>

<script setup>
import { getImageUrl } from "@/utils/getImageUrl";
import { moneyFormat } from "@/utils/moneyFormat";

defineProps(['products'])
defineEmits(['add-to-cart'])
</script>
