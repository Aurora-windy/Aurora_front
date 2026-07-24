import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'

export interface SeckillActivityResp {
  id: ApiId
  productId: ApiId
  productName?: string
  seckillPrice: number
  originalPrice?: number
  seckillStock: number
  availableStock: number
  limitPerUser: number
  startTime: string
  endTime: string
  status: number
  createTime?: string
}

export interface SeckillActivityForm {
  productId: ApiId
  seckillPrice: number
  seckillStock: number
  limitPerUser?: number
  startTime: string
  endTime: string
}

export interface StockLogResp {
  id: ApiId
  productId: ApiId
  productName?: string
  bizType: number
  quantity: number
  orderId?: ApiId
  remark?: string
  createTime?: string
}

export interface PageResult<T> { list: T[]; total: number }

// Payment
export function payOrder(id: ApiId) { return request.post<boolean>(`/mall/orders/${id}/pay`) }
export function cancelOrder(id: ApiId) { return request.post<boolean>(`/mall/orders/${id}/cancel`) }
export function shipOrder(id: ApiId) { return request.post<boolean>(`/mall/orders/${id}/ship`) }
export function completeOrder(id: ApiId) { return request.post<boolean>(`/mall/orders/${id}/complete`) }
export function refundOrder(id: ApiId) { return request.post<boolean>(`/mall/orders/${id}/refund`) }

// Seckill
export function listActivities(pageNum = 1, pageSize = 10) { return request.get<PageResult<SeckillActivityResp>>('/mall/seckill/activities', { params: { pageNum, pageSize } }) }
export function availableActivities() { return request.get<SeckillActivityResp[]>('/mall/seckill/available') }
export function createActivity(data: SeckillActivityForm) { return request.post<ApiId>('/mall/seckill/activities', data) }
export function updateActivity(id: ApiId, data: SeckillActivityForm) { return request.put<boolean>(`/mall/seckill/activities/${id}`, data) }
export function toggleActivityStatus(id: ApiId, status: number) { return request.patch<boolean>(`/mall/seckill/activities/${id}/status`, null, { params: { status } }) }
export function joinSeckill(activityId: ApiId, idempotentId: string) { return request.post<ApiId>('/mall/seckill/join', { activityId, idempotentId }) }
export function listStockLogs(params: { productId?: ApiId; bizType?: number; pageNum?: number; pageSize?: number }) { return request.get<PageResult<StockLogResp>>('/mall/seckill/stock-logs', { params }) }
