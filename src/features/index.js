import { defineStore } from 'pinia'
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'src/services/firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // Stores { uid, email, role, username }
    permissions: [], // Stores ['order:create', 'product:read', ...]
  }),

  getters: {
    // Helper to check if user is superadmin (Case insensitive)
    isSuperAdmin: (state) => {
      const role = state.user?.role?.toLowerCase() || ''
      return role === 'superadmin' || role === 'admin'
    },
  },

  actions: {
    // 1. FETCH PERMISSIONS ON LOGIN
    async fetchPermissions() {
      if (!this.user?.role) return

      // Superadmin doesn't need to fetch permissions (they have all)
      if (this.isSuperAdmin) {
        this.permissions = ['*']
        return
      }

      try {
        // Fetch the permissions array from the 'roles' collection
        const roleRef = doc(db, 'roles', this.user.role)
        const roleSnap = await getDoc(roleRef)

        if (roleSnap.exists()) {
          this.permissions = roleSnap.data().permissions || []
        } else {
          console.warn(`Role '${this.user.role}' not found in DB.`)
          this.permissions = []
        }
      } catch (error) {
        console.error('Error fetching permissions:', error)
      }
    },

    // 2. THE CHECKER FUNCTION (Used in Buttons/Routes)
    can(action, resource) {
      // RULE 1: Superadmin always returns TRUE
      if (this.isSuperAdmin) return true

      // RULE 2: Check if user has specific permission
      // Standard format: "resource:action" (e.g., "product:delete")
      const requiredPermission = `${resource}:${action}`

      return this.permissions.includes(requiredPermission)
    },

    setUser(userData) {
      this.user = userData
      // Automatically fetch permissions when user is set
      this.fetchPermissions()
    },
    setPermissions(perms) {
      this.permissions = Array.isArray(perms) ? perms : []
    },
  },
})
