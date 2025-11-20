<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDownIcon, LogoutIcon } from '@/icons'
import { useUser } from '@/stores/user'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const dropdownOpen = ref(false)
const dropdownRef = ref(null)
const router = useRouter()
const userStore = useUser()

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = async () => {
  try {
    await userStore.logout()
    closeDropdown()

    // 🔥 Tampilkan notifikasi sukses
    toast.success('Berhasil logout!', {
      position: 'top-right',
      autoClose: 4000,
      theme: 'colored'
    })

    // Redirect ke halaman signin setelah sedikit delay
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (error) {
    toast.error('Gagal logout. Coba lagi.', {
      position: 'top-right',
      autoClose: 2500,
      theme: 'colored'
    })
  }
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>



<template>
  <div class="relative" ref="dropdownRef">
    <!-- Tombol Profil -->
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11">
        <img src="/images/user/owner.jpg" alt="User" />
      </span>

      <span class="block mr-1 font-medium text-theme-sm">{{ user?.name || 'User' }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <!-- User Info -->
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ user?.name || 'Guest User' }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ user?.email || 'No email' }}
        </span>
      </div>

      <!-- Logout -->
      <button
        @click="signOut"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Sign out
      </button>
    </div>
  </div>
</template>


