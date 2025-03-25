import request from '../utils/request'
import type { Community, CommunityQuery } from '@/types/community'

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
 * 获取小区列表数据
 * @param params - 查询参数，包含运营商ID、局点ID、网格ID、小区名称和分页信息
 * @returns Promise<ApiResponse<PageResult<Community>>> - 返回小区列表和总数
 */
export const fetchCommunityData = (
  params: CommunityQuery,
): Promise<ApiResponse<PageResult<Community>>> => {
  return request({
    url: '/ces/community/list/page',
    method: 'post',
    data: params,
  })
}

/**
 * 添加小区
 * @param data - 小区数据，只需包含网格ID和小区名称
 * @returns Promise<ApiResponse<Community>> - 返回添加结果
 */
export const addCommunity = (data: {
  gridId: number
  name: string
}): Promise<ApiResponse<Community>> => {
  return request({
    url: '/ces/community/add',
    method: 'post',
    data,
  })
}

/**
 * 更新小区
 * @param data - 小区数据，包含小区ID、网格ID和小区名称
 * @returns Promise<ApiResponse<Community>> - 返回更新结果
 */
export const updateCommunity = (data: {
  id: number
  gridId: number
  name: string
}): Promise<ApiResponse<Community>> => {
  return request({
    url: '/ces/community/modify',
    method: 'post',
    data,
  })
}

/**
 * 删除小区
 * @param id - 小区ID
 * @returns Promise<ApiResponse<null>> - 返回删除结果
 */
export const deleteCommunity = (id: number): Promise<ApiResponse<null>> => {
  return request({
    url: `/ces/community/delete?id=${id}`,
    method: 'delete',
  })
}
