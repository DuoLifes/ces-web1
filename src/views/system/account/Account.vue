<!-- 账号管理页面 -->
<template>
  <div class="page-container">
    <!-- 搜索表单 -->
    <TableSearch
      v-model:query="query"
      :options="searchOpt"
      :search="handleSearch"
      :reset="resetQuery"
      :layout="4"
      :fixed-buttons="true"
      class="table-search account-search"
      ref="tableSearchRef"
      :key="searchFormKey"
      @update:query="handleQueryUpdate"
    />

    <!-- 数据表格 -->
    <div class="container">
      <TableCustom
        :columns="columns"
        :tableData="tableData"
        :total="page.total"
        :currentPage="page.index"
        :pageSize="page.size"
        :pageSizes="[10, 15, 20]"
        :changePage="changePage"
        :sizeChange="handleSizeChange"
        :operateFunc="handleOperate"
        :showView="false"
        :showEdit="false"
        :showDelete="false"
        :loading="loading"
        :max-height="650"
        title="账号列表"
        @addOperate="handleAdd"
      >
        <template #operator="{ rows }">
          <div class="operate-btns">
            <!-- 编辑按钮 -->
            <el-button class="light-blue-btn" size="small" :icon="Edit" @click="handleEdit(rows)">
              编辑
            </el-button>

            <!-- 删除按钮 -->
            <el-popconfirm
              title="确认要删除此条数据吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(rows)"
            >
              <template #reference>
                <el-button class="light-red-btn" size="small" :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>

        <!-- 自定义是否启用列 -->
        <template #enabled="{ rows }">
          <div class="switch-cell">
            <el-switch
              v-model="rows.enabled"
              :active-value="1"
              :inactive-value="0"
              class="status-switch"
            />
          </div>
        </template>

        <!-- 自定义是否到期列 -->
        <template #expired="{ rows }">
          <el-tag :type="rows.expired === 1 || rows.expired === true ? 'danger' : 'success'">
            {{ rows.expired === 1 || rows.expired === true ? '已到期' : '未到期' }}
          </el-tag>
        </template>
      </TableCustom>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, markRaw, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Component } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import type { FormOption } from '@/types/form-option'
import type { Account, AccountQuery } from '@/api/account'

// 导入组件
import TableCustom from '@/components/common/table-custom.vue'
import TableSearch from '@/components/common/table-search.vue'
import TenantSelect from '@/components/tenant/TenantSelect.vue'
import CompanySelect from '@/components/company/CompanySelect.vue'
import MarketingGroupMultiSelect from '@/components/marketing-group/MarketingGroupMultiSelect.vue'

// 导入API
import {
  fetchAccountData,
  deleteAccount
} from '@/api/account'

// 设置组件名称
defineOptions({ name: 'AccountManagementView' })

// 获取路由
const router = useRouter()

// 查询条件
const query = reactive({
  tenantId: '',
  companyId: '',
  marketingGroups: [] as Array<number | string>,
  username: '',
  realName: '',
  enabled: 0,
  expired: 0,
})

// 分页配置
const page = reactive({
  index: 1,
  size: 10,
  total: 0,
})

// 表格数据
const tableData = ref<Account[]>([])

// 表单引用
const tableSearchRef = ref()
const searchFormKey = ref(0) // 用于强制刷新表单

// 加载状态
const loading = ref(false)

// 防止递归更新的标志
let isUpdatingProps = false

// 查询表单配置接口
interface SearchOption {
  type: string
  label: string
  prop: string
  placeholder?: string
  component?: Component
  props?: Record<string, unknown>
  opts?: Array<{ value: string | number; label: string }>
}

// 查询表单配置
const searchOpt = ref<SearchOption[]>([
  {
    type: 'custom',
    label: '运营商：',
    prop: 'tenantId',
    placeholder: '全部',
    component: markRaw(TenantSelect),
    props: {
      showAll: true,
      allLabel: '全部',
      allValue: 0,
      clearable: true,
    },
  },
  {
    type: 'custom',
    label: '局点名称：',
    prop: 'companyId',
    placeholder: '请选择局点',
    component: markRaw(CompanySelect),
    props: {
      tenantId: '',
      showAll: true,
      allLabel: '全部',
      allValue: 0,
      clearable: true,
    },
  },
  {
    type: 'custom',
    label: '营销组：',
    prop: 'marketingGroups',
    placeholder: '请选择营销组',
    component: markRaw(MarketingGroupMultiSelect),
    props: {
      companyId: '',
      showAll: false,
      clearable: true,
    },
  },
  {
    type: 'input',
    label: '用户账号：',
    prop: 'username',
    placeholder: '请输入用户账号',
  },
  {
    type: 'input',
    label: '用户名称：',
    prop: 'realName',
    placeholder: '请输入用户名称',
  },
  {
    type: 'select',
    label: '是否启用：',
    prop: 'enabled',
    placeholder: '请选择是否启用',
    opts: [
      { value: 0, label: '全部' },
      { value: 1, label: '是' },
      { value: 2, label: '否' },
    ],
  },
  {
    type: 'select',
    label: '是否到期：',
    prop: 'expired',
    placeholder: '请选择是否到期',
    opts: [
      { value: 0, label: '全部' },
      { value: 1, label: '已到期' },
      { value: 2, label: '未到期' },
    ],
  },
])

