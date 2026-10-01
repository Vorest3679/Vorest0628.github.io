<template>
  <button
    ref="trigger"
    type="button"
    class="rss-trigger"
    :class="{ compact }"
    :aria-label="compact ? 'RSS 订阅' : undefined"
    aria-haspopup="dialog"
    title="RSS 订阅"
    @click="openDialog"
  >
    <AppIcon name="rss" />
    <span v-if="!compact">RSS 订阅</span>
  </button>

  <Teleport to="body">
    <Transition
      name="rss-modal"
      @after-leave="restorePage"
    >
      <div
        v-if="isOpen"
        class="rss-overlay"
        @click.self="closeDialog"
      >
        <section
          ref="dialog"
          class="rss-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`${id}-title`"
          :aria-describedby="`${id}-description`"
          tabindex="-1"
        >
          <div class="rss-dialog-head">
            <div class="rss-heading">
              <span class="rss-badge"><AppIcon name="rss" /></span>
              <h2 :id="`${id}-title`">
                订阅博客更新
              </h2>
            </div>
            <button
              type="button"
              class="rss-close"
              aria-label="关闭订阅弹窗"
              @click="closeDialog"
            >
              <AppIcon name="xmark" />
            </button>
          </div>

          <p
            :id="`${id}-description`"
            class="rss-description"
          >
            把链接添加到你的 RSS 阅读器，新文章发布后即可获取概览，点击「阅读全文」访问原文。
          </p>

          <label
            :for="`${id}-url`"
            class="rss-label"
          >订阅链接</label>
          <div class="rss-link-row">
            <input
              :id="`${id}-url`"
              ref="urlInput"
              :value="feedUrl"
              type="url"
              readonly
              spellcheck="false"
              @click="selectLink"
            >
            <button
              type="button"
              class="rss-copy"
              :disabled="isCopying"
              @click="copyLink"
            >
              <AppIcon :name="isCopied ? 'check' : 'copy'" />
              {{ isCopied ? '已复制' : '复制链接' }}
            </button>
          </div>
          <p
            class="rss-feedback"
            role="status"
            aria-live="polite"
          >
            {{ feedback }}
          </p>

          <div class="rss-dialog-foot">
            <span>文章摘要 · 分类与标签 · 原文链接</span>
            <a
              :href="feedUrl"
              target="_blank"
              rel="noopener"
            >查看订阅源 <AppIcon name="arrow-right" /></a>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, useId } from 'vue'
import { getRssFeedUrl } from '@/utils/rss'

defineProps({ compact: Boolean })

const id = useId()
const isOpen = ref(false)
const trigger = ref(null)
const dialog = ref(null)
const urlInput = ref(null)
const feedUrl = computed(getRssFeedUrl)
const feedback = ref('复制链接后，在阅读器中选择「添加订阅」。')
const isCopied = ref(false)
const isCopying = ref(false)
let pageState = null

