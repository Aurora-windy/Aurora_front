import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { PageResult, ProductForm, ProductQuery, ProductResp } from './types'

const BASE_URL = '/mall/products'

export function listProducts(params: ProductQuery) {
  return request.get<PageResult<ProductResp>>(BASE_URL, { params })
}

export function listAvailableProducts(params: ProductQuery) {
  return request.get<PageResult<ProductResp>>(`${BASE_URL}/available`, { params })
}

export function getProduct(id: ApiId) {
  return request.get<ProductResp>(`${BASE_URL}/${id}`)
}

export function addProduct(data: ProductForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateProduct(id: ApiId, data: ProductForm) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function updateProductStatus(id: ApiId, status: number) {
  return request.patch<boolean>(`${BASE_URL}/${id}/status`, { status })
}

export function deleteProduct(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
