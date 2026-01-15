<template>
  <q-drawer v-model="model" show-if-above :width="280" class="bg-grey-1">
    <div class="column full-height no-wrap">
      <div class="q-pa-md q-pt-lg">
        <div class="row items-center q-mb-lg q-px-sm">
          <q-avatar
            color="primary"
            text-color="white"
            icon="dashboard"
            size="32px"
            font-size="20px"
            class="q-mr-sm"
          />
          <div class="text-h6 text-weight-bold text-grey-9">POS System</div>
        </div>

        <q-card flat bordered class="bg-white rounded-borders">
          <q-item class="q-py-sm">
            <q-item-section avatar>
              <q-avatar size="40px" class="bg-grey-3 text-grey-8">
                <span class="text-weight-bold">{{ userInitials }}</span>
                <q-badge
                  floating
                  color="green"
                  rounded
                  transparent
                  style="top: 30px; right: 0px; width: 10px; height: 10px; padding: 0"
                />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold text-grey-9">
                {{ currentUserName }}
              </q-item-label>
              <q-item-label caption class="text-grey-7" style="font-size: 0.75rem">
                {{ currentUserEmail }}
              </q-item-label>
              <q-item-label caption class="text-primary text-weight-bold" style="font-size: 0.7rem">
                {{ currentUserRole.toUpperCase() }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <q-scroll-area class="col fit">
        <q-list padding class="text-grey-8">
          <q-item-label
            header
            class="text-uppercase text-weight-bold text-grey-6 q-pl-md"
            style="font-size: 0.7rem; letter-spacing: 1px"
          >
            Quick Access
          </q-item-label>

          <div class="q-px-sm">
            <SidebarItems
              v-for="(route, index) in quickAccessRoutes"
              :key="index"
              :name="route.name"
              :label="route.meta.label"
              :caption="route.meta.caption"
              :icon="route.meta.icon"
              :meta="route.meta"
            />
          </div>

          <div v-if="managementRoutes.length > 0" class="q-mt-md">
            <q-item-label
              header
              class="text-uppercase text-weight-bold text-grey-6 q-pl-md"
              style="font-size: 0.7rem; letter-spacing: 1px"
            >
              Management
            </q-item-label>

            <div class="q-px-sm">
              <SidebarItems
                v-for="(route, index) in managementRoutes"
                :key="index"
                :name="route.name"
                :label="route.meta.label"
                :caption="route.meta.caption"
                :icon="route.meta.icon"
                :meta="route.meta"
              />
            </div>
          </div>
        </q-list>
      </q-scroll-area>

      <div class="q-pa-md bg-grey-2">
        <q-btn
          unelevated
          outline
          color="negative"
          class="full-width q-mb-sm"
          no-caps
          @click="onLogout"
        >
          <q-icon left name="logout" size="18px" />
          <div>Sign Out</div>
        </q-btn>

        <div class="text-center">
          <div class="text-caption text-grey-5">v1.0.0</div>
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import _ from 'lodash'

// 1. Import Sidebar Item Component & Stores
import { SidebarItems } from 'src/shared'
import { useAuthStore } from 'src/features/index.js'

// 2. Firebase Imports
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { auth, db } from 'src/services/firebase'

const model = defineModel()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

// --- LOCAL STATE ---
const currentUserName = ref('Loading...')
const currentUserEmail = ref('...')
const currentUserRole = ref('')
const fetchedPermissions = ref([]) // Local cache of permissions

// --- COMPUTED: USER INITIALS ---
const userInitials = computed(() => {
  if (currentUserName.value === 'Loading...' || !currentUserName.value) return 'U'
  return currentUserName.value.charAt(0).toUpperCase()
})

// --- COMPUTED: IS SUPER ADMIN? ---
const isSuperAdmin = computed(() => {
  const role = currentUserRole.value.toLowerCase()
  return role === 'admin' || role === 'superadmin'
})

// --- 1. INITIALIZATION & DATA FETCHING ---
onMounted(() => {
  onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      currentUserEmail.value = authUser.email

      try {
        // A. Get User Profile from 'user' collection using email
        const q = query(collection(db, 'user'), where('email', '==', authUser.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          currentUserName.value = userData.username || 'User'
          currentUserRole.value = userData.role || 'staff'

          // Update Pinia Store
          if (authStore.setUser) {
            authStore.setUser({
              uid: authUser.uid,
              email: authUser.email,
              ...userData,
            })
          }

          // B. Fetch Permissions (if NOT superadmin)
          if (!isSuperAdmin.value) {
            await fetchRolePermissions(currentUserRole.value)
          }
        } else {
          currentUserName.value = 'User (No Profile)'
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    } else {
      // Handle Logout State / No User
      currentUserName.value = 'Guest'
      currentUserRole.value = ''
      fetchedPermissions.value = []
      router.replace('/')
    }
  })
})

// Helper: Fetch permissions from 'roles' collection
const fetchRolePermissions = async (roleName) => {
  try {
    const roleRef = doc(db, 'roles', roleName)
    const roleSnap = await getDoc(roleRef)

    if (roleSnap.exists()) {
      fetchedPermissions.value = roleSnap.data().permissions || []

      // Update store so we can use can() in other components
      if (authStore.setPermissions) {
        authStore.setPermissions(fetchedPermissions.value)
      }
    } else {
      console.warn(`Role definition for '${roleName}' not found in DB.`)
      fetchedPermissions.value = []
    }
  } catch (e) {
    console.error('Error fetching permissions', e)
  }
}

// --- 2. PERMISSION LOGIC ---
const canAccess = (route) => {
  // A. Super Admin Bypass
  if (isSuperAdmin.value) return true

  // B. No restrictions
  if (!route.meta?.permissions && !route.meta?.roles) return true

  // C. Legacy Role Check
  if (route.meta?.roles) {
    if (route.meta.roles.includes(currentUserRole.value)) return true
  }

  // D. Dynamic Permissions Check
  if (route.meta?.permissions) {
    const hasPermission = route.meta.permissions.some((requiredPerm) =>
      fetchedPermissions.value.includes(requiredPerm),
    )
    return hasPermission
  }

  return false
}

// --- 3. DYNAMIC MENU FILTERING ---
const allRoutes = router.getRoutes()

const quickAccessRoutes = computed(() => {
  return _.filter(
    allRoutes,
    (route) => route.meta.isSidebarItem && !route.meta.isManagement && canAccess(route),
  )
})

const managementRoutes = computed(() => {
  return _.filter(
    allRoutes,
    (route) => route.meta.isSidebarItem && route.meta.isManagement && canAccess(route),
  )
})

// --- 4. LOGOUT LOGIC (UPDATED) ---
const onLogout = async () => {
  $q.loading.show({ message: 'Signing out...' })
  try {
    // 1. Firebase Sign Out
    await signOut(auth)

    // 2. Clear Pinia Store (Critical for Security)
    // This removes the user & permissions from state immediately
    authStore.$reset()

    // 3. Redirect
    router.replace('/')
  } catch (error) {
    console.error('Logout Error:', error)
    $q.notify({ color: 'negative', message: 'Failed to sign out', icon: 'warning' })
  } finally {
    $q.loading.hide()
  }
}
</script>

<style lang="scss">
.q-item--active {
  color: $primary;
  font-weight: 600;
  border-radius: 8px;
  background: lighten($primary, 45%);
}
.q-item--active .q-icon {
  color: $primary;
}
</style>
