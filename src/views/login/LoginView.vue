<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message, type FieldRule, type FormInstance } from '@arco-design/web-vue'
import { useUserStore } from '@/stores/user'
import { getCaptcha } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaImg = ref('')

const form = reactive({
  username: 'admin',
  password: 'admin123',
  captcha: '',
  uuid: '',
})

const rules: Record<string, FieldRule[]> = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
  captcha: [{ required: true, message: '请输入验证码' }],
}

async function refreshCaptcha() {
  const data = await getCaptcha()
  captchaImg.value = data.img
  form.uuid = data.uuid
  form.captcha = ''
}

async function handleLogin() {
  const err = await formRef.value?.validate()
  if (err) return
  loading.value = true
  try {
    await userStore.login({
      username: form.username,
      password: form.password,
      captcha: form.captcha,
      uuid: form.uuid,
    })
    await userStore.fetchUserInfo()
    Message.success('登录成功')
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' ? redirect : '/')
  } catch {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<template>
  <div class="login-page">
    <!-- 左侧 Hero 区 — 极光装饰 -->
    <div class="login-hero">
      <div class="hero-content">
        <img src="/logo.jpg" alt="AURORA" class="hero-logo" />
        <h1 class="hero-title">AURORA</h1>
        <p class="hero-subtitle">综合一体化后台平台</p>
        <div class="hero-features">
          <div class="feature-item">
            <icon-user-group :size="18" />
            <span>HR 人事管理</span>
          </div>
          <div class="feature-item">
            <icon-book :size="18" />
            <span>教务选课系统</span>
          </div>
          <div class="feature-item">
            <icon-code :size="18" />
            <span>OJ 在线判题</span>
          </div>
          <div class="feature-item">
            <icon-shopping-cart :size="18" />
            <span>电商商城管理</span>
          </div>
          <div class="feature-item">
            <icon-robot :size="18" />
            <span>AI 智能助手</span>
          </div>
        </div>
      </div>
      <!-- 极光渐变装饰条 -->
      <div class="aurora-bar"></div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-form-area">
      <div class="login-box">
        <div class="login-header">
          <h2>欢迎回来</h2>
          <p>请登录您的 AURORA 账号</p>
        </div>

        <a-form
          ref="formRef"
          :model="form"
          :rules="rules"
          layout="vertical"
          size="large"
          @submit-success="handleLogin"
        >
          <a-form-item field="username" hide-label>
            <a-input v-model="form.username" placeholder="请输入用户名" allow-clear>
              <template #prefix><icon-user /></template>
            </a-input>
          </a-form-item>

          <a-form-item field="password" hide-label>
            <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear>
              <template #prefix><icon-lock /></template>
            </a-input-password>
          </a-form-item>

          <a-form-item field="captcha" hide-label>
            <div class="captcha-row">
              <a-input
                v-model="form.captcha"
                placeholder="请输入验证码"
                :max-length="6"
                allow-clear
                style="flex: 1"
              >
                <template #prefix><icon-safe /></template>
              </a-input>
              <img
                v-if="captchaImg"
                :src="captchaImg"
                alt="验证码"
                class="captcha-img"
                title="点击刷新"
                @click="refreshCaptcha"
              />
              <div v-else class="captcha-placeholder" @click="refreshCaptcha">点击加载</div>
            </div>
          </a-form-item>

          <a-form-item hide-label>
            <a-button
              type="primary"
              long
              :loading="loading"
              html-type="submit"
              class="login-btn"
            >登录</a-button>
          </a-form-item>
        </a-form>

        <div class="login-tip">默认账号 admin / admin123（开发演示）</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: #FAFAFA;
}

/* === 左侧 Hero 区 === */
.login-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1f36 0%, #0d1424 100%);
  position: relative;
  overflow: hidden;
  min-width: 420px;
}

/* 极光装饰条 */
.aurora-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    #FFD700 0%,
    #FFA500 25%,
    #32CD32 50%,
    #14B8A6 75%,
    #87CEFA 100%
  );
}

.hero-content {
  text-align: center;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.hero-logo {
  width: 120px;
  height: auto;
  margin-bottom: 32px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.hero-title {
  font-size: 28px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 0.12em;
  margin: 0 0 8px;
}

.hero-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.06em;
  margin: 0 0 48px;
}

.hero-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 400;
}

/* === 右侧表单区 === */
.login-form-area {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  flex-shrink: 0;
}

.login-box {
  width: 360px;
}

.login-header {
  margin-bottom: 36px;
}

.login-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1F2329;
  margin: 0 0 8px;
}

.login-header p {
  font-size: 14px;
  font-weight: 400;
  color: #86909C;
  margin: 0;
}

/* 验证码行 */
.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.captcha-img {
  height: 40px;
  width: 120px;
  cursor: pointer;
  border: 1px solid #E5E6EB;
  border-radius: 6px;
  object-fit: cover;
  transition: opacity 0.15s ease;
}

.captcha-img:hover {
  opacity: 0.7;
}

.captcha-placeholder {
  height: 40px;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #E5E6EB;
  border-radius: 6px;
  color: #C9CDD4;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.captcha-placeholder:hover {
  color: #1E3A8A;
  border-color: #1E3A8A;
}

/* 登录按钮 */
.login-btn {
  height: 40px;
  font-size: 14px;
  font-weight: 500;
}

.login-tip {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #C9CDD4;
}
</style>
