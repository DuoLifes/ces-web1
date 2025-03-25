import request from '../utils/request'
import type { MarketingGroup, MarketingGroupQuery } from '@/types/marketing-group'

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
 * 营销组树形结构接口
 */
export interface MarketingGroupTree {
  /** 局点名称 */
  companyName: string
  /** 营销组列表 */
  groupVoList: Array<{
    /** 营销组ID */
    id: number
    /** 营销组名称 */
    name: string
  }>
}

/**
 * 获取营销组列表数据
 * @param params - 查询参数，包含运营商ID、局点ID、营销组名称和分页信息
 * @returns Promise<ApiResponse<PageResult<MarketingGroup>>> - 返回营销组列表和总数
 */
export const fetchMarketingGroupData = (
  params: MarketingGroupQuery,
): Promise<ApiResponse<PageResult<MarketingGroup>>> => {
  return request({
    url: '/ces/group/list/page',
    method: 'post',
    data: params,
  })
}

/**
 * 添加营销组
 * @param data - 营销组数据，包含局点ID、营销组名称和描述
 * @returns Promise<ApiResponse<MarketingGroup>> - 返回添加结果
 */
export const addMarketingGroup = (data: {
  companyId: number
  name: string
  description?: string
}): Promise<ApiResponse<MarketingGroup>> => {
  return request({
    url: '/ces/group/add',
    method: 'post',
    data,
  })
}

/**
 * 更新营销组
 * @param data - 营销组数据，包含营销组ID、局点ID、营销组名称和描述
 * @returns Promise<ApiResponse<MarketingGroup>> - 返回更新结果
 */
export const updateMarketingGroup = (data: {
  id: number
  companyId: number
  name: string
  description?: string
}): Promise<ApiResponse<MarketingGroup>> => {
  return request({
    url: '/ces/group/modify',
    method: 'post',
    data,
  })
}

/**
 * 删除营销组
 * @param id - 营销组ID
 * @returns Promise<ApiResponse<null>> - 返回删除结果
 */
export const deleteMarketingGroup = (id: number): Promise<ApiResponse<null>> => {
  return request({
    url: `/ces/group/delete?id=${id}`,
    method: 'delete',
  })
}

/**
 * 根据局点ID获取营销组树形结构
 * @param companyId - 局点ID
 * @returns Promise<ApiResponse<MarketingGroupTree>> - 返回营销组树形结构
 */
export const fetchMarketingGroupTree = (
  companyId: number,
): Promise<ApiResponse<MarketingGroupTree>> => {
  return request({
    url: `/ces/group/company_group/tree?companyId=${companyId}`,
    method: 'get',
  })
}
