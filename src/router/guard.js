import { useUser } from '@/stores/user';

export const roleGuard = (to, from, next) => {
  const userStore = useUser();
  const userRole = userStore.userRole;
  const isAuthenticated = userStore.isAuthenticated;

  // Skip guard untuk halaman login
  if (to.path === '/' && !isAuthenticated) {
    next();
    return;
  }

  // Cek apakah route membutuhkan role tertentu
  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(userRole)) {
      // Redirect ke halaman yang sesuai dengan role
      if (userRole === 'admin') {
        // Cegah redirect loop
        if (to.path !== '/data-pelanggan') {
          next('/data-pelanggan');
        } else {
          next();
        }
      } else if (userRole === 'super_admin') {
        // Cegah redirect loop
        if (to.path !== '/Ecommerce') {
          next('/Ecommerce');
        } else {
          next();
        }
      } else {
        next('/');
      }
      return;
    }
  }

  next();
};
