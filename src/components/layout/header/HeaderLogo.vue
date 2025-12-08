<template>
  <router-link to="/" class="lg:hidden flex items-center">
    <!-- ✅ OPTIMIZED: Gunakan WebP + ukuran tepat -->
    <picture class="dark:hidden">
      <source srcset="/images/logo/logo_ses2_40x40.webp" type="image/webp">
      <img 
        class="h-10 w-auto object-contain" 
        src="/images/logo/logo_ses2_40x40.png" 
        alt="Logo Sinar Elektro Sejahtera" 
        width="40"
        height="40"
        loading="eager"
        fetchpriority="high"
      />
    </picture>
    <picture class="hidden dark:block">
      <source srcset="/images/logo/logo_ses2_40x40.webp" type="image/webp">
      <img 
        class="h-10 w-auto object-contain" 
        src="/images/logo/logo_ses2_40x40.png" 
        alt="Logo Sinar Elektro Sejahtera Dark Mode" 
        width="40"
        height="40"
        loading="eager"
        fetchpriority="high"
      />
    </picture>
  </router-link>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
