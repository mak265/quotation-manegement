<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Order Management</div>
            <div class="text-subtitle2">Process and track customer orders</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-md-4">
                <q-select
                  v-model="statusFilter"
                  :options="statusOptions"
                  outlined
                  dense
                  label="Filter by Status"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="searchQuery" outlined dense placeholder="Search orders...">
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-4">
                <q-btn
                  color="primary"
                  icon="add"
                  label="New Order"
                  @click="showNewOrderDialog = true"
                />
              </div>
            </div>

            <q-table
              :rows="filteredOrders"
              :columns="columns"
              row-key="id"
              :loading="loading"
              flat
              bordered
            >
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-chip :color="getStatusColor(props.row.status)" text-color="white" dense>
                    {{ props.row.status }}
                  </q-chip>
                </q-td>
              </template>

              <template v-slot:body-cell-total="props">
                <q-td :props="props"> ${{ props.row.total.toFixed(2) }} </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    round
                    dense
                    icon="visibility"
                    color="primary"
                    @click="viewOrder(props.row)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    color="warning"
                    @click="editOrder(props.row)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    @click="deleteOrder(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- New Order Dialog -->
    <q-dialog v-model="showNewOrderDialog" persistent maximized>
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-h6">Create New Order</div>
            </div>
            <div class="col-auto">
              <q-btn flat round dense icon="close" @click="closeOrderDialog" />
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-subtitle1">Customer Information</div>
                  <q-input
                    v-model="newOrder.customerName"
                    label="Customer Name"
                    outlined
                    dense
                    class="q-mb-md"
                    required
                  />
                  <q-input
                    v-model="newOrder.customerEmail"
                    label="Email"
                    type="email"
                    outlined
                    dense
                    class="q-mb-md"
                    required
                  />
                  <q-input
                    v-model="newOrder.customerPhone"
                    label="Phone"
                    outlined
                    dense
                    class="q-mb-md"
                  />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-subtitle1">Order Items</div>
                  <div
                    v-for="(item, index) in newOrder.items"
                    :key="index"
                    class="row q-col-gutter-sm q-mb-sm"
                  >
                    <div class="col-6">
                      <q-select
                        v-model="item.product"
                        :options="availableProducts"
                        label="Product"
                        outlined
                        dense
                      />
                    </div>
                    <div class="col-3">
                      <q-input
                        v-model.number="item.quantity"
                        label="Qty"
                        type="number"
                        outlined
                        dense
                        min="1"
                      />
                    </div>
                    <div class="col-3">
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        @click="removeOrderItem(index)"
                      />
                    </div>
                  </div>
                  <q-btn flat icon="add" label="Add Item" color="primary" @click="addOrderItem" />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row justify-between items-center">
            <div class="text-h6">Total: ${{ calculateOrderTotal.toFixed(2) }}</div>
            <div>
              <q-btn flat label="Cancel" color="primary" @click="closeOrderDialog" />
              <q-btn flat label="Create Order" color="primary" @click="createOrder" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const searchQuery = ref('')
const statusFilter = ref('All')
const loading = ref(false)
const showNewOrderDialog = ref(false)

const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const columns = [
  { name: 'id', label: 'Order ID', field: 'id', align: 'left' },
  { name: 'customerName', label: 'Customer', field: 'customerName', align: 'left' },
  { name: 'date', label: 'Order Date', field: 'date', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'items', label: 'Items', field: 'items', align: 'center', format: (val) => val.length },
  { name: 'total', label: 'Total', field: 'total', align: 'right' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const orders = ref([
  {
    id: 'ORD-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    date: '2024-01-15',
    status: 'Pending',
    items: [
      { product: 'Laptop Pro 15', quantity: 1, price: 1299.99 },
      { product: 'Wireless Mouse', quantity: 2, price: 29.99 },
    ],
    total: 1359.97,
  },
  {
    id: 'ORD-002',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    date: '2024-01-14',
    status: 'Processing',
    items: [{ product: 'Cotton T-Shirt', quantity: 3, price: 19.99 }],
    total: 59.97,
  },
  {
    id: 'ORD-003',
    customerName: 'Bob Johnson',
    customerEmail: 'bob@example.com',
    date: '2024-01-13',
    status: 'Shipped',
    items: [
      { product: 'JavaScript Guide', quantity: 1, price: 39.99 },
      { product: 'Wireless Mouse', quantity: 1, price: 29.99 },
    ],
    total: 69.98,
  },
])

const availableProducts = ['Laptop Pro 15', 'Wireless Mouse', 'Cotton T-Shirt', 'JavaScript Guide']

const newOrder = reactive({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  items: [],
  status: 'Pending',
})

const filteredOrders = computed(() => {
  let filtered = orders.value

  if (statusFilter.value !== 'All') {
    filtered = filtered.filter((order) => order.status === statusFilter.value)
  }

  if (searchQuery.value) {
    filtered = filtered.filter(
      (order) =>
        order.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  return filtered
})

const calculateOrderTotal = computed(() => {
  return newOrder.items.reduce((total, item) => {
    const productPrice = getProductPrice(item.product)
    return total + productPrice * item.quantity
  }, 0)
})

const getStatusColor = (status) => {
  const colors = {
    Pending: 'warning',
    Processing: 'info',
    Shipped: 'primary',
    Delivered: 'positive',
    Cancelled: 'negative',
  }
  return colors[status] || 'grey'
}

const getProductPrice = (productName) => {
  const prices = {
    'Laptop Pro 15': 1299.99,
    'Wireless Mouse': 29.99,
    'Cotton T-Shirt': 19.99,
    'JavaScript Guide': 39.99,
  }
  return prices[productName] || 0
}

const addOrderItem = () => {
  newOrder.items.push({ product: '', quantity: 1, price: 0 })
}

const removeOrderItem = (index) => {
  newOrder.items.splice(index, 1)
}

const createOrder = () => {
  const order = {
    id: `ORD-${String(orders.value.length + 1).padStart(3, '0')}`,
    customerName: newOrder.customerName,
    customerEmail: newOrder.customerEmail,
    customerPhone: newOrder.customerPhone,
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    items: newOrder.items.filter((item) => item.product && item.quantity > 0),
    total: calculateOrderTotal.value,
  }

  orders.value.push(order)
  closeOrderDialog()
}

const viewOrder = (order) => {
  console.log('Viewing order:', order)
}

const editOrder = (order) => {
  console.log('Editing order:', order)
}

const deleteOrder = (order) => {
  if (confirm(`Are you sure you want to delete order ${order.id}?`)) {
    orders.value = orders.value.filter((o) => o.id !== order.id)
  }
}

const closeOrderDialog = () => {
  showNewOrderDialog.value = false
  Object.assign(newOrder, {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    status: 'Pending',
  })
}

// Initialize with one empty order item
addOrderItem()
</script>
