import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref({
    email: 'admin@test.com',
    firstName: 'Super',
    lastName: 'Admin',
    isEmployee: true,
    roles: ['superAdmin'],
  })

  const fullName = computed(() => `${user.value.firstName} ${user.value.lastName}`)
  const roles = computed(() => user.value.roles)

  const hasRole = (role) => {
    return user.value.roles.includes(role)
  }

  // eslint-disable-next-line no-unused-vars
  const can = (_action, _resource) => {
    // Mock permission logic
    return true
  }

  return {
    user,
    fullName,
    roles,
    hasRole,
    can,
  }
})
