<template>
  <div class="relative w-full">
    <input
      :id="id"
      :type="type"
      :required="required"
      :placeholder="placeholder || label"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :data-filled="modelValue"
      class="peer block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 pt-5 pb-2 text-sm text-gray-900 placeholder-transparent focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 transition-all"
    />
    <label
      :for="id"
      class="absolute left-4 top-2.5 px-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 ease-out pointer-events-none bg-white dark:bg-gray-800
             peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
             peer-focus:-top-1.5 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
             peer-[&:not([data-filled=''])]:-top-1.5 peer-[&:not([data-filled=''])]:text-xs peer-[&:not([data-filled=''])]:text-indigo-600 dark:peer-[&:not([data-filled=''])]:text-indigo-400"
    >
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

defineEmits(['update:modelValue']);
</script>
