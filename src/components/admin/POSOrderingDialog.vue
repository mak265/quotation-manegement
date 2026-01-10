<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-layout view="hHh lpR fFf" container class="bg-grey-2">
      <q-header class="bg-white text-primary bordered-bottom shadow-1">
        <q-toolbar>
          <q-btn flat round dense icon="close" v-close-popup color="grey-8" />
          <q-toolbar-title class="text-weight-bold text-grey-9">
            <q-icon name="point_of_sale" color="primary" size="28px" class="q-mr-sm" />
            POS Terminal
          </q-toolbar-title>
          <div class="text-subtitle1 text-grey-8 q-mr-md">
            {{ currentDate }}
          </div>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="row no-wrap fit">
          
          <div class="col-8 column q-pa-md">
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-12 col-md-8">
                <q-tabs
                  v-model="selectedCategory"
                  active-color="primary"
                  indicator-color="primary"
                  align="left"
                  dense
                  class="text-grey-7 bg-white rounded-borders shadow-1"
                >
                  <q-tab name="All" label="All Items" />
                  <q-tab name="Electronics" label="Electronics" />
                  <q-tab name="Clothing" label="Clothing" />
                  <q-tab name="Books" label="Books" />
                </q-tabs>
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="search"
                  outlined
                  dense
                  placeholder="Search products..."
                  bg-color="white"
                >
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
            </div>

            <q-scroll-area class="col">
              <div class="row q-col-gutter-md">
                <div
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                  <q-card
                    class="cursor-pointer full-height hover-effect no-border"
                    @click="addToCart(product)"
                    v-ripple
                  >
                    <q-img :src="product.image" :ratio="4 / 3">
                      <div class="absolute-bottom text-subtitle2 text-center text-weight-bold">
                        ${{ product.price }}
                      </div>
                    </q-img>
                    <q-card-section>
                      <div class="text-weight-bold ellipsis text-grey-9">{{ product.name }}</div>
                      <div class="text-caption text-grey-6">{{ product.category }}</div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-scroll-area>
          </div>

          <div class="col-4 bg-white column shadow-3 relative-position">
            
            <div class="q-pa-md bg-grey-1 bordered-bottom">
              <div class="text-h6 q-mb-sm text-grey-8">Order Details</div>
              <q-input
                v-model="customer.name"
                label="Customer Name"
                outlined
                dense
                class="q-mb-xs bg-white"
                :rules="[val => !!val || 'Required']"
                hide-bottom-space
              />
              <q-input
                v-model="customer.email"
                label="Email (Optional)"
                outlined
                dense
                class="bg-white q-mt-sm"
              />
            </div>

            <q-separator />

            <q-scroll-area class="col q-px-sm">
              <q-list separator class="q-py-md">
                <q-item v-if="cart.length === 0" class="text-grey text-center q-pa-xl column flex-center">
                  <q-icon name="shopping_cart_checkout" size="4em" color="grey-4" />
                  <div class="q-mt-sm text-h6 text-grey-5">Cart is empty</div>
                  <div class="text-caption">Select items from the left to start</div>
                </q-item>

                <transition-group name="list">
                  <q-item v-for="(item, index) in cart" :key="item.product.id">
                    <q-item-section avatar>
                      <q-avatar rounded size="50px">
                        <img :src="item.product.image" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-bold">{{ item.product.name }}</q-item-label>
                      <q-item-label caption>
                        ${{ item.product.price }} / unit
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div class="row items-center bg-grey-2 rounded-borders">
                        <q-btn
                          round flat dense size="sm"
                          icon="remove"
                          color="grey-7"
                          @click.stop="updateQuantity(index, -1)"
                        />
                        <span class="text-body1 q-mx-sm text-weight-bold" style="min-width: 20px; text-align: center">
                          {{ item.quantity }}
                        </span>
                        <q-btn
                          round flat dense size="sm"
                          icon="add"
                          color="primary"
                          @click.stop="updateQuantity(index, 1)"
                        />
                      </div>
                      <div class="text-subtitle2 text-primary q-mt-xs text-right text-weight-bold">
                        ${{ (item.product.price * item.quantity).toFixed(2) }}
                      </div>
                    </q-item-section>
                  </q-item>
                </transition-group>
              </q-list>
            </q-scroll-area>

            <div class="q-pa-md bg-white bordered-top shadow-up-2">
              <div class="row justify-between q-mb-xs">
                <span class="text-grey-8">Subtotal</span>
                <span class="text-weight-bold">${{ totalAmount.toFixed(2) }}</span>
              </div>
              <div class="row justify-between q-mb-md">
                <span class="text-grey-8">Tax (0%)</span>
                <span>$0.00</span>
              </div>

              <q-separator class="q-mb-md" />

              <div class="row justify-between items-center q-mb-lg">
                <span class="text-h5 text-weight-bold">Total</span>
                <span class="text-h4 text-primary text-weight-bolder">
                  ${{ totalAmount.toFixed(2) }}
                </span>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-5">
                  <q-btn
                    outline
                    color="grey-8"
                    label="Clear"
                    class="full-width"
                    @click="clearCart"
                    :disable="orderStore.loading"
                  />
                </div>
                <div class="col-7">
                  <q-btn
                    unelevated
                    color="primary"
                    class="full-width"
                    size="lg"
                    @click="submitOrder"
                    :loading="orderStore.loading"
                    :disable="cart.length === 0 || !customer.name"
                  >
                    <div>Pay & Save</div>
                    <q-icon name="arrow_forward" class="q-ml-sm" size="xs" />
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { date, useQuasar } from 'quasar'
import { useOrderStore } from 'src/stores/orderStore' // Ensure this path matches your project structure

