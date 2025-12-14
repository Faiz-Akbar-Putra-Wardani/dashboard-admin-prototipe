import { useUser } from '@/stores/user';

export const roleGuard = (to, from, next) => {
  const userStore = useUser();
  const userRole = userStore.userRole;
  const isAuthenticated = userStore.isAuthenticated;

  if (to.path === '/' && !isAuthenticated) {
    next();
    return;
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(userRole)) {
      if (userRole === 'admin') {
        if (to.path !== '/data-pelanggan') {
          next('/data-pelanggan');
        } else {
          next();
        }
      } else if (userRole === 'super_admin') {
        if (to.path !== '/dashboard') {
          next('/dashboard');
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
