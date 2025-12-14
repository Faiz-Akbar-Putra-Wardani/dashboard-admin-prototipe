// composables/useRentalCalculation.js
import { computed, watch } from 'vue'
import dayjs from 'dayjs'
import Swal from 'sweetalert2'

/**
 * Composable untuk perhitungan rental
 * @param {Ref} cartRef - Reactive cart reference
 * @param {Ref} dpRef - Reactive DP reference
 */
export function useRentalCalculation(cartRef, dpRef) {
  
  /**
   * Hitung jumlah bulan dari start_date dan end_date
   */
  const calculateMonths = (startDate, endDate) => {
    if (!startDate || !endDate) return 0

    const start = dayjs(startDate)
    const end = dayjs(endDate)

    // Hitung selisih bulan
    let months = (end.year() - start.year()) * 12 + (end.month() - start.month())

    // Jika tanggal end > tanggal start, tambah 1 bulan
    if (end.date() > start.date()) {
      months += 1
    }

    return months < 1 ? 1 : months
  }

  /**
   * Total harga sewa (rent_price × months × qty)
   */
  const totalRentPrice = computed(() => {
    const cart = Array.isArray(cartRef.value) ? cartRef.value : []
    
    let total = 0

    cart.forEach(item => {
      if (!item.start_date || !item.end_date || !item.rent_price) return

      const months = calculateMonths(item.start_date, item.end_date)
      total += item.rent_price * months * item.qty
    })

    return total
  })

  /**
   * Safe DP value
   */
  const dpSafe = computed(() => Number(dpRef?.value) || 0)

  /**
   * Total yang harus dibayar (setelah DP)
   */
  const totalBayar = computed(() => {
    return Math.max(0, totalRentPrice.value - dpSafe.value)
  })

  /**
   * Validasi DP
   */
  watch([dpRef, totalRentPrice], () => {
    if (dpRef.value == null) return

    if (dpRef.value > totalRentPrice.value) {
      dpRef.value = totalRentPrice.value

      Swal.fire({
        icon: 'warning',
        title: 'DP tidak valid',
        text: 'DP tidak boleh melebihi total sewa',
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (dpRef.value < 0) {
      dpRef.value = 0
    }
  })

  return {
    totalRentPrice,
    totalBayar,
    dpSafe,
    calculateMonths,
  }
}
