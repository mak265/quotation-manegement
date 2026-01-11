<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-layout view="hHh lpR fFf" container class="bg-grey-2">
      <q-header class="bg-gradient-primary text-white shadow-2">
        <q-toolbar>
          <q-btn flat round dense icon="close" v-close-popup size="sm" />
          <q-toolbar-title class="text-weight-bold row items-center">
            <q-icon name="point_of_sale" size="32px" class="q-mr-sm" />
            <div>
              <div>POS Terminal</div>
              <div class="text-caption text-blue-1">V.2.0 • Premium Edition</div>
            </div>
          </q-toolbar-title>

          <div class="row items-center q-gutter-x-lg">
            <div class="text-center">
              <div class="text-caption text-blue-1">Current Session</div>
              <div class="text-subtitle1">{{ currentDate }}</div>
            </div>
            <q-separator vertical dark />
            <div class="text-center">
              <div class="text-caption text-blue-1">Operator</div>
              <div class="text-subtitle1">Admin</div>
            </div>
            <q-btn round flat icon="notifications" size="sm">
              <q-badge color="red" floating rounded>3</q-badge>
            </q-btn>
          </div>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="row no-wrap fit">
          <div class="col-8 column q-pa-md">
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-md-6">
                <div class="bg-white rounded-borders shadow-1 q-pa-sm">
                  <q-tabs
                    v-model="selectedCategory"
                    active-color="primary"
                    indicator-color="primary"
                    align="justify"
                    dense
                    class="text-grey-7"
                  >
                    <q-tab v-for="cat in categories" :key="cat" :name="cat" :label="cat" />
                  </q-tabs>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="row q-col-gutter-sm">
                  <div class="col-8">
                    <q-input
                      v-model="search"
                      outlined
                      dense
                      placeholder="Search products..."
                      bg-color="white"
                      class="shadow-1"
                    >
                      <template v-slot:prepend>
                        <q-icon name="search" color="primary" />
                      </template>
                      <template v-slot:append v-if="search">
                        <q-icon name="close" class="cursor-pointer" @click="search = ''" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="sortBy"
                      :options="sortOptions"
                      outlined
                      dense
                      bg-color="white"
                      class="shadow-1"
                      label="Sort by"
                    />
                  </div>
                </div>
              </div>
            </div>

            <q-scroll-area class="col q-pr-sm">
              <div class="row q-col-gutter-md">
                <div
                  v-for="product in sortedProducts"
                  :key="product.id"
                  class="col-12 col-sm-6 col-md-4 col-xl-3"
                >
                  <product-card :product="product" @add-to-cart="promptAddToCart" />
                </div>
              </div>
            </q-scroll-area>
          </div>

          <div class="col-4 bg-white column shadow-3-left">
            <customer-details v-model="customer" class="q-pa-md" />

            <q-separator />

            <q-scroll-area class="col q-px-md">
              <q-list separator>
                <q-item v-for="(item, index) in cart" :key="index" class="q-py-md">
                  <q-item-section avatar>
                    <q-img
                      :src="item.product.image"
                      style="width: 50px; height: 50px"
                      class="rounded-borders"
                    />
                  </q-item-section>

                  <q-item-section>
                    <div class="row items-center justify-between">
                      <div class="text-subtitle2">{{ item.product.name }}</div>
                      <div class="text-weight-bold">
                        ${{ (item.unitPrice * item.quantity).toFixed(2) }}
                      </div>
                    </div>

                    <div class="text-caption text-grey-7">
                      <span
                        v-if="item.selectedSize"
                        class="q-mr-xs text-primary text-weight-medium"
                      >
                        {{ item.selectedSize.label }}
                      </span>
                      <span v-if="item.selectedAddons && item.selectedAddons.length > 0">
                        + {{ item.selectedAddons.map((a) => a.label).join(', ') }}
                      </span>
                    </div>
                    <div v-if="item.note" class="text-caption text-italic text-grey-6">
                      "{{ item.note }}"
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <div class="row items-center no-wrap bg-grey-2 rounded-borders">
                      <q-btn
                        flat
                        dense
                        size="sm"
                        icon="remove"
                        @click="updateQuantity(index, -1)"
                      />
                      <div class="q-px-sm text-caption text-weight-bold">{{ item.quantity }}</div>
                      <q-btn flat dense size="sm" icon="add" @click="updateQuantity(index, 1)" />
                    </div>
                  </q-item-section>
                </q-item>

                <div v-if="cart.length === 0" class="text-center text-grey q-pa-xl">
                  <q-icon name="shopping_cart" size="40px" color="grey-4" />
                  <div class="q-mt-sm">Cart is empty</div>
                </div>
              </q-list>
            </q-scroll-area>

            <checkout-summary
              :subtotal="subtotal"
              :tax-rate="taxRate"
              :discount-rate="discountRate"
              :cart-length="cart.length"
              :customer-name="customer.name"
              @clear-cart="clearCart"
              @pay-now="submitOrder"
              @save-draft="saveAsDraft"
            />
          </div>
        </q-page>
      </q-page-container>

      <q-dialog v-model="customizationDialog" position="bottom">
        <q-card style="width: 500px; max-width: 100vw" class="rounded-borders-top">
          <div v-if="activeProduct">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">{{ activeProduct.name }}</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="row q-col-gutter-md">
              <div class="col-4">
                <q-img
                  :src="activeProduct.image"
                  class="rounded-borders"
                  style="height: 100px; object-fit: cover"
                />
              </div>

              <div class="col-8 column justify-center">
                <div class="text-grey-7 text-caption">{{ activeProduct.description }}</div>
                <div class="text-h5 text-primary q-mt-sm text-weight-bold">
                  ${{ customizedPrice.toFixed(2) }}
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section style="max-height: 50vh" class="scroll">
              <div v-if="activeProduct.sizes && activeProduct.sizes.length > 0" class="q-mb-md">
                <div class="text-subtitle2 q-mb-xs">Size</div>
                <div class="row q-gutter-sm">
                  <q-btn
                    v-for="size in activeProduct.sizes"
                    :key="size.label"
                    :label="`${size.label} ${size.price > 0 ? '(+$' + size.price + ')' : ''}`"
                    :outline="customizationForm.size?.label !== size.label"
                    :color="customizationForm.size?.label === size.label ? 'primary' : 'grey-7'"
                    unelevated
                    @click="customizationForm.size = size"
                    no-caps
                    class="col-auto"
                  />
                </div>
              </div>

              <div v-if="activeProduct.addons && activeProduct.addons.length > 0" class="q-mb-md">
                <div class="text-subtitle2 q-mb-xs">Add-ons</div>
                <q-list bordered separator class="rounded-borders">
                  <q-item
                    tag="label"
                    v-for="addon in activeProduct.addons"
                    :key="addon.label"
                    v-ripple
                    dense
                  >
                    <q-item-section avatar>
                      <q-checkbox v-model="customizationForm.addons" :val="addon" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ addon.label }}</q-item-label>
                    </q-item-section>
                    <q-item-section side> +${{ addon.price.toFixed(2) }} </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div>
                <div class="text-subtitle2 q-mb-xs">Notes</div>
                <q-input
                  v-model="customizationForm.note"
                  outlined
                  dense
                  placeholder="e.g. Less ice, warm..."
                />
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="between" class="q-pa-md bg-grey-1">
              <div class="row items-center bg-white shadow-1 rounded-borders">
                <q-btn
                  flat
                  dense
                  icon="remove"
                  color="primary"
                  @click="customizationForm.quantity > 1 ? customizationForm.quantity-- : null"
                />
                <div class="q-px-md text-weight-bold">{{ customizationForm.quantity }}</div>
                <q-btn
                  flat
                  dense
                  icon="add"
                  color="primary"
                  @click="customizationForm.quantity++"
                />
              </div>

              <q-btn
                color="primary"
                icon="add_shopping_cart"
                :label="`Add - $${(customizedPrice * customizationForm.quantity).toFixed(2)}`"
                class="q-px-lg"
                @click="confirmAddToCart"
              />
            </q-card-actions>
          </div>
        </q-card>
      </q-dialog>
    </q-layout>
  </q-dialog>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { date, useQuasar } from 'quasar'
