<template>
  <div class="page-container">
    <TableSearch
      v-model:query="query"
      :options="searchOpt"
      :search="handleSearch"
      :reset="resetQuery"
      :layout="4"
      :fixed-buttons="true"
      class="table-search company-search"
      ref="tableSearchRef"
      :key="searchFormKey"
      @update:query="handleQueryUpdate"
    />
    <div class="container">
      <TableCustom
        :columns="columns"
        :tableData="tableData"
        :total="page.total"
        :changePage="changePage"
        :currentPage="page.index"
        :pageSize="page.size"
        :pageSizes="[10, 15, 20]"
        :sizeChange="handleSizeChange"
        :editFunc="handleEdit"
        :delFunc="handleDelete"
        :showView="false"
        :showEdit="true"
        :showDelete="true"
        :loading="loading"
        :max-height="650"
        title="局点列表"
        @addOperate="handleAdd"
      />
    </div>
    <el-dialog
      v-model="visible"
      width="500px"
      destroy-on-close
      :close-on-click-modal="false"
      @close="closeDialog"
    >
      <template #header>
        <DialogTitle :title="isEdit ? '编辑局点' : '新增局点'" />
      </template>
      <TableEdit
        :form-data="rowData"
        :options="options"
        :edit="isEdit"
        :update="handleUpdate"
        @cancel="closeDialog"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import type { Company } from '@/types/company'
import type { FormOption } from '@/types/form-option'
import { fetchCompanyData, addCompany, updateCompany, deleteCompany } from '@/api/company'

// 导入组件
import TableCustom from '@/components/common/table-custom.vue'
import TableSearch from '@/components/common/table-search.vue'
import TableEdit from '@/components/common/table-edit.vue'
import DialogTitle from '@/components/common/dialog-title.vue'
import TenantSelect from '@/components/tenant/TenantSelect.vue'

interface ApiResponse<T> {
  code: string
  msg: string
  data: T
}

defineOptions({ name: 'CompanyManagementView' })

// 查询条件
const query = reactive({
  tenantId: '',
  companyName: '',
})

// 分页配置
const page = reactive({
  index: 1,
  size: 10,
  total: 0,
})

// 表格数据
const tableData = ref<Company[]>([])
const visible = ref(false)
const isEdit = ref(false)
const rowData = ref<Partial<Company>>({})
const loading = ref(false)
const tableSearchRef = ref()
const searchFormKey = ref(0) // 用于强制刷新表单

// 查询表单配置
const searchOpt = ref([
  {
    type: 'custom',
    label: '运营商：',
    prop: 'tenantId',
    placeholder: '请选择运营商',
    component: markRaw(TenantSelect),
    props: {
      showAll: true,
      allLabel: '全部',
      allValue: 0,
      clearable: true,
    },
  },
  {
    type: 'input',
    label: '局点名称：',
    prop: 'companyName',
    placeholder: '请输入局点名称',
  },
])

// 表格列配置
const columns = ref([
  { prop: 'tenantName', label: '运营商' },
  { prop: 'name', label: '局点名称' },
  { prop: 'description', label: '局点描述' },
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
        clearable: false,
      },
    },
    {
      type: 'input',
      label: '局点名称',
      prop: 'name',
      placeholder: '请输入',
      required: true,
    },
    {
      type: 'textarea',
      label: '局点描述',
      prop: 'description',
      placeholder: '请输入',
      required: false,
    },
  ],
})

// 获取表格数据
const getData = async (): Promise<void> => {
  try {
    loading.value = true
    const formValues = tableSearchRef.value?.localQuery || query
    const params = {
      tenantId: formValues.tenantId ? Number(formValues.tenantId) : 0,
      companyName: formValues.companyName || '',
      pageNo: page.index,
      pageSize: page.size,
    }
    const res = await fetchCompanyData(params)

    if (res.code === '00000') {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取数据失败')
      tableData.value = []
      page.total = 0
    }
  } catch (e) {
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
  query.companyName = ''

  searchFormKey.value += 1
  resetPagination()
  getData()
}

// 执行查询
const handleSearch = (searchQuery?: Record<string, any>): void => {
  if (searchQuery) {
    // 使用从搜索组件接收的查询参数
    query.tenantId = searchQuery.tenantId || ''
    query.companyName = searchQuery.companyName || ''
  }
  resetPagination()
  getData()
}

// 页码变化处理
const changePage = (val: number): void => {
  page.index = val
  getData()
}

// 每页条数变化处理
const handleSizeChange = (val: number): void => {
  page.size = val
  page.index = 1
  getData()
}

// 添加局点
const handleAdd = (): void => {
  rowData.value = {
    tenantId: undefined,
    name: '',
    description: '',
  }
  isEdit.value = false
  visible.value = true
}

// 编辑局点
const handleEdit = (row: Company): void => {
  rowData.value = { ...row }
  isEdit.value = true
  visible.value = true
}

// 处理删除操作
const handleDelete = async (row: Company): Promise<void> => {
  try {
    const res = await deleteCompany(row.id)
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

// 处理更新操作
const handleUpdate = async (formData: Partial<Company>): Promise<void> => {
  try {
    if (!formData.tenantId || !formData.name) {
      ElMessage.error('请填写必填字段')
      return
    }

    const tenantId =
      typeof formData.tenantId === 'string'
        ? parseInt(formData.tenantId)
        : Number(formData.tenantId)

    if (!isEdit.value) {
      // 新增局点
      const res = (await addCompany({
        tenantId,
        name: formData.name,
        description: formData.description || '',
      })) as ApiResponse<Company>

      if (res.code === '00000') {
        ElMessage.success('添加成功')
        closeDialog()
        getData()
      } else {
        ElMessage.error(res.msg || '添加失败')
      }
    } else {
      // 编辑局点
      const res = (await updateCompany({
        id: formData.id!,
        tenantId,
        name: formData.name,
        description: formData.description || '',
      })) as ApiResponse<Company>

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

// 关闭对话框
const closeDialog = (): void => {
  visible.value = false
  isEdit.value = false
  rowData.value = {}
}

// 处理查询条件更新
const handleQueryUpdate = (newQuery: any): void => {
  // 将新的查询条件同步到本地
  Object.assign(query, newQuery)
}

// 初始化加载数据
getData()
</script>

<style scoped>
/* 局点管理特有的查询条件样式 */
.company-search :deep(.el-form-item__content) {
  max-width: 280px;
}
</style>
