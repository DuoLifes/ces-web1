<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    multiple
    collapse-tags
    collapse-tags-tooltip
    @update:model-value="handleChange"
    @click="handleClick"
  >
    <el-option
      v-for="item in marketingGroupList"
      :key="item.id"
      :label="item.groupName"
      :value="item.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchMarketingGroupData } from '@/api/marketing-group'
import type { PropType } from 'vue'
import type { MarketingGroup } from '@/types/marketing-group'

/**
 * 定义组件名称
 */
defineOptions({
  name: 'MarketingGroupMultiSelect',
})

/**
 * 定义组件属性
 */
const props = defineProps({
  /**
   * v-model绑定值
   */
  modelValue: {
    type: Array as PropType<(number | string)[]>,
    default: () => [], // 默认值为空数组
  },
  /**
   * 占位文本
   */
  placeholder: {
    type: String,
    default: '请选择营销组',
  },
  /**
   * 是否可清空
   */
  clearable: {
    type: Boolean,
    default: true,
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * 是否添加全部选项
   */
  showAll: {
    type: Boolean,
    default: false,
  },
  /**
   * 全部选项的值
   */
  allValue: {
    type: Number,
    default: 0,
  },
  /**
   * 全部选项的标签
   */
  allLabel: {
    type: String,
    default: '全部',
  },
  /**
   * 局点ID，用于获取对应的营销组列表
   */
  companyId: {
    type: [Number, String],
    default: '',
  },
  /**
   * 值变化时的回调函数
   */
  onChange: {
    type: Function as PropType<(value: (number | string)[]) => void>,
    default: null,
  },
  /**
   * 是否在局点ID变化时自动清空选择
   */
  autoClearOnCompanyChange: {
    type: Boolean,
    default: true,
  },
})

/**
 * 定义组件事件
 */
const emit = defineEmits<{
  /**
   * 更新v-model值的事件
   */
  'update:modelValue': [value: (number | string)[]]
  /**
   * 值变化的事件
   */
  change: [value: (number | string)[]]
  /**
   * 当选择被清空时触发的事件(特别是因为局点ID变化)
   */
  selectionCleared: []
}>()

/**
 * 营销组列表数据
 */
const marketingGroupList = ref<MarketingGroup[]>([])

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 清空当前选择
 */
function clearSelection(): void {
  console.log('清空当前营销组选择')
  // 清空当前选择
  emit('update:modelValue', [])
  emit('change', [])
  emit('selectionCleared')

  // 如果提供了onChange回调，则调用它
  if (props.onChange) {
    props.onChange([])
  }
}

/**
 * 验证当前选择在新的营销组列表中是否有效
 */
function validateCurrentSelection(): void {
  // 如果没有当前选择，不需要验证
  if (!props.modelValue || props.modelValue.length === 0) {
    return
  }

  // 将所有选择项转为数字（如果是字符串的话）
  const currentValues = props.modelValue.map(value => 
    typeof value === 'string' ? parseInt(value) : value
  )

  // 检查当前选择是否有在新列表中不存在的项
  const allIdsInList = marketingGroupList.value.map(item => item.id)
  const allValid = currentValues.every(value => allIdsInList.includes(value))

  if (!allValid && props.autoClearOnCompanyChange) {
    console.log('部分营销组选择在新列表中无效，清空选择')
    clearSelection()
  }
}

/**
 * 处理选择框点击事件
 */
function handleClick(): void {
  // 检查是否已选择局点，条件更严格以确保在任何情况下都能正确判断
  const validCompanyId =
    props.companyId !== undefined &&
    props.companyId !== null &&
    props.companyId !== '' &&
    props.companyId !== 0 &&
    props.companyId !== '0' &&
    String(props.companyId) !== 'undefined'

  console.log('点击营销组选择框，当前companyId:', props.companyId, '有效性:', validCompanyId)

  if (!validCompanyId) {
    ElMessage.warning('请先选择局点')
    return
  }
}

/**
 * 获取营销组列表数据
 */
async function getMarketingGroupList(): Promise<void> {
  // 检查是否已选择局点
  const validCompanyId =
    props.companyId !== undefined &&
    props.companyId !== null &&
    props.companyId !== '' &&
    props.companyId !== 0 &&
    props.companyId !== '0' &&
    String(props.companyId) !== 'undefined'

  // 如果没有局点ID，则清空营销组列表并返回
  if (!validCompanyId) {
    marketingGroupList.value = []
    console.log('无效的局点ID，已清空营销组列表')

    // 如果有当前选择，根据配置决定是否清空
    if (props.modelValue && props.modelValue.length > 0 && props.autoClearOnCompanyChange) {
      clearSelection()
    }
    return
  }

  if (loading.value) return

  try {
    loading.value = true
    console.log('开始获取营销组列表，局点ID:', props.companyId)

    const companyIdValue = Number(props.companyId)
    // 使用fetchMarketingGroupData替代fetchMarketingGroupTree
    const res = await fetchMarketingGroupData({
      companyId: companyIdValue,
      pageNo: 1,
      pageSize: 1000 // 设置一个较大的值以获取所有数据
    })

    if (res.code === '00000') {
      // 获取营销组列表
      const groups = res.data.records || []
      marketingGroupList.value = [...groups]
      console.log('获取到营销组列表数据:', marketingGroupList.value.length, '条')

      // 如果需要添加全部选项
      if (props.showAll) {
        marketingGroupList.value.unshift({
          id: props.allValue as number,
          groupName: props.allLabel,
          tenantId: '',
          tenantName: '',
          companyId: companyIdValue,
          companyName: '',
          description: '',
          operatorName: '',
          createTime: '',
          updateTime: ''
        })
      }

      // 验证当前选择在新的列表中是否存在
      validateCurrentSelection()
    } else {
      ElMessage.error(res.msg || '获取营销组列表失败')
      marketingGroupList.value = []
    }
  } catch (error) {
    console.error('获取营销组列表出错:', error)
    ElMessage.error('获取营销组列表出错')
    marketingGroupList.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 选择改变事件处理
 * @param values - 选择的值数组
 */
function handleChange(values: (number | string)[]): void {
  if (!values || values.length === 0) {
    emit('update:modelValue', [])
    // 如果提供了onChange回调，则调用它
    if (props.onChange) {
      props.onChange([])
    }
    return
  }

  // 确保所有值都是数字类型
  const numValues = values.map(value => 
    typeof value === 'string' ? parseInt(value) : value
  )

  // 更新绑定值
  emit('update:modelValue', numValues)

  // 如果提供了onChange回调，则调用它
  if (props.onChange) {
    props.onChange(numValues)
  }
}

/**
 * 监听局点ID变化，更新营销组列表
 */
watch(
  () => props.companyId,
  (newValue, oldValue) => {
    console.log('局点ID变化:', {
      old: oldValue,
      new: newValue,
      currentSelection: props.modelValue,
      autoClear: props.autoClearOnCompanyChange,
    })

    // 检查局点ID是否真的发生了变化（考虑类型转换）
    const oldId = oldValue === '' || oldValue === undefined ? 0 : Number(oldValue)
    const newId = newValue === '' || newValue === undefined ? 0 : Number(newValue)

    // 如果局点ID没有变化，不执行后续操作
    if (oldId === newId) {
      return
    }

    // 根据配置决定是否自动清空
    const hasCurrentSelection = props.modelValue && props.modelValue.length > 0
    if (hasCurrentSelection && props.autoClearOnCompanyChange) {
      console.log('自动清空当前营销组选择，因为局点已更改且autoClearOnCompanyChange=true')
      clearSelection()
    }

    // 立即调用getMarketingGroupList获取新数据
    getMarketingGroupList()
  },
  { immediate: false },
)

/**
 * 刷新营销组列表
 */
function refreshMarketingGroupList(): void {
  getMarketingGroupList()
}

// 暴露给父组件的方法
defineExpose({
  refreshMarketingGroupList,
})

/**
 * 组件挂载时初始化数据
 */
onMounted(() => {
  if (props.companyId) {
    getMarketingGroupList()
  }
})
</script>

<style scoped>
.el-select {
  width: 100%;
}
</style> 