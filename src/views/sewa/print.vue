<script setup>
import { ref, onMounted, computed } from "vue";
import Api from "@/services/api";
import Cookies from "js-cookie";
import html2pdf from "html2pdf.js";

// State
const invoiceCode = ref("");
const customer = ref("-");
const startDate = ref("");
const endDate = ref("");
const dp = ref(0);
const status = ref("");
const printDate = ref(new Date());
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

// Untuk mendapatkan unique account holders (hapus duplikat)
const uniqueAccountHolders = computed(() => {
  if (bankAccounts.value.length === 0) {
    return [];
  }
  
  const holders = bankAccounts.value.map(bank => bank.account_holder);
  const unique = [...new Set(holders)];
  
  return unique;
});

// === LOGIKA TERBILANG (BARU) ===
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

// Computed Text Terbilang
const terbilangText = computed(() => {
  const total = Number(total_rent_price.value ?? 0);
  if (total > 0) {
    const words = numberToWords(total);
    // Huruf kapital di awal + rupiah
    return words.charAt(0).toUpperCase() + words.slice(1) + " rupiah";
  }
  return "-";
});
// ===============================

// Format Functions
const formatRupiah = (num) =>
  new Intl.NumberFormat("id-ID").format(num);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatPrintDate = (date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const getMonths = (start, end) => {
  if (!start || !end) return 1;

  const s = new Date(start);
  const e = new Date(end);

  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());

  if (e.getDate() > s.getDate()) {
    months += 1;
  }

  return months < 1 ? 1 : months;
};

// FETCH BANK DATA 
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

// Fetch Data
const fetchRental = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get(`/api/rentals/invoice/${invoiceCode.value}`);
    const data = res.data.data;

    customer.value = data.customer?.name_perusahaan ?? "-";
    startDate.value = data.start_date;
    endDate.value = data.end_date;
    dp.value = Number(data.dp);
    status.value = data.status;

    items.value = data.details.map((d) => {
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);

      let months = 0;

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        
        if (end.getDate() > start.getDate()) {
          months += 1;
        }
      }

      if (months < 1) months = 1;

      const total = months * Number(d.rent_price ?? 0) * Number(d.qty ?? 0);

      return {
        name: d.product?.title ?? "-",
        qty: Number(d.qty ?? 0),
        price: Number(d.rent_price ?? 0),
        total,
        start_date: d.start_date,
        end_date: d.end_date,
      };
    });

  } catch (err) {
    console.error("Gagal memuat rental:", err);
  }
};

const total_rent_price = computed(() => {
  return items.value.reduce(
    (sum, item) => sum + Number(item.total ?? 0),
    0
  );
});

const sisa = computed(() => {
  const total = Number(total_rent_price.value ?? 0);
  const down = Number(dp.value ?? 0);

  if (down === 0) return 0;

  const result = total - down;

  return result > 0 ? result : 0;
});

