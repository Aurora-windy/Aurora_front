/**
 * 权限码常量（与后端 PermCodeConst 一一对应）
 *
 * spec: docs/specs/2026-07-05-global-variables.md §3.2.4 / §4.2.4
 * 后端: aurora-common/.../constant/PermCodeConst.java
 *
 * 命名规则：模块:资源:动作，三段式，全小写，kebab-case（与 continew-admin 一致）。
 * 前端用法：v-perm="'system:user:add'" 或 hasPerm(PermCode.System.User.ADD)
 *
 * 嵌套对象层级：模块 → 资源 → 动作字符串。镜像 Java 嵌套类结构。
 */

export const PermCode = {
  /** 系统模块（基座 RBAC） */
  System: {
    User: {
      LIST:           'system:user:list',
      ADD:            'system:user:add',
      EDIT:           'system:user:edit',
      REMOVE:         'system:user:remove',
      RESET_PASSWORD: 'system:user:reset-password',
      STATUS:         'system:user:status',
    },
    Role: {
      LIST:        'system:role:list',
      ADD:         'system:role:add',
      EDIT:        'system:role:edit',
      REMOVE:      'system:role:remove',
      ASSIGN_MENU: 'system:role:assign-menu',
    },
    Menu: {
      LIST:   'system:menu:list',
      ADD:    'system:menu:add',
      EDIT:   'system:menu:edit',
      REMOVE: 'system:menu:remove',
    },
    Log: {
      LIST:   'system:log:list',
      REMOVE: 'system:log:remove',
    },
    File: {
      UPLOAD: 'system:file:upload',
    },
  },

  /** HR 模块（Phase 2） */
  Hr: {
    Dept: {
      LIST:   'hr:dept:list',
      ADD:    'hr:dept:add',
      EDIT:   'hr:dept:edit',
      REMOVE: 'hr:dept:remove',
    },
    Position: {
      LIST:   'hr:position:list',
      ADD:    'hr:position:add',
      EDIT:   'hr:position:edit',
      REMOVE: 'hr:position:remove',
    },
    Employee: {
      LIST:     'hr:employee:list',
      ADD:      'hr:employee:add',
      EDIT:     'hr:employee:edit',
      REMOVE:   'hr:employee:remove',
      EXPORT:   'hr:employee:export',
      TRANSFER: 'hr:employee:transfer',
    },
    Attendance: {
      CLOCK_IN: 'hr:attendance:clock-in',
      AUDIT:    'hr:attendance:audit',
    },
  },

  /** EDU 模块（Phase 3） */
  Edu: {
    Student: {
      LIST:   'edu:student:list',
      ADD:    'edu:student:add',
      EDIT:   'edu:student:edit',
      REMOVE: 'edu:student:remove',
    },
    Teacher: {
      LIST:   'edu:teacher:list',
      ADD:    'edu:teacher:add',
      EDIT:   'edu:teacher:edit',
      REMOVE: 'edu:teacher:remove',
    },
    Course: {
      LIST:   'edu:course:list',
      ADD:    'edu:course:add',
      EDIT:   'edu:course:edit',
      REMOVE: 'edu:course:remove',
    },
    SCORE_INPUT:      'edu:score:input',
    SCORE_VIEW_MY:    'edu:score:view-my',
    SELECTION_SELECT: 'edu:selection:select',
    SELECTION_DROP:   'edu:selection:drop',
  },

  /** OJ 模块（Phase 4） */
  Oj: {
    Problem: {
      LIST:   'oj:problem:list',
      DETAIL: 'oj:problem:detail',
      ADD:    'oj:problem:add',
      EDIT:   'oj:problem:edit',
      REMOVE: 'oj:problem:remove',
    },
    SUBMISSION_SUBMIT:  'oj:submission:submit',
    SUBMISSION_VIEW_MY: 'oj:submission:view-my',
    FAVORITE_VIEW_MY:   'oj:favorite:view-my',
    LEADERBOARD_VIEW:   'oj:leaderboard:view',
  },

  /** MALL 模块（Phase 5，答辩核心） */
  Mall: {
    Product: {
      LIST:   'mall:product:list',
      ADD:    'mall:product:add',
      EDIT:   'mall:product:edit',
      REMOVE: 'mall:product:remove',
      STATUS: 'mall:product:status',
    },
    Cart: {
      LIST:   'mall:cart:list',
      ADD:    'mall:cart:add',
      EDIT:   'mall:cart:edit',
      REMOVE: 'mall:cart:remove',
    },
    Address: {
      LIST:   'mall:address:list',
      ADD:    'mall:address:add',
      EDIT:   'mall:address:edit',
      REMOVE: 'mall:address:remove',
    },
    Order: {
      PLACE:   'mall:order:place',
      VIEW_MY: 'mall:order:view-my',
      LIST:    'mall:order:list',
      PRICE:   'mall:order:price',
      SHIP:    'mall:order:ship',
      REFUND:  'mall:order:refund',
    },
    SECKILL_JOIN: 'mall:seckill:join',
  },

  /** AI 模块（Phase 6） */
  Ai: {
    Document: {
      UPLOAD: 'ai:document:upload',
      REMOVE: 'ai:document:remove',
    },
    CHAT_SEND:    'ai:chat:send',
    CHAT_HISTORY: 'ai:chat:history',
  },
} as const

/** 递归提取所有权限码字符串字面量类型 */
type DeepStringValues<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : DeepStringValues<T[K]>
}[keyof T]

export type PermCode = DeepStringValues<typeof PermCode>

/** 收集所有叶子权限码（运行时给 v-perm 全量注册或调试用） */
const collectAllPerms = (obj: unknown, acc: string[] = []): string[] => {
  if (typeof obj === 'string') {
    acc.push(obj)
  } else if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      collectAllPerms(v, acc)
    }
  }
  return acc
}

export const ALL_PERM_CODES: readonly string[] = Object.freeze(collectAllPerms(PermCode))
