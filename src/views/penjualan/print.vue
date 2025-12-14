<template>
  <div>
    <!-- Tombol Preview dan Download -->
    <div style="margin-bottom: 20px; text-align:right;">
      <button @click="downloadPdf" class="btn btn-primary" :disabled="loading">
        <span v-if="loading">Loading...</span>
        <span v-else>Download PDF</span>
      </button>
    </div>

    <!-- AREA INVOICE UNTUK DIEXPORT PDF -->
    <div class="invoice-print" ref="printArea" v-if="!loading">
      <!-- Header Perusahaan -->
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

      <!-- Tempat & Tanggal -->
      <div class="place-date">
        Bandar Lampung, {{ formatDate(invoiceDate) }}
      </div>

      <!-- Judul Invoice -->
      <div class="title-section">
        <p class="invoice-title"><u>Invoice</u></p>
        <p>Tanggal Cetak Tagihan: {{ formatDate(printDate) }}</p>
      </div>

      <!-- Kepada Yth -->
      <div class="customer">
        <p>Kepada Yth.</p>
        <p class="name">{{ customer }}</p>
      </div>

      <!-- Tabel -->
      <table class="items">
        <thead>
          <tr>
            <th class="no-col">No</th>
            <th class="item-col">Nama barang</th>
            <th class="qty-col">QTY</th>
            <th class="bill-col">Total Tagihan</th>
            <th class="unit-price-col">pph {{ pph }}%</th>
            <th class="amount-col">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="i">
            <td class="center">{{ i + 1 }}</td>
            <td>{{ item.name }}</td>
            <td class="center">{{ item.qty }}</td>
            <td class="right">{{ formatRupiah(subtotalPlusExtra) }}</td>
            <td class="center">{{ formatRupiah(pph_nominal) }}</td>
            <td class="right">{{ formatRupiah(total) }}</td>
          </tr>

          <!-- Sub-total/Terbilang/DP/SISA/TOTAL -->
          <tr class="sub-total-row">
            <td colspan="4" class="terbilang-cell">
              Terbilang: {{ terbilangText }}
            </td>
            <td class="right">DP</td>
            <td class="right">{{ formatRupiah(dp) }}</td>
          </tr>

          <tr class="sub-total-row">
            <td colspan="4" class="empty-cell"></td>
            <td class="right">SISA</td>
            <td class="right">{{ formatRupiah(sisa) }}</td>
          </tr>

          <tr class="total-row">
            <td colspan="4" class="empty-cell"></td>
            <td class="right">TOTAL</td>
            <td class="right total-amount">Rp {{ formatRupiah(total) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Informasi Pembayaran -->
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
              : -  {{ bank.bank_name }}<br>
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
      
      <!-- Atas Nama - UNIQUE ONLY -->
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
        <div class="signature-text">Bandar Lampung, {{ formatDate(printDate) }}</div>
        <div class="signature-text">Sinar Elektro Sejahtera</div>
        <div class="signature-space"></div>
        <div class="signature-name">{{ signatureName }}</div>
        <div class="signature-title">Pelaksana</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="text-center py-20">
      <p>Memuat data invoice...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Api from "@/services/api";
import Cookies from "js-cookie";
import html2pdf from "html2pdf.js";

// DATA ======================================================================
const invoiceCode = ref("");
const loading = ref(true);

const invoiceDate = ref("");
const printDate = ref(new Date());
const customer = ref("-");
const terbilang = ref("-");

const total = ref(0);
const dp = ref(0);
const sisa = ref(0);
const subtotalPlusExtra = ref(0);
const pph = ref(0);
const pph_nominal = ref(0);

const items = ref([]);

// Bank accounts dari API
const bankAccounts = ref([]);

const printArea = ref(null);

// COMPUTED ==================================================================
// Untuk signature name - ambil account_holder pertama
const signatureName = computed(() => {
  if (bankAccounts.value.length > 0) {
    return bankAccounts.value[0]?.account_holder ?? "ISWOYO";
  }
  return "ISWOYO";
});

// KONVERSI ANGKA KE TERBILANG ===============================================
const numberToWords = (num) => {
  if (num === 0) return "nol";

  const units = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
  const teens = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", 
                 "enam belas", "tujuh belas", "delapan belas", "sembilan belas"];

  const convertHundreds = (n) => {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const remainder = n % 10;
      return (tens === 1 ? "se" : units[tens]) + " puluh" + (remainder > 0 ? " " + units[remainder] : "");
    }
    if (n < 200) {
      const remainder = n % 100;
      return "seratus" + (remainder > 0 ? " " + convertHundreds(remainder) : "");
    }
    if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      return units[hundreds] + " ratus" + (remainder > 0 ? " " + convertHundreds(remainder) : "");
    }
    return "";
  };

  const convertThousands = (n) => {
    if (n < 1000) return convertHundreds(n);
    if (n < 2000) {
      const remainder = n % 1000;
      return "seribu" + (remainder > 0 ? " " + convertHundreds(remainder) : "");
    }
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      return convertHundreds(thousands) + " ribu" + (remainder > 0 ? " " + convertHundreds(remainder) : "");
    }
    return "";
  };

  const convertMillions = (n) => {
    if (n < 1000000) return convertThousands(n);
    if (n < 1000000000) {
      const millions = Math.floor(n / 1000000);
      const remainder = n % 1000000;
      return convertThousands(millions) + " juta" + (remainder > 0 ? " " + convertThousands(remainder) : "");
    }
    if (n < 1000000000000) {
      const billions = Math.floor(n / 1000000000);
      const remainder = n % 1000000000;
      return convertThousands(billions) + " miliar" + (remainder > 0 ? " " + convertMillions(remainder) : "");
    }
    return "";
  };

  return convertMillions(num);
};

