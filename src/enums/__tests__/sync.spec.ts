/**
 * 枚举同步单测：前端 enum 值必须与后端 Java enum 一致
 *
 * spec: docs/specs/2026-07-05-global-variables.md §4.7.2 / §六 验收 7
 *
 * 维护方式：每次后端 enum 变更 → 手动同步前端 → 跑此测试验证
 * 单测覆盖原则：spec §六 验收 7 要求"任选 3 个枚举"，这里覆盖全部关键路径
 * （订单状态机、判题状态、双值枚举、通用状态、角色码、权限码）。
 */

import { describe, it, expect } from 'vitest'
import {
  OrderStatus,
  OrderStatusMeta,
  JudgeStatus,
  JudgeStatusMeta,
  Language,
  LanguageValueMap,
  Status,
  StatusMeta,
  ChatRole,
  ChatRoleValueMap,
} from '@/enums'
import { RoleCode, PermCode } from '@/constants'

describe('前端枚举与后端 code 值同步', () => {
  /**
   * 订单状态机（OrderStatusEnum）
   * 后端 aurora-mall/.../enums/OrderStatusEnum.java
   */
  describe('OrderStatus', () => {
    it('code 值与后端一致', () => {
      expect(OrderStatus.PENDING_PAYMENT).toBe(0)
      expect(OrderStatus.PAID).toBe(1)
      expect(OrderStatus.SHIPPED).toBe(2)
      expect(OrderStatus.COMPLETED).toBe(3)
      expect(OrderStatus.CANCELLED).toBe(4)
      expect(OrderStatus.REFUNDED).toBe(5)
    })

    it('6 个状态全部有 meta', () => {
      const allCodes = [0, 1, 2, 3, 4, 5] as const
      for (const code of allCodes) {
        expect(OrderStatusMeta[code as OrderStatus]).toBeDefined()
        expect(OrderStatusMeta[code as OrderStatus].label).toBeTruthy()
      }
    })
  })

  /**
   * 判题状态（JudgeStatusEnum）
   * 后端 aurora-oj/.../enums/JudgeStatusEnum.java
   */
  describe('JudgeStatus', () => {
    it('code 值与后端 0-7 一致', () => {
      expect(JudgeStatus.PENDING).toBe(0)
      expect(JudgeStatus.ACCEPTED).toBe(1)
      expect(JudgeStatus.WRONG_ANSWER).toBe(2)
      expect(JudgeStatus.TIME_LIMIT_EXCEEDED).toBe(3)
      expect(JudgeStatus.MEMORY_LIMIT_EXCEEDED).toBe(4)
      expect(JudgeStatus.RUNTIME_ERROR).toBe(5)
      expect(JudgeStatus.COMPILE_ERROR).toBe(6)
      expect(JudgeStatus.SYSTEM_ERROR).toBe(7)
    })

    it('AC 缩写必须为 "AC"（OJ 通用约定）', () => {
      expect(JudgeStatusMeta[JudgeStatus.ACCEPTED].abbr).toBe('AC')
    })
  })

  /**
   * 双值枚举：LanguageEnum
   * 后端 @JsonValue 标在 value 上，前端接口收到的就是字符串
   */
  describe('Language (双值枚举)', () => {
    it('int code 与后端一致', () => {
      expect(Language.JAVA).toBe(1)
      expect(Language.PYTHON).toBe(2)
      expect(Language.GO).toBe(3)
      expect(Language.CPP).toBe(4)
    })

    it('value 字符串与后端一致（喂 Monaco Editor）', () => {
      expect(LanguageValueMap[Language.JAVA]).toBe('java')
      expect(LanguageValueMap[Language.PYTHON]).toBe('python')
      expect(LanguageValueMap[Language.GO]).toBe('go')
      expect(LanguageValueMap[Language.CPP]).toBe('cpp')
    })
  })

  /**
   * 双值枚举：ChatRoleEnum
   * value 必须对齐 OpenAI/Spring AI 协议（"user"/"assistant"/"system"）
   */
  describe('ChatRole (双值枚举)', () => {
    it('value 字符串与 LLM 协议一致', () => {
      expect(ChatRoleValueMap[ChatRole.USER]).toBe('user')
      expect(ChatRoleValueMap[ChatRole.ASSISTANT]).toBe('assistant')
      expect(ChatRoleValueMap[ChatRole.SYSTEM]).toBe('system')
    })
  })

  /**
   * 通用状态（StatusEnum）
   * 后端 aurora-common/.../enums/StatusEnum.java
   */
  describe('Status (通用启停)', () => {
    it('code 值与后端一致', () => {
      expect(Status.DISABLED).toBe(0)
      expect(Status.ENABLED).toBe(1)
    })

    it('meta 颜色对应语义', () => {
      expect(StatusMeta[Status.DISABLED].color).toBe('red')
      expect(StatusMeta[Status.ENABLED].color).toBe('green')
    })
  })
})

describe('前端角色码与权限码同步', () => {
  /**
   * RoleCodeConst
   * 后端 aurora-common/.../constant/RoleCodeConst.java
   * 5 个角色已定死，命名一旦冻结不可改
   */
  describe('RoleCode', () => {
    it('5 个角色码与后端一致', () => {
      expect(RoleCode.ADMIN).toBe('ADMIN')
      expect(RoleCode.HR_ADMIN).toBe('HR_ADMIN')
      expect(RoleCode.EDU_TEACHER).toBe('EDU_TEACHER')
      expect(RoleCode.MALL_ADMIN).toBe('MALL_ADMIN')
      expect(RoleCode.STUDENT).toBe('STUDENT')
    })
  })

  /**
   * PermCodeConst
   * 后端 aurora-common/.../constant/PermCodeConst.java
   * 命名规则：模块:资源:动作，三段式，全小写，kebab-case
   */
  describe('PermCode', () => {
    it('系统模块权限码格式正确', () => {
      expect(PermCode.System.User.ADD).toBe('system:user:add')
      expect(PermCode.System.User.RESET_PASSWORD).toBe('system:user:reset-password')
      expect(PermCode.System.Role.ASSIGN_MENU).toBe('system:role:assign-menu')
    })

    it('MALL 模块权限码格式正确', () => {
      expect(PermCode.Mall.Order.PLACE).toBe('mall:order:place')
      expect(PermCode.Mall.Order.VIEW_MY).toBe('mall:order:view-my')
      expect(PermCode.Mall.SECKILL_JOIN).toBe('mall:seckill:join')
    })

    it('权限码全部遵循三段式（regex）', () => {
      const pattern = /^[a-z]+:[a-z][a-z-]*:[a-z][a-z-]*$/
      const flatten = (obj: unknown, acc: string[] = []): string[] => {
        if (typeof obj === 'string') acc.push(obj)
        else if (obj && typeof obj === 'object')
          for (const v of Object.values(obj as Record<string, unknown>)) flatten(v, acc)
        return acc
      }
      const all = flatten(PermCode)
      expect(all.length).toBeGreaterThanOrEqual(60)
      for (const code of all) {
        expect(code, `权限码格式错误：${code}`).toMatch(pattern)
      }
    })
  })
})
