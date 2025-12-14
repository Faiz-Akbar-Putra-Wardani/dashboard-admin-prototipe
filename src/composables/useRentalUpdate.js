// composables/useRentalUpdate.js
import Swal from 'sweetalert2'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

/**
 * Composable untuk handle rental update flow
 */
export function useRentalUpdate() {
  const router = useRouter()

  /**
   * Validate rental cart before update
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

  const processUpdate = async (rentalEdit, calculationData) => {
    const {
      cart,
      selectedCustomer,
      invoice,
      status,
      dp,
      updateRental,
    } = rentalEdit

    const {
      totalRentPrice,
      dpSafe,
    } = calculationData

    if (!selectedCustomer.value) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer belum dipilih',
        text: 'Silakan pilih customer terlebih dahulu',
      })
      return false
    }

    if (!validateCart(cart.value)) {
      return false
    }

    if (dpSafe > totalRentPrice) {
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP tidak boleh melebihi total sewa',
      })
      return false
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Update',
      html: `
        <div class="text-center">
          <p><strong>Invoice:</strong> ${invoice.value}</p>
          <p><strong>Customer:</strong> ${selectedCustomer.value?.name || '-'}</p>
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
      confirmButtonText: 'Ya, Update',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#06b6d4',
      cancelButtonColor: '#ef4444',
    })

    if (!result.isConfirmed) return false

    try {
      const payload = {
        customer_id: selectedCustomer.value.id,
        dp: dpSafe,
        status: status.value,
        total_rent_price: totalRentPrice,
        details: cart.value.map(item => ({
          product_id: item.product_id,
          qty: item.qty,
          rent_price: item.rent_price,
          start_date: item.start_date,
          end_date: item.end_date,
        })),
      }

      await updateRental(payload)

      // Redirect to list page
      router.push('/halaman-data-sewa')

      return true

    } catch (error) {
      console.error('Update error:', error)
      return false
    }
  }

  return {
    processUpdate,
  }
}
