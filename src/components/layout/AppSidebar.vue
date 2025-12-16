<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="!isExpanded && (isHovered = true)"
    @mouseleave="isHovered = false"
  >
    <div :class="['py-6 flex items-center justify-center w-full']">
      <router-link to="/dashboard" class="flex justify-center w-full">
        <picture v-if="isExpanded || isHovered || isMobileOpen">
          <source srcset="/images/logo/logo_ses2_100x100.webp" type="image/webp">
          <img
            class="dark:hidden w-[100px] mx-auto"
            src="/images/logo/logo_ses2_100x100.png"
            alt="Logo Sinar Elektro Sejahtera"
            width="100"
            height="100"
            loading="eager"
            fetchpriority="high"
          />
        </picture>
        <picture v-if="isExpanded || isHovered || isMobileOpen">
          <source srcset="/images/logo/logo_ses2_100x100.webp" type="image/webp">
          <img
            class="hidden dark:block w-[100px] mx-auto"
            src="/images/logo/logo_ses2_100x100.png"
            alt="Logo Sinar Elektro Sejahtera"
            width="100"
            height="100"
            loading="eager"
            fetchpriority="high"
          />
        </picture>
        <picture v-else>
          <source srcset="/images/logo/logo_ses2_40x40.webp" type="image/webp">
          <img
            src="/images/logo/logo_ses2_40x40.png"
            alt="Logo"
            class="w-[30px] mx-auto"
            width="40"
            height="40"
            loading="eager"
            fetchpriority="high"
          />
        </picture>
      </router-link>
    </div>

    <div class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <!-- GANTI menuGroups dengan filteredMenuGroups -->
          <div v-for="(menuGroup, groupIndex) in filteredMenuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <EllipsisHorizontalIcon v-else class="w-5 h-5" />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.name">
                <button
                  v-if="item.subItems"
                  @click="toggleSubmenu(groupIndex, index)"
                  :aria-label="`Toggle ${item.name} menu`"
                  :aria-expanded="isSubmenuOpen(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      'menu-item-active': isSubmenuOpen(groupIndex, index),
                      'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                    },
                    !isExpanded && !isHovered ? 'lg:justify-center' : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isSubmenuOpen(groupIndex, index)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" class="w-5 h-5" />
                  </span>
                  <span v-if="isExpanded || isHovered || isMobileOpen" class="menu-item-text">
                    {{ item.name }}
                  </span>
                  <ChevronDownIcon
                    v-if="isExpanded || isHovered || isMobileOpen"
                    :class="[
                      'ml-auto w-5 h-5 transition-transform duration-200',
                      { 'rotate-180 text-brand-500': isSubmenuOpen(groupIndex, index) },
                    ]"
                  />
                </button>
                <router-link
                  v-else-if="item.path"
                  :to="item.path"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path) ? 'menu-item-icon-active' : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" class="w-5 h-5" />
                  </span>
                  <span v-if="isExpanded || isHovered || isMobileOpen" class="menu-item-text">
                    {{ item.name }}
                  </span>
                </router-link>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="isSubmenuOpen(groupIndex, index) && (isExpanded || isHovered || isMobileOpen)"
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.name">
                        <router-link
                          :to="subItem.path"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isActive(subItem.path),
                              'menu-dropdown-item-inactive': !isActive(subItem.path),
                            },
                          ]"
                        >
                          <component
                            :is="subItem.icon"
                            class="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition"
                          />
                          <span>{{ subItem.name }}</span>
                          <span class="flex items-center gap-1 ml-auto">
                            <span
                              v-if="subItem.new"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(subItem.path),
                                  'menu-dropdown-badge-inactive': !isActive(subItem.path),
                                },
                              ]"
                            >
                              new
                            </span>
                            <span
                              v-if="subItem.pro"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(subItem.path),
                                  'menu-dropdown-badge-inactive': !isActive(subItem.path),
                                },
                              ]"
                            >
                              pro
                            </span>
                          </span>
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <SidebarWidget v-if="isExpanded || isHovered || isMobileOpen" />
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useUser } from "@/stores/user";

