import { createRouter, createWebHashHistory } from 'vue-router';

import HomeView from './views/HomeView.vue';

const router = createRouter({
  strict: true,
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: `/`,
      component: HomeView,
    },
    {
      path: '/:path(.*)',
      component: () => import('./views/404View.vue'),
    },
  ],
});

export default router;
