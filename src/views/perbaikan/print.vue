
<script setup>
import { ref, computed, onMounted } from "vue";
import Api from "@/services/api";
import Cookies from "js-cookie";
import html2pdf from "html2pdf.js";

const invoiceCode = ref("");
const loading = ref(true);

const invoiceDate = ref("");
const printDate = ref(new Date());
const customer = ref("-");
const terbilang = ref("-");

const subtotalPlusExtra = ref(0);
const total = ref(0);            
const dp = ref(0);
const sisa = ref(0);              
const pph = ref(0);               
const pph_nominal = ref(0);       

// satu baris item perbaikan
const itemName = ref("-");
const startDate = ref("");
const endDate = ref("");
const component = ref("-");
const description = ref("-");

// Bank accounts dari API
const bankAccounts = ref([]);
const printArea = ref(null);

// COMPUTED ==================================================================

// signature name - ambil account_holder pertama
const signatureName = computed(() => {
  if (bankAccounts.value.length > 0) {
    return bankAccounts.value[0]?.account_holder ?? "ISWOYO";
  }
  return "ISWOYO";
});

const uniqueAccountHolders = computed(() => {
  if (bankAccounts.value.length === 0) return [];
  const holders = bankAccounts.value.map((bank) => bank.account_holder);
  return [...new Set(holders)];
});

// konversi angka ke terbilang
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

const terbilangText = computed(() => {
  if (total.value > 0) {
    const words = numberToWords(total.value);
    return words.charAt(0).toUpperCase() + words.slice(1) + " rupiah";
  }
  return terbilang.value || "-";
});