// 表格列配置
const columns = ref([
  { prop: 'tenantName', label: '运营商' },
  { prop: 'companyName', label: '局点名称' },
  { prop: 'username', label: '用户账号' },
  { prop: 'realName', label: '用户名称' },
  { prop: 'roleName', label: '角色名称' },
  { prop: 'marketingGroupNames', label: '营销组', showOverflowTooltip: true },
  { prop: 'enabled', label: '是否启用', slot: 'enabled' },
  { prop: 'expireDate', label: '有效期至' },
  { prop: 'expired', label: '是否到期', slot: 'expired' },
  { prop: 'creator', label: '创建人' },
  { prop: 'createTime', label: '创建时间' },
  { prop: 'updateTime', label: '更新时间' },
  { prop: 'operator', label: '操作', fixed: 'right', slot: 'operator' },
])

// 更新CompanySelect组件的tenantId
const updateCompanySelectTenantId = (tenantId: number | string): void => {
  // 更新搜索表单中的CompanySelect组件
  const companyOption = searchOpt.value.find((opt) => opt.prop === 'companyId')
  if (companyOption?.props) {
    companyOption.props.tenantId = tenantId
  }
}

// 更新MarketingGroupMultiSelect组件的companyId
const updateMarketingGroupSelectCompanyId = (companyId: number | string): void => {
  // 更新搜索表单中的MarketingGroupMultiSelect组件
  const marketingGroupOption = searchOpt.value.find((opt) => opt.prop === 'marketingGroups')
  if (marketingGroupOption?.props) {
    marketingGroupOption.props.companyId = companyId
  }
}

// 获取表格数据
const getData = async (): Promise<void> => {
  try {
    loading.value = true

    const formValues = tableSearchRef.value?.localQuery || query

    const params: AccountQuery = {
      tenantId: formValues.tenantId ? Number(formValues.tenantId) : undefined,
      companyId: formValues.companyId ? Number(formValues.companyId) : undefined,
      marketingGroups: formValues.marketingGroups && formValues.marketingGroups.length > 0
        ? formValues.marketingGroups.map((id: number | string) => Number(id))
        : undefined,
      username: formValues.username || undefined,
      realName: formValues.realName || undefined,
      enabled: formValues.enabled === 0 ? undefined : formValues.enabled === 1 ? true : false,
      expired: formValues.expired === 0 ? undefined : formValues.expired === 1 ? true : false,
      pageNo: page.index,
      pageSize: page.size,
    }

    const res = await fetchAccountData(params)

    if (res.code === '00000') {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取数据失败')
      tableData.value = []
      page.total = 0
    }
  } catch (error) {
    console.error('查询出错:', error)
    ElMessage.error('获取数据失败')
    tableData.value = []
    page.total = 0
  } finally {
    loading.value = false
  }
}

// 重置分页参数
const resetPagination = (): void => {
  page.index = 1
  page.size = 10
  page.total = 0
}

// 重置查询条件
const resetQuery = (): void => {
  query.tenantId = ''
  query.companyId = ''
  query.marketingGroups = []
  query.username = ''
  query.realName = ''
  query.enabled = 0
  query.expired = 0

  // 更新CompanySelect组件的tenantId
  updateCompanySelectTenantId('')

  // 更新MarketingGroupMultiSelect组件的companyId
  updateMarketingGroupSelectCompanyId('')

  searchFormKey.value += 1
  resetPagination()
  getData()
}

// 执行查询
const handleSearch = (searchQuery?: Record<string, unknown>): void => {
  if (searchQuery) {
    // 使用从搜索组件接收的查询参数
    query.tenantId = (searchQuery.tenantId as string) || ''
    query.companyId = (searchQuery.companyId as string) || ''
    query.marketingGroups = (searchQuery.marketingGroups as Array<number | string>) || []
    query.username = (searchQuery.username as string) || ''
    query.realName = (searchQuery.realName as string) || ''
    query.enabled = searchQuery.enabled !== undefined ? Number(searchQuery.enabled) : 0
    query.expired = searchQuery.expired !== undefined ? Number(searchQuery.expired) : 0
  }

  resetPagination()
  getData()
}

