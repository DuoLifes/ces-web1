/**
 * 标签信息接口
 */
export interface Tag {
  id: number
  name: string
  type: number
  typeValue: string
  companyIds: string
  companyNames: string
}

/**
 * 标签查询参数
 */
export interface TagQuery {
  companyId?: number
  name?: string
  type?: number
  pageNo?: number
  pageSize?: number
}

/**
 * 标签创建参数
 */
export interface TagCreate {
  name: string
  type: number
}

/**
 * 标签更新参数
 */
export interface TagUpdate {
  id: number
  name: string
  type: number
}

/**
 * 标签局点配置参数
 */
export interface TagCompanyConfigure {
  id: number
  companyList: number[]
}
