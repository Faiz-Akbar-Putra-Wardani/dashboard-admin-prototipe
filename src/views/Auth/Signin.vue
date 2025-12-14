<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/stores/user'
import { handleErrors } from '@/utils/handleErrors'
import Swal from 'sweetalert2'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'

const router = useRouter()
const userStore = useUser()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const keepLoggedIn = ref(false)
const errors = ref({})
const loginFailed = ref('')

// 🔹 Hapus error saat user mengetik
watch(email, (val) => {
  if (val && errors.value.email) delete errors.value.email
})
watch(password, (val) => {
  if (val && errors.value.password) delete errors.value.password
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const loginHandler = async () => {
  try {
    errors.value = {}
    loginFailed.value = ''

    // 🔹 Validasi input kosong
    if (!email.value || !password.value) {
      if (!email.value) errors.value.email = 'Email harus diisi.'
      if (!password.value) errors.value.password = 'Password harus diisi.'

      Swal.fire({
        icon: 'warning',
        title: 'Form belum lengkap',
        text: 'Mohon isi semua kolom.',
        confirmButtonColor: '#3085d6'
      })

      return
    }

    // 🔹 Proses login
    await userStore.login({ email: email.value, password: password.value })

    // 🔹 DEBUG - CEK DATA SETELAH LOGIN
    console.log('=== DEBUG LOGIN ===')
    console.log('User Store:', userStore.user)
    console.log('Token:', userStore.token)
    console.log('User Role:', userStore.userRole)
    console.log('Is Authenticated:', userStore.isAuthenticated)
    console.log('=================')

    // 🔹 Keep login
    if (keepLoggedIn.value) {
      localStorage.setItem('keepLoggedIn', 'true')
    }

    // 🔹 Notifikasi sukses
    await Swal.fire({
      icon: 'success',
      title: 'Berhasil login!',
      text: `Selamat datang, ${userStore.user.name}!`,
      timer: 1500,
      showConfirmButton: false
    })

    // 🔹 Redirect berdasarkan role
    const userRole = userStore.userRole
    
    console.log('Redirecting with role:', userRole) 
    
    if (userRole === 'super_admin') {
      console.log('Redirecting to /dashboard') 
      await router.push('/dashboard')
    } else if (userRole === 'admin') {
      console.log('Redirecting to /data-pelanggan') 
      await router.push('/data-pelanggan')
    } else {
      // Fallback jika role tidak dikenali
      console.warn('Role tidak dikenali:', userRole, '- Redirecting to login page') // DEBUG
      await router.push('/')
    }

  } catch (error) {
    console.error('Login error:', error) // DEBUG
    
    // 🔹 Jika kredensial salah
    if (error.response?.data?.message) {
      loginFailed.value = error.response.data.message

      await Swal.fire({
        icon: 'error',
        title: 'Login gagal',
        text: loginFailed.value || 'Email atau password salah.',
        confirmButtonColor: '#d33'
      })

      return
    }

    // 🔹 Jika error validasi backend
    handleErrors(error.response?.data, errors)

    Swal.fire({
      icon: 'error',
      title: 'Terjadi kesalahan',
      text: 'Silakan coba lagi.',
      confirmButtonColor: '#d33'
    })
  }
}
</script>

<!-- Template tetap sama -->
<template>
  <FullScreenLayout>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-4">
      <!-- Card -->
      <div class="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-blue-200">
        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-md">
           <img
            src="/images/logo/logo_ses2.png"
            alt="Logo SES"
            class="w-15 h-15 object-contain"
          />
          </div>

          <h1 class="text-3xl font-bold text-blue-700 mt-4">
            Sinar Elektro Sejahtera
          </h1>
          <p class="text-gray-600 mt-1">Silakan login untuk melanjutkan</p>
        </div>

        <!-- Error Alert -->
        <div v-if="loginFailed" class="mb-4 text-center text-red-600 font-semibold">
          {{ loginFailed }}
        </div>

        <!-- Form -->
        <form @submit.prevent="loginHandler" class="space-y-5">
          <!-- Email -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p v-if="errors.email" class="text-red-600 text-sm mt-1">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
              />

              <!-- Toggle -->
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>

                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 3l18 18M9.88 9.88a3 3 0 014.24 4.24M13.88 18.88A10 10 0 0112 19c-4.48 0-8.27-2.94-9.54-7a9.97 9.97 0 011.56-3.03" />
                </svg>
              </button>
            </div>

            <p v-if="errors.password" class="text-red-600 text-sm mt-1">{{ errors.password }}</p>
          </div>

          <!-- Keep logged in -->
          <label class="flex items-center text-sm text-gray-600 cursor-pointer">
            <input
              v-model="keepLoggedIn"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span class="ml-2">Keep me logged in</span>
          </label>

          <!-- Button -->
          <button
            type="submit"
            class="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md"
          >
            Sign In
          </button>
        </form>
      </div>

    </div>
  </FullScreenLayout>
</template>

<style scoped>
/* Tidak pakai animasi blob di versi simple */
</style>
