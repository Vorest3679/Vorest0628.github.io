<!--
  UserPanel - 用户管理面板
  功能：
  1. 普通用户专用管理界面
  2. 只能管理自己的内容
  3. 我的评论、账户设置
-->
<template>
  <div class="user-panel-content">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-content">
        <h1>用户管理面板</h1>
        <p class="user-info">
          欢迎，{{ authStore.user?.username }}！
          <span class="role-badge user">普通用户</span>
        </p>
      </div>
    </div>

    <!-- 普通用户界面 -->
    <div class="user-section">
      <div class="section-tabs">
        <div
          ref="tabList"
          class="custom-tabs"
          role="tablist"
          aria-label="用户管理"
        >
          <button
            v-for="(tab, index) in userTabs"
            :id="`${id}-tab-${tab.key}`"
            :key="tab.key"
            type="button"
            class="panel-tab"
            :class="{ active: activeTab === tab.key }"
            role="tab"
            :aria-selected="activeTab === tab.key"
            :aria-controls="`${id}-panel-${tab.key}`"
            :tabindex="activeTab === tab.key ? 0 : -1"
            @click="activeTab = tab.key"
            @keydown="handleTabKeydown($event, index)"
          >
            {{ tab.label }}
            <span
              v-if="tab.count > 0"
              class="tab-count"
              :aria-label="`${tab.count} 条评论`"
            >{{ tab.count > 99 ? '99+' : tab.count }}</span>
          </button>
        </div>
      </div>

      <div class="tab-content">
        <!-- 我的评论 -->
        <div
          v-show="activeTab === 'my-comments'"
          :id="`${id}-panel-my-comments`"
          class="my-comments"
          role="tabpanel"
          :aria-labelledby="`${id}-tab-my-comments`"
          tabindex="0"
        >
          <UserCommentManager />
        </div>

        <!-- 账户设置 -->
        <div
          v-show="activeTab === 'settings'"
          :id="`${id}-panel-settings`"
          class="account-settings"
          role="tabpanel"
          :aria-labelledby="`${id}-tab-settings`"
          tabindex="0"
        >
          <UserAccountSettings />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent, useId } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'

// 懒加载组件
const UserCommentManager = defineAsyncComponent(() => import('./components/UserCommentManager.vue'))
const UserAccountSettings = defineAsyncComponent(() => import('./components/UserAccountSettings.vue'))

const authStore = useAuthStore()
const router = useRouter()
const id = useId()
const tabList = ref(null)

// 响应式数据
const activeTab = ref('my-comments')
const userStats = ref({
  myComments: 0,
})

// 普通用户标签页
const userTabs = computed(() => [
  { key: 'my-comments', label: '我的评论', count: userStats.value.myComments },
  { key: 'settings', label: '账户设置', count: 0 }
])

const handleTabKeydown = (event, index) => {
  const count = userTabs.value.length
  let nextIndex
  switch (event.key) {
    case 'ArrowRight': nextIndex = (index + 1) % count; break
    case 'ArrowLeft': nextIndex = (index + count - 1) % count; break
    case 'Home': nextIndex = 0; break
    case 'End': nextIndex = count - 1; break
    default: return
  }
  event.preventDefault()
  activeTab.value = userTabs.value[nextIndex].key
  tabList.value?.querySelectorAll('[role="tab"]')[nextIndex]?.focus()
}

// 加载用户统计数据
const loadUserStats = async () => {
  try {
    const response = await userApi.getMyStats()
    if (response.success) {
      userStats.value = response.data
    }
  } catch (error) {
    console.error('加载用户统计数据失败:', error)
    // 使用默认数据作为备用
    userStats.value = {
      myComments: 0,
    }
  }
}

// 检查权限并初始化
const initializePanel = async () => {
  // 检查是否已登录
  if (!authStore.isAuthenticated) {
    alert('请先登录后再访问用户面板')
    router.push('/')
    return
  }

  // 如果是管理员，重定向到管理员控制台
  if (authStore.isAdmin) {
    console.log('管理员用户，重定向到管理员控制台')
    router.push('/admin/dashboard')
    return
  }

  // 加载用户数据
  await loadUserStats()
}

// 组件挂载
onMounted(async () => {
  await authStore.initAuth()
  await initializePanel()
})
</script>

<style scoped>
.user-panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
  color: white;
  padding: 30px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.header-content h1 {
  margin-bottom: 10px;
  font-size: 2.2rem;
  font-weight: 600;
}

.user-info {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 10px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
}

.section-tabs {
  margin-bottom: 20px;
}

.custom-tabs {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: #f4f7fb;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.panel-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #60758b;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.panel-tab:hover { color: #2676ba; background: #e8f2fc; }
.panel-tab.active { color: #2676ba; background: white; box-shadow: 0 2px 8px rgba(38, 118, 186, 0.12); }
.panel-tab:focus-visible,
[role="tabpanel"]:focus-visible { outline: 3px solid #65baff; outline-offset: 2px; }

.tab-count {
  min-width: 22px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #2f87d7;
  color: white;
  font-size: 0.75rem;
  line-height: 1.4;
}

.tab-content {
  flex: 1;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  min-height: 400px;
}

.my-recommendations,
.my-comments,
.account-settings {
  min-height: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    padding: 20px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .tab-content {
    padding: 15px;
  }
  .panel-tab { flex: 1; padding: 10px 12px; }
}
</style>
