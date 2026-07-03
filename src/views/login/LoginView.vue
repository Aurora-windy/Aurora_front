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
    router.push(typeof redirect === 'string' ? redirect : '/workbench')
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
    <div class="login-box">
      <div class="login-header">
        <h1>AURORA</h1>
        <p>综合一体化后台平台</p>
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
          >立即登录</a-button>
        </a-form-item>
      </a-form>

      <div class="login-tip">默认账号 admin / admin123（开发演示）</div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.login-box {
  width: 400px;
  padding: 36px 32px 24px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-header h1 {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 700;
  color: #1677ff;
  letter-spacing: 2px;
}

.login-header p {
  margin: 0;
  font-size: 13px;
  color: #86909c;
}

.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.captcha-img {
  height: 40px;
  width: 120px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
}

.captcha-placeholder {
  height: 40px;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #c9cdd4;
  border-radius: 4px;
  color: #86909c;
  font-size: 12px;
  cursor: pointer;
}

.login-tip {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: #86909c;
}
</style>
