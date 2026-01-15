import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref({
    email: 'admin@test.com',
    password: '123456',
    firstName: 'Super',
    lastName: 'Admin',
    username: 'superAdmin',
    isEmployee: true,
    roles: ['superAdmin'],
  })

  const fullName = computed(() => `${user.value.firstName} ${user.value.lastName}`)
  const roles = computed(() => user.value.roles)

  const hasRole = (role) => {
    return user.value.roles.includes(role)
  }

  const can = () => {
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