const openDialog = async () => {
  isCopied.value = false
  feedback.value = '复制链接后，在阅读器中选择「添加订阅」。'
  if (!pageState) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const backgrounds = Array.from(document.body.children)
      .filter(element => !element.matches('.rss-overlay, .custom-cursor'))
      .map(element => ({ element, inert: element.inert }))
    pageState = {
      backgrounds,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight
    }
    // 背景包含 Teleport 导航；光标保持在普通页面层级的最上方。
    backgrounds.forEach(({ element }) => { element.inert = true })
    if (scrollbarWidth > 0) {
      const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0
      document.body.style.paddingRight = `${padding + scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleDialogKeydown)
  }
  isOpen.value = true
  await nextTick()
  if (isOpen.value) focusLink()
}

const closeDialog = () => { isOpen.value = false }
const restorePage = () => {
  if (!pageState) return
  const { backgrounds, overflow, paddingRight } = pageState
  backgrounds.forEach(({ element, inert }) => { element.inert = inert })
  document.body.style.overflow = overflow
  document.body.style.paddingRight = paddingRight
  document.removeEventListener('keydown', handleDialogKeydown)
  pageState = null
  if (trigger.value?.isConnected) trigger.value.focus({ preventScroll: true })
}

const handleDialogKeydown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeDialog()
  } else if (event.key === 'Tab') {
    const controls = dialog.value?.querySelectorAll('button:not(:disabled), input, a[href]')
    if (!controls?.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    const active = document.activeElement
    if (!dialog.value.contains(active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault()
      const next = event.shiftKey ? last : first
      next.focus()
    }
  }
}
const focusLink = () => urlInput.value?.focus({ preventScroll: true })
const selectLink = () => {
  focusLink()
  urlInput.value?.select()
}

const copyLink = async () => {
  isCopying.value = true
  isCopied.value = false
  try {
    try {
      await navigator.clipboard.writeText(feedUrl.value)
    } catch {
      // 兼容 HTTP 页面和未授予 Clipboard API 权限的浏览器。
      selectLink()
      if (!document.execCommand('copy')) throw new Error('Copy unavailable')
    }
    isCopied.value = true
    feedback.value = '链接已复制，可以粘贴到 RSS 阅读器中。'
  } catch {
    selectLink()
    feedback.value = '自动复制失败，链接已选中，请手动复制。'
  } finally {
    isCopying.value = false
  }
}

const cleanupDialog = () => {
  closeDialog()
  restorePage()
}
onDeactivated(cleanupDialog)
onBeforeUnmount(cleanupDialog)
</script>

<style scoped>
.rss-trigger,
.rss-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.rss-trigger {
  flex-shrink: 0;
  padding: 0.65rem 1rem;
  border: 1px solid #f6cba2;
  background: #fff5e8;
  color: #ae5c21;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.rss-trigger:hover {
  background: #ffecd3;
  box-shadow: 0 6px 16px rgba(174, 92, 33, 0.12);
}

.rss-trigger.compact {
  width: 2rem;
  height: 2rem;
  padding: 0;
}

.rss-trigger:focus-visible,
.rss-close:focus-visible,
.rss-copy:focus-visible,
.rss-dialog a:focus-visible {
  outline: 3px solid #65baff;
  outline-offset: 3px;
}

.rss-dialog {
  width: min(560px, 100%);
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  margin: auto;
  padding: 1.6rem;
  border: 1px solid #d5ebfa;
  border-radius: 24px;
  background: #f7fcff;
  color: #336a94;
  box-shadow: 0 24px 80px rgba(26, 65, 98, 0.25);
}

.rss-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(30, 62, 87, 0.4);
  backdrop-filter: blur(5px);
}

/* 在普通页面层级播放进出动画，让自定义光标始终位于遮罩上方。 */
.rss-modal-enter-active {
  transition: opacity 280ms ease;
}

.rss-modal-leave-active {
  transition: opacity 220ms ease;
}

.rss-modal-enter-active .rss-dialog {
  transition: opacity 280ms ease, transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.rss-modal-leave-active .rss-dialog {
  transition: opacity 220ms ease, transform 220ms ease;
}

.rss-modal-enter-from,
.rss-modal-leave-to {
  opacity: 0;
}

.rss-modal-enter-from .rss-dialog {
  opacity: 0;
  transform: translateY(16px) scale(0.94);
}

.rss-modal-leave-to .rss-dialog {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}

.rss-dialog-head,
.rss-heading,
.rss-dialog-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.rss-heading { justify-content: flex-start; }
.rss-heading h2 { font-size: 1.25rem; color: #2c72ad; }
.rss-badge { color: #ce742c; font-size: 1.2rem; }

.rss-close {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: #e8f3fb;
  color: #50748f;
  cursor: pointer;
}

.rss-description { margin: 1.15rem 0; line-height: 1.8; color: #5a7b93; }
.rss-label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 700; }
.rss-link-row { display: flex; gap: 0.6rem; }

.rss-link-row input {
  flex: 1;
  min-width: 0;
  padding: 0.7rem 0.85rem;
  border: 1px solid #b6daf2;
  border-radius: 12px;
  background: #fff;
  color: #336a94;
  font-size: 0.9rem;
}

.rss-link-row input:focus { outline: 2px solid #65baff; outline-offset: 1px; }
.rss-copy { flex-shrink: 0; border: none; padding: 0.7rem 1rem; background: #2f87d7; color: #fff; }
.rss-copy:hover { background: #2474bd; }
.rss-copy:disabled { opacity: 0.65; cursor: wait; }
.rss-feedback { min-height: 2.5em; margin-top: 0.65rem; font-size: 0.8rem; line-height: 1.5; color: #5a7b93; }
.rss-dialog-foot { flex-wrap: wrap; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #dceef9; font-size: 0.78rem; color: #64839a; }
.rss-dialog-foot a { color: #2f87d7; text-decoration: none; }
.rss-dialog-foot a:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .rss-dialog { padding: 1.2rem; border-radius: 20px; }
  .rss-link-row { flex-direction: column; }
  .rss-copy { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .rss-modal-enter-active,
  .rss-modal-leave-active,
  .rss-modal-enter-active .rss-dialog,
  .rss-modal-leave-active .rss-dialog {
    transition-duration: 1ms;
  }
}
</style>
