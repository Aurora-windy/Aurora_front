import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { OrderCreateReq, OrderQuery, OrderResp, PageResult } from './types'

const BASE_URL = '/mall/orders'

export function createOrder(data: OrderCreateReq = {}) {
  return request.post<ApiId>(BASE_URL, data)
}

export function listMyOrders(params: OrderQuery) {
  return request.get<PageResult<OrderResp>>(`${BASE_URL}/my`, { params })
}

export function listOrders(params: OrderQuery) {
  return request.get<PageResult<OrderResp>>(BASE_URL, { params })
}
