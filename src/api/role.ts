import request from '../utils/request'
import type { Role, RoleQuery, RoleCreate, RoleUpdate, RoleItem } from '@/types/role'

/**
 * 分页响应数据接口
 */
interface PageResult<T> {
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
interface ApiResponse<T> {
  /** 状态码，'00000'表示成功 */
  code: string
  /** 响应消息 */
  msg: string
  /** 响应数据 */
  data: T
}

/**
 * 获取角色列表数据（分页）
 * @param params - 查询参数，包含角色名称和分页信息
 * @returns Promise<ApiResponse<PageResult<Role>>> - 返回角色列表和总数
 */
export const fetchRoleData = (params: RoleQuery): Promise<ApiResponse<PageResult<Role>>> => {
  return request({
    url: '/ces/role/list/page',
    method: 'post',
    data: params,
  })
}

/**
 * 获取角色列表（不分页）
 * @returns Promise<ApiResponse<RoleItem[]>> - 返回角色列表
 */
export const fetchRoleList = (): Promise<ApiResponse<RoleItem[]>> => {
  return request({
    url: '/ces/role/list',
    method: 'get',
  })
}

/**
 * 添加角色
 * @param data - 角色数据，包含角色名称和描述
 * @returns Promise<ApiResponse<any>> - 返回添加结果
 */
export const addRole = (data: RoleCreate): Promise<ApiResponse<any>> => {
  return request({
    url: '/ces/role/add',
    method: 'post',
    data,
  })
}

/**
 * 更新角色
 * @param data - 角色数据，包含角色ID、名称和描述
 * @returns Promise<ApiResponse<any>> - 返回更新结果
 */
export const updateRole = (data: RoleUpdate): Promise<ApiResponse<any>> => {
  return request({
    url: '/ces/role/modify',
    method: 'post',
    data,
  })
}

/**
 * 删除角色
 * @param id - 角色ID
 * @returns Promise<ApiResponse<any>> - 返回删除结果
 */
export const deleteRole = (id: number): Promise<ApiResponse<any>> => {
  return request({
    url: `/ces/role/delete?id=${id}`,
    method: 'delete',
  })
}
