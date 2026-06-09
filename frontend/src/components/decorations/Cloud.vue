<template>
  <div
    class="decoration-cloud"
    :class="className"
    :style="mergedStyle"
  >
    <svg
      :width="width"
      :height="height"
      viewBox="0 0 120 60"
      fill="none"
      class="cloud-svg"
    >
      <ellipse cx="60" cy="38" rx="54" ry="20" fill="white" fill-opacity="0.65"/>
      <ellipse cx="38" cy="28" rx="32" ry="22" fill="white" fill-opacity="0.8"/>
      <ellipse cx="82" cy="30" rx="30" ry="19" fill="white" fill-opacity="0.75"/>
      <ellipse cx="58" cy="22" rx="24" ry="17" fill="white" fill-opacity="0.9"/>
      <ellipse cx="72" cy="24" rx="18" ry="14" fill="white" fill-opacity="0.85"/>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  className: { type: String, default: '' },
  size: { type: String, default: 'md' },
  style: { type: Object, default: () => ({}) }
})

const sizeMap = {
  sm: { width: 100, height: 50 },
  md: { width: 140, height: 70 },
  lg: { width: 180, height: 90 }
}

const { width, height } = sizeMap[props.size] || sizeMap.md

const mergedStyle = computed(() => ({
  position: 'absolute',
  pointerEvents: 'none',
  ...props.style
}))
</script>

<style scoped>
.cloud-svg {
  opacity: 0.5;
}
</style>