// 处理查询条件更新
const handleQueryUpdate = (newQuery: Record<string, unknown>): void => {
  // 如果正在进行属性更新，则跳过后续操作
  if (isUpdatingProps) return

  const oldTenantId = query.tenantId
  const oldCompanyId = query.companyId

  try {
    // 标记正在更新
    isUpdatingProps = true

    // 将新的查询条件同步到本地，需要对enabled和expired做类型转换
    if (newQuery.enabled !== undefined) {
      query.enabled = Number(newQuery.enabled)
    }
    if (newQuery.expired !== undefined) {
      query.expired = Number(newQuery.expired)
    }

    // 其他属性直接复制
    if (newQuery.tenantId !== undefined) query.tenantId = newQuery.tenantId as string
    if (newQuery.companyId !== undefined) query.companyId = newQuery.companyId as string
    if (newQuery.marketingGroups !== undefined) query.marketingGroups = newQuery.marketingGroups as Array<number | string>
    if (newQuery.username !== undefined) query.username = newQuery.username as string
    if (newQuery.realName !== undefined) query.realName = newQuery.realName as string

    // 更新CompanySelect组件的tenantId
    if (newQuery.tenantId !== undefined && newQuery.tenantId !== oldTenantId) {
      updateCompanySelectTenantId(newQuery.tenantId as string | number)

      // 如果运营商变化，清空局点和营销组
      if (query.companyId) query.companyId = ''
      if (query.marketingGroups && query.marketingGroups.length > 0) query.marketingGroups = []

      // 清空营销组选择器的companyId
      updateMarketingGroupSelectCompanyId('')
    }

    // 更新MarketingGroupMultiSelect组件的companyId
    if (newQuery.companyId !== undefined && newQuery.companyId !== oldCompanyId) {
      updateMarketingGroupSelectCompanyId(newQuery.companyId as string | number)

      // 如果局点变化，清空营销组
      if (query.marketingGroups && query.marketingGroups.length > 0) {
        query.marketingGroups = []
      }
    }
  } finally {
    // 确保标志总是被重置
    setTimeout(() => {
      isUpdatingProps = false
    }, 0)
  }
}

// 页码变化
const changePage = (val: number): void => {
  page.index = val
  getData()
}

// 每页条数变化
const handleSizeChange = (val: number): void => {
  page.size = val
  page.index = 1
  getData()
}

// 新增账号
const handleAdd = (): void => {
  router.push('/add-account')
}

// 编辑账号
const handleEdit = (row: Account): void => {
  const accountData = {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    marketingGroups: row.marketingGroups || [],
    username: row.username,
    realName: row.realName,
    roleId: row.roleId,
    enabled: row.enabled,
    expireDate: row.expireDate,
  }

  // 通过路由参数传递数据
  router.push({
    path: `/edit-account/${row.id}`,
    query: {
      data: encodeURIComponent(JSON.stringify(accountData))
    }
  })
}

// 通用操作按钮处理函数
const handleOperate = (action: string, row: Account): void => {
  if (action === 'edit') {
    handleEdit(row)
  } else if (action === 'delete') {
    handleDelete(row)
  }
}

// 删除账号
const handleDelete = async (row: Account): Promise<void> => {
  try {
    loading.value = true
    const res = await deleteAccount(row.id)
    if (res.code === '00000') {
      ElMessage.success('删除成功')
      getData()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除出错:', error)
    ElMessage.error('删除失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  getData()
})
</script>

<style scoped>
.operate-btns {
  display: flex;
  gap: 8px;
}

.status-switch {
  --el-switch-on-color: #13ce66;
  --el-switch-off-color: #ff4949;
}

.switch-cell {
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 设置表格行高与其他页面一致 */
:deep(.el-table__row) {
  height: 41.38px !important; /* 与其他页面保持一致的高度 */
}

:deep(.el-table__cell) {
  padding-top: 0;
  padding-bottom: 0;
  height: 41.38px;
}

/* 调整标签样式适应固定的单元格高度 */
:deep(.el-tag) {
  margin: 0;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
  display: inline-flex;
  align-items: center;
}

/* 添加全局调整，确保单元格内容垂直居中 */
:deep(.el-table__body td) {
  vertical-align: middle;
}
</style>
