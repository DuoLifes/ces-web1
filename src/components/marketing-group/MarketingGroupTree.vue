<template>
  <div class="marketing-group-tree">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="errorMessage || '获取营销组数据失败'"
        type="error"
        show-icon
        :closable="false"
      />
    </div>
    <div v-else class="tree-container">
      <h3 v-if="treeData?.companyName" class="company-title">{{ treeData.companyName }}</h3>
      <div v-if="!treeData?.groupVoList || treeData.groupVoList.length === 0" class="empty-tip">
        该局点下暂无营销组
      </div>
      <el-tree
        v-else
        :data="formattedTreeData"
        node-key="id"
        :props="defaultProps"
        :expand-on-click-node="false"
        :check-strictly="checkStrictly"
        :default-expand-all="defaultExpandAll"
        :show-checkbox="showCheckbox"
        @check="handleCheck"
        @node-click="handleNodeClick"
        ref="treeRef"
        highlight-current
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchMarketingGroupTree, type MarketingGroupTree } from '@/api/marketing-group'
import type { PropType } from 'vue'
import type { ElTree } from 'element-plus'

// 定义组件名称
defineOptions({
  name: 'MarketingGroupTree',
})

// 定义组件属性
const props = defineProps({
  /**
   * 局点ID，用于获取对应的营销组树形结构
   */
  companyId: {
    type: [Number, String],
    required: true,
  },
  /**
   * 是否展示复选框
   */
  showCheckbox: {
    type: Boolean,
    default: false,
  },
  /**
   * 是否严格遵循父子不互相关联的做法
   */
  checkStrictly: {
    type: Boolean,
    default: true,
  },
  /**
   * 默认是否展开所有节点
   */
  defaultExpandAll: {
    type: Boolean,
    default: true,
  },
  /**
   * 默认选中的节点ID数组
   */
  defaultCheckedKeys: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
})

// 定义组件事件
const emit = defineEmits<{
  /**
   * 复选框被点击时触发
   */
  check: [checkedNodes: any[], checkedKeys: number[]]
  /**
   * 节点被点击时触发
   */
  'node-click': [data: any, node: any]
}>()

// 树形数据接口
interface TreeNode {
  id: number
  label: string
  children?: TreeNode[]
}

// 树形组件引用
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)

// 局部状态
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const treeData = ref<MarketingGroupTree | null>(null)

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label',
}

// 转换为树形控件需要的数据格式
const formattedTreeData = computed((): TreeNode[] => {
  if (!treeData.value || !treeData.value.groupVoList) {
    return []
  }

  // 将营销组列表转换为树形控件可用的数据格式
  return treeData.value.groupVoList.map((group) => ({
    id: group.id,
    label: group.name,
  }))
})

/**
 * 获取营销组树形数据
 */
const getMarketingGroupTree = async (): Promise<void> => {
  // 检查是否有有效的局点ID
  const validCompanyId =
    props.companyId !== undefined &&
    props.companyId !== null &&
    props.companyId !== '' &&
    props.companyId !== 0 &&
    props.companyId !== '0' &&
    String(props.companyId) !== 'undefined'

  // 如果没有有效的局点ID，清空数据并返回
  if (!validCompanyId) {
    treeData.value = null
    error.value = false
    loading.value = false
    return
  }

  loading.value = true
  error.value = false
  errorMessage.value = ''

  try {
    const companyId =
      typeof props.companyId === 'string' ? parseInt(props.companyId) : props.companyId
    const res = await fetchMarketingGroupTree(companyId)

    if (res.code === '00000') {
      treeData.value = res.data
      // 如果有默认选中的节点，设置选中状态
      setDefaultCheckedNodes()
    } else {
      error.value = true
      errorMessage.value = res.msg || '获取营销组数据失败'
      treeData.value = null
    }
  } catch (err) {
    console.error('获取营销组树形数据出错:', err)
    error.value = true
    errorMessage.value = '获取营销组数据出错'
    treeData.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 设置默认选中的节点
 */
const setDefaultCheckedNodes = (): void => {
  if (!props.showCheckbox || !props.defaultCheckedKeys || props.defaultCheckedKeys.length === 0) {
    return
  }

  // 等待DOM更新后设置默认选中
  setTimeout(() => {
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(props.defaultCheckedKeys)
    }
  }, 0)
}

/**
 * 获取当前选中的节点键值
 * @returns 选中的节点ID数组
 */
const getCheckedKeys = (): number[] => {
  if (!treeRef.value) return []
  return treeRef.value.getCheckedKeys() as number[]
}

/**
 * 获取当前选中的半选节点键值
 * @returns 半选中的节点ID数组
 */
const getHalfCheckedKeys = (): number[] => {
  if (!treeRef.value) return []
  return treeRef.value.getHalfCheckedKeys() as number[]
}

/**
 * 复选框状态变化时的回调
 */
const handleCheck = (
  node: any,
  checkedInfo: {
    checkedNodes: any[]
    checkedKeys: number[]
    halfCheckedNodes: any[]
    halfCheckedKeys: number[]
  },
): void => {
  emit('check', checkedInfo.checkedNodes, checkedInfo.checkedKeys)
}

/**
 * 节点点击时的回调
 */
const handleNodeClick = (data: any, node: any): void => {
  emit('node-click', data, node)
}

/**
 * 设置选中节点
 * @param keys - 要选中的节点键值数组
 */
const setCheckedKeys = (keys: number[]): void => {
  if (treeRef.value) {
    treeRef.value.setCheckedKeys(keys)
  }
}

/**
 * 获取所有节点ID
 * @returns 所有节点的ID数组
 */
const getAllKeys = (): number[] => {
  if (!treeData.value || !treeData.value.groupVoList) {
    return []
  }
  return treeData.value.groupVoList.map((item) => item.id)
}

/**
 * 全选
 */
const checkAll = (): void => {
  const allKeys = getAllKeys()
  setCheckedKeys(allKeys)
}

/**
 * 全不选
 */
const uncheckAll = (): void => {
  setCheckedKeys([])
}

// 监听companyId变化，重新获取树形数据
watch(
  () => props.companyId,
  (newVal) => {
    if (newVal) {
      getMarketingGroupTree()
    } else {
      treeData.value = null
    }
  },
)

// 组件挂载时，如果已有companyId则获取数据
onMounted(() => {
  if (props.companyId) {
    getMarketingGroupTree()
  }
})

// 暴露方法给父组件
defineExpose({
  getCheckedKeys,
  getHalfCheckedKeys,
  setCheckedKeys,
  checkAll,
  uncheckAll,
  refreshData: getMarketingGroupTree,
})
</script>

<style scoped>
.marketing-group-tree {
  width: 100%;
  padding: 10px;
}

.loading-container {
  padding: 20px 0;
}

.error-container {
  margin: 20px 0;
}

.company-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.empty-tip {
  color: #909399;
  padding: 20px 0;
  text-align: center;
  font-size: 14px;
}

.tree-container {
  max-height: 600px;
  overflow-y: auto;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node__label) {
  font-size: 14px;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #f0f7ff;
}
</style>
