# Views 页面目录

每个业务模块对应一个子目录，目录里放该模块所有页面（.vue 文件）。

## 文件命名约定

- 列表页：`XxxList.vue`（如 `UserList.vue`）
- 表单页（新增/编辑）：`XxxForm.vue`（如 `UserForm.vue`）
- 详情页：`XxxDetail.vue`（如 `UserDetail.vue`）
- 弹窗组件：`XxxModal.vue`

## 模块对应业务

| 目录 | 后端模块 | 主要页面 |
|------|---------|---------|
| views/system | aurora-system | 用户/角色/菜单/部门/字典/日志/登录/注册/个人中心 |
| views/hr | aurora-hr | 员工档案/考勤打卡/请假申请/合同管理 |
| views/edu | aurora-edu | 课程管理/选课/成绩录入/课表查询 |
| views/oj | aurora-oj | 题目列表/在线答题/提交记录/排行榜 |
| views/mall | aurora-mall | 商品管理/订单管理/购物车 |
| views/ai | aurora-ai | 知识库管理/对话界面 |

## 已有页面（来自初始模板）

- `views/DashboardView.vue` - 仪表盘（首页）
- `views/UsersView.vue` - 用户管理占位（Phase 1 替换为正式实现）
- `views/SettingsView.vue` - 设置页占位

## Phase 1 开始填的页面

Phase 1 Task 1.1 开始填 `views/login/`（登录、注册、找回密码），Task 1.4 开始填 `views/system/`（用户、角色、菜单、部门管理）。
