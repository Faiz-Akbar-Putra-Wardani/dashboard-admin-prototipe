// stores/useSaleStore.js
import { defineStore } from 'pinia'
import productService from '@/services/productService'
import customerService from '@/services/customerService'
import categoryService from '@/services/categoryService'
import cartService from '@/services/cartService'
import transactionService from '@/services/transactionService'
import Swal from 'sweetalert2'

export const useSaleStore = defineStore('sale', {
  // STATE
  state: () => ({
    products: [],
    categories: [],
    customers: [],
    cart: [],
    invoice: '',
    selectedCustomer: null,
    status: null,
    isLoading: false,
  }),

  // ========================================
  // GETTERS
  // ========================================
  getters: {
    cartCount: (state) => state.cart.length,
    hasItems: (state) => state.cart.length > 0,
    hasCustomer: (state) => state.selectedCustomer !== null,
  },

  actions: {
    /**
     * Initialize - Load semua data yang dibutuhkan
     */
    async init() {
      this.isLoading = true
      
      try {
        const [products, categories, customers, invoice, cart] = await Promise.allSettled([
          this.fetchProducts(),
          this.fetchCategories(),
          this.fetchCustomers(),
          this.fetchInvoice(),
          this.fetchCart(),
        ])

        // Log error jika ada
        if (products.status === 'rejected') {
          console.error('Products error:', products.reason?.response?.data || products.reason)
        }
        if (categories.status === 'rejected') {
          console.error('Categories error:', categories.reason?.response?.data || categories.reason)
        }
        if (customers.status === 'rejected') {
          console.error('Customers error:', customers.reason?.response?.data || customers.reason)
        }
        if (invoice.status === 'rejected') {
          console.error('Invoice error:', invoice.reason?.response?.data || invoice.reason)
        }
        if (cart.status === 'rejected') {
          console.error('Cart error:', cart.reason?.response?.data || cart.reason)
        }

      } catch (error) {
        console.error('Init error:', error)
      } finally {
        this.isLoading = false
      }
    },


    // PRODUCTS
    async fetchProducts() {
      try {
        this.products = await productService.all()
      } catch (error) {
        console.error('Gagal fetch products:', error?.response?.data || error)
        this.products = []
        throw error
      }
    },

    // CATEGORIES
    async fetchCategories() {
      try {
        this.categories = await categoryService.all()
      } catch (error) {
        console.error('Gagal fetch categories:', error?.response?.data || error)
        this.categories = ['Semua']
        throw error
      }
    },

    // CUSTOMERS
    async fetchCustomers() {
      try {
        this.customers = await customerService.all()
      } catch (error) {
        console.error('Gagal fetch customers:', error?.response?.data || error)
        this.customers = []
        throw error
      }
    },

    setCustomer(customer) {
      this.selectedCustomer = customer
    },

    clearCustomer() {
      this.selectedCustomer = null
    },

    // INVOICE
    async fetchInvoice() {
      try {
        const data = await transactionService.getInvoice()
        this.invoice = data.invoice
      } catch (error) {
        console.error('Gagal fetch invoice:', error?.response?.data || error)
        this.invoice = ''
        throw error
      }
    },

 
    // CART CRUD-
    async fetchCart() {
      try {
        this.cart = await cartService.all()
      } catch (error) {
        console.error('Gagal fetch cart:', error?.response?.data || error)
        this.cart = []
        throw error
      }
    },

    async addToCart(product) {
      try {
        await cartService.add({
          product_id: product.id,
          qty: 1,
        })
        await this.fetchCart()
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal menambah ke keranjang',
          text: error.response?.data?.meta?.message || 'Terjadi kesalahan',
          confirmButtonColor: '#e3342f',
        })
        throw error
      }
    },

    async updateCartQty(id, delta) {
      const item = this.cart.find(i => i.id === id)
      if (!item) return

      const newQty = item.qty + delta

      if (newQty < 1) {
        return await this.removeCart(id)
      }

      try {
        await cartService.update(id, { qty: newQty })
        await this.fetchCart()
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal update jumlah',
          text: error.response?.data?.meta?.message || 'Quantity tidak valid',
        })
        throw error
      }
    },

    async removeCart(id) {
      try {
        await cartService.delete(id)
        await this.fetchCart()
      } catch (error) {
        console.error('Gagal hapus cart:', error?.response?.data || error)
        throw error
      }
    },

    // ----------------------------------------
    // CHECKOUT
    // ----------------------------------------
    async checkout(payload) {
      try {
        const res = await transactionService.create(payload)
        return res
      } catch (error) {
        console.error('Checkout error:', error?.response?.data || error)
        throw error
      }
    },

    // ----------------------------------------
    // UPDATE STATUS
    // ----------------------------------------
    async updateStatus(newStatus) {
      this.status = newStatus

      if (!this.invoice) return

      try {
        await transactionService.updateStatus(this.invoice, newStatus)
      } catch (error) {
        console.error('Gagal update status:', error?.response?.data || error)
        throw error
      }
    },

    // ----------------------------------------
    // RESET TRANSACTION
    // ----------------------------------------
    resetTransaction() {
      this.selectedCustomer = null
      this.status = null
    },
  },
})
