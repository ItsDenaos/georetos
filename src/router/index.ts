import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

// Las vistas de juego se cargan bajo demanda: la portada no descarga d3 ni el mapa.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/mapa', name: 'locate', component: () => import('@/views/LocateView.vue') },
    { path: '/trivia', name: 'trivia', component: () => import('@/views/TriviaView.vue') },
    {
      path: '/silueta',
      name: 'silhouette',
      component: () => import('@/views/SilhouetteView.vue'),
    },
    {
      path: '/silueta/diario',
      name: 'daily-silhouette',
      component: () => import('@/views/DailySilhouetteView.vue'),
    },
    { path: '/escribe', name: 'typing', component: () => import('@/views/TypingView.vue') },
    { path: '/diario', name: 'daily', component: () => import('@/views/DailyView.vue') },
    { path: '/progreso', name: 'progress', component: () => import('@/views/ProgressView.vue') },
    { path: '/resultados', name: 'results', component: () => import('@/views/ResultsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
