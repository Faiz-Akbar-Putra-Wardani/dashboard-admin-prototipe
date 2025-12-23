// composables/useRepairCalculation.js
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'

export function useRepairCalculation() {
  // STATE (input dari form)
  const repairCost = ref(null)     // biaya dasar perbaikan
  const extraRepair = ref(null)    // tambahan biaya (misal 50.000)
  const repairPph = ref(null)      // persen PPH (2.5, 3, dst.)
  const repairDp = ref(null)       // tetap disimpan kalau nanti mau dipakai, tapi tidak dihitung sisa bayar

  // SAFE NUMBER HELPERS
  const safeNum = (v) => Number(v) || 0

  const repairCostSafe = computed(() => safeNum(repairCost.value))
  const extraRepairSafe = computed(() => safeNum(extraRepair.value))
  const repairPphSafe = computed(() => safeNum(repairPph.value))
  const repairDpSafe = computed(() => safeNum(repairDp.value))

  // 1. Subtotal perbaikan (biaya dasar)
  const repairSubtotal = computed(() => repairCostSafe.value)

  // 2. Subtotal + tambahan biaya
  const repairSubtotalPlusExtra = computed(() =>
    repairSubtotal.value + extraRepairSafe.value
  )

  // 3. Nominal PPH (persentase dari subtotal + extra)
  const repairPphNominal = computed(() =>
    repairSubtotalPlusExtra.value * (repairPphSafe.value / 100)
  )

  // 4. Total biaya perbaikan setelah PPH
  const repairTotal = computed(() =>
    Math.max(0, repairSubtotalPlusExtra.value - repairPphNominal.value)
  )

  // VALIDASI PPH
  watch([repairPph, repairSubtotalPlusExtra], () => {
    if (repairPph.value == null) return

    if (repairPph.value > 100) {
      repairPph.value = 100
      Swal.fire({
        icon: 'warning',
        title: 'PPH tidak valid',
        text: 'PPH tidak boleh melebihi 100%',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (repairPph.value < 0) repairPph.value = 0
  })

  // VALIDASI DP (hanya memastikan masuk akal, walau tidak dipakai sisa bayar)
  watch([repairDp, repairTotal], () => {
    if (repairDp.value == null) return

    if (repairDp.value >= repairTotal.value && repairTotal.value > 0) {
      repairDp.value = Math.max(0, repairTotal.value - 1)
      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP harus lebih kecil dari total biaya perbaikan',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (repairDp.value < 0) repairDp.value = 0
  })

  const resetRepair = () => {
    repairCost.value = null
    extraRepair.value = null
    repairPph.value = null
    repairDp.value = null
  }

  return {
    // refs (buat di-bind ke form)
    repairCost,
    extraRepair,
    repairPph,
    repairDp,

    // safe values
    repairCostSafe,
    extraRepairSafe,
    repairPphSafe,
    repairDpSafe,

    // computed (buat ditampilkan / dikirim ke backend)
    repairSubtotal,
    repairSubtotalPlusExtra,
    repairPphNominal,
    repairTotal,

    // methods
    resetRepair,
  }
}
