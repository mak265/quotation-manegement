<template>
  <q-page class="window-height window-width bg-app">
    <div class="column items-center justify-center full-height">
      <div class="text-h4 gradient-text text-weight-bold q-mb-md">POS Management</div>
      <q-card flat bordered class="glass-card q-pa-xl" style="max-width: 420px; width: 100%">
        <div class="text-h6 q-mb-xs text-weight-bold">Welcome back</div>
        <div class="text-caption q-mb-lg text-grey-7">Sign in to continue</div>

        <q-form @submit="onSubmit" class="q-gutter-y-md">
          <q-input v-model="email" label="Email Address" outlined dense class="input-field">
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input v-model="password" label="Password" outlined dense type="password" class="input-field">
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <div class="row justify-between items-center q-mb-sm">
            <q-checkbox v-model="rememberMe" label="Remember me" dense size="sm" color="primary" />
            <q-btn flat color="primary" label="Forgot Password?" size="sm" />
          </div>

          <q-btn label="Login" type="submit" class="btn-primary full-width" size="md" to="/dashboard" />
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>
<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)

const onSubmit = () => {
  console.log('Login attempt:', email.value, password.value)
}
</script>
