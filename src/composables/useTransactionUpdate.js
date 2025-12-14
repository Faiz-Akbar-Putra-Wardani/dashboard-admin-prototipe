// composables/useTransactionUpdate.js
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

/**
 * Composable untuk handle update transaction flow
 */
export function useTransactionUpdate() {
  const router = useRouter()

  /**
   * Process transaction update with confirmation
   */
  const processUpdate = async (transactionEdit, calculationData) => {
    const {
      cart,
      selectedCustomer,
      invoice,
      status,
      updateTransaction,
    } = transactionEdit

    const {
      subtotal,
      subtotalPlusExtra,
      extraSafe,
      pphSafe,
      pphNominal,
      negoSafe,
      dpSafe,
      totalBayar,
    } = calculationData

    // ========================================
    // VALIDASI
    // ========================================
    if (!cart.value.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Keranjang masih kosong',
        text: 'Tambahkan produk sebelum update!',
      })
      return false
    }

    if (!selectedCustomer.value) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer belum dipilih',
        text: 'Silakan pilih customer sebelum update!',
      })
      return false
    }

    if (negoSafe > totalBayar) {
      Swal.fire({
        icon: 'warning',
        title: 'Nego tidak valid',
        text: 'Harga nego tidak boleh melebihi total',
      })
      return false
    }

    if (dpSafe > totalBayar) {
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP tidak boleh melebihi total bayar',
      })
      return false
    }

    // ========================================
    // KONFIRMASI
    // ========================================
    const result = await Swal.fire({
      title: 'Konfirmasi Update',
      html: `
        <div class="text-center">
          <p><strong>Invoice:</strong> ${invoice.value}</p>
          <p><strong>Customer:</strong> ${selectedCustomer.value?.name || '-'}</p>
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
      confirmButtonText: 'Ya, Update',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#06b6d4',
      cancelButtonColor: '#EF4444',
    })

    if (!result.isConfirmed) return false

    // ========================================
    // UPDATE TRANSACTION
    // ========================================
    try {
      const payload = {
        customer_id: selectedCustomer.value.id,
        subtotal,
        subtotalPlusExtra,
        extra: extraSafe,
        pph: pphSafe,
        pph_nominal: pphNominal,
        nego: negoSafe,
        dp: dpSafe,
        grand_total: totalBayar,
        status: status.value || 'proses',
      }

      await updateTransaction(payload)

      // Redirect to list page
      router.push('/halaman-data-penjualan')

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
