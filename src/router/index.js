// import vue router
import { createRouter, createWebHistory } from 'vue-router'

// import store user
import { useUser } from '../stores/user'

// define routes
const routes = [
 {
  path: '/',
  name: 'Signin',
  component: () => import(/* webpackChunkName: "signin" */ '../views/Auth/Signin.vue'),
  beforeEnter: (to, from, next) => {
    const user = useUser()
    // jika sudah login langsung ke Ecommerce
    if (user.getToken) {
      next('/Ecommerce')
    } else {
      next()
    }
  },
  meta: { title: 'Signin' },
},

 {
    path: '/Ecommerce',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'Ecommerce',
    component: () => import(/* webpackChunkName: "ecommerce" */ '../views/Ecommerce.vue'),
    meta: { title: 'eCommerce Dashboard' },
  },

   {
        path: '/data-pelanggan',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'data pelanggan',
        component: () => import( /* webpackChunkName: "home" */ '../views/data-pelanggan/index.vue'),
    },
    {
        path: '/data-pelanggan/create',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'tambah data pelanggan',
        component: () => import( /* webpackChunkName: "home" */ '../views/data-pelanggan/create.vue'),
    },
     {
        path: '/data-pelanggan/edit/:id',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'edit data pelanggan',
        component: () => import( /* webpackChunkName: "home" */ '../views/data-pelanggan/edit.vue'),
    },

    {
        path: '/categories',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'data categories',
        component: () => import( /* webpackChunkName: "home" */ '../views/categories/index.vue'),
    },
     {
        path: '/categories/create',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'tambah data categories',
        component: () => import( /* webpackChunkName: "home" */ '../views/categories/create.vue'),
    },
    {
        path: '/categories/edit/:id',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'edit data categories',
        component: () => import( /* webpackChunkName: "home" */ '../views/categories/edit.vue'),
    },
    {
        path: '/products',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'data products',
        component: () => import( /* webpackChunkName: "home" */ '../views/products/index.vue'),
    },
     {
        path: '/products/create',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'tambah data products',
        component: () => import( /* webpackChunkName: "home" */ '../views/products/create.vue'),
    },
    {
        path: '/products/edit/:id',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'edit data products',
        component: () => import( /* webpackChunkName: "home" */ '../views/products/edit.vue'),
    },
    {
        path: '/detail-products',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'data detail products',
        component: () => import( /* webpackChunkName: "home" */ '../views/detail-products/index.vue'),
    },
     {
        path: '/detail-products/create',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'tambah data detail products',
        component: () => import( /* webpackChunkName: "home" */ '../views/detail-products/create.vue'),
    },
    {
        path: '/detail-products/edit/:id',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'edit data detail products',
        component: () => import( /* webpackChunkName: "home" */ '../views/detail-products/edit.vue'),
    },
    {
        path: '/penjualan',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'kasir',
        component: () => import( /* webpackChunkName: "home" */ '../views/penjualan/CashierApp.vue'),
    },
       {
        path: '/halaman-data-penjualan',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'data penjualan',
        component: () => import( /* webpackChunkName: "home" */ '../views/penjualan/index.vue'),
    },
     {
        path: '/halaman-data-penjualan/detail/:id',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'halaman data detail penjualan',
        component: () => import( /* webpackChunkName: "home" */ '../views/penjualan/detail.vue'),
    },
      {
    path: '/penjualan/print',
    beforeEnter: (to, from, next) => {
        useUser().getToken ? next() : next('/')
    },
    name: 'penjualan print',
    component: () => import( /* webpackChunkName: "home" */ '../views/penjualan/print.vue'),
    },

    {
        path: '/sewa',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'kasir sewa',
        component: () => import( /* webpackChunkName: "home" */ '../views/sewa/CashierAppSewa.vue'),
    },
      {
        path: '/halaman-data-sewa',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'data sewa',
        component: () => import( /* webpackChunkName: "home" */ '../views/sewa/index.vue'),
    },

    {
        path: '/halaman-data-rental/detail/:id',
        beforeEnter: (to, from, next) => {
            useUser().getToken ? next() : next('/')
        },
        name: 'halaman data detail sewa',
        component: () => import( /* webpackChunkName: "home" */ '../views/sewa/detail.vue'),
    },
          {
    path: '/rental/print',
    beforeEnter: (to, from, next) => {
        useUser().getToken ? next() : next('/')
    },
    name: 'sewa print',
    component: () => import( /* webpackChunkName: "home" */ '../views/sewa/print.vue'),
    },


]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} | MyApp` : 'MyApp'
  next()
})

export default router
