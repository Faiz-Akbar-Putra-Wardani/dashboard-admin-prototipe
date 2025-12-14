// composables/useRentalEdit.js
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import Api from '@/services/api'

/**
 * Composable untuk handle edit rental
 * @param {string} uuid - Rental UUID
 */
export function useRentalEdit(uuid) {
  const router = useRouter()
  const isLoading = ref(false)
  
  // Rental data refs
  const invoice = ref('')
  const selectedCustomer = ref(null)
  const cart = ref([])
  const status = ref('berlangsung')
  const dp = ref(null)

  /**
   * Fetch rental detail dari API
   */
  const fetchRentalDetail = async () => {
    if (!uuid) return

    isLoading.value = true

    try {
      console.log('=== FETCH RENTAL DETAIL ===')
      console.log('UUID:', uuid)

      const res = await Api.get(`/api/rentals/${uuid}`)
      const rental = res.data.data

      console.log('Rental data:', rental)

      // Populate invoice & status
      invoice.value = rental.invoice
      status.value = rental.status

      // Populate customer (convert 0 to null for placeholder)
      dp.value = rental.dp === 0 ? null : rental.dp

      // Customer data
      selectedCustomer.value = rental.customer ? {
        id: rental.customer.uuid,
        uuid: rental.customer.uuid,
        name: rental.customer.name_perusahaan,
        address: rental.customer.address,
      } : null

      // Cart items with dates
      cart.value = rental.details.map(d => ({
        id: d.id,
        product_id: d.product.uuid,
        name: d.product.title,
        qty: d.qty,
        rent_price: Number(d.rent_price),
        icon: d.product.image,
        start_date: dayjs(d.start_date).format('YYYY-MM-DD'),
        end_date: dayjs(d.end_date).format('YYYY-MM-DD'),
        months: 0,
      }))

      console.log('✅ Rental loaded:', {
        invoice: invoice.value,
        customer: selectedCustomer.value?.name,
        items: cart.value.length,
        status: status.value,
        dp: dp.value,
      })

    } catch (err) {
      console.error('❌ Failed to fetch rental:', err.response?.data || err)
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal memuat data',
        text: 'Rental tidak ditemukan',
      }).then(() => {
        router.push('/halaman-data-sewa')
      })
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update rental
   */
  const updateRental = async (payload) => {
    try {
      console.log('=== UPDATE RENTAL ===')
      console.log('UUID:', uuid)
      console.log('Payload:', payload)

      Swal.fire({
        title: 'Memproses update...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const res = await Api.put(`/api/rentals/${uuid}`, payload)

      await Swal.fire({
        icon: 'success',
        title: 'Rental berhasil diperbarui',
        text: `Invoice: ${invoice.value}`,
        timer: 1800,
        showConfirmButton: false,
      })

      return res.data.data

    } catch (error) {
      console.error('❌ Update failed:', error.response?.data || error)
      
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Terjadi kesalahan'

      Swal.fire({
        icon: 'error',
        title: 'Gagal update',
        text: message,
      })
      
      throw error
    }
  }

  /**
   * Add product to local cart (no API call)
   */
  const addToLocalCart = (product) => {
    console.log('Adding product to cart:', product)

    const existing = cart.value.find(item => item.product_id === product.id)

    if (existing) {
      existing.qty += 1
      console.log('Updated existing item:', existing)
      return
    }

    const newItem = {
      id: Date.now(), // Temporary ID
      product_id: product.id,
      name: product.name,
      qty: 1,
      rent_price: Number(product.price || 0),
      icon: product.icon,
      start_date: '',
      end_date: '',
      months: 0,
    }

    cart.value.push(newItem)
    console.log('Added new item:', newItem)
  }

  /**
   * Remove from local cart
   */
  const removeFromLocalCart = (id) => {
    console.log('Removing cart item:', id)
    cart.value = cart.value.filter(item => item.id !== id)
  }

  /**
   * Update qty in local cart
   */
  const updateLocalCartQty = (id, delta) => {
    const item = cart.value.find(i => i.id === id)
    if (!item) return

    if (item.qty === 1 && delta === -1) {
      return removeFromLocalCart(id)
    }

    item.qty += delta
  }

  /**
   * Set customer
   */
  const setCustomer = (customer) => {
    selectedCustomer.value = customer
  }

  /**
   * Clear customer
   */
  const clearCustomer = () => {
    selectedCustomer.value = null
  }

  return {
    // State
    isLoading,
    invoice,
    selectedCustomer,
    cart,
    status,
    dp,

    // Methods
    fetchRentalDetail,
    updateRental,
    addToLocalCart,
    removeFromLocalCart,
    updateLocalCartQty,
    setCustomer,
    clearCustomer,
  }
}
