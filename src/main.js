import './assets/main.css'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'jsvectormap/dist/jsvectormap.css'
import 'flatpickr/dist/flatpickr.css'


// import vue-awesome-paginate
import VueAwesomePaginate from "vue-awesome-paginate";
import "vue-awesome-paginate/dist/style.css";

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueApexCharts from 'vue3-apexcharts'

//import pinia
import { createPinia } from 'pinia'

//initialize pinia
const pinia = createPinia()

const app = createApp(App)

//use vue-awesome-paginate
app.use(VueAwesomePaginate);

//use pinia on vue
app.use(pinia)

app.use(router)
app.use(VueApexCharts)

app.mount('#app')