import { useOrderStore } from 'src/stores/orderStore'
// Assuming these exist in your project
import ProductCard from 'src/components/ordering/ProductCard.vue'
import CustomerDetails from 'src/components/ordering/CustomerDetails.vue'
import CheckoutSummary from 'src/components/ordering/CheckoutSummary.vue'

// Initialize
const $q = useQuasar()
const orderStore = useOrderStore()

// Props & Emits
defineProps({
  modelValue: Boolean,
})
const emit = defineEmits(['update:modelValue', 'create'])

// State
const search = ref('')
const selectedCategory = ref('All')
const sortBy = ref('name')
const cart = ref([])
const customer = reactive({
  name: '',
  email: '',
  phone: '',
})

// --- Customization State ---
const customizationDialog = ref(false)
const activeProduct = ref(null)
const customizationForm = reactive({
  size: null,
  addons: [],
  quantity: 1,
  note: '',
})

// Constants
const taxRate = 0.08
const discountRate = 0.05
const categories = ['All', 'Hot Coffee', 'Iced Coffee', 'Pastries', 'Beans', 'Merchandise']

const sortOptions = [
  { label: 'Name A-Z', value: 'name' },
  { label: 'Price Low-High', value: 'price-asc' },
  { label: 'Price High-Low', value: 'price-desc' },
  { label: 'Category', value: 'category' },
]

