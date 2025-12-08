<script setup>
import { ref, onMounted, computed } from "vue"
import Api from "@/services/api"
import Cookies from "js-cookie"
import html2pdf from "html2pdf.js"

// STATE
const invoiceCode = ref("")
const customer = ref("-")
const startDate = ref("")
const endDate = ref("")
const component = ref("-")
const item_repair = ref("-")
const description = ref("-")
const dp = ref(0)
const status = ref("")
const repairCost = ref(0)
const printDate = ref(new Date())

// Bank accounts dari API
const bankAccounts = ref([])

const printArea = ref(null)

// COMPUTED ==================================================================
// Untuk signature name - ambil account_holder pertama
const signatureName = computed(() => {
  if (bankAccounts.value.length > 0) {
    return bankAccounts.value[0]?.account_holder ?? "ISWOYO";
  }
  return "ISWOYO";
});

// Untuk mendapatkan unique account holders (hapus duplikat)
const uniqueAccountHolders = computed(() => {
  if (bankAccounts.value.length === 0) {
    return [];
  }
  
  const holders = bankAccounts.value.map(bank => bank.account_holder);
  const unique = [...new Set(holders)];
  
  return unique;
});

// FORMAT
const formatRupiah = (num) =>
  new Intl.NumberFormat("id-ID").format(num ?? 0)

const formatDate = (date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

const formatPrintDate = (date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

// FETCH BANK DATA ===========================================================
const fetchBankAccounts = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get("/api/banks-all");
    
    if (res.data && res.data.data) {
      bankAccounts.value = res.data.data;
    } else {
      bankAccounts.value = [];
    }
  } catch (err) {
    console.error("Gagal load bank accounts:", err.response || err);
    bankAccounts.value = [];
  }
};

// FETCH DATA PERBAIKAN
const fetchRepair = async () => {
  try {
    const token = Cookies.get("token")
    Api.defaults.headers.common["Authorization"] = token

    const res = await Api.get(`/api/repairs/invoice/${invoiceCode.value}`)
    const data = res.data.data

    customer.value = data.customer?.name_perusahaan ?? "-"
    startDate.value = data.start_date
    endDate.value = data.end_date
    component.value = data.component ?? "-"
    item_repair.value = data.item_repair ?? "-"
    description.value = data.description ?? "-"
    dp.value = Number(data.dp ?? 0)
    status.value = data.status
    repairCost.value = Number(data.repair_cost ?? 0)

  } catch (err) {
    console.error("Gagal memuat perbaikan:", err)
  }
}

// HITUNG SISA
const sisa = computed(() => {
  const total = Number(repairCost.value ?? 0)
  const down = Number(dp.value ?? 0)

  if (down === 0) return 0

  const result = total - down
  return result > 0 ? result : 0
})

