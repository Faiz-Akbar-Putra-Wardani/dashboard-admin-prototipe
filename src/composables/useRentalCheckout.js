// composables/useRentalCheckout.js
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import { useRentalStore } from '@/stores/useRentalStore'

/**
 * Composable untuk checkout rental
 */
export function useRentalCheckout() {
  const store = useRentalStore()

  /**
   * Validate rental cart
   */
  const validateCart = (cart) => {
    // Check empty cart
    if (!cart.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Keranjang kosong',
        text: 'Tambahkan produk terlebih dahulu',
      })
      return false
    }

    // Check dates
    const hasEmptyDates = cart.some(item => !item.start_date || !item.end_date)
    if (hasEmptyDates) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanggal belum lengkap',
        text: 'Tanggal sewa wajib diisi di setiap item!',
      })
      return false
    }

    // Check date validity
    for (const item of cart) {
      const start = dayjs(item.start_date)
      const end = dayjs(item.end_date)

      if (end.isBefore(start)) {
        Swal.fire({
          icon: 'error',
          title: 'Tanggal Tidak Valid',
          text: `Tanggal selesai tidak boleh lebih awal dari tanggal mulai untuk ${item.name}`,
        })
        return false
      }
    }

    return true
  }

  /**
   * Process checkout
   */
  const checkout = async (calculationData) => {
    const { totalRentPrice, dpSafe } = calculationData

    // Validate customer
    if (!store.selectedCustomer) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer belum dipilih',
        text: 'Silakan pilih customer terlebih dahulu',
      })
      return false
    }

    // Validate cart
    if (!validateCart(store.cart)) {
      return false
    }

    // Validate DP
    if (dpSafe > totalRentPrice) {
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP tidak boleh melebihi total sewa',
      })
      return false
    }

    // Confirmation
    const result = await Swal.fire({
      title: 'Konfirmasi Checkout',
      html: `
        <div class="text-center">
          <p><strong>Customer:</strong> ${store.selectedCustomer?.name || '-'}</p>
          <p><strong>Total Harga Sewa:</strong> Rp ${totalRentPrice.toLocaleString('id-ID')}</p>
          <p><strong>DP:</strong> Rp ${dpSafe.toLocaleString('id-ID')}</p>
          <hr class="my-2" />
          <p class="text-lg font-bold" style="color:#06b6d4">
            Sisa Bayar: Rp ${(totalRentPrice - dpSafe).toLocaleString('id-ID')}
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Proses',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#06b6d4',
      cancelButtonColor: '#ef4444',
    })

    if (!result.isConfirmed) return false

    // Prepare payload
    const payload = {
      invoice: store.invoice,
      customer_id: store.selectedCustomer.id,
      dp: dpSafe,
      status: store.status,
      total_rent_price: totalRentPrice,
      details: store.cart.map(item => ({
        product_id: item.id,
        qty: item.qty,
        rent_price: item.rent_price,
        start_date: item.start_date,
        end_date: item.end_date,
      })),
    }

    console.log('Checkout payload:', payload)

    try {
      Swal.fire({
        title: 'Memproses data...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const res = await store.checkout(payload)

      await Swal.fire({
        icon: 'success',
        title: 'Rental berhasil dibuat',
        text: `Invoice: ${res.invoice}`,
        timer: 1800,
        showConfirmButton: false,
      })

      return true

    } catch (err) {
      console.error('Checkout error:', err.response?.data || err)

      const message =
        err.response?.data?.meta?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Terjadi kesalahan'

      Swal.fire({
        icon: 'error',
        title: 'Gagal checkout',
        text: message,
      })

      return false
    }
  }

  return {
    checkout,
  }
}
