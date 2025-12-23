// composables/useTransactionEdit.js
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import Api from '@/services/api'

/**
 * Composable untuk handle edit transaksi penjualan (PPN)
 * @param {string} uuid - Transaction UUID
 */
export function useTransactionEdit(uuid) {
  const router = useRouter()
  const isLoading = ref(false)
  
  // Transaction data refs
  const invoice = ref('')
  const selectedCustomer = ref(null)
  const cart = ref([])
  const status = ref(null)
  
  // Financial data refs
  const ppn = ref(null)     
  const nego = ref(null)
  const dp = ref(null)

  const fetchTransactionDetail = async () => {
    if (!uuid) return

    isLoading.value = true

    try {
      const res = await Api.get(`/api/transactions/${uuid}`)
      const trx = res.data.data
      
      invoice.value = trx.invoice
      status.value = trx.status

      // Customer data
      selectedCustomer.value = trx.customer
        ? {
            id: trx.customer.uuid,     
            uuid: trx.customer.uuid,
            name: trx.customer.name_perusahaan,
            address: trx.customer.address,
          }
        : null

      ppn.value  = (trx.ppn === 0 || trx.ppn === null) ? null : trx.ppn
      nego.value = (trx.nego === 0 || trx.nego === null) ? null : trx.nego
      dp.value   = (trx.dp === 0 || trx.dp === null) ? null : trx.dp

      // Cart items
      cart.value = trx.transaction_details.map(d => ({
        id: d.id,
        qty: d.qty,
        name: d.product.title,
        price: d.price,
        icon: d.product.image,
        product_id: d.product.uuid,
        product_uuid: d.product.uuid,
      }))

      console.log('Transaction loaded:', {
        invoice: invoice.value,
        customer: selectedCustomer.value?.name,
        items: cart.value.length,
        status: status.value,
      })
    } catch (err) {
      console.error('Failed to fetch transaction:', err.response?.data || err)
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal memuat data',
        text: 'Transaksi tidak ditemukan',
      }).then(() => {
        router.push('/halaman-data-penjualan')
      })
    } finally {
      isLoading.value = false
    }
  }

  const updateTransaction = async (payload) => {
    try {
      Swal.fire({
        title: 'Memproses update...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const res = await Api.put(`/api/transactions/${uuid}`, payload)

      await Swal.fire({
        icon: 'success',
        title: 'Update Berhasil!',
        text: `Invoice: ${invoice.value}`,
        timer: 2000,
        showConfirmButton: false,
      })

      return res.data.data
    } catch (error) {
      console.error('Update failed:', error.response?.data || error)
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal update transaksi',
        text: error.response?.data?.meta?.message || 'Terjadi kesalahan',
      })
      
      throw error
    }
  }

  const addToLocalCart = (product) => {
    console.log('Adding product to cart:', product)

    const existing = cart.value.find(
      c => c.product_uuid === product.id || c.product_id === product.id
    )

    if (existing) {
      existing.qty += 1
      console.log('Updated existing item:', existing)
    } else {
      const newItem = {
        id: Date.now(), 
        product_id: product.id,
        product_uuid: product.id,
        qty: 1,
        name: product.name,
        price: product.price,
        icon: product.icon,
      }
      cart.value.push(newItem)
      console.log('Added new item:', newItem)
    }
  }

  const removeFromLocalCart = (id) => {
    console.log('Removing cart item:', id)
    cart.value = cart.value.filter(c => c.id !== id)
  }

  const updateLocalCartQty = (id, delta) => {
    const item = cart.value.find(c => c.id === id)
    if (!item) return

    const newQty = item.qty + delta

    if (newQty < 1) {
      removeFromLocalCart(id)
    } else {
      item.qty = newQty
    }
  }

  const setCustomer = (customer) => {
    selectedCustomer.value = customer
  }

  const clearCustomer = () => {
    selectedCustomer.value = null
  }

  const resetFinancials = () => {
    ppn.value = null
    nego.value = null
    dp.value = null
  }

  return {
    // State
    isLoading,
    invoice,
    selectedCustomer,
    cart,
    status,
    ppn,
    nego,
    dp,

    // Methods
    fetchTransactionDetail,
    updateTransaction,
    addToLocalCart,
    removeFromLocalCart,
    updateLocalCartQty,
    setCustomer,
    clearCustomer,
    resetFinancials,
  }
}
