import request from '../utils/request'
import type { AccountQuery, Account, RoleOption, PageResult, ApiResponse } from '@/types/account'

/**
 * 获取账号列表
 * @param params - 查询参数
 * @returns 账号列表和分页信息
 */
export const fetchAccountData = (params: AccountQuery): Promise<ApiResponse<PageResult<Account>>> => {
  return request({
    url: '/ces/account/list/page',
    method: 'post',
    data: params,
  })
}

/**
 * 添加账号
 * @param data - 账号数据
 * @returns 添加结果
 */
export const addAccount = (data: Partial<Account>): Promise<ApiResponse<Account>> => {
  return request({
    url: '/ces/account/add',
    method: 'post',
    data,
  })
}

/**
 * 更新账号
 * @param data - 账号数据
 * @returns 更新结果
 */
export const updateAccount = (data: Partial<Account>): Promise<ApiResponse<Account>> => {
  return request({
    url: '/ces/account/modify',
    method: 'post',
    data,
  })
}

/**
 * 删除账号
 * @param id - 账号ID
 * @returns 删除结果
 */
export const deleteAccount = (id: number): Promise<ApiResponse<null>> => {
  return request({
    url: `/ces/account/delete`,
    method: 'delete',
    params: { id },
  })
}

/**
 * 重置账号密码
 * @param id - 账号ID
 * @returns 操作结果
 */
export const resetPassword = (id: number): Promise<ApiResponse<null>> => {
  return request({
    url: `/ces/account/reset-password`,
    method: 'put',
    params: { id },
  })
}