const fetchBankAccounts = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get("/api/banks-all");
    bankAccounts.value = res.data?.data || [];
  } catch (err) {
    console.error("Gagal load bank accounts:", err.response || err);
    bankAccounts.value = [];
  }
};
const fetchRepairInvoice = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get(`/api/repairs/invoice/${invoiceCode.value}`);
    const data = res.data.data;

    invoiceDate.value = data.created_at || data.start_date;
    customer.value = data.customer?.name_perusahaan ?? "-";

    const repairCost = Number(data.repair_cost ?? 0);
    const extra = Number(data.extra ?? 0);
    const pphPercent = Number(data.pph ?? 0);
    const dpNum = Number(data.dp ?? 0);

    // 1. subtotal + extra
    const _subtotalPlusExtra = repairCost + extra;

    // 2. PPH nominal
    const _pphNominal = _subtotalPlusExtra * (pphPercent / 100);

    // 3. total setelah PPH (dikurangi PPH)
    const _total = Math.max(0, _subtotalPlusExtra - _pphNominal);

    subtotalPlusExtra.value = _subtotalPlusExtra;
    pph.value = pphPercent;
    pph_nominal.value = _pphNominal;
    total.value = _total;

    dp.value = dpNum;
    sisa.value = dp.value > 0 ? Math.max(0, total.value - dp.value) : 0;

    // item/barang perbaikan
    itemName.value = data.item_repair ?? "-";
    startDate.value = data.start_date;
    endDate.value = data.end_date;
    component.value = data.component ?? "-";
    description.value = data.description ?? "-";
  } catch (err) {
    console.error("Gagal load invoice perbaikan:", err);
  }
};

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  invoiceCode.value = params.get("invoice") || "";

  await Promise.all([fetchRepairInvoice(), fetchBankAccounts()]);
  loading.value = false;
});
const formatRupiah = (num) => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num ?? 0);
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
const downloadPdf = async () => {
  const element = printArea.value;
  await new Promise((resolve) => setTimeout(resolve, 300));

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Invoice-Perbaikan-${invoiceCode.value}.pdf`,
    image: {
      type: "jpeg",
      quality: 0.95,
    },
    html2canvas: {
      scale: 2.2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
      windowHeight: 1400,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector(".invoice-print");
        if (clonedElement) {
          clonedElement.style.maxWidth = "100%";
          clonedElement.style.padding = "20px 35px";
          clonedElement.style.fontSize = "10pt";
        }
      },
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"],
      avoid: [".signature-section", ".payment", ".header"],
    },
  };

  html2pdf().set(opt).from(element).save();
};
</script>


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
            service:Rewinding Elektro motor1 dan 3phase, ,Genset<br />
            <span class="underline">Generator Jual-Beli dan Sewa Genset</span>
          </div>
          <div class="address">
            Alamat:<span class="underline"
              >JL.Cendanall Gg.H.JANUR Jatimulyo-Lampung Selatan
              Tlp.0853-8312-0656</span
            >
          </div>
        </div>
      </div>

      <!-- Tempat & Tanggal -->
      <div class="place-date">
        Bandar Lampung, {{ formatDate(invoiceDate || printDate) }}
      </div>

      <!-- Judul Invoice -->
      <div class="title-section">
        <p class="invoice-title"><u>Invoice Perbaikan</u></p>
        <p>Tanggal Cetak Tagihan: {{ formatDate(printDate) }}</p>
        <p>No Invoice: {{ invoiceCode }}</p>
      </div>

      <!-- Kepada Yth -->
      <div class="customer">
        <p>Kepada Yth.</p>
        <p class="name">{{ customer }}</p>
      </div>

      <!-- Tabel (sesuai penjualan, tapi 1 item perbaikan) -->
    <table class="items">
  <thead>
    <tr>
      <th class="no-col">No</th>
      <th class="item-col">Nama barang</th>
      <th class="bill-col">Total Tagihan</th>
      <th class="unit-price-col">PPH {{ pph }}%</th>
      <th class="amount-col">Jumlah</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="center">1</td>
      <td class="center">
        {{ itemName }}
      </td>
      <td class="center">Rp {{ formatRupiah(subtotalPlusExtra) }}</td>
      <td class="center">Rp {{ formatRupiah(pph_nominal) }}</td>
      <!-- JUMALH RATA KANAN, SEJAJAR DENGAN KOLOM TOTAL/PPH -->
      <td class="right">Rp {{ formatRupiah(total) }}</td>
    </tr>

    <!-- Terbilang / DP / SISA / TOTAL -->
    <tr class="sub-total-row">
      <!-- Kolom terbilang tetap ambil 3 kolom awal -->
      <td colspan="3" class="terbilang-cell">
        <b>Terbilang: {{ terbilangText }}</b>
      </td>
      <!-- Kolom label & nilai DP sejajar dengan kolom PPH & Jumlah -->
      <td class="center">DP</td>
      <td class="right">{{ formatRupiah(dp) }}</td>
    </tr>

    <tr class="sub-total-row">
      <td colspan="3" class="empty-cell"></td>
      <td class="center">SISA</td>
      <td class="right">{{ formatRupiah(sisa) }}</td>
    </tr>

    <tr class="total-row">
      <td colspan="3" class="empty-cell"></td>
      <td class="center">TOTAL</td>
      <!-- TOTAL juga rata kanan dan bold -->
      <td class="right total-amount">
        Rp {{ formatRupiah(total) }}
      </td>
    </tr>
  </tbody>
</table>


      <!-- Informasi Pembayaran -->
      <div class="payment">
        <p>
          <strong>Pembayaran</strong><br />
          Mohon ditransfer ke
        </p>

        <!-- Nomor Rekening -->
        <div class="account-details">
          <div class="rek-label">Nomor Rekening</div>
          <div class="rek-content">
            <template v-if="bankAccounts.length > 0">
              <template
                v-for="(bank, index) in bankAccounts"
                :key="bank.id"
              >
                : - {{ bank.bank_name }}<br />
                ({{ bank.account_number }})<br
                  v-if="index < bankAccounts.length - 1"
                />
              </template>
            </template>
            <template v-else>
              : - Bank BRI<br />
              (2092-0101-1376-504)<br />
              : - Bank MANDIRI<br />
              (114-00-2493557-2)
            </template>
          </div>
        </div>

        <!-- Atas Nama -->
        <div class="atas-nama">
          <div class="an-label">Atas Nama</div>
          <div class="an-content">
            <template v-if="uniqueAccountHolders.length > 0">
              <template
                v-for="(holder, index) in uniqueAccountHolders"
                :key="'holder-' + index"
              >
                : {{ holder }}<br
                  v-if="index < uniqueAccountHolders.length - 1"
                />
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
        <div class="signature-text">
          Bandar Lampung, {{ formatDate(printDate) }}
        </div>
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
