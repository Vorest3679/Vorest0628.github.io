<template>
  <div class="animated-decorations">
    <!-- Floating Clouds -->
    <Cloud class="animate-float" size="lg" style="top: 5%; left: -8%" />
    <Cloud class="animate-float-delayed" size="sm" style="top: 22%; left: 15%" />

    <!-- God Rays -->
    <GodRay style="top: -10%; left: 20%; transform: rotate(-15deg); opacity: 0.08" />
    <GodRay style="top: -5%; right: 15%; transform: rotate(10deg); opacity: 0.06" />

    <!-- Birds -->
    <Bird :delay="0" style="top: 100px" />
    <Bird :delay="2" style="top: 160px" />
    <Bird :delay="4" style="top: 80px" />

    <!-- Falling Leaves -->
    <Leaf :delay="0" :duration="14" color="#A5D6A7" style="left: 3%" />
    <Leaf :delay="4" :duration="11" color="#C8E6C9" style="left: 18%" />
    <Leaf :delay="8" :duration="16" color="#81C784" style="left: 42%" />
    <Leaf :delay="12" :duration="12" color="#A5D6A7" style="left: 68%" />
    <Leaf :delay="16" :duration="15" color="#C8E6C9" style="left: 88%" />
    <Leaf :delay="20" :duration="10" color="#81C784" style="left: 55%" />
    <Leaf :delay="24" :duration="13" color="#A5D6A7" style="left: 30%" />

    <!-- Sparkles -->
    <Sparkle :size="16" style="top: 8%; left: 10%" />
    <Sparkle :size="12" style="top: 18%; right: 22%" />
    <Sparkle :size="18" style="top: 38%; left: 8%" />
    <Sparkle :size="14" style="top: 62%; right: 12%" />
    <Sparkle :size="16" style="top: 82%; left: 45%" />
    <Sparkle :size="10" style="top: 48%; right: 35%" />
  </div>
</template>

<script setup>
import Cloud from './decorations/Cloud.vue'
import GodRay from './decorations/GodRay.vue'
import Bird from './decorations/Bird.vue'
import Leaf from './decorations/Leaf.vue'
import Sparkle from './decorations/Sparkle.vue'
</script>

<style scoped>
.animated-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
</style>
