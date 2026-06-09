<template>
  <div
    class="decoration-leaf"
    :style="mergedStyle"
  >
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="8" rx="4" ry="7" :fill="color" fill-opacity="0.55"/>
      <line x1="8" y1="2" x2="8" y2="13" :stroke="color" stroke-width="0.5" opacity="0.3"/>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  delay: { type: Number, default: 0 },
  duration: { type: Number, default: 10 },
  color: { type: String, default: '#81C784' },
  style: { type: Object, default: () => ({}) }
})

const mergedStyle = computed(() => ({
  position: 'absolute',
  pointerEvents: 'none',
  animation: `fall ${props.duration}s ease-in-out infinite`,
  animationDelay: `${-props.delay}s`,
  ...props.style
}))
</script>
