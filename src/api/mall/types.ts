import type { ApiId, PageQuery } from '@/api/system/types'

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface ProductQuery extends PageQuery {
  name?: string
  status?: number
}

export interface ProductResp {
  id: ApiId
  name: string
  description?: string
  price: number
  stock: number
  status: number
  createTime?: string
}

export interface ProductForm {
  id?: ApiId
  name: string
  description?: string
  price: number
  stock: number
  status?: number
}

export interface CartResp {
  id: ApiId
  productId: ApiId
  productName: string
  price: number
  stock: number
  productStatus?: number
  quantity: number
  subtotalAmount: number
}

export interface CartAddReq {
  productId: ApiId
  quantity: number
}

export interface CartUpdateReq {
  quantity: number
}

export interface OrderQuery extends PageQuery {
  orderNo?: string
  userId?: ApiId
  status?: number
}

export interface OrderCreateReq {
  cartIds?: ApiId[]
}

export interface OrderItemResp {
  id: ApiId
  productId: ApiId
  productName: string
  price: number
  quantity: number
  subtotalAmount: number
}

export interface OrderResp {
  id: ApiId
  orderNo: string
  userId: ApiId
  totalAmount: number
  status: number
  createTime?: string
  items: OrderItemResp[]
}
