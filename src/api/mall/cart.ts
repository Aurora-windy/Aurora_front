import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { CartAddReq, CartResp, CartUpdateReq } from './types'

const BASE_URL = '/mall/cart'

export function listCart() {
  return request.get<CartResp[]>(BASE_URL)
}

export function addCart(data: CartAddReq) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateCart(id: ApiId, data: CartUpdateReq) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function deleteCart(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