// Updated Products data with Sizes and Addons
const products = ref([
  {
    id: 1,
    sku: 'COF-001',
    name: 'Espresso',
    description: 'Rich, concentrated coffee served in a small cup.',
    category: 'Hot Coffee',
    price: 3.5,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
    stock: 100,
    sizes: [
      { label: 'Single', price: 0 },
      { label: 'Double', price: 1.5 },
    ],
    addons: [
      { label: 'Sugar', price: 0 },
      { label: 'Cream', price: 0.5 },
    ],
  },
  {
    id: 2,
    sku: 'COF-002',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and a thick layer of foam.',
    category: 'Hot Coffee',
    price: 4.5,
    originalPrice: 5.0,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
    stock: 85,
    sizes: [
      { label: 'Small', price: 0 },
      { label: 'Medium', price: 0.75 },
      { label: 'Large', price: 1.5 },
    ],
    addons: [
      { label: 'Extra Shot', price: 1.0 },
      { label: 'Soy Milk', price: 0.75 },
      { label: 'Caramel', price: 0.5 },
    ],
  },
  {
    id: 7,
    sku: 'PAS-002',
    name: 'Chocolate Muffin',
    description: 'Rich chocolate muffin with chocolate chips.',
    category: 'Pastries',
    price: 3.75,
    originalPrice: 4.25,
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400',
    stock: 18,
    sizes: [], // No sizes for food typically
    addons: [
      { label: 'Warmed Up', price: 0 },
      { label: 'Butter', price: 0.5 },
    ],
  },
  {
    id: 8,
    sku: 'BEA-001',
    name: 'Signature Blend Beans',
    description: 'Our house signature blend, medium roast.',
    category: 'Beans',
    price: 15.0,
    originalPrice: 18.0,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
    stock: 30,
    sizes: [
      { label: '250g', price: 0 },
      { label: '500g', price: 12.0 }, // +12 on top of base 15 = 27
      { label: '1kg', price: 25.0 },
    ],
    addons: [
      { label: 'Grind for Espresso', price: 0 },
      { label: 'Grind for Filter', price: 0 },
    ],
  },
  {
    id: 9,
    sku: 'MER-001',
    name: 'Ceramic Mug',
    description: 'Classic white ceramic mug with our logo.',
    category: 'Merchandise',
    price: 12.5,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    stock: 50,
    sizes: [],
    addons: [],
  },
])

// Computed Properties
const currentDate = computed(() => {
  return date.formatDate(Date.now(), 'ddd, DD MMM YYYY • hh:mm A')
})

