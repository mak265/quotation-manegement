<template>
  <q-page class="window-height window-width bg-grey-2">
    <div class="column items-center justify-center full-height">
      <q-card shadow-10 bordered class="glass-card q-pa-xl" style="max-width: 420px; width: 100%">
        
        <div class="row justify-center q-mb-md">
          <q-avatar size="80px" class="bg-white">
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" alt="Company Logo">
          </q-avatar>
        </div>

        <div class="text-h6 text-center q-mb-xs text-weight-bold">Welcome back</div>
        <div class="text-caption text-center q-mb-lg text-grey-7">Sign in to continue</div>

        <q-form @submit="onSubmit" class="q-gutter-y-md">
          
          <q-input 
            v-model="email" 
            label="Email Address" 
            dense 
            class="input-underline"
            :class="{ 'validation-error': isEmailError, 'validation-success': isEmailSuccess }"
            color="primary"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
            <template v-slot:append>
              <q-icon name="check_circle" color="positive" v-if="isEmailSuccess" />
            </template>
          </q-input>

          <q-input 
            v-model="password" 
            label="Password" 
            dense 
            :type="isPwdHidden ? 'password' : 'text'" 
            class="input-underline"
            color="primary"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            
            <template v-slot:append>
              <q-icon
                :name="isPwdHidden ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwdHidden = !isPwdHidden"
              />
            </template>
          </q-input>

          <div class="row justify-center q-mt-lg">
            <q-btn 
              label="Login" 
              type="submit" 
              color="primary" 
              rounded 
              class="q-px-xl" 
              size="md" 
              to="/dashboard" 
            />
          </div>
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

const email = ref('')
const password = ref('')
const isPwdHidden = ref(true)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isEmailSuccess = computed(() => {
  return email.value.length > 0 && emailPattern.test(email.value)
})

const isEmailError = computed(() => {
  return email.value.length > 0 && !emailPattern.test(email.value)
})

const onSubmit = () => {
  console.log('Login attempt:', email.value, password.value)
}
</script>

<style scoped>
.bg-app {
  background-color: #f5f5f5;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.input-underline :deep(.q-field__control) {
  background-color: transparent !important;
  padding-left: 0;
  padding-right: 0;
}

.input-underline :deep(.q-field__control:before) {
  border-bottom: 1px solid #ccc;
}

.input-underline :deep(.q-field__control:after) {
  height: 2px;
}

.validation-error :deep(.q-field__label) {
  color: #C10015;
}

.validation-error :deep(.q-field__control:after) {
  background: #C10015;
  transform: scaleX(1);
}

.validation-success :deep(.q-field__label) {
  color: #21BA45;
}

.validation-success :deep(.q-field__control:after) {
  background: #21BA45;
  transform: scaleX(1);
}
</style>