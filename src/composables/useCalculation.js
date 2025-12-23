// composables/useCalculation.js
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'

/**
 * Composable untuk handle semua perhitungan transaksi PENJUALAN
 * (tanpa extra & PPH, hanya PPN).
 * @param {Ref} cartRef - Reactive reference ke cart array
 */
export function useCalculation(cartRef) {
  // STATE
  const ppn = ref(null)   // persen PPN (11, 12, dll)
  const nego = ref(null)
  const dp = ref(null)

  // SAFE NUMBER HELPERS
  const safeNum = (v) => Number(v) || 0

  const ppnSafe = computed(() => safeNum(ppn.value))
  const negoSafe = computed(() => safeNum(nego.value))
  const dpSafe = computed(() => safeNum(dp.value))

  // 1. Subtotal (harga × qty semua item)
  const subtotal = computed(() => {
    const cart = Array.isArray(cartRef.value) ? cartRef.value : []
    return cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  })

  // 2. Nominal PPN (persen dari subtotal)
  const ppnNominal = computed(() =>
    subtotal.value * (ppnSafe.value / 100)
  )

  // 3. Total sebelum nego (subtotal + PPN)
  const totalBeforeNego = computed(() =>
    subtotal.value + ppnNominal.value
  )

  // 4. Total setelah nego
  const totalAfterNego = computed(() =>
    Math.max(0, totalBeforeNego.value - negoSafe.value)
  )

  // 5. Total bayar final
  const totalBayar = computed(() =>
    Math.max(0, totalAfterNego.value)
  )

  // VALIDASI NEGO
  watch([nego, totalBeforeNego], () => {
    if (nego.value == null) return

    if (nego.value >= totalBeforeNego.value) {
      nego.value = Math.max(0, totalBeforeNego.value - 1)
      Swal.fire({
        icon: 'warning',
        title: 'Nego tidak valid',
        text: 'Nego harus lebih kecil dari total sebelum nego',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (nego.value < 0) nego.value = 0
  })

  // VALIDASI DP
  watch([dp, totalBayar], () => {
    if (dp.value == null) return

    if (dp.value >= totalBayar.value) {
      dp.value = Math.max(0, totalBayar.value - 1)
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP harus lebih kecil dari total bayar',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (dp.value < 0) dp.value = 0
  })

  // VALIDASI PPN
  watch([ppn, subtotal], () => {
    if (ppn.value == null) return

    if (ppn.value > 100) {
      ppn.value = 100
      Swal.fire({
        icon: 'warning',
        title: 'PPN tidak valid',
        text: 'PPN tidak boleh melebihi 100%',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (ppn.value < 0) ppn.value = 0
  })

  const reset = () => {
    ppn.value = null
    nego.value = null
    dp.value = null
  }

  return {
    // Refs
    ppn,
    nego,
    dp,

    // Computed values
    subtotal,
    ppnNominal,
    totalBeforeNego,
    totalAfterNego,
    totalBayar,

    // Safe values
    ppnSafe,
    negoSafe,
    dpSafe,

    // Methods
    reset,
  }
}