// DOWNLOAD PDF - SAMA SEPERTI RENTAL
const downloadPdf = async () => {
  const element = printArea.value;

  await new Promise(resolve => setTimeout(resolve, 300));

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Perbaikan-${invoiceCode.value}.pdf`,
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

        const sections = clonedDoc.querySelectorAll('.title-section, .customer, .payment');
        sections.forEach(section => {
          section.style.marginTop = '15px';
          section.style.marginBottom = '15px';
        });

        const table = clonedDoc.querySelector('.items');
        if (table) {
          table.style.fontSize = '10pt';
          table.style.marginBottom = '18px';
        }

        const signature = clonedDoc.querySelector('.signature-section');
        if (signature) {
          signature.style.marginTop = '30px';
        }

        const signatureSpace = clonedDoc.querySelector('.signature-space');
        if (signatureSpace) {
          signatureSpace.style.height = '45px';
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
      avoid: ['.signature-section', '.payment', '.header']
    }
  };

  html2pdf().set(opt).from(element).save();
};

// ON MOUNTED
onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  invoiceCode.value = params.get("invoice")
  
  await Promise.all([
    fetchRepair(),
    fetchBankAccounts()
  ]);
});
</script>

<template>
  <div>
    <!-- Tombol Download PDF -->
    <div style="margin-bottom: 20px; text-align:right;">
      <button @click="downloadPdf" class="btn btn-primary">
        Download PDF
      </button>
    </div>

    <!-- AREA PRINT -->
    <div class="invoice-print" ref="printArea">

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
        <p class="invoice-title"><u>Invoice Perbaikan</u></p>
        <p>Tanggal Cetak: {{ formatPrintDate(printDate) }}</p>
        <p>No Invoice: {{ invoiceCode }}</p>
      </div>

      <!-- KEPADA -->
      <div class="customer">
        <p>Kepada Yth.</p>
        <p class="name">{{ customer }}</p>
      </div>

      <!-- TABEL PERBAIKAN -->
      <table class="items">
        <thead>
          <tr>
            <th class="no-col">No</th>
            <th class="item-col">Nama Barang</th>
            <th class="date-col">Estimasi Tanggal</th>
            <th class="component-col">Komponen</th>
            <th class="price-col">Biaya</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td class="center">1</td>
            <td>{{ item_repair }}</td>
            <td class="center">
              {{ formatDate(startDate) }} - {{ formatDate(endDate) }}
            </td>
            <td class="center">{{ component }}</td>
            <td class="right">Rp {{ formatRupiah(repairCost) }}</td>
          </tr>

          <tr class="sub-total-row">
            <td colspan="3" class="empty-cell"></td>
            <td class="right">DP</td>
            <td class="right">{{ formatRupiah(dp) }}</td>
          </tr>

          <tr class="sub-total-row">
            <td colspan="3" class="empty-cell"></td>
            <td class="right">SISA</td>
            <td class="right">{{ formatRupiah(sisa) }}</td>
          </tr>

          <tr class="total-row">
            <td colspan="3" class="empty-cell"></td>
            <td class="right">TOTAL</td>
            <td class="right total-amount">Rp {{ formatRupiah(repairCost) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- DESKRIPSI -->
      <div class="payment">
        <p><strong>Deskripsi Perbaikan</strong></p>
        <p style="margin-top:8px;">
          {{ description }}
        </p>
      </div>

      <!-- PEMBAYARAN dengan Bank Dinamis -->
      <div class="payment">
        <p>
          <strong>Pembayaran</strong><br>
          Mohon ditransfer ke
        </p>

        <!-- Nomor Rekening -->
        <div class="account-details">
          <div class="rek-label">Nomor Rekening</div>
          <div class="rek-content">
            <template v-if="bankAccounts.length > 0">
              <template v-for="(bank, index) in bankAccounts" :key="bank.id">
                : - Bank {{ bank.bank_name }}<br>
                ({{ bank.account_number }})<br v-if="index < bankAccounts.length - 1">
              </template>
            </template>
            <template v-else>
              : - Bank BRI<br>
              (2092-0101-1376-504)<br>
              : - Bank MANDIRI<br>
              (114-00-2493557-2)
            </template>
          </div>
        </div>

        <!-- Atas Nama - DINAMIS -->
        <div class="atas-nama">
          <div class="an-label">Atas Nama</div>
          <div class="an-content">
            <template v-if="uniqueAccountHolders.length > 0">
              <template v-for="(holder, index) in uniqueAccountHolders" :key="'holder-' + index">
                : {{ holder }}<br v-if="index < uniqueAccountHolders.length - 1">
              </template>
            </template>
            <template v-else>
              : ISWOYO
            </template>
          </div>
        </div>
      </div>

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-text">Bandar Lampung, {{ formatPrintDate(printDate) }}</div>
        <div class="signature-text">Sinar Elektro Sejahtera</div>
        <div class="signature-space"></div>
        <div class="signature-name">{{ signatureName }}</div>
        <div class="signature-title">Pelaksana</div>
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
  margin: 18px 0;
}

.invoice-title {
  font-weight: bold;
  font-size: 12pt;
  margin-bottom: 5px;
}

.title-section p {
  margin: 3px 0;
  font-size: 10pt;
}

.customer {
  margin-bottom: 18px;
}

.customer p {
  margin: 4px 0;
  font-size: 11pt;
}

.customer .name {
  font-weight: bold;
  font-size: 11pt;
}

/* Items Table dengan spacing yang lebih besar */
.items {
  width: 100%;
  border-collapse: collapse;
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

/* Column widths untuk table perbaikan */
.no-col { width: 8%; }
.item-col { width: 25%; text-align: left; }
.date-col { width: 30%; text-align: center; }
.component-col { width: 20%; text-align: center; }
.price-col { width: 17%; text-align: right; }

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

/* Sub-total rows dengan spacing yang cukup */
.sub-total-row td {
  border-top: none;
  border-bottom: none;
  padding: 5px 8px !important;
}

.empty-cell {
  border-right: none !important;
  border-left: 1px solid #000;
}

.total-row td {
  font-weight: bold;
  border-top: 1px solid #000;
  padding: 6px 8px;
}

.total-amount {
  font-weight: bold;
}

/* Payment Section dengan spacing lebih besar */
.payment {
  margin-top: 25px;
  line-height: 1.5;
  font-size: 10pt;
  page-break-inside: avoid;
}

.payment p { 
  margin: 5px 0;
  font-size: 10pt;
  line-height: 1.5;
}

.payment strong {
  font-size: 11pt;
}

.account-details, .atas-nama {
  display: flex;
  margin-left: 12px;
  font-size: 10pt;
  line-height: 1.5;
  margin-top: 6px;
}

.rek-label, .an-label {
  width: 130px;
  flex-shrink: 0;
}

.rek-content, .an-content {
  flex-grow: 1;
  line-height: 1.5;
}

.atas-nama {
  margin-top: 8px;
}

/* Signature Section dengan spacing lebih besar */
.signature-section {
  margin-top: 35px;
  margin-left: auto;
  margin-right: 0;
  width: 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 10pt;
  page-break-inside: avoid;
}

.signature-text {
  margin: 3px 0;
  text-align: center;
  font-size: 10pt;
  line-height: 1.4;
}

.signature-space {
  height: 50px;
  width: 100%;
}

.signature-name {
  margin-top: 5px;
  font-weight: bold;
  text-decoration: underline;
  text-align: center;
  font-size: 10pt;
}

.signature-title {
  margin-top: 3px;
  font-size: 9pt;
  text-align: center;
}

/* Print Optimization */
@media print {
  body {
    margin: 0;
    padding: 0;
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

  .signature-section {
    page-break-inside: avoid !important;
    margin-top: 30px !important;
  }

  .payment {
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

  .sub-total-row td {
    padding: 5px 8px !important;
  }
}
</style>
