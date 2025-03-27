<!-- 标签管理页面 -->
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
      class="table-search tag-search"
      ref="tableSearchRef"
      :key="searchFormKey"
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
        title="标签列表"
        @addOperate="handleAdd"
      >
        <template #operator="{ rows }">
          <div class="operate-btns">
            <!-- 编辑按钮 -->
            <el-button class="light-blue-btn" size="small" :icon="Edit" @click="handleEdit(rows)">
              编辑
            </el-button>

            <!-- 配置局点按钮 -->
            <el-button
              class="light-blue-btn"
              size="small"
              :icon="Setting"
              @click="handleConfigure(rows)"
            >
              配置局点
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
      </TableCustom>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, markRaw, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Tag } from '@/types/tag'
import { fetchTagData, deleteTag } from '@/api/tag'
import type { Component } from 'vue'
import { Setting, Edit, Delete } from '@element-plus/icons-vue'

// 导入组件
import TableCustom from '@/components/common/table-custom.vue'
import TableSearch from '@/components/common/table-search.vue'
import SimpleCompanySelect from '@/components/company/SimpleCompanySelect.vue'

defineOptions({ name: 'TagManagementView' })

const router = useRouter()

// 查询条件
const query = reactive({
  companyId: '',
  name: '',
  type: '' as string | number,
})

// 分页配置
const page = reactive({
  index: 1,
  size: 10,
  total: 0,
})

// 表格数据
const tableData = ref<Tag[]>([])

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
    type: 'input',
    label: '标签名称：',
    prop: 'name',
    placeholder: '请输入标签名称',
  },
  {
    type: 'select',
    label: '标签类别：',
    prop: 'type',
    placeholder: '请选择标签类别',
    opts: [
      { value: 0, label: '全部' },
      { value: 1, label: '基础标签' },
      { value: 2, label: '高级标签' },
    ],
  },
  {
    type: 'custom',
    label: '局点名称：',
    prop: 'companyId',
    placeholder: '请选择局点',
    component: markRaw(SimpleCompanySelect),
    props: {
      showAll: true,
      allLabel: '全部',
      allValue: '',
      clearable: true,
    },
  },
])

// 表格列配置
const columns = ref([
  { prop: 'name', label: '标签名称' },
  { prop: 'typeValue', label: '标签类别' },
  { prop: 'companyNames', label: '关联局点' },
  { prop: 'operator', label: '操作', width: 280 },
])

// 获取表格数据
const getData = async (): Promise<void> => {
  try {
    loading.value = true

    // 从表单组件获取最新值
    const formValues = tableSearchRef.value?.localQuery || query

    const params = {
      companyId:
        formValues.companyId && formValues.companyId !== ''
          ? Number(formValues.companyId)
          : undefined,
      name: formValues.name || undefined,
      type: formValues.type && formValues.type !== '' ? Number(formValues.type) : undefined,
      pageNo: page.index,
      pageSize: page.size,
    }

    const res = await fetchTagData(params)

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
  query.companyId = ''
  query.name = ''
  query.type = ''

  searchFormKey.value += 1
  resetPagination()
  getData()
}

// 执行查询
const handleSearch = (searchQuery?: Record<string, any>): void => {
  if (searchQuery) {
    // 使用从搜索组件接收的查询参数
    query.companyId = searchQuery.companyId || ''
    query.name = searchQuery.name || ''
    query.type = searchQuery.type || ''
  }
  resetPagination()
  getData()
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

// 新增标签
const handleAdd = (): void => {
  router.push('/addTag')
}

// 编辑标签
const handleEdit = (row: Tag): void => {
  // 将完整的标签数据对象编码后通过查询参数传递到编辑页面
  const tagData = encodeURIComponent(JSON.stringify(row))
  router.push(`/editTag/${row.id}?tagData=${tagData}`)
}

// 配置标签局点
const handleConfigure = (row: Tag): void => {
  // 将完整的标签数据对象编码后通过查询参数传递到配置局点页面
  const tagData = encodeURIComponent(JSON.stringify(row))
  router.push(`/configTagCompany/${row.id}?tagData=${tagData}`)
}

// 操作按钮
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
const handleOperate = (row: any) => {
  // 这个函数存在是为了满足tableCustom组件的要求，但我们使用的是自定义的操作按钮模板
}

// 删除标签
const handleDelete = async (row: Tag): Promise<void> => {
  try {
    const res = await deleteTag(row.id)
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

// 初始化
onMounted(() => {
  getData()
})
</script>

<style scoped>
/* 标签管理特有的查询条件样式 */
.tag-search :deep(.el-form-item__content) {
  max-width: 280px;
}

.operate-btns {
  display: flex;
  gap: 8px;
}
</style>
