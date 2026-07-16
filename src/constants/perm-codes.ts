/**
 * 鏉冮檺鐮佸父閲忥紙涓庡悗绔?PermCodeConst 涓€涓€瀵瑰簲锛? *
 * spec: docs/specs/2026-07-05-global-variables.md 搂3.2.4 / 搂4.2.4
 * 鍚庣: aurora-common/.../constant/PermCodeConst.java
 *
 * 鍛藉悕瑙勫垯锛氭ā鍧?璧勬簮:鍔ㄤ綔锛屼笁娈靛紡锛屽叏灏忓啓锛宬ebab-case锛堜笌 continew-admin 涓€鑷达級銆? * 鍓嶇鐢ㄦ硶锛歷-perm="'system:user:add'" 鎴?hasPerm(PermCode.System.User.ADD)
 *
 * 宓屽瀵硅薄灞傜骇锛氭ā鍧?鈫?璧勬簮 鈫?鍔ㄤ綔瀛楃涓层€傞暅鍍?Java 宓屽绫荤粨鏋勩€? */

export const PermCode = {
  /** 绯荤粺妯″潡锛堝熀搴?RBAC锛?*/
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

  /** HR 妯″潡锛圥hase 2锛?*/
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

  /** EDU 妯″潡锛圥hase 3锛?*/
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

  /** OJ 妯″潡锛圥hase 4锛?*/
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

  /** MALL 妯″潡锛圥hase 5锛岀瓟杈╂牳蹇冿級 */
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

  /** AI module */
  Ai: {
    Chat: {
      USE: 'ai:chat:use',
    },
    Session: {
      LIST: 'ai:session:list',
    },
    Knowledge: {
      LIST:    'ai:knowledge:list',
      CREATE:  'ai:knowledge:create',
      UPDATE:  'ai:knowledge:update',
      DELETE:  'ai:knowledge:delete',
      PUBLISH: 'ai:knowledge:publish',
    },
    Provider: {
      LIST:   'ai:provider:list',
      CREATE: 'ai:provider:create',
      UPDATE: 'ai:provider:update',
      TEST:   'ai:provider:test',
    },
    Audit: {
      LIST: 'ai:audit:list',
    },
  },
} as const

/** 閫掑綊鎻愬彇鎵€鏈夋潈闄愮爜瀛楃涓插瓧闈㈤噺绫诲瀷 */
type DeepStringValues<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : DeepStringValues<T[K]>
}[keyof T]

export type PermCode = DeepStringValues<typeof PermCode>

/** 鏀堕泦鎵€鏈夊彾瀛愭潈闄愮爜锛堣繍琛屾椂缁?v-perm 鍏ㄩ噺娉ㄥ唽鎴栬皟璇曠敤锛?*/
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
