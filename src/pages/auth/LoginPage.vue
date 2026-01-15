<template>
  <q-page class="window-height window-width bg-grey-2">
    <div class="column items-center justify-center full-height">
      <q-card shadow-10 bordered class="glass-card q-pa-xl" style="max-width: 420px; width: 100%">
        
        <div class="column items-center justify-center q-mb-md">
          <q-avatar size="100px" class="bg-white shadow-2 q-mb-sm">
            <q-img 
              :src="displayLogo" 
              spinner-color="primary"
              alt="System Logo"
              fit="contain"
              style="height: 100%; width: 100%"
            />
          </q-avatar>
          <div class="text-h5 text-weight-bold text-primary q-mt-xs text-center">
            {{ systemName }}
          </div>
        </div>

        <div class="text-caption text-center q-mb-lg text-grey-7">Sign in to continue</div>

        <q-form @submit="onLoginSubmit" class="q-gutter-y-md">
          <q-input
            v-model="identifier"
            label="Email or Username"
            dense
            class="input-underline"
            :class="{ 'validation-error': isIdentifierError, 'validation-success': isIdentifierSuccess }"
            color="primary"
            :disable="loading"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
            <template v-slot:append>
              <q-icon name="check_circle" color="positive" v-if="isIdentifierSuccess" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            label="Password"
            dense
            :type="isPwdHidden ? 'password' : 'text'"
            class="input-underline"
            color="primary"
            :disable="loading"
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

          <div class="column items-center q-mt-lg">
            <q-btn
              label="Login"
              type="submit"
              color="primary"
              rounded
              class="q-px-xl full-width"
              size="md"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/features/index.js'
import { useSystemSettingsStore } from 'src/stores/systemSettingsStore' // Import the store
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from 'src/services/firebase'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const systemStore = useSystemSettingsStore() // Initialize store

const identifier = ref('')
const password = ref('')
const isPwdHidden = ref(true)
const loading = ref(false)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernamePattern = /^[a-zA-Z0-9_.]{3,30}$/

// --- Computed Properties for System Info ---
const displayLogo = computed(() => {
  // Use uploaded logo, or default path, or a hard fallback
  return systemStore.settings?.systemLogo || 
         systemStore.settings?.defaultLogo || 
         'https://cdn.quasar.dev/logo-v2/svg/logo.svg'
})

const systemName = computed(() => {
  return systemStore.settings?.systemName || 'POS System'
})

// Fetch settings when the login page mounts
onMounted(async () => {
  await systemStore.fetchSettings()
})

const isIdentifierSuccess = computed(() => {
  if (!identifier.value) return false
  return emailPattern.test(identifier.value) || usernamePattern.test(identifier.value)
})

const isIdentifierError = computed(() => {
  if (!identifier.value) return false
  return !emailPattern.test(identifier.value) && !usernamePattern.test(identifier.value)
})

const onLoginSubmit = async () => {
  if (!identifier.value || !password.value) {
    $q.notify({ type: 'warning', message: 'Please enter email/username and password' })
    return
  }
  if (password.value.length < 6) {
    $q.notify({ type: 'warning', message: 'Password must be at least 6 characters' })
    return
  }

  loading.value = true

  try {
    const adminEmail = authStore.user.email
    const adminUsername = authStore.user.username
    const adminPassword = authStore.user.password
    
    const isAdminIdentifier =
      identifier.value.toLowerCase() === adminEmail.toLowerCase() ||
      identifier.value.toLowerCase() === adminUsername.toLowerCase()

    if (isAdminIdentifier && password.value === adminPassword) {
      $q.notify({
        color: 'positive',
        message: 'Admin login successful',
        icon: 'verified_user',
        position: 'top',
      })
      router.push('/ordering')
      return
    }

    let resolvedEmail = ''
    if (emailPattern.test(identifier.value)) {
      resolvedEmail = identifier.value
    } else {
      const q = query(collection(db, 'users'), where('username', '==', identifier.value), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) {
        $q.notify({ color: 'negative', message: 'Username not found', icon: 'report_problem' })
        loading.value = false
        return
      }
      const doc = snap.docs[0]
      const data = doc.data()
      resolvedEmail = data.email
      if (!resolvedEmail || !emailPattern.test(resolvedEmail)) {
        $q.notify({ color: 'negative', message: 'User account has no valid email', icon: 'report_problem' })
        loading.value = false
        return
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, password.value)

    console.log('Login successful:', userCredential.user.uid)

    $q.notify({
      color: 'positive',
      message: 'Login successful!',
      icon: 'check',
      position: 'top',
    })

    router.push('/ordering')
  } catch (error) {
    console.error('Login Error:', error.code)

    let msg = 'Login failed. Please try again.'
    if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.'
    if (error.code === 'auth/user-not-found') msg = 'Account not found.'
    if (error.code === 'auth/wrong-password') msg = 'Incorrect password.'
    if (error.code === 'auth/too-many-requests')
      msg = 'Too many attempts. Account temporarily locked.'
    if (error.code === 'auth/invalid-email') msg = 'Invalid email format.'

    $q.notify({
      color: 'negative',
      message: msg,
      icon: 'report_problem',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
  color: #c10015;
}

.validation-error :deep(.q-field__control:after) {
  background: #c10015;
  transform: scaleX(1);
}

.validation-success :deep(.q-field__label) {
  color: #21ba45;
}

.validation-success :deep(.q-field__control:after) {
  background: #21ba45;
  transform: scaleX(1);
}
</style>