// COMPUTED TERBILANG ========================================================
const terbilangText = computed(() => {
  if (total.value > 0) {
    const words = numberToWords(total.value);
    return words.charAt(0).toUpperCase() + words.slice(1) + " rupiah";
  }
  return terbilang.value || "-";
});

// FETCH BANK DATA ===========================================================
const fetchBankAccounts = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get("/api/banks-all");
    
    console.log("Bank API Response:", res.data);
    
    if (res.data && res.data.data) {
      bankAccounts.value = res.data.data;
      console.log("Bank Accounts:", bankAccounts.value);
    } else {
      console.warn("Bank data kosong");
      bankAccounts.value = [];
    }
  } catch (err) {
    console.error("Gagal load bank accounts:", err.response || err);
    bankAccounts.value = [];
  }
};

// FETCH INVOICE DATA ========================================================
const fetchInvoice = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

   // ✅ PERBAIKAN: Gunakan endpoint yang benar
    const res = await Api.get(`/api/transactions/invoice/${invoiceCode.value}`);
    const data = res.data.data;

    invoiceDate.value = data.created_at;
    customer.value = data.customer?.name_perusahaan ?? "-";
    terbilang.value = data.terbilang ?? "-";

    subtotalPlusExtra.value = Number(data.subtotalPlusExtra) || 0;
    pph_nominal.value = Number(data.pph_nominal ?? data.pphNominal) || 0;
    pph.value = Number(data.pph ?? data.pph) || 0;

    total.value = Number(data.grand_total) || 0;
    dp.value = Number(data.dp) || 0;

    sisa.value = dp.value > 0 ? Math.max(0, total.value - dp.value) : 0;

    items.value = data.transaction_details.map(t => ({
      name: t.product?.title ?? "-",
      qty: t.qty || 1,
      amount: t.price
    }));
  } catch (err) {
    console.error("Gagal load invoice:", err);
  }
};

// MOUNTED ===================================================================
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  invoiceCode.value = params.get("invoice");
  
  await Promise.all([
    fetchInvoice(),
    fetchBankAccounts()
  ]);
  
  console.log("Final Bank Accounts:", bankAccounts.value);
  console.log("Signature Name:", signatureName.value);
  console.log("Terbilang:", terbilangText.value);
  
  loading.value = false;
});

const uniqueAccountHolders = computed(() => {
  if (bankAccounts.value.length === 0) {
    return [];
  }
  const holders = bankAccounts.value.map(bank => bank.account_holder);
  
  const unique = [...new Set(holders)];
  
  return unique;
});

const formatRupiah = (num) => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

