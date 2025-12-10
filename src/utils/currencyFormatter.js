/**
 * Format angka ke format Rupiah Indonesia
 * @param {string|number} value - Nilai yang akan diformat
 * @returns {string} - Nilai terformat (contoh: "1.000.000")
 */
export const formatRupiah = (value) => {
  if (!value) return "";
  
  // Hapus semua karakter non-digit
  const number = value.toString().replace(/\D/g, "");
  
  if (!number) return "";
  
  // Format dengan pemisah ribuan (titik)
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Parse format rupiah kembali ke angka murni
 * @param {string} value - Nilai terformat (contoh: "1.000.000")
 * @returns {string} - Angka murni tanpa format (contoh: "1000000")
 */
export const parseRupiah = (value) => {
  if (!value) return "";
  return value.replace(/\./g, "");
};

/**
 * Format angka ke format Rupiah lengkap dengan prefix "Rp"
 * @param {string|number} value - Nilai yang akan diformat
 * @returns {string} - Nilai terformat dengan prefix (contoh: "Rp 1.000.000")
 */
export const formatRupiahWithPrefix = (value) => {
  const formatted = formatRupiah(value);
  return formatted ? `Rp ${formatted}` : "";
};

/**
 * Validasi apakah input adalah angka valid
 * @param {string} value - Nilai yang akan divalidasi
 * @returns {boolean} - true jika valid
 */
export const isValidNumber = (value) => {
  const parsed = parseRupiah(value);
  return /^\d+$/.test(parsed);
};
