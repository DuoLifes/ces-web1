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
          <el-tag :type="rows.enabled === 1 || rows.enabled === true ? 'success' : 'danger'">
            {{ rows.enabled === 1 || rows.enabled === true ? '是' : '否' }}
          </el-tag>
        </template>

        <!-- 自定义是否到期列 -->
        <template #expired="{ rows }">
          <el-tag :type="rows.expired === 1 || rows.expired === true ? 'danger' : 'success'">
            {{ rows.expired === 1 || rows.expired === true ? '已到期' : '未到期' }}
          </el-tag>
        </template>
      </TableCustom>
    </div>

    <!-- 账号编辑弹窗 -->
    <el-dialog
      v-model="visible"
      width="600px"
      destroy-on-close
      :close-on-click-modal="false"
      @close="closeDialog"
    >
      <template #header>
        <DialogTitle :title="isEdit ? '编辑账号' : '新增账号'" />
      </template>
      <TableEdit
        v-model:form-data="formData"
        :options="formOptions"
        :edit="isEdit"
        :update="handleUpdate"
        @cancel="closeDialog"
        @update:form-data="handleFormDataUpdate"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, markRaw, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Component } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import type { FormOption } from '@/types/form-option'
import type { Account, AccountQuery } from '@/api/account'

// 导入组件
import TableCustom from '@/components/common/table-custom.vue'
import TableSearch from '@/components/common/table-search.vue'
import TableEdit from '@/components/common/table-edit.vue'
import DialogTitle from '@/components/common/dialog-title.vue'
import TenantSelect from '@/components/tenant/TenantSelect.vue'
import CompanySelect from '@/components/company/CompanySelect.vue'
import MarketingGroupMultiSelect from '@/components/marketing-group/MarketingGroupMultiSelect.vue'

// 导入API
import {
  fetchAccountData,
  addAccount,
  updateAccount,
  deleteAccount,
} from '@/api/account'

// 设置组件名称
defineOptions({ name: 'AccountManagementView' })

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

// 弹窗控制
const visible = ref(false)
const isEdit = ref(false)
const formData = ref<Partial<Account>>({})

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

// 表单配置
const formOptions = ref<FormOption>({
  labelWidth: '120px',
  span: 24,
  list: [
    {
      type: 'custom',
      label: '运营商',
      prop: 'tenantId',
      required: true,
      component: markRaw(TenantSelect),
      props: {
        showAll: false,
        clearable: false,
        placeholder: '请选择运营商',
      },
    },
    {
      type: 'custom',
      label: '局点名称',
      prop: 'companyId',
      placeholder: '请选择局点',
      required: true,
      component: markRaw(CompanySelect),
      props: {
        tenantId: '', // 会在设置formData时动态更新
        showAll: false,
        clearable: false,
        placeholder: '请选择局点',
        autoClearOnTenantChange: true,
      },
      dependOn: 'tenantId', // 添加依赖关系
    },
    {
      type: 'custom',
      label: '营销组',
      prop: 'marketingGroups',
      placeholder: '请选择营销组',
      required: true,
      component: markRaw(MarketingGroupMultiSelect),
      props: {
        companyId: '', // 会在设置formData时动态更新
        showAll: false,
        clearable: false,
        placeholder: '请选择营销组',
        autoClearOnCompanyChange: true,
      },
      dependOn: 'companyId', // 添加依赖关系
    },
    {
      type: 'input',
      label: '用户账号',
      prop: 'username',
      placeholder: '请输入用户账号',
      required: true,
    },
    {
      type: 'input',
      label: '用户名称',
      prop: 'realName',
      placeholder: '请输入用户名称',
      required: true,
    },
    {
      type: 'switch',
      label: '是否启用',
      prop: 'enabled',
      required: false,
      defaultValue: true,
    },
    {
      type: 'date',
      label: '有效期至',
      prop: 'expireDate',
      placeholder: '请选择有效期',
      required: true,
    },
  ],
})

