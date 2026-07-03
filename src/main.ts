import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'

import App from './App.vue'
import router from './router'

// AURORA Design System — 飞书风 + 极光装饰
import './styles/tokens.css'        // CSS 变量 Token
import './styles/arco-theme.css'    // Arco Design Token 覆盖
import './styles/global.css'        // 全局基础样式 + Arco 组件覆盖
import './styles/aurora.css'        // 极光装饰工具类

const app = createApp(App)

app.use(createPinia())
app.use(ArcoVue)
app.use(router)

app.mount('#app')
