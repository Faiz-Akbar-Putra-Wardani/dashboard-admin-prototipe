<script setup>
import { ref, onMounted, computed } from "vue"
import Api from "@/services/api"
import Cookies from "js-cookie"
import html2pdf from "html2pdf.js"

// STATE
const recaps = ref([])
const printDate = ref(new Date())
const isLoading = ref(false)
const filters = ref({
  type: "",
  search: "",
  group: false,
  page: null,
  all: false
})

const printArea = ref(null)

// FORMAT
const formatRupiah = (num) =>
  new Intl.NumberFormat("id-ID").format(num ?? 0)

const formatPrintDate = (date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

// HITUNG TOTAL PEMASUKAN
const totalPemasukan = computed(() => {
  return recaps.value.reduce((sum, item) => {
    return sum + Number(item.total || 0)
  }, 0)
})

// COMPUTED TITLE
const printTitle = computed(() => {
  if (filters.value.type) {
    return `Rekap Data Pelanggan - ${filters.value.type.toUpperCase()}`
  }
  return 'Rekap Data Pelanggan'
})

// FETCH DATA REKAP
const fetchRecapData = async () => {
  try {
    isLoading.value = true
    const token = Cookies.get("token")
    Api.defaults.headers.common["Authorization"] = token

    const params = {}

    // Type filter
    if (filters.value.type) {
      params.type = filters.value.type
    }

    // Search filter
    if (filters.value.search) {
      params.search = filters.value.search
    }

    // Group filter
    if (filters.value.group) {
      params.group = filters.value.group
    }

    // Jika print halaman tertentu
    if (filters.value.page && !filters.value.all) {
      params.page = filters.value.page
      params.limit = 5
    }
    // Jika print semua
    else if (filters.value.all) {
      params.all = 'true' // Kirim flag ke backend
    }

    console.log('📤 Params yang dikirim:', params)

    const res = await Api.get("/api/reports/customer-recap", { params })
    
    console.log('📥 Response dari API:', res.data)
    console.log('📊 Jumlah data diterima:', res.data?.data?.length)

    recaps.value = res.data?.data || []

  } catch (err) {
    console.error("❌ Gagal memuat rekap:", err)
    alert('Gagal memuat data: ' + (err.response?.data?.message || err.message))
  } finally {
    isLoading.value = false
  }
}

// DOWNLOAD PDF
const downloadPdf = () => {
  const opt = {
    margin: 5,
    filename: `${printTitle.value}-${formatPrintDate(printDate.value)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  }

  html2pdf().set(opt).from(printArea.value).save()
}

// ON MOUNTED
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  
  filters.value.type = params.get("type") || ""
  filters.value.search = params.get("search") || ""
  filters.value.group = params.get("group") === "true"
  filters.value.page = params.get("page") || null
  filters.value.all = params.get("all") === "true"

  console.log('🔧 Filters dari URL:', filters.value)
  
  fetchRecapData()
});
</script>

<template>
  <div>
    <!-- LOADING OVERLAY -->
    <div v-if="isLoading" class="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
        <p class="text-gray-600 font-semibold">Memuat data untuk print...</p>
      </div>
    </div>

    <!-- Tombol Download PDF -->
    <div v-if="!isLoading" style="margin-bottom: 20px; text-align:right; padding: 20px;">
      <div class="inline-block bg-gray-100 px-4 py-2 rounded-lg mr-4 text-sm">
        <span class="font-semibold">Total Data:</span> {{ recaps.length }}
      </div>
      <button @click="downloadPdf" class="btn btn-primary">
        <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download PDF
      </button>
      <button @click="window.print()" class="btn btn-secondary ml-3">
        <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print
      </button>
    </div>

    <!-- AREA PRINT -->
    <div v-if="!isLoading" class="invoice-print" ref="printArea">

      <!-- HEADER -->
      <div class="header">
        <div class="logo">SES</div>
        <div class="company">
          <h1>SINAR ELEKTRO SEJAHTERA</h1>
          <div class="tagline">
            service: Rewinding Elektro motor 1 dan 3 phase, Genset<br>
            <span class="underline">Generator Jual-Beli dan Sewa Genset</span>
          </div>
          <div class="address">
            Alamat:
            <span class="underline">
              JL. Cendanall Gg. H. JANUR – Jatimulyo – Lampung Selatan • Tlp. 0853-8312-0656
            </span>
          </div>
        </div>
      </div>

      <!-- TEMPAT & TANGGAL -->
      <div class="place-date">
        Bandar Lampung, {{ formatPrintDate(printDate) }}
      </div>

      <!-- JUDUL -->
      <div class="title-section">
        <p class="invoice-title"><u>{{ printTitle }}</u></p>
        <p>Tanggal Cetak: {{ formatPrintDate(printDate) }}</p>
        <p v-if="filters.page" style="margin-top: 5px;">
          <strong>Halaman: {{ filters.page }}</strong>
        </p>
        <p v-else-if="filters.all" style="margin-top: 5px;">
          <strong>Semua Data ({{ recaps.length }} transaksi)</strong>
        </p>
      </div>

      <!-- TABEL REKAP -->
      <table class="items">
        <thead>
          <tr>
            <th style="width: 50px;">No</th>
            <th v-if="!filters.group">Invoice</th>
            <th>Nama Pelanggan</th>
            <th v-if="!filters.group">Jenis</th>
            <th style="width: 150px;">Total</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in recaps" :key="index">
            <td class="center">{{ index + 1 }}</td>
            <td v-if="!filters.group">{{ item.invoice }}</td>
            <td>{{ item.perusahaan }}</td>
            <td v-if="!filters.group" class="center">
              <span class="badge" :class="`badge-${item.type}`">
                {{ item.type }}
              </span>
            </td>
            <td class="right">Rp {{ formatRupiah(item.total) }}</td>
          </tr>

          <!-- EMPTY STATE -->
          <tr v-if="recaps.length === 0">
            <td :colspan="filters.group ? 3 : 5" class="center" style="padding: 20px;">
              Tidak ada data
            </td>
          </tr>

          <!-- TOTAL PEMASUKAN -->
          <tr v-if="recaps.length > 0" class="total-row">
            <td :colspan="filters.group ? 2 : 4" class="right">
              <b>TOTAL PEMASUKAN</b>
            </td>
            <td class="right">
              <b>Rp {{ formatRupiah(totalPemasukan) }}</b>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- KETERANGAN -->
      <div class="notes">
        <p><strong>Keterangan:</strong></p>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Data ini merupakan rekap transaksi pelanggan</li>
          <li>Total pemasukan: <strong>Rp {{ formatRupiah(totalPemasukan) }}</strong></li>
          <li>Jumlah transaksi: <strong>{{ recaps.length }} data</strong></li>
          <li v-if="filters.type">
            Filter jenis: <strong>{{ filters.type.toUpperCase() }}</strong>
          </li>
          <li v-if="filters.page">
            Menampilkan halaman: <strong>{{ filters.page }}</strong>
          </li>
          <li v-else-if="filters.all">
            Menampilkan: <strong>Semua Data</strong>
          </li>
        </ul>
      </div>

      <!-- FOOTER -->
      <div class="footer-section">
        <div class="signature-area">
          <div class="signature-box">
            <p>Mengetahui,</p>
            <div class="signature-line"></div>
            <p class="signature-name">(.......................)</p>
          </div>
          <div class="signature-box">
            <p>Hormat Kami,</p>
            <div class="signature-line"></div>
            <p class="signature-name">(.......................)</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ... (style tetap sama) ... */
.invoice-print {
  font-family: "Times New Roman";
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: #fff;
  color: #000;
  font-size: 12pt;
  line-height: 1.5;
}

.header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #0033A0;
  position: relative;
}

.header::after {
  content: "";
  position: absolute;
  bottom: -1px;
  width: 100%;
  height: 3px;
  background: #0033A0;
}

.logo {
  width: 70px;
  height: 70px;
  background: #0033A0;
  color: #fff;
  font-weight: bold;
  font-size: 30pt;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
}

.company h1 {
  margin: 0 0 2px 0;
  font-size: 20pt;
  text-transform: uppercase;
  font-weight: bold;
  text-decoration: underline;
  text-decoration-color: #0033A0;
}

.tagline,
.address {
  font-size: 10pt;
  line-height: 1.3;
}

.underline {
  text-decoration: underline;
}

.place-date {
  text-align: right;
  margin: 15px 0;
  font-size: 11pt;
}

.title-section {
  text-align: center;
  margin: 20px 0;
}

.invoice-title {
  font-size: 14pt;
  font-weight: bold;
  margin: 0;
}

.title-section p {
  margin: 5px 0;
  font-size: 11pt;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.items th,
.items td {
  border: 1px solid #000;
  padding: 8px;
  font-size: 11pt;
}

.items th {
  background: #f0f0f0;
  font-weight: bold;
  text-align: center;
}

.items td {
  text-align: left;
}

.right { 
  text-align: right; 
}

.center { 
  text-align: center; 
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 9pt;
  font-weight: bold;
}

.badge-penjualan {
  background: #DBEAFE;
  color: #1E40AF;
}

.badge-sewa {
  background: #D1FAE5;
  color: #065F46;
}

.badge-perbaikan {
  background: #FED7AA;
  color: #9A3412;
}

.total-row td {
  font-weight: bold;
  background: #e8e8e8;
  font-size: 12pt;
}

.notes {
  margin-top: 25px;
  font-size: 10pt;
}

.notes ul {
  list-style-type: disc;
}

.notes li {
  margin: 3px 0;
}

.footer-section {
  margin-top: 40px;
}

.signature-area {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.signature-box {
  width: 45%;
  text-align: center;
}

.signature-line {
  height: 60px;
  margin: 10px 0;
}

.signature-name {
  margin-top: 5px;
  font-weight: bold;
}

/* BUTTON STYLE */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
}

.btn-primary {
  background: #10B981;
  color: white;
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-secondary {
  background: #6366F1;
  color: white;
}

.btn-secondary:hover {
  background: #4F46E5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

@media print {
  .btn {
    display: none !important;
  }
  
  .invoice-print {
    padding: 0;
  }

  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
