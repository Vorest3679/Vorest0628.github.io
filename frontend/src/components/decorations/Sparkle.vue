<template>
  <div
    class="decoration-sparkle animate-sparkle"
    :style="mergedStyle"
  >
    <svg :width="size" :height="size" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
        fill="#FFEE88"
        fill-opacity="0.85"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: Number, default: 16 },
  style: { type: Object, default: () => ({}) }
})

const mergedStyle = computed(() => ({
  position: 'absolute',
  pointerEvents: 'none',
  animationDelay: `${Math.random() * 2}s`,
  ...props.style
}))
</script>
