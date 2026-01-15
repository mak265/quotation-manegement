<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="text-h6 text-blue-grey-8 q-mb-md">Add New User</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input 
            outlined 
            v-model="username" 
            label="Username" 
            :rules="[val => !!val || 'Username is required']"
            lazy-rules
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input 
            outlined 
            v-model="password" 
            label="Password" 
            :type="showPassword ? 'text' : 'password'"
            :rules="[val => !!val || 'Password is required']"
            lazy-rules
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>
      </div>
      <div class="row justify-end q-mt-md">
        <q-btn 
          color="primary" 
          label="Add User" 
          @click="submit"
          :disable="!isFormValid"
          icon="person_add"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useUserManagementStore } from 'src/stores/usermanagementStore.js'

const emit = defineEmits(['add'])

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const $q = useQuasar()
const userStore = useUserManagementStore()

const isFormValid = computed(() => {
  return username.value.trim() !== '' && password.value.trim() !== ''
})

const submit = async () => {
  if (!isFormValid.value) return
  try {
    await userStore.addUser({ username: username.value, password: password.value })
    $q.notify({ type: 'positive', message: 'User added to database', position: 'top-right', icon: 'check_circle' })
    emit('add', { username: username.value, password: password.value })
    username.value = ''
    password.value = ''
    showPassword.value = false
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Failed to add user', position: 'top-right', icon: 'error' })
  }
}
</script>

<style scoped>
</style>
