import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/file',
    name: 'file',
    component: () => import(/* webpackChunkName: "file" */ '../views/file/FileView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/share',
    name: 'share',
    component: () => import(/* webpackChunkName: "share" */ '../views/file/ShareFileView.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/user/center',
    name: 'userCenter',
    component: () => import(/* webpackChunkName: "userCenter" */ '../views/user/UserCenterView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/user/security',
    name: 'security',
    component: () => import(/* webpackChunkName: "security" */ '../views/user/SecurityView.vue'),
    meta: { requiresAuth: true }
  }

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 如果路由需要认证且没有token，则重定向到首页
  if (to.meta.requiresAuth && !token) {
    next('/')
    return
  }

  next()
})

export default router
