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
              :loading="productStore.loading"
              flat
              bordered
            >
              <template v-slot:no-data="{ filter }">
                <div class="full-width row flex-center q-gutter-sm q-pa-lg text-grey-8">
                  <q-icon size="2em" :name="filter ? 'filter_list_off' : 'inventory_2'" />
                  <span>
                    {{ filter ? 'No matches found for your search' : 'No products found in inventory' }}
                  </span>
                  <q-btn
                    v-if="!filter"
                    flat
                    color="primary"
                    label="Add your first product"
                    @click="showAddProductDialog = true"
                  />
                </div>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat round dense
                    icon="edit"
                    color="primary"
                    @click="openEditDialog(props.row)"
                  />
                  <q-btn
                    flat round dense
                    icon="delete"
                    color="negative"
                    @click="confirmDelete(props.row)"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-stock="props">
                <q-td :props="props">
                  <q-chip
                    :color="props.row.stock < 10 ? 'negative' : props.row.stock < 50 ? 'warning' : 'positive'"
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

    <q-dialog v-model="showAddProductDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingProduct ? 'Edit Product' : 'Add Product' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleSaveProduct" id="productForm">
            <q-input v-model="productForm.name" label="Product Name" outlined dense class="q-mb-md" required />
            <q-input v-model="productForm.sku" label="SKU" outlined dense class="q-mb-md" required />
            <q-input v-model.number="productForm.price" label="Price" type="number" outlined dense class="q-mb-md" required />
            <q-input v-model.number="productForm.stock" label="Stock Quantity" type="number" outlined dense class="q-mb-md" required />
            <q-select v-model="productForm.category" :options="categories" label="Category" outlined dense class="q-mb-md" required />
            <q-input v-model="productForm.description" label="Description" type="textarea" outlined dense class="q-mb-md" />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeProductDialog" />
          <q-btn 
            flat 
            label="Save" 
            color="primary" 
            type="submit" 
            form="productForm"
            :loading="productStore.loading" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const productStore = useProductStore()

const searchQuery = ref('')
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
  { name: 'name', label: 'Product Name', field: 'name', align: 'left', sortable: true },
  { name: 'sku', label: 'SKU', field: 'sku', align: 'left', sortable: true },
  { name: 'category', label: 'Category', field: 'category', align: 'left', sortable: true },
  {
    name: 'price',
    label: 'Price',
    field: 'price',
    align: 'right',
    sortable: true,
    format: (val) => `$${Number(val).toFixed(2)}`,
  },
  { name: 'stock', label: 'Stock', field: 'stock', align: 'center', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

onMounted(() => {
  productStore.fetchProducts()
})

const filteredProducts = computed(() => {
  const allProducts = productStore.products
  if (!searchQuery.value) return allProducts
  
  const query = searchQuery.value.toLowerCase()
  return allProducts.filter(
    (product) =>
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
  )
})

const openEditDialog = (product) => {
  editingProduct.value = product
  Object.assign(productForm, product)
  showAddProductDialog.value = true
}

const handleSaveProduct = async () => {
  try {
    if (editingProduct.value) {
      await productStore.updateProduct(editingProduct.value.id, { ...productForm })
      $q.notify({ color: 'positive', message: 'Product updated successfully', icon: 'check' })
    } else {
      await productStore.addProduct({ ...productForm })
      $q.notify({ color: 'positive', message: 'Product added successfully', icon: 'add' })
    }
    closeProductDialog()
  } catch {
    $q.notify({ color: 'negative', message: 'Error saving product', icon: 'report_problem' })
  }
}

const confirmDelete = (product) => {
  $q.dialog({
    title: 'Delete Product',
    message: `Are you sure you want to remove ${product.name}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await productStore.deleteProduct(product.id)
      $q.notify({ color: 'positive', message: 'Product deleted', icon: 'delete' })
    } catch {
      $q.notify({ color: 'negative', message: 'Error deleting product' })
    }
  })
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
  console.log('Exporting data:', productStore.products)
}
</script>