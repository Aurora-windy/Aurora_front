# API 接口目录

每个业务模块对应一个子目录，目录里放该模块所有接口请求函数。

## 文件命名约定

```
api/
├── system/
│   ├── user.ts          ← 用户管理接口（CRUD + 改密 + 重置密码）
│   ├── role.ts          ← 角色管理接口
│   ├── menu.ts          ← 菜单管理接口
│   ├── dept.ts          ← 部门管理接口
│   ├── dict.ts          ← 字典管理接口
│   └── log.ts           ← 操作日志接口
├── hr/                  ← 人事（员工/考勤/请假/合同）
├── edu/                 ← 教务（课程/选课/成绩）
├── oj/                  ← 判题（题目/提交/排行榜）
├── mall/                ← 电商（商品/订单/购物车）
└── ai/                  ← AI（对话/知识库）
```

## 使用方式

```ts
// api/system/user.ts
import request from '@/utils/request'

export function getUserPage(params: UserPageQuery) {
  return request.get<UserPageResult>('/system/user/page', { params })
}

export function createUser(data: UserForm) {
  return request.post('/system/user', data)
}
```

```ts
// 在组件里用
import { getUserPage } from '@/api/system/user'

const result = await getUserPage({ page: 1, size: 10 })
```

## 模块对应后端

| 前端目录 | 后端模块 | 说明 |
|---------|---------|------|
| api/system | aurora-system | RBAC 基座：用户/角色/菜单/部门/字典/日志 |
| api/hr | aurora-hr | 人事管理 |
| api/edu | aurora-edu | 教务管理 |
| api/oj | aurora-oj | 在线判题 |
| api/mall | aurora-mall | 电商 |
| api/ai | aurora-ai | RAG AI 智能体 |
