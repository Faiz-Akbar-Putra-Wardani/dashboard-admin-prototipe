// stores/useRentalStore.js
import { defineStore } from 'pinia'
import rentalService from '@/services/rentalService'
import Swal from 'sweetalert2'

export const useRentalStore = defineStore('rental', {
  // STATE
  state: () => ({
    cart: [],
    invoice: '',
    selectedCustomer: null,
    status: 'proses',
    dp: null,
    isLoading: false,
  }),

  // GETTERS
  getters: {
    cartCount: (state) => state.cart.length,
    hasItems: (state) => state.cart.length > 0,
    hasCustomer: (state) => state.selectedCustomer !== null,
  },

  // ========================================
  // ACTIONS
  // ========================================
  actions: {
    /**
     * Fetch invoice rental baru
     */
    async fetchInvoice() {
      try {
        const data = await rentalService.getInvoice()
        this.invoice = data.invoice
      } catch (error) {
        console.error('Gagal fetch invoice:', error?.response?.data || error)
        this.invoice = ''
        throw error
      }
    },

    /**
     * Add product to rental cart (local only)
     */
    addToCart(product) {
      const existing = this.cart.find(item => item.id === product.id)

      if (existing) {
        existing.qty += 1
        console.log('Updated qty:', existing)
        return
      }

      const newItem = {
        id: product.id,
        name: product.name,
        qty: 1,
        rent_price: Number(product.price || 0),
        icon: product.icon,
        start_date: '',
        end_date: '',
        months: 0,
      }

      this.cart.push(newItem)
      console.log('Added to cart:', newItem)
    },

    /**
     * Remove from cart
     */
    removeFromCart(id) {
      this.cart = this.cart.filter(item => item.id !== id)
      console.log('Removed from cart:', id)
    },

    /**
     * Update qty
     */
    updateCartQty(id, delta) {
      const item = this.cart.find(i => i.id === id)
      if (!item) return

      if (item.qty === 1 && delta === -1) {
        return this.removeFromCart(id)
      }

      item.qty += delta
    },

    /**
     * Update rental dates
     */
    updateDates(id, startDate, endDate) {
      const item = this.cart.find(i => i.id === id)
      if (!item) return

      item.start_date = startDate
      item.end_date = endDate
    },

    /**
     * Set customer
     */
    setCustomer(customer) {
      this.selectedCustomer = customer
    },

    /**
     * Clear customer
     */
    clearCustomer() {
      this.selectedCustomer = null
    },

    /**
     * Checkout rental
     */
    async checkout(payload) {
      try {
        const res = await rentalService.create(payload)
        return res
      } catch (error) {
        console.error('Checkout error:', error?.response?.data || error)
        throw error
      }
    },

    /**
     * Reset after checkout
     */
    reset() {
      this.cart = []
      this.selectedCustomer = null
      this.dp = null
      this.status = 'berlangsung'
    },
  },
})
