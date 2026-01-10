<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Inventory Management</div>
            <div class="text-subtitle2">Manage your products and stock levels</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-md-4">
                <q-input v-model="searchQuery" outlined dense placeholder="Search products...">
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-8">
                <q-btn
                  color="primary"
                  icon="add"
                  label="Add Product"
                  @click="showAddProductDialog = true"
                />
                <q-btn
                  color="secondary"
                  icon="download"
                  label="Export"
                  class="q-ml-sm"
                  @click="exportInventory"
                />
              </div>
            </div>

            <q-table
              :rows="filteredProducts"
              :columns="columns"
              row-key="id"
              :loading="loading"
              flat
              bordered
            >
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    color="primary"
                    @click="editProduct(props.row)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    @click="deleteProduct(props.row)"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-stock="props">
                <q-td :props="props">
                  <q-chip
                    :color="
                      props.row.stock < 10
                        ? 'negative'
                        : props.row.stock < 50
                          ? 'warning'
                          : 'positive'
                    "
                    text-color="white"
                    dense
                  >
                    {{ props.row.stock }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Add/Edit Product Dialog -->
    <q-dialog v-model="showAddProductDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingProduct ? 'Edit Product' : 'Add Product' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveProduct">
            <q-input
              v-model="productForm.name"
              label="Product Name"
              outlined
              dense
              class="q-mb-md"
              required
            />
            <q-input
              v-model="productForm.sku"
              label="SKU"
              outlined
              dense
              class="q-mb-md"
              required
            />
            <q-input
              v-model.number="productForm.price"
              label="Price"
              type="number"
              outlined
              dense
              class="q-mb-md"
              required
            />
            <q-input
              v-model.number="productForm.stock"
              label="Stock Quantity"
              type="number"
              outlined
              dense
              class="q-mb-md"
              required
            />
            <q-select
              v-model="productForm.category"
              :options="categories"
              label="Category"
              outlined
              dense
              class="q-mb-md"
              required
            />
            <q-input
              v-model="productForm.description"
              label="Description"
              type="textarea"
              outlined
              dense
              class="q-mb-md"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeProductDialog" />
          <q-btn flat label="Save" color="primary" @click="saveProduct" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const searchQuery = ref('')
const loading = ref(false)
const showAddProductDialog = ref(false)
const editingProduct = ref(null)

const productForm = reactive({
  name: '',
  sku: '',
  price: 0,
  stock: 0,
  category: '',
  description: '',
})

const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']

const columns = [
  { name: 'name', label: 'Product Name', field: 'name', align: 'left' },
  { name: 'sku', label: 'SKU', field: 'sku', align: 'left' },
  { name: 'category', label: 'Category', field: 'category', align: 'left' },
  {
    name: 'price',
    label: 'Price',
    field: 'price',
    align: 'right',
    format: (val) => `$${val.toFixed(2)}`,
  },
  { name: 'stock', label: 'Stock', field: 'stock', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const products = ref([
  {
    id: 1,
    name: 'Laptop Pro 15',
    sku: 'LAP-001',
    category: 'Electronics',
    price: 1299.99,
    stock: 25,
    description: 'High-performance laptop',
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    sku: 'MOU-002',
    category: 'Electronics',
    price: 29.99,
    stock: 150,
    description: 'Ergonomic wireless mouse',
  },
  {
    id: 3,
    name: 'Cotton T-Shirt',
    sku: 'TSH-003',
    category: 'Clothing',
    price: 19.99,
    stock: 5,
    description: 'Comfortable cotton t-shirt',
  },
  {
    id: 4,
    name: 'JavaScript Guide',
    sku: 'BOK-004',
    category: 'Books',
    price: 39.99,
    stock: 75,
    description: 'Complete JavaScript programming guide',
  },
])

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  return products.value.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const editProduct = (product) => {
  editingProduct.value = product
  Object.assign(productForm, product)
  showAddProductDialog.value = true
}

const deleteProduct = (product) => {
  if (confirm(`Are you sure you want to delete ${product.name}?`)) {
    products.value = products.value.filter((p) => p.id !== product.id)
  }
}

const saveProduct = () => {
  if (editingProduct.value) {
    const index = products.value.findIndex((p) => p.id === editingProduct.value.id)
    products.value[index] = { ...editingProduct.value, ...productForm }
  } else {
    const newProduct = {
      id: Date.now(),
      ...productForm,
    }
    products.value.push(newProduct)
  }
  closeProductDialog()
}

const closeProductDialog = () => {
  showAddProductDialog.value = false
  editingProduct.value = null
  Object.assign(productForm, {
    name: '',
    sku: '',
    price: 0,
    stock: 0,
    category: '',
    description: '',
  })
}

const exportInventory = () => {
  console.log('Exporting inventory data...')
  // Add export functionality here
}
</script>
