<template>
  <q-card>
    <q-card-section>
      <div class="text-h6 text-blue-grey-8 q-mb-md">User List</div>

      <div class="row items-center justify-between q-mb-md">
        <div class="col-12 col-md-4">
          <q-input
            outlined
            v-model="search"
            placeholder="Search users..."
            dense
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </div>

      <q-table
        :rows="filteredUsers"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        flat
        bordered
      >
        <template v-slot:body-cell-roles="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <q-badge 
                v-for="role in props.row.roles" 
                :key="role" 
                :color="getRoleColor(role)"
                class="q-px-sm q-py-xs"
              >
                {{ getPermissionLabel(role) }}
              </q-badge>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="row no-wrap q-gutter-xs">
              <q-btn
                icon="add_box"
                size="sm"
                color="green"
                dense
                flat
                @click="$emit('manage-roles', props.row)"
                title="Manage Roles"
              />
              <q-btn
                icon="edit"
                size="sm"
                color="primary"
                dense
                flat
                @click="$emit('edit', props.row)"
                title="Edit User"
              />
              <q-btn
                icon="delete"
                size="sm"
                color="negative"
                dense
                flat
                @click="$emit('delete', props.row.id)"
                title="Delete User"
              />
            </div>
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center text-grey-6 q-pa-lg">
            <q-icon name="person_off" size="2em" class="q-mr-sm" />
            <span>No users found</span>
          </div>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  users: { type: Array, default: () => [] },
  availableRoles: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, default: () => ({ sortBy: 'id', descending: false, page: 1, rowsPerPage: 10 }) },
})

defineEmits(['manage-roles', 'edit', 'delete'])

const search = ref('')

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true, width: '70px' },
  { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
  { name: 'roles', label: 'All Roles', field: 'roles', align: 'left', sortable: true },
  { name: 'createdAt', label: 'Created Date', field: 'createdAt', align: 'left', sortable: true, width: '120px' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center', sortable: false, width: '150px' },
]

const filteredUsers = computed(() => {
  let filtered = props.users
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.roles?.some(role => role.toLowerCase().includes(searchTerm))
    )
  }
  return filtered
})

const getPermissionLabel = (value) => {
  const found = (props.availableRoles || []).find((r) => r.value === value)
  return found ? found.label : value
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
</style>
