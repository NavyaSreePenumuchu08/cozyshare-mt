// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

import Home from '../pages/Home.vue'
import Chores from '../pages/chores.vue'
import Groceries from '../pages/Groceries.vue'
import Expenses from '../pages/Expenses.vue'
import Login from '../pages/Login.vue'
import AIAssistant from "../pages/AIAssistant.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    {
      path: '/',
      component: Home,
      meta: { requiresAuth: true },
      alias: '/home',
    },
    {
      path: '/chores',
      component: Chores,
      meta: { requiresAuth: true },
    },
    {
      path: '/groceries',
      component: Groceries,
      meta: { requiresAuth: true },
    },
    {
      path: '/expenses',
      component: Expenses,
      meta: { requiresAuth: true },
    },
    // 404 fallback
    { path: '/:notFound(.*)', redirect: '/' },
    {
      path: "/ai-assistant",
      name: "AIAssistant",
      component: AIAssistant
   },
  ],
})

// auth guard
router.beforeEach((to, from, next) => {
  if (!store.getters.isAuthenticated) {
    // try restoring from localStorage
    store.dispatch('initAuth')
  }
  const isAuthenticated = store.getters.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    // already logged in, go to home
    next('/')
  } else {
    next()
  }
})

export default router
