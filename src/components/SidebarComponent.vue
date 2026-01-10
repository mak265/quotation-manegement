<template>
  <q-drawer v-model="model" show-if-above bordered>
    <q-list>
      <q-item clickable>
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" icon="person" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ fullName }}</q-item-label>
          <q-item-label caption>{{ user?.email }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator spaced />

      <q-item-label header>Quick Access</q-item-label>
      <SidebarItems
        v-for="(route, index) in quickAccessRoutes"
        :key="index"
        :name="route.name"
        :label="route.meta.label"
        :caption="route.meta.caption"
        :icon="route.meta.icon"
        :meta="route.meta"
      />

      <div v-if="user.isEmployee">
        <q-separator spaced />

        <q-item-label header>Management</q-item-label>
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
    </q-list>
  </q-drawer>
</template>

<script setup>
import { SidebarItems } from 'src/shared'
import { useAuthStore } from 'src/features/index.js'
import { useRouter } from 'vue-router'
import _ from 'lodash'

const model = defineModel()

const router = useRouter()
const allRoutes = router.getRoutes()

const { user, fullName, roles, hasRole, can } = useAuthStore()

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

const quickAccessRoutes = _.filter(
  allRoutes,
  (route) => route.meta.isSidebarItem && !route.meta.isManagement && isAllowed(route),
)

const managementRoutes = _.filter(
  allRoutes,
  (route) =>
    route.meta.isSidebarItem && route.meta.isManagement && isAllowed(route, { requireAdmin: true }),
)
</script>
