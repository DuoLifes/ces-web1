import request from '../utils/request'
import type { AccountQuery, Account, RoleOption, PageResult, ApiResponse } from '@/types/account'

/**
 * 获取账号列表
 * @param params - 查询参数
 * @returns 账号列表和分页信息
 */
export const fetchAccountData = (
  params: AccountQuery,
): Promise<ApiResponse<PageResult<Account>>> => {
  return request({
    url: '/ces/user/list/page',
    method: 'post',
    data: params,
  })
}

/**
 * 获取角色列表
 * @returns 角色列表
 */
export const fetchRoleData = (): Promise<ApiResponse<RoleOption[]>> => {
  return request({
    url: '/role/list',
    method: 'get',
  })
}

/**
 * 获取账号详情
 * @param id - 账号ID
 * @returns 账号详情
 */
export const getAccountDetail = (id: number): Promise<ApiResponse<Account>> => {
  return request({
    url: `/ces/user/query/detail?userId=${id}`,
    method: 'get',
  })
}

/**
 * 更新账号角色
 * @param id - 账号ID
 * @param roleIds - 角色ID列表
 * @returns 更新结果
 */
export const updateAccountRole = (id: number, roleIds: number[]): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/user/configure/user_role',
    method: 'post',
    data: {
      id,
      roleIds,
    },
  })
}

/**
 * 添加账号
 * @param data - 账号数据
 * @returns 添加结果
 */
export const addAccount = (data: {
  companyId: number
  effectiveDay: string
  name: string
  username: string
}): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/user/add',
    method: 'post',
    data,
  })
}

/**
 * 更新账号
 * @param data - 账号数据
 * @returns 更新结果
 */
export const updateAccount = (data: {
  id: number
  effectiveDay: string
  name: string
}): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/user/modify',
    method: 'post',
    data,
  })
}

/**
 * 更新账号状态
 * @param id - 账号ID
 * @param status - 状态：0 关闭，1 开启
 * @returns 更新结果
 */
export const updateAccountStatus = (id: number, status: number): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/user/modify/status',
    method: 'post',
    data: {
      id,
      status,
    },
  })
}

/**
 * 更新账号有效期
 * @param data - 账号数据
 * @returns 更新结果
 */
export const updateAccountEffectiveDay = (data: {
  id: number
  effectiveDay: string
  name: string
}): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/user/configure/user_effectiveDay',
    method: 'post',
    data,
  })
}

/**
 * 配置账号营销组
 * @param id - 账号ID
 * @param groupIds - 营销组ID列表
 * @returns 更新结果
 */
export const updateAccountGroups = (id: number, groupIds: number[]): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/user/configure/user_group',
    method: 'post',
    data: {
      id,
      groupIds,
    },
  })
}
