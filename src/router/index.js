// import vue router
import { createRouter, createWebHistory } from 'vue-router'

// import store user
import { useUser } from '../stores/user'

// import role guard
import { roleGuard } from './guard'

// define routes
const routes = [
  {
    path: '/',
    name: 'Signin',
    component: () => import(/* webpackChunkName: "signin" */ '../views/Auth/Signin.vue'),
    beforeEnter: (to, from, next) => {
      const user = useUser()
      // jika sudah login langsung ke dashboard sesuai role
      if (user.getToken) {
        const role = user.userRole;
        if (role === 'super_admin') {
          next('/Ecommerce')
        } else if (role === 'admin') {
          next('/data-pelanggan')
        } else {
          next('/')
        }
      } else {
        next()
      }
    },
    meta: { title: 'Signin', public: true },
  },

  {
    path: '/Ecommerce',
    beforeEnter: (to, from, next) => {
      const user = useUser()
      if (!user.getToken) {
        next('/')
      } else {
        next()
      }
    },
    name: 'Ecommerce',
    component: () => import(/* webpackChunkName: "ecommerce" */ '../views/Ecommerce.vue'),
    meta: { title: 'eCommerce Dashboard', requiresAuth: true, roles: ['super_admin'] },
  },


  {
    path: '/data-pelanggan',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data pelanggan',
    component: () => import(/* webpackChunkName: "home" */ '../views/data-pelanggan/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/data-pelanggan/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data pelanggan',
    component: () => import(/* webpackChunkName: "home" */ '../views/data-pelanggan/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/data-pelanggan/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data pelanggan',
    component: () => import(/* webpackChunkName: "home" */ '../views/data-pelanggan/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/data-admin',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data admin',
    component: () => import(/* webpackChunkName: "home" */ '../views/admin/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin'] },
  },
  {
    path: '/data-admin/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data admin',
    component: () => import(/* webpackChunkName: "home" */ '../views/admin/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin'] },
  },
  {
    path: '/data-admin/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data admin',
    component: () => import(/* webpackChunkName: "home" */ '../views/admin/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin'] },
  },

  {
    path: '/categories',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data categories',
    component: () => import(/* webpackChunkName: "home" */ '../views/categories/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/categories/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data categories',
    component: () => import(/* webpackChunkName: "home" */ '../views/categories/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/categories/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data categories',
    component: () => import(/* webpackChunkName: "home" */ '../views/categories/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/products',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data products',
    component: () => import(/* webpackChunkName: "home" */ '../views/products/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/products/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data products',
    component: () => import(/* webpackChunkName: "home" */ '../views/products/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/products/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data products',
    component: () => import(/* webpackChunkName: "home" */ '../views/products/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/detail-products',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data detail products',
    component: () => import(/* webpackChunkName: "home" */ '../views/detail-products/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/detail-products/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data detail products',
    component: () => import(/* webpackChunkName: "home" */ '../views/detail-products/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/detail-products/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data detail products',
    component: () => import(/* webpackChunkName: "home" */ '../views/detail-products/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/penjualan',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'kasir',
    component: () => import(/* webpackChunkName: "home" */ '../views/penjualan/CashierApp.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/halaman-data-penjualan',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data penjualan',
    component: () => import(/* webpackChunkName: "home" */ '../views/penjualan/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/halaman-data-penjualan/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'halaman edit data penjualan',
    component: () => import(/* webpackChunkName: "home" */ '../views/penjualan/CashierUpdate.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/halaman-data-penjualan/detail/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'halaman data detail penjualan',
    component: () => import(/* webpackChunkName: "home" */ '../views/penjualan/detail.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/penjualan/print',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'penjualan print',
    component: () => import(/* webpackChunkName: "home" */ '../views/penjualan/print.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/sewa',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'kasir sewa',
    component: () => import(/* webpackChunkName: "home" */ '../views/sewa/CashierAppSewa.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/halaman-data-sewa',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data sewa',
    component: () => import(/* webpackChunkName: "home" */ '../views/sewa/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/halaman-data-sewa/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'halaman data edit sewa',
    component: () => import(/* webpackChunkName: "home" */ '../views/sewa/CashierUpdateSewa.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/halaman-data-sewa/detail/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'halaman data detail sewa',
    component: () => import(/* webpackChunkName: "home" */ '../views/sewa/detail.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/rental/print',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'sewa print',
    component: () => import(/* webpackChunkName: "home" */ '../views/sewa/print.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/projects',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data proyek',
    component: () => import(/* webpackChunkName: "home" */ '../views/proyek/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/projects/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data proyek',
    component: () => import(/* webpackChunkName: "home" */ '../views/proyek/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/projects/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data proyek',
    component: () => import(/* webpackChunkName: "home" */ '../views/proyek/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/clients',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data klien',
    component: () => import(/* webpackChunkName: "home" */ '../views/client/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/clients/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data klien',
    component: () => import(/* webpackChunkName: "home" */ '../views/client/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/clients/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data klien',
    component: () => import(/* webpackChunkName: "home" */ '../views/client/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/repairs',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data perbaikan',
    component: () => import(/* webpackChunkName: "home" */ '../views/perbaikan/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/repairs/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data perbaikan',
    component: () => import(/* webpackChunkName: "home" */ '../views/perbaikan/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/repairs/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data perbaikan',
    component: () => import(/* webpackChunkName: "home" */ '../views/perbaikan/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/repairs/detail/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'halaman data detail perbaikan',
    component: () => import(/* webpackChunkName: "home" */ '../views/perbaikan/detail.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/repairs/print',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'perbaikan print',
    component: () => import(/* webpackChunkName: "home" */ '../views/perbaikan/print.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },

  {
    path: '/reports',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'rekap data pelanggan',
    component: () => import(/* webpackChunkName: "home" */ '../views/rekap/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin'] },
  },
  {
    path: '/reports/print',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'rekap data pelanggan print',
    component: () => import(/* webpackChunkName: "home" */ '../views/rekap/print.vue'),
    meta: { requiresAuth: true, roles: ['super_admin'] },
  },

  {
    path: '/banks',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'data bank',
    component: () => import(/* webpackChunkName: "home" */ '../views/bank/index.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/banks/create',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'tambah data bank',
    component: () => import(/* webpackChunkName: "home" */ '../views/bank/create.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
  {
    path: '/banks/edit/:id',
    beforeEnter: (to, from, next) => {
      useUser().getToken ? next() : next('/')
    },
    name: 'edit data bank',
    component: () => import(/* webpackChunkName: "home" */ '../views/bank/edit.vue'),
    meta: { requiresAuth: true, roles: ['super_admin', 'admin'] },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Apply global guards
router.beforeEach((to, from, next) => {
  // Set document title
  document.title = to.meta.title ? `${to.meta.title} | MyApp` : 'MyApp'
  
  // Apply role guard
  roleGuard(to, from, next)
})

export default router