// DOWNLOAD PDF ==============================================================
const downloadPdf = async () => {
  const element = printArea.value;

  await new Promise(resolve => setTimeout(resolve, 300));

  const opt = {
    margin: [10, 10, 10, 10], // Sama dengan rental
    filename: `Invoice-${invoiceCode.value}.pdf`,
    image: { 
      type: "jpeg", 
      quality: 0.95 // Turunkan dari 0.98
    },
    html2canvas: { 
      scale: 2.2, // Sama dengan rental
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      windowHeight: 1400, // Sama dengan rental
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.invoice-print');
        if (clonedElement) {
          clonedElement.style.maxWidth = '100%';
          clonedElement.style.padding = '20px 35px';
          clonedElement.style.fontSize = '10pt'; // Turunkan dari 12pt
        }
        
        const header = clonedDoc.querySelector('.header');
        if (header) {
          header.style.display = 'flex';
          header.style.alignItems = 'flex-start';
          header.style.gap = '15px';
          header.style.marginBottom = '12px'; // Compact
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

        // Compact spacing untuk semua section
        const sections = clonedDoc.querySelectorAll('.title-section, .customer, .payment');
        sections.forEach(section => {
          section.style.marginTop = '12px';
          section.style.marginBottom = '12px';
        });

        // Table compact
        const table = clonedDoc.querySelector('.items');
        if (table) {
          table.style.fontSize = '9.5pt';
          table.style.marginBottom = '15px';
        }

        // Signature compact
        const signature = clonedDoc.querySelector('.signature-section');
        if (signature) {
          signature.style.marginTop = '25px';
        }

        const signatureSpace = clonedDoc.querySelector('.signature-space');
        if (signatureSpace) {
          signatureSpace.style.height = '40px';
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

</script>

<style scoped>
.invoice-print {
  font-family: "Times New Roman", Times, serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 25px 40px; /* Sesuaikan dengan rental */
  background: #fff;
  color: #000;
  font-size: 10pt; /* Turunkan dari 12pt */
  line-height: 1.4; /* Turunkan dari 1.5 */
  box-sizing: border-box;
  min-height: 1000px;
}

.underline {
  text-decoration: underline;
}

/* Header dengan spacing optimal */
.header {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 12px; /* Turunkan dari 15px */
  padding-bottom: 8px;
  border-bottom: 4px solid #0033A0;
  position: relative;
  page-break-after: avoid;
}

.logo {
  width: 65px; /* Turunkan dari 70px */
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
  width: 65px; /* Turunkan dari 70px */
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
  margin: 0 0 4px 0;
  padding: 0;
  font-size: 18pt; /* Turunkan dari 20pt */
  color: #000;
  text-transform: uppercase;
  font-weight: bold;
  text-decoration: underline;
  text-decoration-color: #0033A0;
  text-decoration-thickness: 2px;
  line-height: 1.2;
}

.tagline, .address {
  font-size: 9.5pt; /* Turunkan dari 10pt */
  margin: 0;
  padding: 0;
  line-height: 1.3;
}

.tagline {
  margin-bottom: 2px; /* Turunkan dari 3px */
}

.address {
  margin-top: 2px; /* Turunkan dari 3px */
}

.place-date {
  text-align: right;
  margin: 12px 0 15px 0; /* Turunkan dari 15px 0 20px 0 */
  font-size: 10pt; /* Turunkan dari 12pt */
}

.title-section {
  margin: 15px 0; /* Turunkan dari 20px */
}

.invoice-title {
  font-weight: bold;
  font-size: 11pt; /* Turunkan dari 12pt */
  margin-bottom: 4px; /* Turunkan dari 5px */
}

.title-section p {
  margin: 2px 0; /* Turunkan dari 4px */
  font-size: 9.5pt; /* Tambahkan sizing */
}

.customer {
  margin-bottom: 18px; /* Turunkan dari 25px */
}

.customer p {
  margin: 3px 0; /* Turunkan dari 4px */
  font-size: 10pt; /* Turunkan dari 12pt */
}

.customer .name {
  font-weight: bold;
  font-size: 10pt; /* Turunkan dari 12pt */
}

/* Items Table - Compact */
.items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px; /* Turunkan dari 30px */
  font-size: 9.5pt; /* Turunkan dari 12pt */
}

.items th, .items td {
  border: 1px solid #000;
  padding: 5px 6px; /* Turunkan dari 5px 8px */
  vertical-align: middle; /* Ubah dari top */
  line-height: 1.3; /* Tambahkan */
}

.items th {
  background-color: #f0f0f0;
  font-weight: bold;
  text-align: center;
  font-size: 9.5pt; /* Turunkan dari 12pt */
  padding: 6px; /* Turunkan dari 8px 10px */
}

/* Column widths - Sesuaikan dengan konten penjualan */
.no-col { width: 5%; }
.item-col { width: 38%; text-align: left; } /* Turunkan dari 40% */
.qty-col { width: 8%; text-align: center; }
.bill-col { width: 16%; text-align: right; } /* Turunkan dari 17% */
.unit-price-col { width: 15%; text-align: center; }
.amount-col { width: 18%; text-align: right; } /* Naikkan dari 15% */

.items thead th {
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  padding: 6px; /* Turunkan dari 8px 10px */
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
  padding: 5px 6px; /* Turunkan */
  font-size: 9.5pt; /* Turunkan dari 12pt */
}

.items .center { text-align: center; }
.items .right { text-align: right; }

/* Sub-total rows - Compact */
.sub-total-row td {
  border-top: none;
  border-bottom: none;
  padding: 4px 6px !important; /* Turunkan */
}

.terbilang-cell {
  font-style: italic;
  font-weight: bold;
  border-right: none !important;
  font-size: 9pt; /* Tambahkan */
}

.empty-cell {
  border-right: none !important;
  border-left: 1px solid #000;
}

.total-row td {
  font-weight: bold;
  border-top: 1px solid #000;
  padding: 5px 6px; /* Turunkan */
}

.total-amount {
  font-weight: bold;
}

/* Payment Section - Compact */
.payment {
  margin-top: 20px; /* Turunkan dari 25px */
  line-height: 1.4; /* Turunkan dari 1.5 */
  font-size: 9.5pt; /* Turunkan dari 12pt */
  page-break-inside: avoid;
}

.payment p { 
  margin: 4px 0; /* Turunkan dari 5px */
  font-size: 9.5pt; /* Turunkan */
  line-height: 1.4;
}

.payment strong {
  font-size: 10pt; /* Turunkan dari 11pt */
}

.account-details, .atas-nama {
  display: flex;
  margin-left: 10px; /* Turunkan dari 12px */
  font-size: 9.5pt; /* Turunkan dari 10pt */
  line-height: 1.4; /* Turunkan */
  margin-top: 5px; /* Turunkan dari 6px */
}

.rek-label, .an-label {
  width: 130px; /* Sama seperti rental */
  flex-shrink: 0;
}

.rek-content, .an-content {
  flex-grow: 1;
  line-height: 1.4;
}

.atas-nama {
  margin-top: 6px; /* Turunkan dari 10px */
}

/* Signature Section - Compact & Pushed Right */
.signature-section {
  margin-top: 28px; /* Turunkan dari 50px */
  margin-left: auto;
  margin-right: 0;
  width: 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 9.5pt; /* Turunkan dari 11pt */
  page-break-inside: avoid;
}

.signature-text {
  margin: 2px 0;
  text-align: center;
  font-size: 9.5pt; /* Turunkan dari 11pt */
  line-height: 1.3;
}

.signature-space {
  height: 45px; /* Turunkan dari 60px */
  width: 100%;
}

.signature-name {
  margin-top: 4px; /* Turunkan dari 5px */
  font-weight: bold;
  text-decoration: underline;
  text-align: center;
  font-size: 9.5pt; /* Turunkan dari 11pt */
}

.signature-title {
  margin-top: 2px;
  font-size: 9pt; /* Turunkan dari 10pt */
  text-align: center;
}

.text-center {
  text-align: center;
}

.py-20 {
  padding: 80px 0;
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
    margin-bottom: 12px !important;
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
    margin-top: 25px !important;
  }

  .payment {
    page-break-inside: avoid !important;
    margin-top: 18px !important;
  }

  .items {
    page-break-inside: auto !important;
  }

  .items tbody tr {
    page-break-inside: avoid !important;
  }

  /* Pastikan spacing tetap compact di PDF */
  .items td, .items th {
    padding: 5px 6px !important;
  }

  .sub-total-row td {
    padding: 4px 6px !important;
  }
}
</style>

