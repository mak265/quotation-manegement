<template>
  <q-item clickable :to="{ name: props.name }">
    <q-item-section v-if="props.icon" avatar>
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.label }}</q-item-label>
      <q-item-label v-if="props.caption" caption>{{ props.caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  meta: {
    type: Object,
    default: () => ({}),
  },
})
</script>
