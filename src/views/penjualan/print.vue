<template>
  <div>
    <!-- Tombol Preview dan Download -->
    <div style="margin-bottom: 20px; text-align:right;">
      <button @click="downloadPdf" class="btn btn-primary">
        Download PDF
      </button>
    </div>

    <!-- AREA INVOICE UNTUK DIEXPORT PDF -->
    <div class="invoice-print" ref="printArea">
      <!-- Header Perusahaan -->
      <div class="header">
        <div class="logo">SES</div>
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
            <th class="bill-col">Total Tagihan</th>
            <th class="unit-price-col">pph {{ pph }}%</th>
            <th class="amount-col">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="i">
            <td class="center">{{ i + 1 }}</td>
            <td>{{ item.name }}</td>
            <td class="right">{{ formatRupiah(subtotalPlusExtra) }}</td>
            <td class="center">{{ formatRupiah(pph_nominal) }}</td>
            <td class="right">{{ formatRupiah(total) }}</td>
          </tr>

          <!-- Sub-total/Terbilang/DP/SISA/TOTAL -->
          <tr class="sub-total-row">
            <td colspan="3" class="terbilang-cell">
              Terbilang: {{ terbilang }}
            </td>
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
        <div class="account-details">
          <div class="rek-label">Nomor Rekening</div>
          <div class="rek-content">
            : - Bank BRI<br>
            ({{ bankBriRek }})<br>
            : - Bank MANDIRI<br>
            ({{ bankMandiriRek }})
          </div>
        </div>
        <div class="atas-nama">
          <div class="an-label">Atas Nama</div>
          <div class="an-content">: {{ atasNama }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
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

const bankBriRek = ref("2092-0101-1376-504");
const bankMandiriRek = ref("114-00-2493557-2");
const atasNama = ref("ISWOYO");

const printArea = ref(null);

// FETCH DATA ================================================================
const fetchInvoice = async () => {
  try {
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    const res = await Api.get(`/api/transactions/by-invoice/${invoiceCode.value}`);
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
      amount: t.price
    }));
  } catch (err) {
    console.error("Gagal load invoice:", err);
  } finally {
    loading.value = false;
  }
};


// MOUNTED ===================================================================
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  invoiceCode.value = params.get("invoice");
  await fetchInvoice();
});

// FORMATTERS ================================================================
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

// DOWNLOAD PDF ===============================================================
const downloadPdf = () => {
  const element = printArea.value;

  const opt = {
    margin: 5,
    filename: `Invoice-${invoiceCode.value}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
};
</script>


<style scoped>
.invoice-print {
  font-family: "Times New Roman", Times, serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: #fff;
  color: #000;
  font-size: 12pt; /* Use pt for print-like accuracy */
  line-height: 1.5;
}

/* Helper classes */
.underline {
  text-decoration: underline;
}

/* Header */
.header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  padding-bottom: 5px; /* Reduced padding to bring line closer */
  border-bottom: 1px solid #0033A0; /* Thinner line */
  position: relative;
}
.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px; /* Thicker line */
  background-color: #0033A0;
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
  /* Octagon shape */
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
  border: 2px solid #0033A0; /* Border color to match image */
}
.company {
  flex-grow: 1;
}
.company h1 {
  margin: 0 0 2px 0;
  font-size: 20pt;
  color: #000; /* Black text */
  text-transform: uppercase;
  font-weight: bold;
  text-decoration: underline; /* Underline the company name */
  text-decoration-color: #0033A0; /* Blue underline */
}
.tagline, .address {
  font-size: 10pt;
  margin: 0;
  line-height: 1.2;
}
.tagline {
  margin-bottom: 2px;
}

/* Tempat & Tanggal */
.place-date {
  text-align: right;
  margin: 15px 0 20px 0;
  font-size: 12pt;
}

/* Judul Invoice */
.title-section {
  margin: 20px 0;
}
.invoice-title {
  font-weight: bold;
  font-size: 12pt;
  margin-bottom: 5px;
}
.title-section p {
  margin: 0;
}

/* Kepada Yth */
.customer {
  margin-bottom: 25px;
}
.customer p {
  margin: 4px 0;
}
.customer .name {
  font-weight: bold;
  font-size: 12pt;
}

/* Tabel */
.items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
  font-size: 12pt;
}
.items th, .items td {
  border: 1px solid #000;
  padding: 5px 8px;
  vertical-align: top;
}
.items th {
  background-color: #f0f0f0; /* Light gray background for header */
  font-weight: bold;
  text-align: center;
}
.items td {
  border-top: none;
  border-bottom: none;
}

/* Specific column widths and alignment */
.no-col { width: 5%; }
.item-col { width: 55%; text-align: left; }
.unit-price-col { width: 15%; text-align: center; }
.amount-col { width: 25%; text-align: center; }
.bill-col {
  width: 15%;
  text-align: right;
}


/* Table body styling to match image */
.items thead th {
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  padding: 8px 10px;
  text-align: center;
  font-weight: bold;
  background: none; /* Remove background */
}
.items tbody tr:first-child td {
  border-top: 2px solid #000;
}
.items tbody tr:last-child td {
  border-bottom: 2px solid #000;
}
.items tbody td {
  border: 1px solid #000;
  padding: 5px 8px;
}

.items .center { text-align: center; }
.items .right  { text-align: right; }

/* Sub-total/Terbilang/DP/SISA/TOTAL */
.sub-total-row td {
  border-top: none;
  border-bottom: none;
}
.terbilang-cell {
  font-style: italic;
  font-weight: bold;
  border-right: none !important;
}
.empty-cell {
  border-right: none !important;
}

.total-row td {
  font-weight: bold;
  border-top: 1px solid #000;
}
.total-amount {
  font-weight: bold;
}

/* Payment Section */
.payment {
  margin-top: 20px;
  line-height: 1.5;
  font-size: 12pt;
}
.payment p { margin: 5px 0; }

.account-details, .atas-nama {
  display: flex;
  margin-left: 10px;
}
.rek-label, .an-label {
  width: 150px;
  flex-shrink: 0;
}
.rek-content, .an-content {
  flex-grow: 1;
}
.atas-nama {
  margin-top: 10px;
}
</style>