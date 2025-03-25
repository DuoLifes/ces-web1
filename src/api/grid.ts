import request from '../utils/request'
import type { Grid, GridQuery } from '@/types/grid'

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
 * 简单网格项数据接口，用于下拉选择器
 */
interface GridItem {
  /** 网格ID */
  id: number
  /** 网格名称 */
  name: string
}

/**
 * 获取网格列表数据
 * @param params - 查询参数，包含运营商ID、局点ID、网格名称和分页信息
 * @returns Promise<ApiResponse<PageResult<Grid>>> - 返回网格列表和总数
 */
export const fetchGridData = (params: GridQuery): Promise<ApiResponse<PageResult<Grid>>> => {
  return request({
    url: '/ces/grid/list/page',
    method: 'post',
    data: params,
  })
}

/**
 * 根据局点ID获取网格列表（不分页）
 * @param companyId - 局点ID
 * @returns Promise<ApiResponse<GridItem[]>> - 返回网格列表
 */
export const fetchGridListByCompany = (companyId: number): Promise<ApiResponse<GridItem[]>> => {
  return request({
    url: '/ces/grid/list',
    method: 'post',
    data: { companyId },
  })
}

/**
 * 添加网格
 * @param data - 网格数据，只需包含局点ID和网格名称
 * @returns Promise<ApiResponse<Grid>> - 返回添加结果
 */
export const addGrid = (data: { companyId: number; name: string }): Promise<ApiResponse<Grid>> => {
  return request({
    url: '/ces/grid/add',
    method: 'post',
    data,
  })
}

/**
 * 更新网格
 * @param data - 网格数据，包含网格ID、局点ID和网格名称
 * @returns Promise<ApiResponse<Grid>> - 返回更新结果
 */
export const updateGrid = (data: {
  id: number
  companyId: number
  name: string
}): Promise<ApiResponse<Grid>> => {
  return request({
    url: '/ces/grid/modify',
    method: 'post',
    data,
  })
}

/**
 * 删除网格
 * @param id - 网格ID
 * @returns Promise<ApiResponse<null>> - 返回删除结果
 */
export const deleteGrid = (id: number): Promise<ApiResponse<null>> => {
  return request({
    url: `/ces/grid/delete?id=${id}`,
    method: 'delete',
  })
}
