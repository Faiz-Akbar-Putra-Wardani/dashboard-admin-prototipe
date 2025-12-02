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
const description = ref("-")
const dp = ref(0)
const status = ref("")
const repairCost = ref(0)
const printDate = ref(new Date())

const printArea = ref(null)

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

// DOWNLOAD PDF
const downloadPdf = () => {
  const opt = {
    margin: 5,
    filename: `Perbaikan-${invoiceCode.value}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  }

  html2pdf().set(opt).from(printArea.value).save()
}

// ON MOUNTED
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  invoiceCode.value = params.get("invoice")
  fetchRepair();
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
        <p class="invoice-title"><u>Invoice Perbaikan</u></p>
        <p>Tanggal Cetak: {{ formatPrintDate(printDate) }}</p>
      </div>

      <!-- KEPADA -->
      <div class="customer">
        <p>Kepada Yth.</p>
        <p class="name">{{ customer }}</p>
      </div>

      <!-- INFO UTAMA -->
      <table class="info-table">
        <tbody>
          <tr>
            <td>Invoice</td>
            <td>: {{ invoiceCode }}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td>: {{ status }}</td>
          </tr>
        </tbody>
      </table>

      <!-- TABEL PERBAIKAN -->
      <table class="items">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Barang</th>
            <th>Estimasi Tanggal</th>
            <th>Komponen</th>
            <th>Biaya</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td class="center">1</td>
            <td>{{ component }}</td>
            <td class="center">
              {{ formatDate(startDate) }} - {{ formatDate(endDate) }}
            </td>
            <td class="center">{{ component }}</td>
            <td class="right">Rp {{ formatRupiah(repairCost) }}</td>
          </tr>

          <tr class="total-row">
            <td colspan="4" class="right"><b>DP</b></td>
            <td class="right"><b>Rp {{ formatRupiah(dp) }}</b></td>
          </tr>

          <tr class="total-row">
            <td colspan="4" class="right"><b>Sisa</b></td>
            <td class="right"><b>Rp {{ formatRupiah(sisa) }}</b></td>
          </tr>

          <tr class="total-row">
            <td colspan="4" class="right"><b>Total</b></td>
            <td class="right"><b>Rp {{ formatRupiah(repairCost) }}</b></td>
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

      <!-- PEMBAYARAN -->
      <div class="payment">
        <p><strong>Pembayaran</strong><br>Mohon ditransfer ke:</p>

        <div class="account-details">
          <div class="rek-label">Nomor Rekening</div>
          <div class="rek-content">
            : - Bank BRI <br>(2092-0101-1376-504)<br>
            : - Bank Mandiri <br>(114-00-2493557-2)
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

.invoice-title {
  font-size: 14pt;
  font-weight: bold;
}

.info-table,
.items {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.items th,
.items td,
.info-table td {
  border: 1px solid #000;
  padding: 6px;
}

.right { text-align: right; }
.center { text-align: center; }

.total-row td {
  font-weight: bold;
  background: #f8f8f8;
}

.payment {
  margin-top: 25px;
}

.account-details,
.atas-nama {
  display: flex;
  margin-left: 10px;
}

.rek-label,
.an-label {
  width: 150px;
}
</style>
