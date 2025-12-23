// composables/useTransactionUpdate.js
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

/**
 * Composable untuk handle update transaction flow (penjualan + PPN)
 */
export function useTransactionUpdate() {
  const router = useRouter()

  /**
   * @param {ReturnType<useTransactionEdit>} transactionEdit
   * @param {Object} calculationData - dari useCalculation (PPN)
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
      ppnSafe,      
      ppnNominal,   
      negoSafe,
      dpSafe,
      totalBayar,
    } = calculationData

    // VALIDASI
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

    if (negoSafe >= totalBayar) {
      Swal.fire({
        icon: 'warning',
        title: 'Nego tidak valid',
        text: 'Harga nego tidak boleh melebihi total',
      })
      return false
    }

    if (dpSafe >= totalBayar) {
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP tidak boleh melebihi total bayar',
      })
      return false
    }

    // KONFIRMASI
    const result = await Swal.fire({
      title: 'Konfirmasi Update',
      html: `
        <div class="text-center">
          <p><strong>Invoice:</strong> ${invoice.value}</p>
          <p><strong>Customer:</strong> ${selectedCustomer.value?.name || '-'}</p>
          <p><strong>Subtotal:</strong> Rp ${subtotal.toLocaleString('id-ID')}</p>
          <p><strong>PPN (%):</strong> ${ppnSafe}%</p>
          <p><strong>PPN Nominal:</strong> Rp ${ppnNominal.toLocaleString('id-ID')}</p>
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

    // UPDATE TRANSACTION
    try {
      const payload = {
        customer_id: selectedCustomer.value.id,
        subtotal,
        ppn: ppnSafe,
        ppn_nominal: ppnNominal,
        nego: negoSafe,
        dp: dpSafe,
        grand_total: totalBayar,
        status: status.value || 'proses',
      }

      await updateTransaction(payload)

      router.push('/halaman-data-penjualan')
      return true
    } catch (error) {
      console.error('Update error:', error)
      return false
    }
  }

  return { processUpdate }
}
