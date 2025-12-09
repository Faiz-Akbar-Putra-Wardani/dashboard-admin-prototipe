<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDownIcon, LogoutIcon } from '@/icons'
import { useUser } from '@/stores/user'
import Swal from 'sweetalert2'

const dropdownOpen = ref(false)
const dropdownRef = ref(null)
const router = useRouter()
const userStore = useUser()

const user = computed(() => userStore.getUser)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = async () => {
  // Tampilkan konfirmasi logout dengan SweetAlert2
  const result = await Swal.fire({
    title: 'Konfirmasi Logout',
    text: 'Apakah Anda yakin ingin keluar?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  })

  // Jika user mengkonfirmasi
  if (result.isConfirmed) {
    try {
      // Panggil logout dengan router
      await userStore.logout(router)
      closeDropdown()

      // Tampilkan toast sukses
      await Swal.fire({
        title: 'Berhasil!',
        text: 'Anda telah berhasil logout',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })

      // Router.push sudah dilakukan di dalam store.logout()
    } catch (error) {
      // Tampilkan pesan error
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal logout. Silakan coba lagi.',
        icon: 'error',
        confirmButtonText: 'OK'
      })
    }
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
    <button
      @click.prevent="toggleDropdown"
      aria-label="User menu"
      :aria-expanded="dropdownOpen"
      class="flex items-center text-gray-700 dark:text-gray-400"
    >
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
      <button
        @click="signOut"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
      >
        <LogoutIcon class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
        Sign out
      </button>
    </div>
  </div>
</template>
