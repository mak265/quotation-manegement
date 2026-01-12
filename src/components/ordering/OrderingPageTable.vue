<template>
  <div class="q-pa-md bg-grey-1 full-height">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card flat bordered class="shadow-1 rounded-borders bg-white">
          <div class="q-pa-md row items-center justify-between q-gutter-y-sm">
            <div>
              <div class="text-h6 text-weight-bold text-grey-9">Order Management</div>
              <div class="text-caption text-grey-6">Track and manage customer orders</div>
            </div>

            <q-btn
              color="primary"
              icon="add_shopping_cart"
              label="New POS Order"
              unelevated
              no-caps
              class="q-px-md"
              @click="showPOSDialog = true"
            />
          </div>

          <q-separator class="bg-grey-3" />

          <div class="q-pa-md bg-grey-1">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <q-input
                  v-model="searchQuery"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Search by ID or Customer..."
                >
                  <template v-slot:prepend>
                    <q-icon name="search" class="text-grey-5" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  v-model="statusFilter"
                  :options="statusOptions"
                  outlined
                  dense
                  bg-color="white"
                  emit-value
                  map-options
                  label="Filter Status"
                >
                  <template v-slot:prepend>
                    <q-icon name="filter_list" class="text-grey-5" />
                  </template>
                </q-select>
              </div>
            </div>
          </div>

          <q-table
            :rows="filteredOrders"
            :columns="columns"
            row-key="id"
            :loading="orderStore.loading"
            flat
            class="sticky-header-table"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:header="props">
              <q-tr :props="props">
                <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-grey-7">
                  {{ col.label }}
                </q-th>
              </q-tr>
            </template>

            <template v-slot:body-cell-id="props">
              <q-td :props="props">
                <span class="text-mono text-grey-8 text-weight-medium"
                  >#{{ props.value.substring(0, 8) }}...</span
                >
                <q-tooltip>Full ID: {{ props.value }}</q-tooltip>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="getStatusColor(props.row.status)"
                  rounded
                  class="q-px-sm q-py-xs shadow-1"
                >
                  {{ props.row.status }}
                </q-badge>
              </q-td>
            </template>

            <template v-slot:body-cell-total="props">
              <q-td :props="props" class="text-weight-bold text-primary">
                {{
                  (() => {
                    const t = props.row.total ?? props.row.totalAmount
                    if (typeof t === 'number') return `$${t.toFixed(2)}`
                    const items = Array.isArray(props.row.items) ? props.row.items : []
                    const subtotal = items.reduce((s, i) => s + Number(i.unitPrice ?? i.price ?? 0) * Number(i.quantity ?? 1), 0)
                    return `$${subtotal.toFixed(2)}`
                  })()
                }}
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="row justify-center q-gutter-x-sm">
                  <q-btn flat round dense size="sm" color="grey-7" icon="visibility" @click="openReceipt(props.row)">
                    <q-tooltip>View Details</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="delete_outline"
                    color="negative"
                    @click="confirmDelete(props.row)"
                  >
                    <q-tooltip class="bg-negative">Delete Order</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center q-pa-lg text-grey-6">
                <div class="column items-center">
                  <q-icon name="assignment_late" size="48px" class="q-mb-sm text-grey-4" />
                  <div>No orders found matching your criteria.</div>
                </div>
              </div>
            </template>
          </q-table>
        </q-card>
      </div>

      <POSOrderDialog
        v-model="showPOSDialog"
        :products="productStore.products"
        @create="handleCreateOrder"
      />
      <ReceiptDialog v-model="showReceiptDialog" :order="selectedOrder" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '../../stores/orderStore.js'
import { useProductStore } from '../../stores/productStore.js'
import { useQuasar } from 'quasar'
import POSOrderDialog from 'src/components/ordering/POSOrderingDialog.vue'
import ReceiptDialog from 'src/components/ordering/ReceiptDialog.vue'

const $q = useQuasar()
const orderStore = useOrderStore()
const productStore = useProductStore()

const searchQuery = ref('')
const statusFilter = ref('All')
const showPOSDialog = ref(false)
const showReceiptDialog = ref(false)
const selectedOrder = ref(null)
const statusOptions = ['All', 'Pending', 'Paid', 'Shipped', 'Cancelled']

const columns = [
  { name: 'id', label: 'Order ID', field: 'id', align: 'left', style: 'width: 150px' },
  { name: 'customerName', label: 'Customer', field: 'customerName', align: 'left', sortable: true },
  {
    name: 'date',
    label: 'Date',
    field: (row) => row.date ?? row.createdAt,
    align: 'left',
    sortable: true,
    format: (val) => {
      try {
        if (val && typeof val.toDate === 'function') {
          return val.toDate().toLocaleDateString()
        }
        const d = new Date(val)
        return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString()
      } catch {
        return '-'
      }
    },
  },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'total', label: 'Total Amount', field: 'total', align: 'right', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'center', style: 'width: 100px' },
]

onMounted(async () => {
  await orderStore.fetchOrders()
  await productStore.fetchProducts()
})

const filteredOrders = computed(() => {
  let list = orderStore.orders || []
  if (statusFilter.value !== 'All') list = list.filter((o) => o.status === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (o) =>
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q)),
    )
  }
  return list
})

const getStatusColor = (status) => {
  const map = {
    Pending: 'orange-7',
    Paid: 'green-6',
    Shipped: 'blue-6',
    Cancelled: 'red-5',
  }
  return map[status] || 'grey-6'
}

const handleCreateOrder = async (orderData) => {
  try {
    const payload = {
      ...orderData,
      date: new Date().toISOString(),
    }
    await orderStore.addOrder(payload)
    $q.notify({ color: 'positive', icon: 'check_circle', message: 'Order successfully created' })
    showPOSDialog.value = false
  } catch (err) {
    console.error(err)
    $q.notify({ color: 'negative', icon: 'error', message: 'Failed to create order' })
  }
}

const confirmDelete = (order) => {
  $q.dialog({
    title: 'Delete Order',
    message: `Are you sure you want to delete order #${order.id.substring(0, 8)}?`,
    // cancel: true, // <--- REMOVE THIS LINE
    persistent: true,
    ok: { label: 'Delete', color: 'negative', flat: true },
    cancel: { label: 'Cancel', color: 'grey-8', flat: true }, // Keep this detailed one
  }).onOk(async () => {
    await orderStore.deleteOrder(order.id)
    $q.notify({ message: 'Order deleted', color: 'grey-8', icon: 'delete' })
  })
}

const openReceipt = (order) => {
  selectedOrder.value = order
  showReceiptDialog.value = true
}
</script>

<style scoped>
.text-mono {
  font-family: 'Roboto Mono', monospace;
}
</style>