// Download PDF dengan html2pdf yang sudah diperbaiki
const downloadPdf = async () => {
  const element = printArea.value;

  await new Promise(resolve => setTimeout(resolve, 300));

  const opt = {
    margin: [10, 10, 10, 10], // Naikkan margin
    filename: `Rental-${invoiceCode.value}.pdf`,
    image: { 
      type: "jpeg", 
      quality: 0.95
    },
    html2canvas: { 
      scale: 2.2, // Naikkan sedikit dari 2
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      windowHeight: 1400, // Naikkan dari 1200
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.invoice-print');
        if (clonedElement) {
          clonedElement.style.maxWidth = '100%';
          clonedElement.style.padding = '20px 35px';
          clonedElement.style.fontSize = '10pt'; // Naikkan
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

        // Tambah spacing untuk semua section
        const sections = clonedDoc.querySelectorAll('.title-section, .customer, .payment');
        sections.forEach(section => {
          section.style.marginTop = '15px';
          section.style.marginBottom = '15px';
        });

        // Ukuran table lebih besar
        const table = clonedDoc.querySelector('.items');
        if (table) {
          table.style.fontSize = '10pt';
          table.style.marginBottom = '18px';
        }

        // Signature dengan spacing lebih besar
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



// On Mounted
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  invoiceCode.value = params.get("invoice");
  
  await Promise.all([
    fetchRental(),
    fetchBankAccounts()
  ]);
});
</script>

<template>
  <div>
    <div style="margin-bottom: 20px; text-align:right;">
      <button @click="downloadPdf" class="btn btn-primary">Download PDF</button>
    </div>

    <div class="invoice-print" ref="printArea">

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

      <div class="place-date">
        Bandar Lampung, {{ formatPrintDate(printDate) }}
      </div>

      <div class="title-section">
        <p class="invoice-title"><u>Invoice Sewa</u></p>
        <p>Tanggal Cetak: {{ formatPrintDate(printDate) }}</p>
        <p>No Invoice: {{ invoiceCode }}</p>
      </div>

      <div class="customer">
        <p>Kepada Yth.</p>
        <p class="name">{{ customer }}</p>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th class="no-col">No</th>
            <th class="item-col">Nama Barang</th>
            <th class="qty-col">Qty</th>
            <th class="date-col">Tanggal Sewa</th>
            <th class="duration-col">Durasi Sewa</th>
            <th class="price-col">Harga Sewa</th>
            <th class="total-col">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="i">
            <td class="center">{{ i + 1 }}</td>
            <td>{{ item.name }}</td>
            <td class="center">{{ item.qty }}</td>
            <td class="center">
              {{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}
            </td>
            <td class="center">
              {{ getMonths(item.start_date, item.end_date) }} bulan
            </td>
            <td class="right">Rp {{ formatRupiah(item.price) }}</td>
            <td class="right">Rp {{ formatRupiah(item.total) }}</td>
          </tr>

          <tr class="sub-total-row">
            <td colspan="5" class="terbilang-cell" style="text-align: left; vertical-align: top;">
              <b>Terbilang: {{ terbilangText }}</b>
            </td>
            <td class="right">DP</td>
            <td class="right">{{ formatRupiah(dp) }}</td>
          </tr>

          <tr class="sub-total-row">
            <td colspan="5" class="empty-cell"></td>
            <td class="right">SISA</td>
            <td class="right">{{ formatRupiah(sisa) }}</td>
          </tr>

          <tr class="total-row">
            <td colspan="5" class="empty-cell"></td>
            <td class="right">TOTAL</td>
            <td class="right total-amount">Rp {{ formatRupiah(total_rent_price) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="payment">
        <p>
          <strong>Pembayaran</strong><br>
          Mohon ditransfer ke
        </p>
        
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
  padding: 25px 40px; /* Tambah padding */
  background: #fff;
  color: #000;
  font-size: 11pt; /* Naikkan dari 10pt */
  line-height: 1.4; /* Naikkan dari 1.3 */
  box-sizing: border-box;
  min-height: 1000px; /* Tambahkan min-height agar memenuhi halaman */
}

.underline {
  text-decoration: underline;
}

/* Header dengan spacing yang cukup */
.header {
  display: flex;
  align-items: flex-start;
  gap: 15px; /* Tambah dari 12px */
  margin-bottom: 15px; /* Tambah spacing */
  padding-bottom: 8px; /* Tambah padding */
  border-bottom: 4px solid #0033A0; /* Kembalikan ke 4px */
  position: relative;
  page-break-after: avoid;
}

.logo {
  width: 65px; /* Naikkan dari 55px */
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
  margin: 0 0 5px 0; /* Tambah spacing */
  padding: 0;
  font-size: 18pt; /* Naikkan dari 16pt */
  color: #000;
  text-transform: uppercase;
  font-weight: bold;
  text-decoration: underline;
  text-decoration-color: #0033A0;
  text-decoration-thickness: 2px;
  line-height: 1.2;
}

.tagline, .address {
  font-size: 9.5pt; /* Naikkan dari 8.5pt */
  margin: 0;
  padding: 0;
  line-height: 1.4; /* Tambah line height */
}

.tagline {
  margin-bottom: 3px; /* Tambah spacing */
}

.address {
  margin-top: 3px;
}

.place-date {
  text-align: right;
  margin: 15px 0 18px 0; /* Tambah spacing */
  font-size: 11pt; /* Naikkan dari 10pt */
}

.title-section {
  margin: 18px 0; /* Tambah spacing */
}

.invoice-title {
  font-weight: bold;
  font-size: 12pt; /* Naikkan dari 11pt */
  margin-bottom: 5px; /* Tambah spacing */
}

.title-section p {
  margin: 3px 0; /* Tambah spacing */
  font-size: 10pt; /* Naikkan dari 9pt */
}

.customer {
  margin-bottom: 18px; /* Tambah spacing */
}

.customer p {
  margin: 4px 0; /* Tambah spacing */
  font-size: 11pt; /* Naikkan dari 10pt */
}

.customer .name {
  font-weight: bold;
  font-size: 11pt;
}

/* Items Table dengan spacing yang lebih besar */
.items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px; /* Tambah spacing */
  font-size: 10pt; /* Naikkan dari 9pt */
}

.items th, .items td {
  border: 1px solid #000;
  padding: 6px 8px; /* Tambah padding */
  vertical-align: middle;
  line-height: 1.4; /* Tambah line height */
}

.items th {
  background-color: #f0f0f0;
  font-weight: bold;
  text-align: center;
  font-size: 10pt; /* Naikkan dari 9pt */
  padding: 8px; /* Tambah padding */
}

/* Column widths */
.no-col { width: 5%; }
.item-col { width: 25%; text-align: left; }
.qty-col { width: 7%; text-align: center; }
.date-col { width: 20%; text-align: center; }
.duration-col { width: 10%; text-align: center; }
.price-col { width: 15%; text-align: right; }
.total-col { width: 18%; text-align: right; }

.items thead th {
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  padding: 8px; /* Tambah padding */
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
  padding: 6px 8px; /* Tambah padding */
  font-size: 10pt; /* Naikkan dari 9pt */
}

.items .center { text-align: center; }
.items .right { text-align: right; }

/* Sub-total rows dengan spacing yang cukup */
.sub-total-row td {
  border-top: none;
  border-bottom: none;
  padding: 5px 8px !important; /* Tambah padding */
}

.empty-cell {
  border-right: none !important;
  border-left: 1px solid #000;
}

/* Style Tambahan untuk Terbilang */
.terbilang-cell {
  border-right: none !important;
  border-left: 1px solid #000;
  font-style: italic; /* Agar miring seperti umumnya invoice */
}

.total-row td {
  font-weight: bold;
  border-top: 1px solid #000;
  padding: 6px 8px; /* Tambah padding */
}

.total-amount {
  font-weight: bold;
}

/* Payment Section dengan spacing lebih besar */
.payment {
  margin-top: 25px; /* Tambah spacing */
  line-height: 1.5; /* Tambah line height */
  font-size: 10pt; /* Naikkan dari 9pt */
  page-break-inside: avoid;
}

.payment p { 
  margin: 5px 0; /* Tambah spacing */
  font-size: 10pt; /* Naikkan dari 9pt */
  line-height: 1.5;
}

.payment strong {
  font-size: 11pt; /* Naikkan dari 10pt */
}

.account-details, .atas-nama {
  display: flex;
  margin-left: 12px; /* Tambah indent */
  font-size: 10pt; /* Naikkan dari 9pt */
  line-height: 1.5; /* Tambah line height */
  margin-top: 6px; /* Tambah spacing */
}

.rek-label, .an-label {
  width: 130px; /* Tambah dari 120px */
  flex-shrink: 0;
}

.rek-content, .an-content {
  flex-grow: 1;
  line-height: 1.5;
}

.atas-nama {
  margin-top: 8px; /* Tambah spacing */
}

/* Signature Section dengan spacing lebih besar */
.signature-section {
  margin-top: 35px; /* Tambah spacing besar */
  margin-left: auto;
  margin-right: 0;
  width: 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 10pt; /* Naikkan dari 9pt */
  page-break-inside: avoid;
}

.signature-text {
  margin: 3px 0; /* Tambah spacing */
  text-align: center;
  font-size: 10pt; /* Naikkan dari 9pt */
  line-height: 1.4;
}

.signature-space {
  height: 50px; /* Naikkan dari 40px */
  width: 100%;
}

.signature-name {
  margin-top: 5px; /* Tambah spacing */
  font-weight: bold;
  text-decoration: underline;
  text-align: center;
  font-size: 10pt; /* Naikkan dari 9pt */
}

.signature-title {
  margin-top: 3px; /* Tambah spacing */
  font-size: 9pt; /* Naikkan dari 8.5pt */
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

  /* Pastikan spacing tetap di PDF */
  .items td, .items th {
    padding: 6px 8px !important;
  }

  .sub-total-row td {
    padding: 5px 8px !important;
  }
}
</style>