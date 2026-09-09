# AURORA Frontend

AURORA 综合一体化后台平台的**前端仓库**。Vue 3 + TypeScript + Vite + Arco Design Vue，覆盖 RBAC 权限、人事、教务、在线判题、电商五大后台业务，以及一套独立的 AI 助手应用外壳。

对应后端仓库：[Aurora_back](https://github.com/Aurora-windy/Aurora_back.git)

---

## 技术栈

| 分类 | 选型 | 版本 |
|------|------|------|
| 框架 | Vue 3（`<script setup>` + TS） | 3.5 |
| 构建 | Vite | 8 |
| 语言 | TypeScript | ~6.0 |
| UI 组件库 | Arco Design Vue | 2.58 |
| 状态管理 | Pinia | 3.0 |
| 路由 | Vue Router | 4.5 |
| 请求 | Axios | 1.18 |
| 图表 | ECharts | 6.1 |
| Markdown | marked + marked-highlight + highlight.js | — |
| 测试 | Vitest + @vue/test-utils + jsdom | 4.1 |
| 类型检查 | vue-tsc | 3.3 |

Node 要求：`^20.19.0 || >=22.12.0`

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（http://localhost:5173）
npm run dev
```

开发服务器通过 Vite proxy 把 `/api/*` 转发到后端：

```
前端 GET /api/system/user/page
  →  http://localhost:1207/api/system/user/page
```

所以**要先启动后端**（端口 1207，context-path `/api`），否则页面全部接口 404。

### 其他命令

```bash
npm run build         # 类型检查 + 生产构建（输出到 dist/）
npm run build-only    # 只构建，不做类型检查
npm run type-check    # 只做 vue-tsc 类型检查
npm run preview       # 本地预览构建产物
npm run test          # 跑一次单元测试
npm run test:watch    # 监听模式跑测试
npm run test:coverage # 带覆盖率
```

---

## 环境变量

| 文件 | 用途 |
|------|------|
| `.env.development` | 开发环境（`npm run dev` 时生效） |
| `.env.production` | 生产环境（`npm run build` 时生效） |

| 变量 | 说明 |
|------|------|
| `VITE_APP_BASE_API` | 请求基础路径，默认 `/api`。生产由 Nginx 把 `/api/*` 反代到后端真实地址 |
| `VITE_APP_TITLE` | 站点标题 |

---

## 目录结构

```
src/
├── api/            接口层，按业务域拆分（system / hr / edu / oj / mall / ai / builder / auth）
├── assets/         静态资源
├── components/     公共组件（ai/AiFloatingAgent.vue 为全局悬浮 AI 助手）
├── constants/      常量
├── directive/      自定义指令（权限指令等）
├── enums/          枚举定义，按域拆分，含 __tests__
├── hooks/          组合式函数
├── layouts/        AdminLayout（后台外壳）、AiAppLayout（AI 助手外壳）
├── router/         路由与全局守卫
├── stores/         Pinia：user（用户）、permission（动态菜单）、app、counter
├── styles/         全局样式
├── types/          全局类型
├── utils/          request.ts（Axios 封装）、auth.ts（token）、markdown.ts
└── views/          页面，按域拆分
```

---

## 路由与权限

路由分两类：

**静态路由**（`router/index.ts`）：

- `/login` — 登录页
- `/` → `AdminLayout` — 后台外壳，`/workbench` 为首页
- `/assistant` → `AiAppLayout` — 独立的 AI 助手应用外壳，含 `/assistant/chat`、`/assistant/knowledge`、`/assistant/graph`、`/assistant/settings`

**动态路由**：登录后由 `stores/permission.ts` 调用 `getUserRoutes()` 从后端拉取菜单树，再按 `componentMap` 映射成真实组件并 `router.addRoute('admin-root', ...)` 注册。全局守卫负责无 token 跳登录、切换账号时清理旧路由。

### 新增一个后台页面的完整步骤

1. 在 `views/<域>/<页面>/index.vue` 写页面；
2. 在 `stores/permission.ts` 的 `componentMap` 里注册一行（**key 必须与后端菜单的 component 路径一致，如 `hr/employee/index`**）；
3. 在后端菜单管理里新增菜单记录并授权给角色。

漏掉第 2 步会出现「菜单能看见，点进去白屏」。

---

## 请求层约定

`utils/request.ts` 封装了 Axios，业务代码**直接拿到 data，不需要解包 `Result`**：

```ts
// api/system/user.ts
import request from '@/utils/request'

export function getUserPage(params: UserPageQuery) {
  return request.get<UserPageResult>('/system/user/page', { params })
}
```

```ts
// 组件里
const page = await getUserPage({ page: 1, size: 10 })
```

已内置的行为：

- 请求拦截自动注入 `Authorization: Bearer <token>`
- 响应拦截解包 `{ code, msg, data }`，`code !== 200` 弹 Arco 错误提示
- `401` 弹确认框跳登录
- `responseType: 'blob'` 直接返回原始响应，供文件下载自己处理
- 超时 30s

---

## 开发约定

- **UI 文案全部中文**，不在界面上暴露英文（后端枚举值如 `CHAT` / `BOTH` / `EMBEDDING` 仅作为提交值，不展示给用户）。
- 接口函数按业务域放在 `src/api/<域>/` 下，类型定义在该域的 `types.ts`。
- 枚举集中在 `src/enums/`，不要在组件里硬编码魔法值。
- 提交前跑一次 `npm run type-check` 和 `npm run test`。

---

## 业务模块对照

| 前端视图 | 后端模块 | 说明 |
|---------|---------|------|
| `views/system` | aurora-system | 用户 / 角色 / 菜单 / 文件 |
| `views/hr` | aurora-hr | 部门 / 岗位 / 员工 / 我的考勤 / 考勤管理 |
| `views/edu` | aurora-edu | 学生 / 教师 / 课程 / 选课 |
| `views/oj` | aurora-oj | 题目 / 练习 / 提交记录 / 我的提交 |
| `views/mall` | aurora-mall | 商品 / 商城 / 购物车 / 订单 / 我的订单 / 秒杀 / 库存流水 |
| `views/ai` | aurora-ai | 对话 / 知识库 / 图谱 / 模型 Provider / MCP / 审计 / 会话 |
| `views/builder` | aurora-ai | AI 代码生成（需求解析 → 生成预览） |
| `views/assistant` | aurora-ai | AI 助手独立外壳（对话 / 知识库 / 图谱 / 设置） |

---

## 测试

```bash
npm run test
```

测试文件与源码同侧的 `__tests__` 目录：`src/enums/__tests__`、`src/stores/__tests__`、`src/utils/__tests__`，配置见 `vitest.config.ts`。

---

## 常见问题

**Q：页面能打开但所有接口 404 / Network Error？**

后端没起。前端只做转发，不提供数据。确认后端在 `http://localhost:1207` 且 context-path 为 `/api`。

**Q：菜单显示出来了，点进去白屏？**

`stores/permission.ts` 的 `componentMap` 里没有注册该 component 路径。检查后端菜单配置的 component 与前端 key 是否一字不差。

**Q：改了后端接口，前端没生效？**

前端是热更新的，但后端改 Java 代码必须重新编译打包并重启。注意区分。

**Q：Long 类型 ID 精度丢失？**

后端 Jackson 已配置 `big-number-mode: string`，超长 Long 会序列化成字符串，前端按 string 处理即可，不要转成 number。
