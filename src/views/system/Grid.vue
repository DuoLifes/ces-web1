<!-- 网格管理页面 -->
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
      class="table-search grid-search"
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
        :editFunc="(row) => handleEdit(row as unknown as Grid)"
        :delFunc="(row) => handleDelete(row as unknown as Grid)"
        :showView="false"
        :showEdit="true"
        :showDelete="true"
        :loading="loading"
        :max-height="650"
        title="网格列表"
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
        <DialogTitle :title="isEdit ? '编辑网格' : '新增网格'" />
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
import type { Grid } from '@/types/grid'
import type { FormOption } from '@/types/form-option'
import { fetchGridData, addGrid, updateGrid, deleteGrid } from '@/api/grid'
import type { Component } from 'vue'

// 导入组件
import TableCustom from '@/components/common/table-custom.vue'
import TableSearch from '@/components/common/table-search.vue'
import TableEdit from '@/components/common/table-edit.vue'
import DialogTitle from '@/components/common/dialog-title.vue'
import TenantSelect from '@/components/tenant/TenantSelect.vue'
import CompanySelect from '@/components/company/CompanySelect.vue'

defineOptions({ name: 'GridManagementView' })

// 查询条件
const query = reactive({
  tenantId: '',
  companyId: '',
  gridName: '',
})

// 分页配置
const page = reactive({
  index: 1,
  size: 10,
  total: 0,
})

// 表格数据
const tableData = ref<Grid[]>([])

// 弹窗控制
const visible = ref(false)
const isEdit = ref(false)
const rowData = ref<Partial<Grid>>({})

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
    type: 'input',
    label: '网格名称：',
    prop: 'gridName',
    placeholder: '请输入网格名称',
  },
])

// 表格列配置
const columns = ref([
  { prop: 'tenantName', label: '运营商' },
  { prop: 'companyName', label: '局点名称' },
  { prop: 'gridName', label: '网格名称' },
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
      type: 'input',
      label: '网格名称',
      prop: 'gridName',
      placeholder: '请输入网格名称',
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

// 获取表格数据
const getData = async (): Promise<void> => {
  try {
    loading.value = true

    const formValues = tableSearchRef.value?.localQuery || query

    const params = {
      tenantId: formValues.tenantId ? Number(formValues.tenantId) : undefined,
      companyId: formValues.companyId ? Number(formValues.companyId) : undefined,
      name: formValues.gridName || undefined,
      pageNo: page.index,
      pageSize: page.size,
    }

    const res = await fetchGridData(params)

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
  query.gridName = ''

  // 更新CompanySelect组件的tenantId
  const companyOption = searchOpt.value.find((opt) => opt.prop === 'companyId')
  if (companyOption?.props) {
    companyOption.props.tenantId = ''
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
    query.gridName = (searchQuery.gridName as string) || ''
  }

  resetPagination()
  getData()
}

// 处理查询条件更新
const handleQueryUpdate = (newQuery: Record<string, unknown>): void => {
  // 将新的查询条件同步到本地
  Object.assign(query, newQuery)

  // 更新CompanySelect组件的tenantId
  if (newQuery.tenantId !== undefined) {
    const companyOption = searchOpt.value.find((opt) => opt.prop === 'companyId')
    if (companyOption?.props) {
      companyOption.props.tenantId = newQuery.tenantId
    }
  }
}

// 处理表单数据更新
const handleFormDataUpdate = (newFormData: Record<string, unknown>): void => {
  // 更新CompanySelect组件的tenantId
  if (newFormData.tenantId !== undefined && newFormData.tenantId !== rowData.value.tenantId) {
    // 使用类型断言，避免TypeScript错误
    updateCompanySelectTenantId(newFormData.tenantId as string | number)
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

// 新增网格
const handleAdd = (): void => {
  // 先设置isEdit为false
  isEdit.value = false
  // 清空CompanySelect组件的tenantId
  updateCompanySelectTenantId('')
  // 然后设置空的rowData
  rowData.value = {
    tenantId: '',
    companyId: '',
    gridName: '',
  }

  // 最后打开弹窗
  visible.value = true
}

// 编辑网格
const handleEdit = (row: Grid): void => {
  // 先设置isEdit为true，这样可以确保表单知道当前是编辑模式
  isEdit.value = true

  // 确保先更新CompanySelect组件的tenantId
  if (row.tenantId) {
    // 更新选择器的tenantId，这将触发CompanySelect组件加载对应租户的局点列表
    updateCompanySelectTenantId(row.tenantId)
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

// 删除网格
const handleDelete = async (row: Grid): Promise<void> => {
  try {
    const res = await deleteGrid(row.id)
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

// 更新网格信息
const handleUpdate = async (formData: Partial<Grid>): Promise<void> => {
  try {
    if (!isEdit.value) {
      // 新增网格 - 只需要验证companyId和gridName
      if (!formData.companyId || !formData.gridName) {
        ElMessage.error('请填写必填字段')
        return
      }

      const companyId = Number(formData.companyId)

      if (isNaN(companyId)) {
        ElMessage.error('局点ID格式无效')
        return
      }

      // 新增网格
      const res = await addGrid({
        companyId: companyId,
        name: formData.gridName,
      })

      if (res.code === '00000') {
        ElMessage.success('添加成功')
        closeDialog()
        getData()
      } else {
        ElMessage.error(res.msg || '添加失败')
      }
    } else {
      // 编辑网格 - 验证companyId和gridName
      if (!formData.companyId || !formData.gridName) {
        ElMessage.error('请填写必填字段')
        return
      }

      const companyId = Number(formData.companyId)

      if (isNaN(companyId)) {
        ElMessage.error('局点ID格式无效')
        return
      }

      // 编辑网格
      const res = await updateGrid({
        id: Number(formData.id),
        companyId,
        name: formData.gridName,
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
/* 网格管理特有的查询条件样式 */
.grid-search :deep(.el-form-item__content) {
  max-width: 280px;
}
</style>
