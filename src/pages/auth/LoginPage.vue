<template>
  <q-page class="window-height window-width">
    <div class="row full-height">
      <!-- 2/3 Section: Branding / Image -->
      <div class="col-8 bg-primary text-white flex flex-center">
        <div class="text-center">
          <h2 class="q-my-none text-weight-bold">FAMS Cloud</h2>
          <div class="text-h5 q-mt-md" style="opacity: 0.8">Welcome back!</div>
        </div>
      </div>

      <!-- 1/3 Section: Login Form -->
      <div class="col-4 flex flex-center bg-white">
        <div class="q-pa-xl full-width" style="max-width: 450px">
          <div class="text-h4 q-mb-sm text-weight-bold text-primary">Login</div>
          <div class="text-subtitle1 q-mb-xl text-grey-7">Sign in to your account</div>

          <q-form @submit="onSubmit" class="q-gutter-y-md">
            <q-input v-model="email" label="Email Address" outlined dense>
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <q-input v-model="password" label="Password" outlined dense type="password">
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
            </q-input>

            <div class="row justify-between items-center q-mb-lg">
              <q-checkbox
                v-model="rememberMe"
                label="Remember me"
                dense
                size="sm"
                color="primary"
              />
              <a
                href="#"
                class="text-primary text-weight-medium"
                style="text-decoration: none; font-size: 0.9em"
                >Forgot Password?</a
              >
            </div>

            <q-btn
              label="Login"
              type="submit"
              color="primary"
              class="full-width q-py-sm"
              unelevated
              size="lg"
              to="/dashboard"
            />
          </q-form>
        </div>
      </div>
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
