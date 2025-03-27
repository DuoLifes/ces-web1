<!-- 小区管理页面 -->
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
      class="table-search community-search"
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
        :editFunc="handleEdit"
        :delFunc="handleDelete"
        :showView="false"
        :showEdit="true"
        :showDelete="true"
        :loading="loading"
        :max-height="650"
        title="小区列表"
        @addOperate="handleAdd"
      />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="visible"
      width="500px"
      destroy-on-close
      :close-on-click-modal="false"
      @close="closeDialog"
    >
      <template #header>
        <DialogTitle :title="isEdit ? '编辑小区' : '新增小区'" />
      </template>
      <TableEdit
        v-model:form-data="rowData"
        :options="options"
        :edit="isEdit"
        :update="handleUpdate"
        @cancel="closeDialog"
        @update:form-data="handleFormDataUpdate"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import type { Community } from '@/types/community'
import type { FormOption } from '@/types/form-option'
import { fetchCommunityData, addCommunity, updateCommunity, deleteCommunity } from '@/api/community'
import type { Component } from 'vue'

// 导入组件
import TableCustom from '@/components/common/table-custom.vue'
import TableSearch from '@/components/common/table-search.vue'
import TableEdit from '@/components/common/table-edit.vue'
import DialogTitle from '@/components/common/dialog-title.vue'
import TenantSelect from '@/components/tenant/TenantSelect.vue'
import CompanySelect from '@/components/company/CompanySelect.vue'
import GridSelect from '@/components/grid/GridSelect.vue'

defineOptions({ name: 'CommunityManagementView' })

// 查询条件
const query = reactive({
  tenantId: '',
  companyId: '',
  gridId: '',
  name: '',
})

// 分页配置
const page = reactive({
  index: 1,
  size: 10,
  total: 0,
})

// 表格数据
const tableData = ref<Community[]>([])

// 弹窗控制
const visible = ref(false)
const isEdit = ref(false)
const rowData = ref<Partial<Community>>({})

// 表单引用
const tableSearchRef = ref()
const searchFormKey = ref(0) // 用于强制刷新表单

// 加载状态
const loading = ref(false)

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
    label: '网格名称：',
    prop: 'gridId',
    placeholder: '请选择网格',
    component: markRaw(GridSelect),
    props: {
      companyId: '',
      showAll: true,
      allLabel: '全部',
      allValue: 0,
      clearable: true,
    },
  },
  {
    type: 'input',
    label: '小区名称：',
    prop: 'name',
    placeholder: '请输入小区名称',
  },
])

// 表格列配置
const columns = ref([
  { prop: 'tenantName', label: '运营商' },
  { prop: 'companyName', label: '局点名称' },
  { prop: 'gridName', label: '网格名称' },
  { prop: 'name', label: '小区名称' },
  { prop: 'operatorName', label: '创建人' },
  { prop: 'createTime', label: '创建时间' },
  { prop: 'updateTime', label: '更新时间' },
  { prop: 'operator', label: '操作', width: 250 },
])

// 表单配置
const options = ref<FormOption>({
  labelWidth: '100px',
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
        tenantId: '', // 会在设置rowData时动态更新
        showAll: false,
        clearable: false,
        placeholder: '请选择局点',
        autoClearOnTenantChange: true, // 启用自动清空功能
      },
      dependOn: 'tenantId', // 添加依赖关系，表示此字段依赖于tenantId
    },
    {
      type: 'custom',
      label: '网格名称',
      prop: 'gridId',
      placeholder: '请选择网格',
      required: true,
      component: markRaw(GridSelect),
      props: {
        companyId: '', // 会在设置rowData时动态更新
        showAll: false,
        clearable: false,
        placeholder: '请选择网格',
        autoClearOnCompanyChange: true, // 启用自动清空功能
      },
      dependOn: 'companyId', // 添加依赖关系，表示此字段依赖于companyId
    },
    {
      type: 'input',
      label: '小区名称',
      prop: 'name',
      placeholder: '请输入小区名称',
      required: true,
    },
  ],
})

// 更新局点选择器的租户ID
const updateCompanySelectTenantId = (tenantId: number | string): void => {
  if (options.value.list && options.value.list.length > 1) {
    const companyOption = options.value.list[1]
    if (companyOption?.props) {
      companyOption.props.tenantId = tenantId
    }
  }
}

// 更新网格选择器的局点ID
const updateGridSelectCompanyId = (companyId: number | string): void => {
  if (options.value.list && options.value.list.length > 2) {
    const gridOption = options.value.list[2]
    if (gridOption?.props) {
      gridOption.props.companyId = companyId
    }
  }
}

// 获取表格数据
const getData = async (): Promise<void> => {
  try {
    loading.value = true

    const formValues = tableSearchRef.value?.localQuery || query

    const params = {
      tenantId: formValues.tenantId ? Number(formValues.tenantId) : undefined,
      companyId: formValues.companyId ? Number(formValues.companyId) : undefined,
      gridId: formValues.gridId ? Number(formValues.gridId) : undefined,
      name: formValues.name || undefined,
      pageNo: page.index,
      pageSize: page.size,
    }

    const res = await fetchCommunityData(params)

    if (res.code === '00000') {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取数据失败')
      tableData.value = []
      page.total = 0
    }
  } catch {
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
  query.gridId = ''
  query.name = ''

  // 更新CompanySelect组件的tenantId
  const companyOption = searchOpt.value.find((opt) => opt.prop === 'companyId')
  if (companyOption?.props) {
    companyOption.props.tenantId = ''
  }

  // 更新GridSelect组件的companyId
  const gridOption = searchOpt.value.find((opt) => opt.prop === 'gridId')
  if (gridOption?.props) {
    gridOption.props.companyId = ''
  }

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
    query.gridId = (searchQuery.gridId as string) || ''
    query.name = (searchQuery.name as string) || ''
  }

  resetPagination()
  getData()
}

