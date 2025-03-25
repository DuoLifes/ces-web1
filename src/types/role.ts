/**
 * 角色信息接口
 */
export interface Role {
  /** 角色ID */
  id: number
  /** 角色名称 */
  name: string
  /** 角色描述 */
  description: string
  /** 创建人 */
  operatorName: string
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime: string
}

/**
 * 角色查询参数
 */
export interface RoleQuery {
  /** 角色名称，可选 */
  name?: string
  /** 当前页码 */
  pageNo?: number
  /** 每页记录数 */
  pageSize?: number
}

/**
 * 角色创建参数
 */
export interface RoleCreate {
  /** 角色名称 */
  name: string
  /** 角色描述，可选 */
  description?: string
}

/**
 * 角色更新参数
 */
export interface RoleUpdate {
  /** 角色ID */
  id: number
  /** 角色名称 */
  name: string
  /** 角色描述，可选 */
  description?: string
}

/**
 * 简单角色项，用于下拉选择器
 */
export interface RoleItem {
  /** 角色ID */
  id: number
  /** 角色名称 */
  name: string
}
