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

    if (filters.value.type) {
      params.type = filters.value.type
    }

    if (filters.value.search) {
      params.search = filters.value.search
    }

    if (filters.value.group) {
      params.group = filters.value.group
    }

    if (filters.value.page && !filters.value.all) {
      params.page = filters.value.page
      params.limit = 5
    } else if (filters.value.all) {
      params.all = 'true'
    }

    console.log(' Params yang dikirim:', params)

    const res = await Api.get("/api/reports/customer-recap", { params })
    
    console.log(' Response dari API:', res.data)
    console.log('Jumlah data diterima:', res.data?.data?.length)

    recaps.value = res.data?.data || []

  } catch (err) {
    console.error(" Gagal memuat rekap:", err)
    alert('Gagal memuat data: ' + (err.response?.data?.message || err.message))
  } finally {
    isLoading.value = false
  }
}

// DOWNLOAD PDF - SAMA SEPERTI INVOICE
const downloadPdf = async () => {
  const element = printArea.value;

  await new Promise(resolve => setTimeout(resolve, 300));

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${printTitle.value}-${formatPrintDate(printDate.value)}.pdf`,
    image: { 
      type: "jpeg", 
      quality: 0.95
    },
    html2canvas: { 
      scale: 2.2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      windowHeight: 1400,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.invoice-print');
        if (clonedElement) {
          clonedElement.style.maxWidth = '100%';
          clonedElement.style.padding = '20px 35px';
          clonedElement.style.fontSize = '10pt';
        }
        
        const header = clonedDoc.querySelector('.header');
        if (header) {
          header.style.display = 'flex';
          header.style.alignItems = 'flex-start';
          header.style.gap = '15px';
          header.style.marginBottom = '15px';
        }
        
        const logo = clonedDoc.querySelector('.logo');
        if (logo) {
          logo.style.width = '65px';
          logo.style.height = '65px';
          logo.style.flexShrink = '0';
          logo.style.display = 'flex';
        }
        
        const logoImg = clonedDoc.querySelector('.logo img');
        if (logoImg) {
          logoImg.style.width = '65px';
          logoImg.style.height = '65px';
        }
        
        const company = clonedDoc.querySelector('.company');
        if (company) {
          company.style.flex = '1';
        }

        const sections = clonedDoc.querySelectorAll('.title-section, .notes');
        sections.forEach(section => {
          section.style.marginTop = '15px';
          section.style.marginBottom = '15px';
        });

        const table = clonedDoc.querySelector('.items');
        if (table) {
          table.style.fontSize = '10pt';
          table.style.marginBottom = '18px';
        }
      }
    },
    jsPDF: { 
      unit: "mm", 
      format: "a4", 
      orientation: "portrait",
      compress: true
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      avoid: ['.footer-section', '.notes', '.header']
    }
  };

  html2pdf().set(opt).from(element).save();
};

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

      <!-- HEADER dengan Logo Image -->
      <div class="header">
        <div class="logo">
          <img src="/images/logo/logo_ses2.png" alt="SES Logo" />
        </div>
        <div class="company">
          <h1>SINAR ELEKTRO SEJAHTERA</h1>
          <div class="tagline">
            service:Rewinding Elektro motor1 dan 3phase, ,Genset<br>
            <span class="underline">Generator Jual-Beli dan Sewa Genset</span>
          </div>
          <div class="address">
            Alamat:<span class="underline">JL.Cendanall Gg.H.JANUR Jatimulyo-Lampung Selatan Tlp.0853-8312-0656</span>
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
        <p v-if="filters.page">
          <strong>Halaman: {{ filters.page }}</strong>
        </p>
        <p v-else-if="filters.all">
          <strong>Semua Data ({{ recaps.length }} transaksi)</strong>
        </p>
      </div>

      <!-- TABEL REKAP -->
      <table class="items">
        <thead>
          <tr>
            <th class="no-col">No</th>
            <th v-if="!filters.group" class="invoice-col">Invoice</th>
            <th class="customer-col">Nama Pelanggan</th>
            <th v-if="!filters.group" class="type-col">Jenis</th>
            <th class="total-col">Total</th>
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
        <ul>
          <li>Data ini merupakan rekap transaksi pelanggan</li>
          <li>Total pemasukan: <strong>Rp {{ formatRupiah(totalPemasukan) }}</strong></li>
          <li>Jumlah transaksi: <strong>{{ recaps.length }} data</strong></li>
          <li v-if="filters.type">
            Filter jenis: <strong>{{ filters.type.toUpperCase() }}</strong>
          </li>
        </ul>
      </div>

      <!-- FOOTER SIGNATURE -->
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
.invoice-print {
  font-family: "Times New Roman", Times, serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 25px 40px;
  background: #fff;
  color: #000;
  font-size: 11pt;
  line-height: 1.4;
  box-sizing: border-box;
  min-height: 1000px;
}

.underline {
  text-decoration: underline;
}

/* Header dengan spacing yang cukup */
.header {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 4px solid #0033A0;
  position: relative;
  page-break-after: avoid;
}

.logo {
  width: 65px;
  height: 65px;
  min-width: 65px;
  min-height: 65px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-right: 0;
}

.logo img {
  width: 65px;
  height: 65px;
  max-width: 65px;
  max-height: 65px;
  object-fit: contain;
  display: block;
}

.company {
  flex: 1;
  min-width: 0;
}

.company h1 {
  margin: 0 0 5px 0;
  padding: 0;
  font-size: 18pt;
  color: #000;
  text-transform: uppercase;
  font-weight: bold;
  text-decoration: underline;
  text-decoration-color: #0033A0;
  text-decoration-thickness: 2px;
  line-height: 1.2;
}

.tagline, .address {
  font-size: 9.5pt;
  margin: 0;
  padding: 0;
  line-height: 1.4;
}

.tagline {
  margin-bottom: 3px;
}

.address {
  margin-top: 3px;
}

.place-date {
  text-align: right;
  margin: 15px 0 18px 0;
  font-size: 11pt;
}

.title-section {
  text-align: center;
  margin: 18px 0;
}

.invoice-title {
  font-size: 12pt;
  font-weight: bold;
  margin: 0 0 5px 0;
}

.title-section p {
  margin: 3px 0;
  font-size: 10pt;
}

/* Items Table */
.items {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  margin-bottom: 20px;
  font-size: 10pt;
}

.items th, .items td {
  border: 1px solid #000;
  padding: 6px 8px;
  vertical-align: middle;
  line-height: 1.4;
}

.items th {
  background-color: #f0f0f0;
  font-weight: bold;
  text-align: center;
  font-size: 10pt;
  padding: 8px;
}

/* Column widths */
.no-col { width: 8%; }
.invoice-col { width: 20%; text-align: left; }
.customer-col { width: 30%; text-align: left; }
.type-col { width: 15%; text-align: center; }
.total-col { width: 20%; text-align: right; }

.items thead th {
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  padding: 8px;
  text-align: center;
  font-weight: bold;
  background: none;
}

.items tbody tr:first-child td {
  border-top: 2px solid #000;
}

.items tbody tr:last-child td {
  border-bottom: 2px solid #000;
}

.items tbody td {
  border: 1px solid #000;
  padding: 6px 8px;
  font-size: 10pt;
}

.items .center { text-align: center; }
.items .right { text-align: right; }

/* .badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 8.5pt;
  font-weight: bold;
  display: inline-block;
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
} */

.total-row td {
  font-weight: bold;
  background: #e8e8e8;
  border-top: 2px solid #000;
  padding: 8px;
  font-size: 11pt;
}

/* Notes Section */
.notes {
  margin-top: 25px;
  font-size: 10pt;
  line-height: 1.5;
  page-break-inside: avoid;
}

.notes ul {
  list-style-type: disc;
  margin-left: 20px;
  margin-top: 8px;
}

.notes li {
  margin: 4px 0;
}

/* Footer Signature */
.footer-section {
  margin-top: 35px;
  page-break-inside: avoid;
}

.signature-area {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.signature-box {
  width: 45%;
  text-align: center;
  font-size: 10pt;
}

.signature-box p {
  margin: 3px 0;
}

.signature-line {
  height: 50px;
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

/* Print Optimization */
@media print {
  body {
    margin: 0;
    padding: 0;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .btn {
    display: none !important;
  }

  .invoice-print {
    padding: 20px 35px !important;
    max-width: 100% !important;
    min-height: auto !important;
  }

  .header {
    display: flex !important;
    align-items: flex-start !important;
    gap: 15px !important;
    page-break-after: avoid !important;
    margin-bottom: 15px !important;
    padding-bottom: 8px !important;
  }
  
  .logo {
    width: 65px !important;
    height: 65px !important;
    flex-shrink: 0 !important;
  }
  
  .logo img {
    width: 65px !important;
    height: 65px !important;
  }

  .footer-section {
    page-break-inside: avoid !important;
    margin-top: 30px !important;
  }

  .notes {
    page-break-inside: avoid !important;
    margin-top: 20px !important;
  }

  .items {
    page-break-inside: auto !important;
  }

  .items tbody tr {
    page-break-inside: avoid !important;
  }

  .items td, .items th {
    padding: 6px 8px !important;
  }

  /* .badge {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  } */
}
</style>