// 更新CompanySelect组件的tenantId
const updateCompanySelectTenantId = (tenantId: number | string): void => {
  // 更新搜索表单中的CompanySelect组件
  const companyOption = searchOpt.value.find((opt) => opt.prop === 'companyId')
  if (companyOption?.props) {
    companyOption.props.tenantId = tenantId
  }

  // 更新编辑表单中的CompanySelect组件
  if (formOptions.value.list) {
    const formCompanyOption = formOptions.value.list.find((opt) => opt.prop === 'companyId')
    if (formCompanyOption?.props) {
      formCompanyOption.props.tenantId = tenantId
    }
  }
}

// 更新MarketingGroupMultiSelect组件的companyId
const updateMarketingGroupSelectCompanyId = (companyId: number | string): void => {
  // 更新搜索表单中的MarketingGroupMultiSelect组件
  const marketingGroupOption = searchOpt.value.find((opt) => opt.prop === 'marketingGroups')
  if (marketingGroupOption?.props) {
    marketingGroupOption.props.companyId = companyId
  }

  // 更新编辑表单中的MarketingGroupMultiSelect组件
  if (formOptions.value.list) {
    const formMarketingGroupOption = formOptions.value.list.find((opt) => opt.prop === 'marketingGroups')
    if (formMarketingGroupOption?.props) {
      formMarketingGroupOption.props.companyId = companyId
    }
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
        ? formValues.marketingGroups.map(id => Number(id))
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

// 处理表单数据更新
const handleFormDataUpdate = (newFormData: Record<string, unknown>): void => {
  // 在运营商变化时重点处理
  if (newFormData.tenantId !== undefined && newFormData.tenantId !== formData.value.tenantId) {
    console.log('运营商变化:', {
      old: formData.value.tenantId,
      new: newFormData.tenantId,
    })

    // 更新CompanySelect组件的tenantId
    updateCompanySelectTenantId(newFormData.tenantId as string | number)

    // 清空局点和营销组值
    formData.value.companyId = ''
    formData.value.marketingGroups = []

    // 清空营销组选择器的companyId
    updateMarketingGroupSelectCompanyId('')
  }

  // 在局点变化时处理
  if (newFormData.companyId !== undefined && newFormData.companyId !== formData.value.companyId) {
    console.log('局点变化:', {
      old: formData.value.companyId,
      new: newFormData.companyId,
    })

    // 更新MarketingGroupMultiSelect组件的companyId
    updateMarketingGroupSelectCompanyId(newFormData.companyId as string | number)

    // 清空营销组值
    formData.value.marketingGroups = []
  }

  // 将表单数据同步到formData
  Object.assign(formData.value, newFormData)
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
  isEdit.value = false
  // 清空CompanySelect组件的tenantId和MarketingGroupMultiSelect组件的companyId
  updateCompanySelectTenantId('')
  updateMarketingGroupSelectCompanyId('')
  // 设置空的formData
  formData.value = {
    tenantId: '',
    companyId: '',
    marketingGroups: [],
    username: '',
    realName: '',
    roleId: '',
    enabled: true,
    expireDate: '',
  }
  visible.value = true
}

// 编辑账号
const handleEdit = (row: Account): void => {
  isEdit.value = true
  // 更新CompanySelect组件的tenantId和MarketingGroupMultiSelect组件的companyId
  updateCompanySelectTenantId(row.tenantId)
  updateMarketingGroupSelectCompanyId(row.companyId)
  // 设置formData
  formData.value = {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    marketingGroups: row.marketingGroups || [],
    username: row.username,
    realName: row.realName,
    roleId: row.roleId,
    enabled: row.enabled === 1 || row.enabled === true,
    expireDate: row.expireDate,
  }
  visible.value = true
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

// 更新账号
const handleUpdate = async (): Promise<boolean> => {
  try {
    loading.value = true

    // 表单数据处理和验证
    const params = {
      ...formData.value,
      enabled: formData.value.enabled === true || formData.value.enabled === 1 ? 1 : 0,
    }

    // 调用API
    const res = isEdit.value
      ? await updateAccount(params)
      : await addAccount(params)

    if (res.code === '00000') {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      visible.value = false
      getData()
      return true
    } else {
      ElMessage.error(res.msg || (isEdit.value ? '编辑失败' : '新增失败'))
      return false
    }
  } catch (error) {
    console.error(isEdit.value ? '编辑出错:' : '新增出错:', error)
    ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    return false
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const closeDialog = (): void => {
  visible.value = false
  formData.value = {}
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
</style>
