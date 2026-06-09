<template>
  <div
    class="decoration-godray"
    :style="mergedStyle"
  >
    <svg width="200" height="400" viewBox="0 0 200 400" fill="none" class="godray-svg">
      <polygon points="80,0 120,0 180,400 20,400" fill="white" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  style: { type: Object, default: () => ({}) }
})

const mergedStyle = computed(() => ({
  position: 'absolute',
  pointerEvents: 'none',
  ...props.style
}))
</script>

<style scoped>
.godray-svg {
  opacity: 0.2;
}
</style>
