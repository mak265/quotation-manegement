<template>
  <div class="checkout-summary q-pa-md bg-white">
    <div class="q-mb-md">
      <div class="text-subtitle1 text-grey-8 q-mb-sm">Order Summary</div>

      <div class="q-pa-sm bg-grey-1 rounded-borders">
        <div class="row justify-between items-center q-pb-xs">
          <span class="text-grey-7">Subtotal</span>
          <span class="text-weight-medium">${{ formatPrice(subtotal) }}</span>
        </div>
        <div class="row justify-between items-center q-py-xs">
          <span class="text-grey-7">Tax ({{ (taxRate * 100).toFixed(0) }}%)</span>
          <span>${{ formatPrice(taxAmount) }}</span>
        </div>
        <div class="row justify-between items-center q-pt-xs">
          <span class="text-grey-7">Discount</span>
          <span class="text-green">-${{ formatPrice(discountAmount) }}</span>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <div class="row justify-between items-center">
        <div>
          <div class="text-h5 text-weight-bold text-grey-9">Total</div>
          <div class="text-caption text-grey-6">Including all taxes</div>
        </div>
        <div class="text-right">
          <div class="text-h3 text-primary text-weight-bolder">${{ formatPrice(totalAmount) }}</div>
          <div class="text-caption text-grey-6">{{ totalItems }} items</div>
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
          @click="handlePayNow"
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
          @click="$emit('save-draft', { total: totalAmount, items: totalItems })"
          :disable="loading || cartLength === 0"
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
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0.08, // Example: Fetch this from a Firestore 'Settings' collection in the parent
  },
  discountRate: {
    type: Number,
    default: 0.0,
  },
  cartLength: {
    type: Number,
    default: 0,
  },
  customerName: {
    type: String,
    default: '',
  },
  totalItems: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['clear-cart', 'pay-now', 'save-draft'])

// --- Computed Properties ---

// Use || 0 to handle cases where props might be null while loading from Firebase
const taxAmount = computed(() => {
  return (props.subtotal || 0) * (props.taxRate || 0)
})

const discountAmount = computed(() => {
  return (props.subtotal || 0) * (props.discountRate || 0)
})

const totalAmount = computed(() => {
  const sub = props.subtotal || 0
  // JavaScript math safety (prevents 0.1 + 0.2 = 0.300000004)
  const result = sub + taxAmount.value - discountAmount.value
  return Math.max(0, result) // Prevent negative totals
})

const loading = computed(() => orderStore.loading)

// --- Methods ---

// Helper for display
const formatPrice = (val) => {
  return (val || 0).toFixed(2)
}

const handlePayNow = () => {
  // IMPORTANT: We emit the calculated values to the parent.
  // The parent will take this object and write it directly to Firestore.
  // This ensures the Database matches the UI exactly.
  const orderSummary = {
    subtotal: Number(props.subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.value.toFixed(2)),
    discountAmount: Number(discountAmount.value.toFixed(2)),
    totalAmount: Number(totalAmount.value.toFixed(2)),
    itemCount: props.totalItems,
  }

  emit('pay-now', orderSummary)
}
</script>

<style scoped>
.checkout-summary {
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  /* Ensure it sticks to bottom on mobile if needed */
  position: sticky;
  bottom: 0;
  z-index: 10;
}
</style>