// 1. Initialize Store & Quasar
const orderStore = useOrderStore()
const $q = useQuasar()

const props = defineProps({
  modelValue: Boolean,
  products: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'create'])

// State
const search = ref('')
const selectedCategory = ref('All')
const cart = ref([])
const customer = reactive({ name: '', email: '' })
const currentDate = date.formatDate(Date.now(), 'DD MMM YYYY • HH:mm')

// Mock Data Enhancement
const enhancedProducts = computed(() => {
  return props.products.map((p, i) => ({
    ...p,
    image: p.image || `https://picsum.photos/seed/${p.id}/300/200`,
    category: p.category || ['Electronics', 'Clothing', 'Books'][i % 3],
  }))
})

// Filtering Logic
const filteredProducts = computed(() => {
  let list = enhancedProducts.value

  if (selectedCategory.value !== 'All') {
    list = list.filter((p) => p.category === selectedCategory.value)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  return list
})

const totalAmount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

// Actions
const addToCart = (product) => {
  const existing = cart.value.find((item) => item.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      product: product,
      quantity: 1,
    })
  }
}

const updateQuantity = (index, delta) => {
  const item = cart.value[index]
  const newQty = item.quantity + delta

  if (newQty <= 0) {
    cart.value.splice(index, 1)
  } else {
    item.quantity = newQty
  }
}

const clearCart = () => {
  cart.value = []
  customer.name = ''
  customer.email = ''
}

const submitOrder = async () => {
  // Prepare payload for Firestore
  const orderData = {
    customerName: customer.name,
    customerEmail: customer.email,
    status: 'Paid',
    totalAmount: totalAmount.value,
    items: cart.value.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image
    })),
  }

  try {
    await orderStore.addOrder(orderData)

    $q.notify({
      type: 'positive',
      message: 'Order placed successfully!',
      icon: 'check_circle'
    })

    clearCart()
    emit('update:modelValue', false)

  } catch (error) {
    // FIX: Log the error so the variable is "used"
    console.error('POS Submission Error:', error) 

    $q.notify({
      type: 'negative',
      message: 'Failed to place order. Please try again.',
      icon: 'error'
    })
  }
}
</script>

<style scoped>
.hover-effect {
  transition: all 0.2s ease;
}
.hover-effect:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bordered-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.bordered-top {
  border-top: 1px solid #e0e0e0;
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>