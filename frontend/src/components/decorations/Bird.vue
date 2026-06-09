<template>
  <div
    class="decoration-bird"
    :style="mergedStyle"
  >
    <svg width="28" height="18" viewBox="0 0 30 20" fill="none">
      <path
        d="M2 14 Q8 2, 15 11 Q22 2, 28 14"
        stroke="rgba(255, 255, 255, 0.7)"
        stroke-width="2"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  delay: { type: Number, default: 0 },
  style: { type: Object, default: () => ({}) }
})

const mergedStyle = computed(() => ({
  position: 'absolute',
  pointerEvents: 'none',
  animation: `fly ${18 + props.delay * 3}s linear infinite`,
  animationDelay: `${-props.delay * 6}s`,
  ...props.style
}))
</script>
