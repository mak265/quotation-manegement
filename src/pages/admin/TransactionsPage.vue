<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row justify-center">
      <div class="col-12" style="max-width: 1400px">
        
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h5 text-weight-bold text-blue-grey-9">Transactions</div>
            <div class="text-caption text-grey-7">Manage and track your order history</div>
          </div>
          <q-btn 
            color="primary" 
            icon="cloud_download" 
            label="Export Report" 
            no-caps 
            unelevated 
            class="radius-8"
            @click="exportTransactions" 
          />
        </div>

        <q-card class="shadow-2 rounded-xl bg-white overflow-hidden">
          
          <div class="q-pa-md border-bottom-light">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input 
                  v-model="searchQuery" 
                  outlined 
                  dense 
                  placeholder="Search order #, customer..."
                  class="rounded-input"
                  bg-color="grey-1"
                >
                  <template v-slot:prepend>
                    <q-icon name="search" class="text-grey-5" />
                  </template>
                  <template v-slot:append v-if="searchQuery">
                    <q-icon name="cancel" @click="searchQuery = ''" class="cursor-pointer text-grey-5" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <q-input 
                  v-model="fromDate" 
                  outlined 
                  dense 
                  label="From Date" 
                  readonly
                  class="rounded-input"
                  bg-color="grey-1"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" class="text-primary" />
                  </template>
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="fromDate" mask="YYYY-MM-DD" today-btn color="primary" />
                  </q-popup-proxy>
                </q-input>
              </div>
              <div class="col-12 col-md-3">
                <q-input 
                  v-model="toDate" 
                  outlined 
                  dense 
                  label="To Date" 
                  readonly
                  class="rounded-input"
                  bg-color="grey-1"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" class="text-primary" />
                  </template>
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="toDate" mask="YYYY-MM-DD" today-btn color="primary" />
                  </q-popup-proxy>
                </q-input>
              </div>
            </div>
          </div>

          <q-table
            :rows="filteredTransactions"
            :columns="columns"
            row-key="id"
            flat
            class="sticky-header-table"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50]"
          >
            <template v-slot:header="props">
              <q-tr :props="props">
                <q-th 
                  v-for="col in props.cols" 
                  :key="col.name" 
                  :props="props"
                  class="text-uppercase text-grey-7 text-weight-bold bg-grey-1"
                >
                  {{ col.label }}
                </q-th>
              </q-tr>
            </template>

            <template v-slot:body-cell-id="props">
              <q-td :props="props" class="text-grey-7">
                {{ (pagination.page - 1) * pagination.rowsPerPage + props.rowIndex + 1 }}
              </q-td>
            </template>

            <template v-slot:body-cell-customerName="props">
              <q-td :props="props">
                <div class="text-weight-medium text-blue-grey-9">{{ props.value }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge 
                  :color="getStatusColor(props.value)" 
                  class="q-px-sm q-py-xs text-weight-medium"
                  rounded
                >
                  {{ props.value }}
                </q-badge>
              </q-td>
            </template>

            <template v-slot:body-cell-total="props">
              <q-td :props="props" class="text-right">
                <span class="text-primary text-weight-bold" style="font-size: 1.1em">
                   {{ props.value }}
                </span>
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center q-pa-xl text-grey-5">
                <div class="column items-center">
                  <q-icon size="4rem" name="receipt_long" class="q-mb-md opacity-50" />
                  <div class="text-h6">No transactions found</div>
                  <div class="text-caption">Try adjusting your filters</div>
                </div>
              </div>
            </template>

          </q-table>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '../../stores/orderStore'

const orderStore = useOrderStore()

const searchQuery = ref('')
const fromDate = ref('')
const toDate = ref('')

const pagination = ref({
  sortBy: 'date',
  descending: true,
  page: 1,
  rowsPerPage: 10
})

const normalizeDate = (d) => {
  if (!d) return null
  if (typeof d?.toDate === 'function') return d.toDate()
  const js = new Date(d)
  return Number.isNaN(js.getTime()) ? null : js
}

const getStatusColor = (status) => {
  if (!status) return 'grey'
  const s = status.toLowerCase()
  if (s === 'paid' || s === 'completed') return 'positive'
  if (s === 'pending') return 'warning'
  if (s === 'cancelled') return 'negative'
  if (s === 'shipped') return 'info'
  return 'grey-7'
}

const computeTotal = (row) => {
  const t = row.total ?? row.totalAmount
  if (typeof t === 'number') return t
  const items = Array.isArray(row.items) ? row.items : []
  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice ?? i.price ?? 0) * Number(i.quantity ?? 1), 0)
  const tax = Number(row.taxAmount ?? 0)
  const discount = Number(row.discountAmount ?? 0)
  return subtotal + tax - discount
}

const columns = [
  { name: 'id', label: '#', field: 'id', align: 'left', sortable: false, style: 'width: 60px' },
  { name: 'customerName', label: 'Customer', field: 'customerName', align: 'left', sortable: true },
  { 
    name: 'date', 
    label: 'Date & Time', 
    field: row => row.date ?? row.createdAt, 
    align: 'left', 
    sortable: true, 
    format: val => {
      const d = normalizeDate(val)
      if (!d) return '-'
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } 
  },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { 
    name: 'total', 
    label: 'Total', 
    field: row => computeTotal(row), 
    align: 'right', 
    sortable: true, 
    format: val => `₱${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
  },
]

const filteredTransactions = computed(() => {
  let list = orderStore.orders || []
  const from = fromDate.value ? new Date(fromDate.value) : null
  const to = toDate.value ? new Date(toDate.value + 'T23:59:59') : null
  
  if (from || to) {
    list = list.filter(t => {
      const d = normalizeDate(t.date || t.createdAt)
      if (!d) return false
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t =>
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.customerName && t.customerName.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q))
    )
  }
  return list
})

const exportTransactions = () => {
  console.log('Exporting...', filteredTransactions.value.length)
}

onMounted(async () => {
  if (!orderStore.orders.length) {
    await orderStore.fetchOrders()
  }
})
</script>

<style scoped>
.rounded-xl {
  border-radius: 12px;
}

.radius-8 {
  border-radius: 8px;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 8px;
}

.border-bottom-light {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.q-table tbody tr:hover) {
  background-color: #fafafa;
}

.opacity-50 {
  opacity: 0.5;
}
</style>