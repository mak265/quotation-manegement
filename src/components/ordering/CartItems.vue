<template>
  <div class="cart-items flex-column">
    <div class="q-pa-sm bg-grey-2">
      <div class="text-subtitle1 text-grey-8">
        <q-icon name="shopping_cart" class="q-mr-sm" />
        Cart Items ({{ items.length }})
      </div>
    </div>
    
    <q-scroll-area class="col">
      <q-list separator class="q-py-sm">
        <q-item v-if="items.length === 0" class="text-grey text-center q-pa-xl column flex-center">
          <q-icon name="shopping_cart_checkout" size="4em" color="grey-4" />
          <div class="q-mt-sm text-h6 text-grey-5">Cart is empty</div>
          <div class="text-caption">Select items to start</div>
        </q-item>

        <transition-group name="list-slide">
          <q-item 
            v-for="(item, index) in items" 
            :key="item.product.id"
            class="q-py-sm"
          >
            <q-item-section avatar>
              <q-avatar rounded size="60px">
                <img :src="item.product.image" />
                <q-badge 
                  floating 
                  rounded 
                  color="primary"
                  class="text-caption"
                >
                  {{ item.quantity }}
                </q-badge>
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold text-grey-9">
                {{ item.product.name }}
              </q-item-label>
              <q-item-label caption class="text-grey-6">
                SKU: {{ item.product.sku }}
              </q-item-label>
              <q-item-label>
                <span class="text-subtitle2 text-primary text-weight-bold">
                  ${{ (item.product.price * item.quantity).toFixed(2) }}
                </span>
                <span class="text-caption text-grey-6 q-ml-sm">
                  (${{ item.product.price.toFixed(2) }} each)
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="column items-center">
                <div class="row items-center bg-grey-2 rounded-borders">
                  <q-btn
                    round flat dense size="sm"
                    icon="remove"
                    color="grey-7"
                    @click.stop="$emit('update-quantity', index, -1)"
                    :disable="item.quantity <= 1"
                  />
                  <span class="text-body1 q-mx-sm text-weight-bold" style="min-width: 24px; text-align: center">
                    {{ item.quantity }}
                  </span>
                  <q-btn
                    round flat dense size="sm"
                    icon="add"
                    color="primary"
                    @click.stop="$emit('update-quantity', index, 1)"
                  />
                </div>
                <q-btn
                  flat
                  dense
                  color="red"
                  icon="delete"
                  size="sm"
                  class="q-mt-xs"
                  @click.stop="$emit('remove-item', index)"
                />
              </div>
            </q-item-section>
          </q-item>
        </transition-group>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  }
})

defineEmits(['update-quantity', 'remove-item'])
</script>

<style scoped>
.list-slide-enter-active,
.list-slide-leave-active {
  transition: all 0.4s ease;
}
.list-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.list-slide-leave-active {
  position: absolute;
  width: 100%;
}

.q-scrollarea__thumb {
  background: rgba(0, 0, 0, 0.2);
}

.q-scrollarea__thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>