// 处理查询条件更新
const handleQueryUpdate = (newQuery: Record<string, unknown>): void => {
  const oldTenantId = query.tenantId

  // 将新的查询条件同步到本地
  Object.assign(query, newQuery)

  // 更新CompanySelect组件的tenantId
  if (newQuery.tenantId !== undefined && newQuery.tenantId !== oldTenantId) {
    const companyOption = searchOpt.value.find((opt) => opt.prop === 'companyId')
    if (companyOption?.props) {
      companyOption.props.tenantId = newQuery.tenantId
    }

    // 如果运营商变化，清空局点和网格
    if (query.companyId) query.companyId = ''
    if (query.gridId) query.gridId = ''

    // 清空网格选择器的companyId
    const gridOption = searchOpt.value.find((opt) => opt.prop === 'gridId')
    if (gridOption?.props) {
      gridOption.props.companyId = ''
    }
  }

  // 更新GridSelect组件的companyId
  if (newQuery.companyId !== undefined) {
    const gridOption = searchOpt.value.find((opt) => opt.prop === 'gridId')
    if (gridOption?.props) {
      gridOption.props.companyId = newQuery.companyId
    }

    // 如果局点变化，清空网格
    if (query.gridId && newQuery.companyId !== query.companyId) {
      query.gridId = ''
    }
  }
}

// 处理表单数据更新
const handleFormDataUpdate = (newFormData: Record<string, unknown>): void => {
  // 在运营商变化时重点处理
  if (newFormData.tenantId !== undefined && newFormData.tenantId !== rowData.value.tenantId) {
    console.log('运营商变化:', {
      old: rowData.value.tenantId,
      new: newFormData.tenantId,
    })

    // 更新CompanySelect组件的tenantId
    updateCompanySelectTenantId(newFormData.tenantId as string | number)

    // 清空局点和网格值（参考查询表单的处理方式）
    rowData.value.companyId = ''
    rowData.value.gridId = ''

    // 关键点：清空网格选择器的companyId，这样会触发GridSelect组件的监听器清空列表
    updateGridSelectCompanyId('')
  }

  // 在局点变化时处理
  if (newFormData.companyId !== undefined && newFormData.companyId !== rowData.value.companyId) {
    console.log('局点变化:', {
      old: rowData.value.companyId,
      new: newFormData.companyId,
    })

    // 更新GridSelect组件的companyId
    updateGridSelectCompanyId(newFormData.companyId as string | number)

    // 清空网格值
    rowData.value.gridId = ''
  }

  // 将表单数据同步到rowData
  Object.assign(rowData.value, newFormData)
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

// 新增小区
const handleAdd = (): void => {
  // 先设置isEdit为false
  isEdit.value = false
  // 清空CompanySelect组件的tenantId和GridSelect组件的companyId
  updateCompanySelectTenantId('')
  updateGridSelectCompanyId('')
  // 然后设置空的rowData
  rowData.value = {
    tenantId: '',
    companyId: '',
    gridId: '',
    name: '',
  }

  // 最后打开弹窗
  visible.value = true
}

// 编辑小区
const handleEdit = (row: Community): void => {
  // 先设置isEdit为true，这样可以确保表单知道当前是编辑模式
  isEdit.value = true

  // 确保先更新CompanySelect组件的tenantId
  if (row.tenantId) {
    // 更新选择器的tenantId，这将触发CompanySelect组件加载对应租户的局点列表
    updateCompanySelectTenantId(row.tenantId)
  }

  // 更新网格选择器的companyId
  if (row.companyId) {
    // 更新选择器的companyId，这将触发GridSelect组件加载对应局点的网格列表
    updateGridSelectCompanyId(row.companyId)
  }

  // 然后设置rowData，确保数据正确
  rowData.value = { ...row }

  // 最后打开弹窗
  visible.value = true
}

// 关闭弹窗
const closeDialog = (): void => {
  visible.value = false
  isEdit.value = false
  rowData.value = {}
}

// 删除小区
const handleDelete = async (row: Community): Promise<void> => {
  try {
    const res = await deleteCommunity(row.id)
    if (res.code === '00000') {
      ElMessage.success('删除成功')
      await getData()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

// 更新小区信息
const handleUpdate = async (formData: Partial<Community>): Promise<void> => {
  try {
    if (!isEdit.value) {
      // 新增小区 - 只需要验证gridId和name
      if (!formData.gridId || !formData.name) {
        ElMessage.error('请填写必填字段')
        return
      }

      const gridId = Number(formData.gridId)

      if (isNaN(gridId)) {
        ElMessage.error('网格ID格式无效')
        return
      }

      // 新增小区
      const res = await addCommunity({
        gridId: gridId,
        name: formData.name,
      })

      if (res.code === '00000') {
        ElMessage.success('添加成功')
        closeDialog()
        getData()
      } else {
        ElMessage.error(res.msg || '添加失败')
      }
    } else {
      // 编辑小区 - 验证gridId和name
      if (!formData.gridId || !formData.name) {
        ElMessage.error('请填写必填字段')
        return
      }

      const gridId = Number(formData.gridId)

      if (isNaN(gridId)) {
        ElMessage.error('网格ID格式无效')
        return
      }

      // 编辑小区
      const res = await updateCommunity({
        id: Number(formData.id),
        gridId,
        name: formData.name,
      })

      if (res.code === '00000') {
        ElMessage.success('更新成功')
        closeDialog()
        getData()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

// 初始化加载数据
getData()
</script>

<style scoped>
/* 小区管理特有的查询条件样式 */
.community-search :deep(.el-form-item__content) {
  max-width: 280px;
}
</style>
