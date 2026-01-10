<template>
  <q-drawer 
    v-model="model" 
    show-if-above 
    :width="280"
    class="bg-grey-1"
  >
    <div class="column full-height no-wrap">
      
      <div class="q-pa-md q-pt-lg">
        <div class="row items-center q-mb-lg q-px-sm">
          <q-avatar color="primary" text-color="white" icon="dashboard" size="32px" font-size="20px" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold text-grey-9">POS System</div>
        </div>

        <q-card flat bordered class="bg-white rounded-borders">
          <q-item class="q-py-sm">
            <q-item-section avatar>
              <q-avatar size="40px">
                <img src="https://cdn.quasar.dev/img/boy-avatar.png" alt="User" />
                <q-badge floating color="green" rounded transparent style="top: 30px; right: 0px; width: 10px; height: 10px; padding: 0;" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold text-grey-9">{{ fullName }}</q-item-label>
              <q-item-label caption class="text-grey-7" style="font-size: 0.75rem">
                {{ user?.email }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <q-scroll-area class="col fit">
        <q-list padding class="text-grey-8">
          
          <q-item-label header class="text-uppercase text-weight-bold text-grey-6 q-pl-md" style="font-size: 0.7rem; letter-spacing: 1px;">
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

          <div v-if="user.isEmployee" class="q-mt-md">
            <q-item-label header class="text-uppercase text-weight-bold text-grey-6 q-pl-md" style="font-size: 0.7rem; letter-spacing: 1px;">
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
      
      <div class="q-py-md text-center">
        <div class="text-caption text-grey-5">v1.0.0</div>
      </div>
      
    </div>
  </q-drawer>
</template>

<script setup>
import { SidebarItems } from 'src/shared'
import { useAuthStore } from 'src/features/index.js'
import { useRouter } from 'vue-router'
import _ from 'lodash'

const model = defineModel()
const router = useRouter()
const { user, fullName, roles, hasRole, can } = useAuthStore()

// --- PERMISSION LOGIC ---
const isAllowed = (route, { requireAdmin = false } = {}) => {
  if (requireAdmin && hasRole('superAdmin')) return true
  if (!route.meta?.roles && !route.meta?.permissions) return true

  if (route.meta?.roles) {
    const hasAnyRoleAllowed = _.intersection(roles, route.meta.roles).length > 0
    if (hasAnyRoleAllowed) return true
  }

  if (route.meta?.permissions) {
    return route.meta.permissions.some((perm) => {
      const [action, resource] = perm.split(':')
      return can(action, resource)
    })
  }
  return false
}

// --- DYNAMIC LINKS (Based on Router) ---
const allRoutes = router.getRoutes()

const quickAccessRoutes = _.filter(
  allRoutes,
  (route) => route.meta.isSidebarItem && !route.meta.isManagement && isAllowed(route),
)

const managementRoutes = _.filter(
  allRoutes,
  (route) => route.meta.isSidebarItem && route.meta.isManagement && isAllowed(route, { requireAdmin: true }),
)

</script>

<style lang="scss">

.q-item--active {
  color: $primary;
  font-weight: 600;
  border-radius: 8px;
}

.q-item--active .q-icon {
  color: $primary;
}
</style>