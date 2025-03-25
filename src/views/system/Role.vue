<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <TableSearch
      v-model:query="query"
      :options="searchOpt"
      :search="handleSearch"
      :reset="resetQuery"
      :layout="4"
      :fixed-buttons="true"
      class="table-search role-search"
      ref="tableSearchRef"
      :key="searchFormKey"
    />

    <!-- 数据表格 -->
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
        :editFunc="(row) => handleEdit(row as unknown as Role)"
        :delFunc="(row) => handleDelete(row as unknown as Role)"
        :showView="false"
        :showEdit="true"
        :showDelete="true"
        :loading="loading"
        :max-height="650"
        title="角色列表"
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
        <DialogTitle :title="isEdit ? '编辑角色' : '新增角色'" />
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { Role } from '@/types/role'
import type { FormOption } from '@/types/form-option'
import { fetchRoleData, addRole, updateRole, deleteRole } from '@/api/role'

// 导入组件
import TableCustom from '@/components/common/table-custom.vue'
import TableSearch from '@/components/common/table-search.vue'
import TableEdit from '@/components/common/table-edit.vue'
import DialogTitle from '@/components/common/dialog-title.vue'

interface ApiResponse<T> {
  code: string
  msg: string
  data: T
}

defineOptions({ name: 'RoleManagementView' })

// 查询条件
const query = reactive({
  name: '',
})

// 跟踪查询输入
const inputRoleName = ref('')

// 角色名称输入变化处理
const handleRoleNameInput = (value: string): void => {
  inputRoleName.value = value
}

// 分页配置
const page = reactive({
  index: 1,
  size: 10,
  total: 0,
})

// 表格数据
const tableData = ref<Role[]>([])
const visible = ref(false)
const isEdit = ref(false)
const rowData = ref<Partial<Role>>({})
const loading = ref(false)
const tableSearchRef = ref()
const searchFormKey = ref(0) // 用于强制刷新表单

// 查询表单配置
const searchOpt = ref([
  {
    type: 'input',
    label: '角色名称：',
    prop: 'name',
    placeholder: '请输入角色名称',
    props: {
      onInput: handleRoleNameInput,
    },
  },
])

// 表格列配置
const columns = ref([
  { prop: 'name', label: '角色名称' },
  { prop: 'description', label: '角色描述' },
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
      type: 'input',
      label: '角色名称',
      prop: 'name',
      placeholder: '请输入角色名称',
      required: true,
    },
    {
      type: 'textarea',
      label: '角色描述',
      prop: 'description',
      placeholder: '请输入角色描述',
      required: false,
    },
  ],
})

// 获取表格数据
const getData = async (): Promise<void> => {
  try {
    loading.value = true

    const params = {
      name: inputRoleName.value || undefined,
      pageNo: page.index,
      pageSize: page.size,
    }

    const res = await fetchRoleData(params)

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
  inputRoleName.value = ''
  query.name = ''
  searchFormKey.value += 1
  resetPagination()
  getData()
}

// 执行查询
const handleSearch = (): void => {
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

// 添加角色
const handleAdd = (): void => {
  rowData.value = {
    name: '',
    description: '',
  }
  isEdit.value = false
  visible.value = true
}

// 编辑角色
const handleEdit = (row: Role): void => {
  rowData.value = { ...row }
  isEdit.value = true
  visible.value = true
}

// 处理删除操作
const handleDelete = async (row: Role): Promise<void> => {
  try {
    const res = await deleteRole(row.id)
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
const handleUpdate = async (formData: Partial<Role>): Promise<void> => {
  try {
    if (!formData.name) {
      ElMessage.error('请填写角色名称')
      return
    }

    if (!isEdit.value) {
      // 新增角色
      const res = await addRole({
        name: formData.name,
        description: formData.description || '',
      })

      if (res.code === '00000') {
        ElMessage.success('添加成功')
        closeDialog()
        getData()
      } else {
        ElMessage.error(res.msg || '添加失败')
      }
    } else {
      // 编辑角色
      const res = await updateRole({
        id: formData.id!,
        name: formData.name,
        description: formData.description || '',
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

// 关闭对话框
const closeDialog = (): void => {
  visible.value = false
  isEdit.value = false
  rowData.value = {}
}

// 初始化加载数据
getData()
</script>

<style scoped>
/* 角色管理特有的查询条件样式 */
.role-search :deep(.el-form-item__content) {
  max-width: 280px;
}
</style>
