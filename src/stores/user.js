//import pinia
import { defineStore } from 'pinia'

//import services api
import Api from '../services/api'

//import js cookie
import Cookies from 'js-cookie'

//define store
export const useUser = defineStore('user', {
    state: () => {
        return {
            user: Cookies.get('user') ? JSON.parse(Cookies.get('user')) : {},
            token: Cookies.get('token') || '',
            isLoading: false,
        }
    },
    actions: {
        //action "login"
        async login(credentials) {
            await Api.post('/api/login', credentials)
            .then((response) => {
                this.user = response.data.data.user
                this.token = response.data.data.token

                Cookies.set('token', response.data.data.token, { expires: 7 })
                Cookies.set('user', JSON.stringify(response.data.data.user), { expires: 7 })
            })
        },

        // PERBAIKAN: Action untuk fetch user profile (opsional)
        async fetchProfile() {
            try {
                this.isLoading = true
                const token = Cookies.get('token')
                
                if (!token) return
                
                Api.defaults.headers.common.Authorization = `Bearer ${token}`
                const response = await Api.get('/api/admins') // Sesuaikan endpoint
                
                if (response.data?.success) {
                    this.user = response.data.data
                    Cookies.set('user', JSON.stringify(response.data.data))
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                this.isLoading = false
            }
        },

        //action "logout" - TERIMA PARAMETER ROUTER
        async logout(router) {  // ← TAMBAHKAN PARAMETER INI
            // Hapus data user
            this.user = {}
            this.token = ''

            // Hapus cookies
            Cookies.remove('token')
            Cookies.remove('user')

            // Hapus Authorization header
            delete Api.defaults.headers.common['Authorization']

            // Redirect ke halaman login
            if (router) {
                await router.push('/').catch(() => {})
            }
        },
    },
    getters: {
        getUser: (state) => state.user,
        getToken: (state) => state.token,
        isAuthenticated: (state) => !!state.token, 
        userRole: (state) => state.user?.role || '',
        isSuperAdmin: (state) => state.user?.role === 'super_admin',
        isAdmin: (state) => state.user?.role === 'admin',
    }
})
