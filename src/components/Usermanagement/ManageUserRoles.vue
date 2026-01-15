<template>
  <q-dialog v-model="localDialog" persistent position="right" full-height>
    <q-card class="q-dialog-plugin" style="min-width: 450px; height: 100vh">
      <q-card-section class="row items-center justify-between bg-primary text-white q-pb-md">
        <div class="text-h6">Manage User Roles</div>
        <q-btn flat round dense icon="close" color="white" v-close-popup size="sm" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-card flat bordered class="q-mb-md bg-blue-grey-1">
          <q-card-section class="q-pa-sm">
            <div class="row items-center no-wrap">
              <q-avatar color="primary" text-color="white" size="md" class="q-mr-sm">
                {{ props.selectedUser?.username?.charAt(0).toUpperCase() }}
              </q-avatar>
              <div>
                <div class="text-subtitle1 text-weight-bold text-blue-grey-10">
                  {{ props.selectedUser?.username }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="q-mb-md">
          <div class="text-subtitle2 text-weight-medium text-blue-grey-9 q-mb-xs">
            Current Roles
            <q-badge color="grey" class="q-ml-xs" :label="selectedRoles.length" />
          </div>
          <div class="q-gutter-xs">
            <q-chip 
              v-for="role in selectedRoles" 
              :key="role" 
              :color="getRoleColor(role)"
              text-color="white"
              dense
              removable
              @remove="removeRole(role)"
            >
              <q-avatar :color="getRoleDarkColor(role)" text-color="white">
                {{ getPermissionLabel(role)?.charAt(0).toUpperCase() }}
              </q-avatar>
              {{ getPermissionLabel(role) }}
            </q-chip>
            <div v-if="!selectedRoles.length" class="text-caption text-grey-6 q-pa-sm">
              No roles assigned yet
            </div>
          </div>
        </div>

        <q-separator spaced />

        <div class="q-mb-md">
          <div class="text-subtitle2 text-weight-medium text-blue-grey-9 q-mb-xs">
            Available Roles
          </div>

          <div class="row q-col-gutter-xs q-mb-md">
            <q-btn outline size="sm" color="primary" label="Select All" @click="selectAllRoles" class="col" />
            <q-btn outline size="sm" color="grey" label="Clear All" @click="clearAllRoles" class="col" />
          </div>

          <q-list bordered class="rounded-borders">
            <q-item 
              v-for="role in props.availableRoles" 
              :key="role.value"
              clickable
              v-ripple
              :class="{ 'bg-blue-1': selectedRoles.includes(role.value) }"
              @click="toggleRole(role.value)"
            >
              <q-item-section avatar>
                <q-checkbox 
                  v-model="selectedRoles" 
                  :val="role.value" 
                  color="primary"
                  @click.stop
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ role.label }}
                </q-item-label>
                <q-item-label caption>
                  {{ getRoleDescription(role.value) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="getRoleColor(role.value)" :label="role.label" class="text-caption" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-banner v-if="selectedRoles.length > 0" dense class="bg-green-1 text-green-9 q-mb-md">
          <template v-slot:avatar>
            <q-icon name="check_circle" color="green" />
          </template>
          {{ selectedRoles.length }} role(s) selected
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" color="grey" v-close-popup class="q-px-lg" />
        <q-btn 
          label="Apply Roles" 
          color="green"
          @click="save"
          :disable="!selectedRoles.length"
          class="q-px-lg"
          icon-right="check"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  selectedUser: { type: Object, default: () => null },
  availableRoles: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])

const localDialog = ref(props.modelValue)
const selectedRoles = ref([])

watch(() => props.modelValue, (val) => {
  localDialog.value = val
})

watch(localDialog, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.selectedUser, (user) => {
  selectedRoles.value = [...(user?.roles || [])]
}, { immediate: true })

const toggleRole = (role) => {
  const index = selectedRoles.value.indexOf(role)
  if (index === -1) {
    selectedRoles.value.push(role)
  } else {
    selectedRoles.value.splice(index, 1)
  }
}

const selectAllRoles = () => {
  selectedRoles.value = (props.availableRoles || []).map((role) => role.value)
}

const clearAllRoles = () => {
  selectedRoles.value = []
}

const removeRole = (role) => {
  const index = selectedRoles.value.indexOf(role)
  if (index !== -1) {
    selectedRoles.value.splice(index, 1)
  }
}

const save = () => {
  if (!props.selectedUser) return
  emit('save', [...selectedRoles.value])
  localDialog.value = false
}

const getPermissionLabel = (value) => {
  const found = (props.availableRoles || []).find((r) => r.value === value)
  return found ? found.label : value
}

const getRoleDescription = (value) => {
  const found = (props.availableRoles || []).find((r) => r.value === value)
  return found?.caption || 'Sidebar access'
}

const getRoleDarkColor = (role) => {
  switch (role) {
    case 'admin': return 'red-9'
    case 'manager': return 'orange-9'
    case 'user': return 'blue-9'
    case 'editor': return 'purple-9'
    case 'viewer': return 'green-9'
    default: return 'grey-9'
  }
}

const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'red'
    case 'manager': return 'orange'
    case 'user': return 'blue'
    case 'editor': return 'purple'
    case 'viewer': return 'green'
    default: return 'grey'
  }
}
</script>

<style scoped>
.q-dialog-plugin {
  border-radius: 8px 0 0 8px;
}
.q-item {
  transition: all 0.3s ease;
}
.q-item:hover {
  background-color: rgba(0, 150, 255, 0.05);
}
</style>
