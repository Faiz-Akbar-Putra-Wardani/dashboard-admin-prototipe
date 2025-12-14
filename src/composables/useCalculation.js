// composables/useCalculation.js
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'

/**
 * Composable untuk handle semua perhitungan transaksi
 * @param {Ref} cartRef - Reactive reference ke cart array
 */
export function useCalculation(cartRef) {
  // ========================================
  // STATE
  // ========================================
  const extra = ref(null)
  const pph = ref(null)
  const nego = ref(null)
  const dp = ref(null)

  // ========================================
  // SAFE NUMBER HELPERS
  // ========================================
  const safeNum = (v) => Number(v) || 0

  const extraSafe = computed(() => safeNum(extra.value))
  const pphSafe = computed(() => safeNum(pph.value))
  const negoSafe = computed(() => safeNum(nego.value))
  const dpSafe = computed(() => safeNum(dp.value))

  // ========================================
  // PERHITUNGAN BERTINGKAT
  // ========================================
  
  // 1. Subtotal (harga × qty semua item)
  const subtotal = computed(() => {
    const cart = Array.isArray(cartRef.value) ? cartRef.value : []
    return cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  })

  // 2. Subtotal + Biaya Extra
  const subtotalPlusExtra = computed(() => 
    subtotal.value + extraSafe.value
  )

  // 3. Nominal PPH (persentase dari subtotal + extra)
  const pphNominal = computed(() =>
    subtotalPlusExtra.value * (pphSafe.value / 100)
  )

  // 4. Total sebelum nego (subtotal + extra - pph)
  const totalBeforeNego = computed(() =>
    subtotalPlusExtra.value - pphNominal.value
  )

  // 5. Total setelah nego
  const totalAfterNego = computed(() =>
    Math.max(0, totalBeforeNego.value - negoSafe.value)
  )

  // 6. Total bayar final
  const totalBayar = computed(() => 
    Math.max(0, totalAfterNego.value)
  )

  // ========================================
  // VALIDASI NEGO
  // ========================================
  watch([nego, totalBeforeNego], () => {
    if (nego.value == null) return

    if (nego.value > totalBeforeNego.value) {
      nego.value = totalBeforeNego.value
      Swal.fire({
        icon: 'warning',
        title: 'Nego tidak valid',
        text: 'Harga nego tidak boleh melebihi total sebelum nego',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (nego.value < 0) nego.value = 0
  })

  // VALIDASI DP
 
  watch([dp, totalBayar], () => {
    if (dp.value == null) return

    if (dp.value > totalBayar.value) {
      dp.value = totalBayar.value
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP tidak boleh melebihi total bayar',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (dp.value < 0) dp.value = 0
  })


  // VALIDASI PPH
  watch([pph, subtotalPlusExtra], () => {
    if (pph.value == null) return

    if (pph.value > 100) {
      pph.value = 100
      Swal.fire({
        icon: 'warning',
        title: 'PPH tidak valid',
        text: 'PPH tidak boleh melebihi 100%',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (pph.value < 0) pph.value = 0
  })

  // RESET FUNCTION
  const reset = () => {
    extra.value = null
    pph.value = null
    nego.value = null
    dp.value = null
  }

  // RETURN API
  return {
    // Refs
    extra,
    pph,
    nego,
    dp,

    // Computed values
    subtotal,
    subtotalPlusExtra,
    pphNominal,
    totalBeforeNego,
    totalAfterNego,
    totalBayar,

    // Safe values
    extraSafe,
    pphSafe,
    negoSafe,
    dpSafe,

    // Methods
    reset,
  }
}
