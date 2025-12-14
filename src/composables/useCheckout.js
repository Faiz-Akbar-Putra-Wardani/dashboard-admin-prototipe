// composables/useCheckout.js
import Swal from 'sweetalert2'
import { useSaleStore } from '@/stores/useSaleStore'

/**
 * Composable untuk handle checkout process
 */
export function useCheckout() {
  const store = useSaleStore()

  /**
   * Process checkout transaksi
   * @param {Object} calculationData - Data perhitungan dari useCalculation
   */
  const checkout = async (calculationData) => {
    const { 
      subtotal, 
      subtotalPlusExtra, 
      extraSafe, 
      pphSafe, 
      pphNominal, 
      negoSafe, 
      dpSafe, 
      totalBayar 
    } = calculationData

    // ========================================
    // VALIDASI KERANJANG
    // ========================================
    if (!store.cart.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Keranjang masih kosong',
        text: 'Tambahkan produk sebelum checkout!',
      })
      return false
    }

    // ========================================
    // VALIDASI CUSTOMER
    // ========================================
    if (!store.selectedCustomer) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer belum dipilih',
        text: 'Silakan pilih customer sebelum checkout!',
      })
      return false
    }

    // ========================================
    // VALIDASI NEGO
    // ========================================
    if (negoSafe > totalBayar) {
      Swal.fire({
        icon: 'warning',
        title: 'Nego tidak valid',
        text: 'Harga nego tidak boleh melebihi total',
      })
      return false
    }

    // ========================================
    // VALIDASI DP
    // ========================================
    if (dpSafe > totalBayar) {
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP tidak boleh melebihi total bayar',
      })
      return false
    }

    // ========================================
    // KONFIRMASI CHECKOUT
    // ========================================
    const result = await Swal.fire({
      title: 'Konfirmasi Checkout',
      html: `
        <div class="text-center">
          <p><strong>Customer:</strong> ${store.selectedCustomer?.name || '-'}</p>
          <p><strong>Subtotal:</strong> Rp ${subtotal.toLocaleString('id-ID')}</p>
          <p><strong>Tambahan Biaya:</strong> Rp ${extraSafe.toLocaleString('id-ID')}</p>
          <p><strong>Total + Biaya:</strong> Rp ${subtotalPlusExtra.toLocaleString('id-ID')}</p>
          <p><strong>PPH (%):</strong> ${pphSafe}%</p>
          <p><strong>PPH Nominal:</strong> Rp ${pphNominal.toLocaleString('id-ID')}</p>
          <p><strong>Nego:</strong> Rp ${negoSafe.toLocaleString('id-ID')}</p>
          <p><strong>DP:</strong> Rp ${dpSafe.toLocaleString('id-ID')}</p>
          <hr class="my-2" />
          <p class="text-lg font-bold" style="color:#06b6d4">
            Total Dibayar: Rp ${totalBayar.toLocaleString('id-ID')}
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Checkout',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#06b6d4',
      cancelButtonColor: '#EF4444',
    })

    if (!result.isConfirmed) return false

    // ========================================
    // PROCESS CHECKOUT
    // ========================================
    try {
      Swal.fire({
        title: 'Memproses transaksi...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const payload = {
        customer_id: store.selectedCustomer.id,
        subtotal,
        subtotalPlusExtra,
        extra: extraSafe,
        pph: pphSafe,
        pph_nominal: pphNominal,
        nego: negoSafe,
        dp: dpSafe,
        grand_total: totalBayar,
        status: store.status || 'proses',
      }

      const res = await store.checkout(payload)

      await Swal.fire({
        icon: 'success',
        title: 'Transaksi Berhasil!',
        text: `Invoice: ${res.invoice}`,
        timer: 2000,
        showConfirmButton: false,
      })

      return true

    } catch (error) {
      console.error('Checkout gagal:', error.response?.data || error)

      Swal.fire({
        icon: 'error',
        title: 'Gagal melakukan checkout',
        text: error.response?.data?.meta?.message || 'Terjadi kesalahan saat memproses transaksi.',
        confirmButtonColor: '#e3342f',
      })

      return false
    }
  }

  return {
    checkout,
  }
}
