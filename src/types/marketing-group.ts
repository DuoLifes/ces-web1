/**
 * 营销组信息接口
 */
export interface MarketingGroup {
  id: number
  tenantId: number | string
  tenantName: string
  companyId: number | string
  companyName: string
  groupName: string
  description: string
  operatorName: string
  createTime: string
  updateTime: string
}

/**
 * 营销组查询参数
 */
export interface MarketingGroupQuery {
  tenantId?: number | string
  companyId?: number | string
  name?: string
  pageNo?: number
  pageSize?: number
}

/**
 * 营销组创建参数
 */
export interface MarketingGroupCreate {
  companyId: string | number
  name: string
  description?: string
}

/**
 * 营销组更新参数
 */
export interface MarketingGroupUpdate {
  id: number
  companyId: string | number
  name: string
  description?: string
}