const filteredProducts = computed(() => {
  let list = products.value

  if (selectedCategory.value !== 'All') {
    list = list.filter((p) => p.category === selectedCategory.value)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }
  return list
})

const sortedProducts = computed(() => {
  const list = [...filteredProducts.value]
  switch (sortBy.value) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price)
    case 'category':
      return list.sort((a, b) => a.category.localeCompare(b.category))
    default:
      return list.sort((a, b) => a.name.localeCompare(b.name))
  }
})

// Calculate price dynamically for the popup
const customizedPrice = computed(() => {
  if (!activeProduct.value) return 0

  let total = activeProduct.value.price

  // Add Size Price
  if (customizationForm.size) {
    total += customizationForm.size.price
  }

  // Add Add-ons Price
  customizationForm.addons.forEach((addon) => {
    total += addon.price
  })

  return total
})

// Calculate total cart value
const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
})

// Methods

// 1. Open Dialog
const promptAddToCart = (product) => {
  activeProduct.value = JSON.parse(JSON.stringify(product)) // Deep copy

  // Set Defaults
  customizationForm.size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  customizationForm.addons = []
  customizationForm.quantity = 1
  customizationForm.note = ''

  customizationDialog.value = true
}

// 2. Add Item to Cart
const confirmAddToCart = () => {
  // Create cart item object
  const cartItem = {
    product: { ...activeProduct.value }, // Keep original product info
    selectedSize: customizationForm.size,
    selectedAddons: [...customizationForm.addons],
    note: customizationForm.note,
    quantity: customizationForm.quantity,
    unitPrice: customizedPrice.value, // Store the calculated unit price
  }

  // Push to cart
  cart.value.push(cartItem)

  $q.notify({
    message: `${activeProduct.value.name} added`,
    caption: `+ $${(cartItem.unitPrice * cartItem.quantity).toFixed(2)}`,
    color: 'positive',
    icon: 'add_shopping_cart',
    position: 'top-right',
    timeout: 1000,
  })

  customizationDialog.value = false
}

const updateQuantity = (index, delta) => {
  const item = cart.value[index]
  item.quantity += delta

  if (item.quantity <= 0) {
    removeItem(index)
  }
}

const removeItem = (index) => {
  $q.dialog({
    title: 'Remove Item',
    message: 'Remove this item from cart?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    cart.value.splice(index, 1)
  })
}

const clearCart = () => {
  $q.dialog({
    title: 'Clear Cart',
    message: 'Clear all items?',
    cancel: true,
  }).onOk(() => {
    cart.value = []
    customer.name = ''
    customer.email = ''
    customer.phone = ''
  })
}

const saveAsDraft = () => {
  $q.notify({
    message: 'Order saved as draft',
    color: 'info',
    icon: 'save',
    position: 'top-right',
  })
}

const submitOrder = async () => {
  if (!customer.name) {
    $q.notify({
      type: 'warning',
      message: 'Please enter customer name',
      icon: 'warning',
    })
    return
  }

  const taxAmount = subtotal.value * taxRate
  const discountAmount = subtotal.value * discountRate
  const totalAmount = subtotal.value + taxAmount - discountAmount

  const orderData = {
    customer,
    status: 'Paid',
    subtotal: subtotal.value,
    taxAmount,
    discountAmount,
    totalAmount,
    items: cart.value.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      variant: item.selectedSize ? item.selectedSize.label : 'Standard',
      addons: item.selectedAddons.map((a) => a.label),
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      note: item.note,
    })),
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
  }

  try {
    await orderStore.addOrder(orderData)

    $q.notify({
      type: 'positive',
      message: `Order #${orderData.orderNumber} placed!`,
      caption: `Total: $${totalAmount.toFixed(2)}`,
      icon: 'check_circle',
      position: 'top-right',
      timeout: 3000,
    })

    clearCart()
    emit('update:modelValue', false)
  } catch (error) {
    console.error('POS Error:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to place order',
      icon: 'error',
    })
  }
}

onMounted(() => {
  // Initialization if needed
})
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
}

.shadow-3-left {
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.08);
}

.rounded-borders-top {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
</style>
