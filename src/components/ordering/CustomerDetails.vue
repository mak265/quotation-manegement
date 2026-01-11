<template>
  <div class="customer-details">
    <div class="text-subtitle1 text-grey-8 q-mb-sm row items-center">
      <q-icon name="person" class="q-mr-sm" color="primary" size="20px" />
      Customer Details
    </div>
    
    <div class="row q-col-gutter-sm">
      <div class="col-12">
        <q-input
          :model-value="modelValue.name"
          @update:model-value="val => updateField('name', val)"
          label="Customer Name *"
          outlined
          dense
          bg-color="white"

          hide-bottom-space
        >
          <template v-slot:prepend>
            <q-icon name="badge" color="grey-6" size="18px" />
          </template>
        </q-input>
      </div>
      
      
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ name: '', email: '', phone: '' })
  }
})

const emit = defineEmits(['update:modelValue'])

const updateField = (key, value) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
