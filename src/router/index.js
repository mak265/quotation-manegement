import { route } from 'quasar/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

// 1. Import your Store and Firebase
import { useAuthStore } from 'src/features/index.js'
import { auth, db } from 'src/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { Notify } from 'quasar'

/*
 * HELPER: Wait for Firebase Auth to Initialize
 * This prevents the user from being kicked to login on page refresh (F5)
 */
function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject,
    )
  })
}

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // --- NAVIGATION GUARD ---
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(
      (record) => record.meta.isSidebarItem || record.meta.permissions,
    )
    const requiresGuest = to.path === '/' // Login page

    // 1. CHECK AUTH STATE (Handle Refresh)
    // If the store is empty, check if Firebase remembers the user
    if (!authStore.user) {
      const firebaseUser = await getCurrentUser()

      if (firebaseUser) {
        // User is logged in via Firebase, but Store is empty (Refresh happened)
        // We need to fetch the Role from Firestore again to populate the store
        try {
          // Note: Assuming your collection is 'user' based on previous context
          const userDoc = await getDoc(doc(db, 'user', firebaseUser.uid)) // or 'users'

          if (userDoc.exists()) {
            const userData = userDoc.data()

            // Repopulate Store
            authStore.setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData.role || 'staff',
              username: userData.username || 'User',
            })

            // Wait for permissions to be fetched (setUser triggers fetchPermissions)
            // But we add a small delay or check to ensure permissions are ready
            // (Store action is async, so better to explicitly await fetchPermissions if possible)
            await authStore.fetchPermissions()
          }
        } catch (error) {
          console.error('Error restoring session:', error)
        }
      }
    }

    const isAuthenticated = !!authStore.user

    // 2. ROUTE LOGIC

    // A. If going to Login page but already logged in -> Redirect to Dashboard
    if (requiresGuest && isAuthenticated) {
      return next('/dashboard')
    }

    // B. If going to Protected page but NOT logged in -> Redirect to Login
    if (requiresAuth && !isAuthenticated) {
      return next('/')
    }

    // C. PERMISSION CHECK
    if (to.meta.permissions) {
      // 1. Check if Super Admin (Bypass)
      if (authStore.isSuperAdmin) {
        return next()
      }

      // 2. Allow if user has the exact permission OR any permission with the same resource prefix
      const hasPermission = to.meta.permissions.some((perm) => {
        if (authStore.permissions.includes(perm)) return true
        const resource = String(perm).split(':')[0]
        return authStore.permissions.some((p) => p.startsWith(resource + ':'))
      })

      if (hasPermission) {
        return next()
      } else {
        // PERMISSION DENIED
        // Warning: Do not redirect to the same page (Infinite loop)
        Notify.create({
          type: 'negative',
          message: 'You do not have permission to view this page.',
        })

        // If coming from somewhere else, abort navigation
        if (from.path !== '/') {
          return next(false)
        } else {
          // If typed directly into browser, send to Dashboard
          return next('/dashboard')
        }
      }
    }

    // Default: Allow navigation
    next()
  })

  return Router
})
