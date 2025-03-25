/**
 * 小区信息接口
 */
export interface Community {
  id: number
  tenantId: number | string
  tenantName: string
  companyId: number | string
  companyName: string
  gridId: number | string
  gridName: string
  name: string
  operatorName: string
  createTime: string
  updateTime: string
}

/**
 * 小区查询参数
 */
export interface CommunityQuery {
  tenantId?: number | string
  companyId?: number | string
  gridId?: number | string
  name?: string
  pageNo?: number
  pageSize?: number
}

/**
 * 小区创建参数
 */
export interface CommunityCreate {
  gridId: string | number
  name: string
}

/**
 * 小区更新参数
 */
export interface CommunityUpdate {
  id: number
  gridId: string | number
  name: string
}
