<template>
  <div class="checkout-summary q-pa-md bg-white">
    <div class="q-mb-md">
      <div class="text-subtitle1 text-grey-8 q-mb-sm">Order Summary</div>
      
      <div class="q-pa-sm bg-grey-1 rounded-borders">
        <div class="row justify-between items-center q-pb-xs">
          <span class="text-grey-7">Subtotal</span>
          <span class="text-weight-medium">${{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="row justify-between items-center q-py-xs">
          <span class="text-grey-7">Tax ({{ (taxRate * 100).toFixed(0) }}%)</span>
          <span>${{ taxAmount.toFixed(2) }}</span>
        </div>
        <div class="row justify-between items-center q-pt-xs">
          <span class="text-grey-7">Discount</span>
          <span class="text-green">-${{ discountAmount.toFixed(2) }}</span>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <div class="row justify-between items-center">
        <div>
          <div class="text-h5 text-weight-bold text-grey-9">Total</div>
          <div class="text-caption text-grey-6">Including all taxes</div>
        </div>
        <div class="text-right">
          <div class="text-h3 text-primary text-weight-bolder">
            ${{ totalAmount.toFixed(2) }}
          </div>
          <div class="text-caption text-grey-6">
            {{ totalItems }} items
          </div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-sm">
      <div class="col-6">
        <q-btn
          outline
          color="grey-8"
          label="Clear All"
          icon="delete_sweep"
          class="full-width"
          @click="$emit('clear-cart')"
          :disable="loading"
        />
      </div>
      <div class="col-6">
        <q-btn
          unelevated
          color="primary"
          class="full-width"
          size="lg"
          @click="$emit('pay-now')"
          :loading="loading"
          :disable="cartLength === 0 || !customerName"
        >
          <q-icon name="payments" class="q-mr-sm" />
          Pay Now
          <template v-slot:loading>
            <q-spinner-hourglass class="on-left" />
            Processing...
          </template>
        </q-btn>
      </div>
    </div>
    
    <div class="row q-col-gutter-sm q-mt-sm">
      <div class="col-12">
        <q-btn
          flat
          color="primary"
          label="Save as Draft"
          icon="save"
          class="full-width"
          @click="$emit('save-draft')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOrderStore } from 'src/stores/orderStore'

const orderStore = useOrderStore()

const props = defineProps({
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0.08
  },
  discountRate: {
    type: Number,
    default: 0.05
  },
  cartLength: {
    type: Number,
    default: 0
  },
  customerName: {
    type: String,
    default: ''
  },
  totalItems: {
    type: Number,
    default: 0
  }
})

defineEmits(['clear-cart', 'pay-now', 'save-draft'])

// Computed
const taxAmount = computed(() => props.subtotal * props.taxRate)
const discountAmount = computed(() => props.subtotal * props.discountRate)
const totalAmount = computed(() => props.subtotal + taxAmount.value - discountAmount.value)
const loading = computed(() => orderStore.loading)
</script>

<style scoped>
.checkout-summary {
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}
</style>