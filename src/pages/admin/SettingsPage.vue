<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row justify-center">
      <div class="col-12 col-md-8" style="max-width: 900px">
        
        <div class="text-h5 text-weight-bold text-blue-grey-9 q-mb-md">
          System Configuration
        </div>

        <q-card class="shadow-2 rounded-xl bg-white q-pa-md">
          
          <div class="row q-col-gutter-lg">
            
            <div class="col-12 col-md-5 column items-center text-center">
              <div class="text-subtitle1 text-weight-medium q-mb-sm text-grey-8">System Logo</div>
              
              <q-avatar size="150px" class="shadow-3 q-mb-md bg-grey-3">
                <q-img 
                  :src="previewImage || form.defaultLogo" 
                  spinner-color="primary"
                  style="height: 100%; width: 100%"
                  fit="contain"
                />
                <q-btn
                  round
                  color="primary"
                  icon="edit"
                  size="sm"
                  class="absolute-bottom-right"
                  style="bottom: 10px; right: 10px"
                  @click="$refs.fileInput.pickFiles()"
                />
              </q-avatar>

              <q-file
                ref="fileInput"
                v-model="logoFile"
                accept=".jpg, .png, .jpeg"
                style="display: none"
                @update:model-value="handleFileSelect"
              />

              <div class="q-gutter-sm">
                 <q-btn 
                  flat 
                  dense 
                  color="negative" 
                  label="Reset to Default" 
                  size="sm" 
                  icon="restart_alt"
                  @click="resetLogo"
                  v-if="form.systemLogo"
                />
              </div>
              
              <div class="text-caption text-grey-6 q-mt-sm">
                Recommended size: 500x500px <br> Max size: 2MB
              </div>
            </div>

            <div class="col-12 col-md-7 column justify-center">
              <div class="text-subtitle1 text-weight-medium q-mb-sm text-grey-8">General Information</div>
              
              <q-form @submit="onSubmit" class="q-gutter-y-md">
                
                <q-input
                  v-model="form.systemName"
                  label="System Name / Store Name"
                  outlined
                  dense
                  bg-color="grey-1"
                  :rules="[val => !!val || 'System Name is required']"
                >
                  <template v-slot:prepend>
                    <q-icon name="store" color="primary" />
                  </template>
                </q-input>

                <q-input
                  v-model="form.defaultLogo"
                  label="Default Logo Path"
                  outlined
                  dense
                  readonly
                  bg-color="grey-2"
                  class="text-grey-7"
                >
                  <template v-slot:prepend>
                    <q-icon name="image" color="grey" />
                  </template>
                </q-input>

                <div class="row justify-end q-mt-lg">
                  <q-btn 
                    label="Save Changes" 
                    type="submit" 
                    color="primary" 
                    icon="save" 
                    unelevated
                    class="full-width rounded-borders" 
                    :loading="store.loading"
                  />
                </div>

              </q-form>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSystemSettingsStore } from 'src/stores/systemSettingsStore'
import { SystemSettingsModel } from 'src/services/models/SystemSettings.js'

const $q = useQuasar()
const store = useSystemSettingsStore()
const fileInput = ref(null)

// Local state for the form
const form = reactive(new SystemSettingsModel())
const logoFile = ref(null)
const previewUrl = ref(null)

// Computed for the image source
const previewImage = computed(() => {
  if (previewUrl.value) return previewUrl.value // Newly uploaded preview
  if (form.systemLogo) return form.systemLogo   // Saved database logo
  return null // Fallback to form.defaultLogo in template
})

const handleFileSelect = (file) => {
  if (!file) return

  // Create local preview
  previewUrl.value = URL.createObjectURL(file)

  // Convert to Base64 for Firestore storage
  const reader = new FileReader()
  reader.onload = (e) => {
    form.systemLogo = e.target.result
  }
  reader.readAsDataURL(file)
}

const resetLogo = () => {
  logoFile.value = null
  previewUrl.value = null
  form.systemLogo = null // This triggers the template to show defaultLogo
}

const onSubmit = async () => {
  await store.saveSettings({
    id: form.id,
    systemName: form.systemName,
    systemLogo: form.systemLogo
  })
  
  $q.notify({
    type: 'positive',
    message: 'System settings updated successfully',
    position: 'top'
  })
}

onMounted(async () => {
  await store.fetchSettings()
  if (store.settings) {
    // Populate form with store data
    Object.assign(form, store.settings)
  }
})
</script>

<style scoped>
.rounded-xl {
  border-radius: 16px;
}
</style>