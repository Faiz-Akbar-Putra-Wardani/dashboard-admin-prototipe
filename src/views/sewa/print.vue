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
const rentPrice = ref(0);
const status = ref("");
const printDate = ref(new Date());
const items = ref([]);

const printArea = ref(null);

// Format Functions
const formatRupiah = (num) =>
  new Intl.NumberFormat("id-ID").format(num);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
    rentPrice.value = Number(data.rent_price);
    status.value = data.status;

    items.value = data.details.map((d) => ({
      name: d.product?.title ?? "-",
      qty: d.qty,
      price: d.rent_price,
      total: d.qty * d.rent_price,
    }));
  } catch (err) {
    console.error("Gagal memuat rental:", err);
  }
};

const sisa = computed(() => {
  return Math.max(0, rentPrice.value - dp.value);
});

// Download PDF
const downloadPdf = () => {
  const opt = {
    margin: 5,
    filename: `Rental-${invoiceCode.value}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(printArea.value).save();
};

// On Mounted
onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  invoiceCode.value = params.get("invoice");
  fetchRental();
});
</script>
<template>
  <div>
    <!-- Tombol Download PDF -->
    <div style="margin-bottom: 20px; text-align:right;">
      <button @click="downloadPdf" class="btn btn-primary">Download PDF</button>
    </div>

    <!-- AREA PRINT -->
    <div class="invoice-print" ref="printArea">

      <!-- Header Perusahaan -->
      <div class="header">
        <div class="logo">SES</div>
        <div class="company">
          <h1>SINAR ELEKTRO SEJAHTERA</h1>
          <div class="tagline">
            service: Rewinding Elektro motor 1 dan 3 phase, Genset<br>
            <span class="underline">Generator Jual-Beli dan Sewa Genset</span>
          </div>
          <div class="address">
            Alamat: <span class="underline">JL. Cendanall Gg. H. JANUR – Jatimulyo – Lampung Selatan • Tlp. 0853-8312-0656</span>
          </div>
        </div>
      </div>

      <!-- Tanggal -->
      <div class="place-date">
        Bandar Lampung, {{ formatDate(printDate) }}
      </div>

      <!-- Judul -->
      <div class="title-section">
        <p class="invoice-title"><u>Invoice Rental</u></p>
        <p>Tanggal Cetak: {{ formatDate(printDate) }}</p>
      </div>

      <!-- Kepada Yth -->
      <div class="customer">
        <p>Kepada Yth.</p>
        <p class="name">{{ customer }}</p>
      </div>

      <!-- Data Utama Rental -->
      <table class="info-table">
      <tbody>
        <tr>
          <td>Invoice</td>
          <td>: {{ invoiceCode }}</td>
        </tr>
        <tr>
          <td>Tanggal Mulai</td>
          <td>: {{ formatDate(startDate) }}</td>
        </tr>
        <tr>
          <td>Tanggal Selesai</td>
          <td>: {{ formatDate(endDate) }}</td>
        </tr>
        <tr>
          <td>DP</td>
          <td>: Rp {{ formatRupiah(dp) }}</td>
        </tr>
        <tr>
          <td>Status</td>
          <td>: {{ status }}</td>
        </tr>
        </tbody>
      </table>

      <!-- Tabel Produk Disewa -->
      <table class="items">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Barang</th>
            <th>Qty</th>
            <th>Harga Sewa</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="i">
            <td class="center">{{ i + 1 }}</td>
            <td>{{ item.name }}</td>
            <td class="center">{{ item.qty }}</td>
            <td class="right">Rp {{ formatRupiah(item.price) }}</td>
            <td class="right">Rp {{ formatRupiah(item.total) }}</td>
          </tr>

          <tr class="total-row">
            <td colspan="4" class="right"><b>Total</b></td>
            <td class="right"><b>Rp {{ formatRupiah(rentPrice) }}</b></td>
            </tr>

            <tr class="total-row">
            <td colspan="4" class="right"><b>DP</b></td>
            <td class="right"><b>Rp {{ formatRupiah(dp) }}</b></td>
            </tr>

            <tr class="total-row">
            <td colspan="4" class="right"><b>Sisa</b></td>
            <td class="right"><b>Rp {{ formatRupiah(sisa) }}</b></td>
            </tr>

        </tbody>
      </table>

      <!-- Informasi Pembayaran -->
      <div class="payment">
        <p><strong>Pembayaran</strong><br>Mohon ditransfer ke:</p>

        <div class="account-details">
          <div class="rek-label">Nomor Rekening</div>
          <div class="rek-content">
            : - Bank BRI <br> (2092-0101-1376-504) <br>
            : - Bank Mandiri <br> (114-00-2493557-2)
          </div>
        </div>

        <div class="atas-nama">
          <div class="an-label">Atas Nama</div>
          <div class="an-content">: ISWOYO</div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
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

.place-date {
  text-align: right;
  margin: 15px 0;
}

.title-section { margin: 20px 0; }
.invoice-title { font-size: 14pt; font-weight: bold; }

.customer .name { font-weight: bold; }

/* Table Info Rental */
.info-table {
  width: 100%;
  margin-bottom: 20px;
  font-size: 12pt;
}
.info-table td {
  padding: 4px;
}

/* Items Table */
.items {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.items th, .items td {
  border: 1px solid #000;
  padding: 6px;
}
.right { text-align: right; }
.center { text-align: center; }

.total-row td {
  font-weight: bold;
  background: #f8f8f8;
}

/* Payment */
.payment { margin-top: 25px; }

.account-details, .atas-nama {
  display: flex;
  margin-left: 10px;
}

.rek-label, .an-label {
  width: 150px;
}
</style>
