<template>
  <button
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
    <dialog
      ref="dialog"
      class="rss-dialog"
      :aria-labelledby="`${id}-title`"
      :aria-describedby="`${id}-description`"
      @click="handleBackdropClick"
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
          autofocus
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
    </dialog>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onDeactivated, ref, useId } from 'vue'
import { getRssFeedUrl } from '@/utils/rss'

defineProps({ compact: Boolean })

const id = useId()
const dialog = ref(null)
const urlInput = ref(null)
const feedUrl = computed(getRssFeedUrl)
const feedback = ref('复制链接后，在阅读器中选择「添加订阅」。')
const isCopied = ref(false)
const isCopying = ref(false)

const openDialog = () => {
  isCopied.value = false
  feedback.value = '复制链接后，在阅读器中选择「添加订阅」。'
  dialog.value?.showModal()
}

const closeDialog = () => dialog.value?.close()
const selectLink = () => {
  urlInput.value?.focus()
  urlInput.value?.select()
}

const handleBackdropClick = (event) => {
  if (event.target !== dialog.value) return
  const bounds = dialog.value.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog()
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

onDeactivated(closeDialog)
onBeforeUnmount(closeDialog)
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
  width: min(560px, calc(100vw - 2rem));
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

.rss-dialog::backdrop {
  background: rgba(30, 62, 87, 0.4);
  backdrop-filter: blur(5px);
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
</style>
