/**
 * 账号查询参数接口
 */
export interface AccountQuery {
  /** 运营商ID */
  tenantId?: number
  /** 局点ID */
  companyId?: number
  /** 营销组ID列表 */
  marketingGroups?: number[]
  /** 用户账号 */
  username?: string
  /** 用户名称 */
  realName?: string
  /** 是否启用 */
  enabled?: boolean
  /** 是否到期 */
  expired?: boolean
  /** 页码 */
  pageNo: number
  /** 每页条数 */
  pageSize: number
}

/**
 * 账号信息接口
 */
export interface Account {
  /** 账号ID */
  id: number
  /** 运营商ID */
  tenantId: number
  /** 运营商名称 */
  tenantName: string
  /** 局点ID */
  companyId: number
  /** 局点名称 */
  companyName: string
  /** 用户账号 */
  username: string
  /** 用户名称 */
  realName: string
  /** 角色ID */
  roleId: number
  /** 角色名称 */
  roleName: string
  /** 营销组ID列表 */
  marketingGroups: number[]
  /** 营销组名称（逗号分隔） */
  marketingGroupNames: string
  /** 是否启用 */
  enabled: number | boolean
  /** 有效期至 */
  expireDate: string
  /** 是否到期 */
  expired: number | boolean
  /** 创建人 */
  creator: string
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime: string
}

/**
 * 角色选项接口
 */
export interface RoleOption {
  /** 角色ID */
  id: number
  /** 角色名称 */
  name: string
  /** 角色编码 */
  code?: string
  /** 角色描述 */
  description?: string
}

/**
 * 分页响应数据接口
 */
export interface PageResult<T> {
  /** 记录列表 */
  records: T[]
  /** 总记录数 */
  total: number
  /** 每页大小 */
  size: number
  /** 当前页码 */
  current: number
  /** 总页数 */
  pages: number
}

/**
 * API 响应数据接口
 */
export interface ApiResponse<T> {
  /** 状态码，'00000'表示成功 */
  code: string
  /** 响应消息 */
  msg: string
  /** 响应数据 */
  data: T
} 