import {
  HomeIcon,
  UsersIcon,
  TagIcon,
  CubeIcon,
  CubeTransparentIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/vue/24/outline";

import SidebarWidget from "./SidebarWidget.vue";
import { useSidebar } from "@/composables/useSidebar";

const route = useRoute();
const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar();
const userStore = useUser();

const menuGroups = [
  {
    title: "Menu",
    items: [
      { icon: HomeIcon, name: "Dashboard", path: "/dashboard", roles: ['super_admin'] }, 
      { icon: UsersIcon, name: "Data Pelanggan", path: "/data-pelanggan", roles: ['super_admin', 'admin'] },
      { icon: UsersIcon, name: "Data Admin", path: "/data-admin", roles: ['super_admin'] }, 
    ],
  },
  {
    title: "Menu Produk",
    items: [
      { icon: TagIcon, name: "Data Kategori Produk", path: "/categories", roles: ['super_admin', 'admin'] },
      {
        icon: CubeIcon,
        name: "Tentang Produk",
        roles: ['super_admin', 'admin'],
        subItems: [
          { name: "Produk", path: "/products", pro: false, icon: CubeIcon },
          { name: "Detail Produk", path: "/detail-products", pro: false, icon: CubeTransparentIcon },
        ],
      },
    ],
  },
  {
    title: "Sistem Penjualan",
    items: [
      { icon: ShoppingCartIcon, name: "Transaksi Penjualan", path: "/penjualan", roles: ['super_admin', 'admin'] },
      { icon: DocumentTextIcon, name: "Data Penjualan", path: "/halaman-data-penjualan", roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: "Sistem Sewa Barang",
    items: [
      { icon: ClipboardDocumentCheckIcon, name: "Transaksi Sewa", path: "/sewa", roles: ['super_admin', 'admin'] },
      { icon: ClipboardDocumentListIcon, name: "Data Sewa", path: "/halaman-data-sewa", roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: "Sistem Perbaikan Barang",
    items: [
      { icon: WrenchScrewdriverIcon, name: "Transaksi Perbaikan", path: "/repairs", roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: "Manajemen Konten",
    items: [
      {
        icon: BriefcaseIcon,
        name: "Konten Proyek",
        roles: ['super_admin', 'admin'],
        subItems: [
          { name: "Kategori Proyek", path: "/projects-categories", pro: false, icon: BriefcaseIcon},
          { name: "Proyek",path: "/projects", pro: false, icon: BriefcaseIcon },
        ],
      },
      
      { icon: BuildingStorefrontIcon, name: "Klien", path: "/clients", roles: ['super_admin', 'admin'] },
      { icon: BuildingStorefrontIcon, name: "Bank", path: "/banks", roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: "Rekap",
    items: [
      { icon: UsersIcon, name: "Rekap Data Pelanggan", path: "/reports", roles: ['super_admin'] },
    ],
  },
];

// Filter menu berdasarkan role user
const filteredMenuGroups = computed(() => {
  const userRole = userStore.userRole;
  
  return menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Jika item tidak punya roles, tampilkan ke semua user
      if (!item.roles) return true;
      
      // Cek apakah role user ada di array roles item
      return item.roles.includes(userRole);
    })
  })).filter(group => group.items.length > 0); // Hapus group kosong
});

const isActive = (path) => route.path === path;

const toggleSubmenu = (groupIndex, itemIndex) => {
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

const isAnySubmenuRouteActive = computed(() => {
  return filteredMenuGroups.value.some((group) =>
    group.items.some(
      (item) =>
        item.subItems && item.subItems.some((subItem) => isActive(subItem.path))
    )
  );
});

const isSubmenuOpen = (groupIndex, itemIndex) => {
  const key = `${groupIndex}-${itemIndex}`;
  return (
    openSubmenu.value === key ||
    (isAnySubmenuRouteActive.value &&
      filteredMenuGroups.value[groupIndex].items[itemIndex].subItems?.some((subItem) =>
        isActive(subItem.path)
      ))
  );
};

const startTransition = (el) => {
  el.style.height = "auto";
  const height = el.scrollHeight;
  el.style.height = "0px";
  el.offsetHeight;
  el.style.height = height + "px";
};

const endTransition = (el) => {
  el.style.height = "";
};
</script>
