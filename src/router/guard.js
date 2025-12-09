import { useUser } from '@/stores/user';

export const roleGuard = (to, from, next) => {
  const userStore = useUser();
  const userRole = userStore.userRole;
  const superAdminRoutes = ['/', '/data-admin', '/reports'];
  if (superAdminRoutes.includes(to.path) && userRole !== 'super_admin') {
    next('/data-pelanggan');
  } else {
    next();
  }
};
