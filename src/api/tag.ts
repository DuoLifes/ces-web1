import request from '../utils/request'
import type { Tag, TagQuery, TagCreate, TagUpdate, TagCompanyConfigure } from '@/types/tag'

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
 * 获取标签列表数据
 * @param params - 查询参数，包含局点ID、标签名称、标签类型和分页信息
 * @returns Promise<ApiResponse<PageResult<Tag>>> - 返回标签列表和总数
 */
export const fetchTagData = (params: TagQuery): Promise<ApiResponse<PageResult<Tag>>> => {
  return request({
    url: '/ces/label/list/page',
    method: 'post',
    data: params,
  })
}

/**
 * 添加标签
 * @param data - 标签数据，包含标签名称和类型
 * @returns Promise<ApiResponse<null>> - 返回添加结果
 */
export const addTag = (data: TagCreate): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/label/add',
    method: 'post',
    data,
  })
}

/**
 * 更新标签
 * @param data - 标签数据，包含标签ID、名称和类型
 * @returns Promise<ApiResponse<null>> - 返回更新结果
 */
export const updateTag = (data: TagUpdate): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/label/modify',
    method: 'post',
    data,
  })
}

/**
 * 删除标签
 * @param id - 标签ID
 * @returns Promise<ApiResponse<null>> - 返回删除结果
 */
export const deleteTag = (id: number): Promise<ApiResponse<null>> => {
  return request({
    url: `/ces/label/delete?id=${id}`,
    method: 'delete',
  })
}

/**
 * 配置标签局点
 * @param data - 包含标签ID和局点ID列表
 * @returns Promise<ApiResponse<null>> - 返回配置结果
 */
export const configureTagCompany = (data: TagCompanyConfigure): Promise<ApiResponse<null>> => {
  return request({
    url: '/ces/label/configure/label_company',
    method: 'post',
    data,
  })
}
