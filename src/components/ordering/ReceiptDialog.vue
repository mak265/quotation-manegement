<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 380px; max-width: 700px; width: 100%" class="glass-card">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div>
          <div class="text-h6 text-weight-bold gradient-text">Receipt</div>
          <div class="text-caption text-grey-7">Order #{{ shortId }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption">{{ formattedDate }}</div>
          <div class="text-caption">{{ order?.customerName || 'Customer' }}</div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list dense bordered class="rounded-borders">
          <q-item v-for="(item, i) in items" :key="i">
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ item.name }}</q-item-label>
              <q-item-label caption v-if="item.variant || (item.addons && item.addons.length)">
                <span v-if="item.variant">{{ item.variant }}</span>
                <span v-if="item.addons && item.addons.length"> • {{ item.addons.join(', ') }}</span>
              </q-item-label>
              <q-item-label caption v-if="item.note">{{ item.note }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center">
                <div class="q-mr-md">x{{ item.quantity }}</div>
                <div class="text-right text-weight-bold">${{ (item.unitPrice * item.quantity).toFixed(2) }}</div>
              </div>
            </q-item-section>
          </q-item>
          <q-item v-if="!items.length">
            <q-item-section>
              <q-item-label>No items</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-separator spaced />
        <div class="row justify-end">
          <div class="col-12 col-sm-6">
            <div class="row items-center justify-between q-py-xs">
              <div class="text-grey-7">Subtotal</div>
              <div class="text-weight-medium">${{ subtotal.toFixed(2) }}</div>
            </div>
            <div class="row items-center justify-between q-py-xs">
              <div class="text-grey-7">Tax</div>
              <div class="text-weight-medium">${{ taxAmount.toFixed(2) }}</div>
            </div>
            <div class="row items-center justify-between q-py-xs">
              <div class="text-grey-7">Discount</div>
              <div class="text-weight-medium">-${{ discountAmount.toFixed(2) }}</div>
            </div>
            <q-separator spaced />
            <div class="row items-center justify-between">
              <div class="text-weight-bold">Total</div>
              <div class="text-h6 gradient-text text-weight-bold">${{ total.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
        <q-btn label="Print" icon="print" class="btn-primary" @click="printReceipt" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const { modelValue, order } = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: () => ({}) }
})
defineEmits(['update:modelValue'])

const items = computed(() => {
  const it = (Array.isArray(order?.items) ? order.items : [])
  return it.map(x => ({
    name: x.name || x.product?.name || 'Item',
    sku: x.sku || x.product?.sku || '',
    variant: x.variant || '',
    addons: x.addons || [],
    unitPrice: Number(x.unitPrice ?? x.price ?? 0),
    quantity: Number(x.quantity ?? 1),
    note: x.note || ''
  }))
})

const subtotal = computed(() => {
  if (typeof order?.subtotal === 'number') return Number(order.subtotal)
  return items.value.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
})
const taxAmount = computed(() => {
  if (typeof order?.taxAmount === 'number') return Number(order.taxAmount)
  const rate = typeof order?.taxRate === 'number' ? order.taxRate : 0
  return subtotal.value * rate
})
const discountAmount = computed(() => {
  if (typeof order?.discountAmount === 'number') return Number(order.discountAmount)
  const rate = typeof order?.discountRate === 'number' ? order.discountRate : 0
  return subtotal.value * rate
})
const total = computed(() => {
  if (typeof order?.totalAmount === 'number') return Number(order.totalAmount)
  if (typeof order?.total === 'number') return Number(order.total)
  return subtotal.value + taxAmount.value - discountAmount.value
})

const formattedDate = computed(() => {
  const d = order?.date || order?.createdAt || new Date().toISOString()
  try {
    if (d && typeof d.toDate === 'function') {
      return d.toDate().toLocaleString()
    }
    return new Date(d).toLocaleString()
  } catch {
    return String(d)
  }
})

const shortId = computed(() => {
  const id = order?.id || order?.orderNumber || ''
  return id ? String(id).slice(0, 8) : 'N/A'
})

const printReceipt = () => {
  const title = `Receipt - ${shortId.value}`
  const rows = items.value.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>${i.variant || ''}</td>
      <td>${i.quantity}</td>
      <td>$${i.unitPrice.toFixed(2)}</td>
      <td>$${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('')
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
          h1 { font-size: 18px; margin: 0 0 12px; }
          .meta { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f3f4f6; text-align: left; }
          .totals { margin-top: 16px; width: 50%; float: right; }
          .totals table { width: 100%; }
        </style>
      </head>
      <body>
        <h1>Receipt</h1>
        <div class="meta">Order #${shortId.value} • ${formattedDate.value} • ${order?.customerName || 'Customer'}</div>
        <table>
          <thead>
            <tr>
              <th>Item</th><th>Variant</th><th>Qty</th><th>Unit</th><th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <table>
            <tr><td>Subtotal</td><td style="text-align:right">$${subtotal.value.toFixed(2)}</td></tr>
            <tr><td>Tax</td><td style="text-align:right">$${taxAmount.value.toFixed(2)}</td></tr>
            <tr><td>Discount</td><td style="text-align:right">-$${discountAmount.value.toFixed(2)}</td></tr>
            <tr><th>Total</th><th style="text-align:right">$${total.value.toFixed(2)}</th></tr>
          </table>
        </div>
      </body>
    </html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 100)
}
</script>
