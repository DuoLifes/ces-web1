<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    @update:model-value="handleChange"
    @click="handleClick"
  >
    <el-option
      v-for="item in marketingGroupList"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    />
    <!-- 如果当前值不在marketingGroupList中但有效，添加一个临时选项 -->
    <el-option
      v-if="tempGroupName && shouldShowTempOption"
      :key="modelValue"
      :label="tempGroupName"
      :value="modelValue"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchMarketingGroupTree } from '@/api/marketing-group'
import type { PropType } from 'vue'

/**
 * 简化的营销组数据项接口
 */
interface MarketingGroupItem {
  /** 营销组ID */
  id: number
  /** 营销组名称 */
  name: string
}

/**
 * 定义组件名称
 */
defineOptions({
  name: 'MarketingGroupSelect',
})

/**
 * 定义组件属性
 */
const props = defineProps({
  /**
   * v-model绑定值
   */
  modelValue: {
    type: [Number, String],
    default: '', // 默认值为空字符串
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
    type: Function as PropType<(value: number | string) => void>,
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
  'update:modelValue': [value: number | string]
  /**
   * 值变化的事件
   */
  change: [value: number | string]
  /**
   * 当选择被清空时触发的事件(特别是因为局点ID变化)
   */
  selectionCleared: []
}>()

/**
 * 营销组列表数据
 */
const marketingGroupList = ref<MarketingGroupItem[]>([])

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 临时存储的营销组名称，用于回写显示
 */
const tempGroupName = ref('')

/**
 * 判断是否需要显示临时选项
 */
const shouldShowTempOption = computed(() => {
  // 如果modelValue有值，但不在marketingGroupList中
  if (!props.modelValue) return false

  const currentValue =
    typeof props.modelValue === 'string' ? parseInt(props.modelValue) : props.modelValue

  return !marketingGroupList.value.some((item) => item.id === currentValue)
})

/**
 * 清空当前选择
 */
function clearSelection(): void {
  console.log('清空当前营销组选择')
  // 清空当前选择
  emit('update:modelValue', '')
  emit('change', '')
  emit('selectionCleared')

  // 如果提供了onChange回调，则调用它
  if (props.onChange) {
    props.onChange('')
  }
}

/**
 * 验证当前选择在新的营销组列表中是否有效
 */
function validateCurrentSelection(): void {
  // 如果没有当前选择，不需要验证
  if (props.modelValue === '' || props.modelValue === undefined || props.modelValue === null) {
    return
  }

  // 将选择值转换为数字以进行比较
  const currentValue =
    typeof props.modelValue === 'string' ? parseInt(props.modelValue) : props.modelValue

  // 如果列表为空但有当前值，尝试加载数据
  if (marketingGroupList.value.length === 0 && currentValue) {
    console.log('列表为空但有当前值，尝试加载营销组数据')
    return
  }

  // 检查当前选择是否在营销组列表中
  const isValid = marketingGroupList.value.some((item) => item.id === currentValue)

  console.log('验证当前营销组选择:', {
    value: currentValue,
    isValid: isValid,
    availableIds: marketingGroupList.value.map((item) => item.id),
  })

  // 如果当前选择无效，但可能需要从服务器获取更多数据
  if (!isValid) {
    console.log('当前营销组选择在列表中无效')
    // 如果有有效的局点ID，可以尝试重新获取数据
    const validCompanyId =
      props.companyId !== undefined &&
      props.companyId !== null &&
      props.companyId !== '' &&
      props.companyId !== 0 &&
      props.companyId !== '0' &&
      String(props.companyId) !== 'undefined'

    if (validCompanyId) {
      console.log('有有效的局点ID，尝试重新获取数据后再次验证选择')
      return
    }

    // 否则清空选择
    console.log('当前营销组选择在新的局点下无效，清空选择')
    clearSelection()
  }
}

/**
 * 处理选择框点击事件
 */
function handleClick(): void {
  // 检查是否已选择局点
  const validCompanyId =
    props.companyId !== undefined &&
    props.companyId !== null &&
    props.companyId !== '' &&
    props.companyId !== 0 &&
    props.companyId !== '0' &&
    String(props.companyId) !== 'undefined'

  console.log(
    '点击营销组选择框，当前companyId:',
    props.companyId,
    '类型:',
    typeof props.companyId,
    '有效性:',
    validCompanyId,
  )

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

    // 如果有当前选择，清空它
    if (props.modelValue !== '' && props.modelValue !== undefined && props.modelValue !== null) {
      clearSelection()
    }

    return
  }

  if (loading.value) return

  try {
    loading.value = true
    console.log('开始获取营销组列表，局点ID:', props.companyId)

    // 调用接口获取数据
    const companyId =
      typeof props.companyId === 'string' ? parseInt(props.companyId) : props.companyId
    const res = await fetchMarketingGroupTree(companyId)

    if (res.code === '00000') {
      // 保存数据
      const groups = res.data.groupVoList || []
      marketingGroupList.value = [...groups]
      console.log('获取到营销组列表数据:', marketingGroupList.value.length, '条')

      // 如果需要添加全部选项
      if (props.showAll) {
        marketingGroupList.value.unshift({
          id: props.allValue,
          name: props.allLabel,
        })
      }

      // 验证当前选择是否有效
      validateCurrentSelection()
    } else {
      console.error('获取营销组列表失败:', res.msg)
      ElMessage.error(res.msg || '获取营销组列表失败')
    }
  } catch (error) {
    console.error('获取营销组列表失败:', error)
    ElMessage.error('获取营销组列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 选择改变事件处理
 * @param value - 选择的值
 */
function handleChange(value: number | string): void {
  // 处理空值情况
  if (value === '' || value === undefined || value === null) {
    emit('update:modelValue', '')

    // 如果提供了onChange回调，则调用它
    if (props.onChange) {
      props.onChange('')
    }
    return
  }

  // 确保value是数字类型
  const numValue = typeof value === 'string' ? parseInt(value) : value

  // 更新绑定值
  emit('update:modelValue', numValue)

  // 如果提供了onChange回调，则调用它
  if (props.onChange) {
    props.onChange(numValue)
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
      oldType: typeof oldValue,
      newType: typeof newValue,
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

    // 有当前选择，并且局点ID发生了变化
    const hasCurrentSelection =
      props.modelValue !== '' && props.modelValue !== undefined && props.modelValue !== null

    if (hasCurrentSelection) {
      // 根据配置决定是否自动清空
      if (props.autoClearOnCompanyChange) {
        console.log(
          '自动清空当前营销组选择，因为局点已更改且autoClearOnCompanyChange=true',
          props.modelValue,
        )
        clearSelection()
      } else {
        console.log('局点已更改，但不自动清空营销组选择，因为autoClearOnCompanyChange=false')
        // 在获取新列表后，会检查当前选择是否有效
      }
    }

    // 立即调用getMarketingGroupList获取新数据
    getMarketingGroupList()
  },
  { immediate: false },
)

/**
 * 通过ID获取营销组名称（如果不在列表中）
 */
async function getGroupNameById(id: number | string): Promise<void> {
  if (!id) return

  // 先检查是否已在列表中
  const currentValue = typeof id === 'string' ? parseInt(id) : id
  const existingGroup = marketingGroupList.value.find((item) => item.id === currentValue)

  if (existingGroup) {
    tempGroupName.value = existingGroup.name
    return
  }

  console.log('尝试获取营销组详情:', id)

  // 如果有有效的局点ID，尝试加载该局点下的所有营销组
  const validCompanyId =
    props.companyId !== undefined &&
    props.companyId !== null &&
    props.companyId !== '' &&
    props.companyId !== 0 &&
    props.companyId !== '0' &&
    String(props.companyId) !== 'undefined'

  if (validCompanyId && marketingGroupList.value.length === 0) {
    // 尝试加载数据
    await getMarketingGroupList()

    // 再次检查是否在列表中
    const groupAfterLoad = marketingGroupList.value.find((item) => item.id === currentValue)
    if (groupAfterLoad) {
      tempGroupName.value = groupAfterLoad.name
      return
    }
  }

  // 暂时使用ID作为临时显示
  tempGroupName.value = `ID: ${id}`
}

/**
 * 监听modelValue变化，确保能正确显示名称
 */
watch(
  () => props.modelValue,
  (newValue) => {
    console.log('MarketingGroupSelect modelValue变化:', newValue)

    // 当modelValue有值，尝试获取名称
    if (newValue) {
      getGroupNameById(newValue)
    } else {
      tempGroupName.value = ''
    }

    // 当modelValue有值且companyId有值，预加载数据确保能够显示正确的名称
    if (newValue && props.companyId) {
      preloadMarketingGroupList()
    }
  },
  { immediate: true }, // 立即执行一次，处理初始值
)

/**
 * 预加载营销组列表，确保能正确显示已选营销组名称
 */
function preloadMarketingGroupList(): void {
  // 检查是否有有效的companyId和modelValue
  const validCompanyId =
    props.companyId !== undefined &&
    props.companyId !== null &&
    props.companyId !== '' &&
    props.companyId !== 0 &&
    props.companyId !== '0' &&
    String(props.companyId) !== 'undefined'

  const validModelValue =
    props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== ''

  console.log('预加载营销组列表检查:', {
    companyId: props.companyId,
    modelValue: props.modelValue,
    validCompanyId,
    validModelValue,
    hasMarketingGroupList: marketingGroupList.value.length > 0,
  })

  // 如果companyId有效且modelValue有值，但营销组列表为空，主动加载数据
  if (validCompanyId && validModelValue && marketingGroupList.value.length === 0) {
    console.log('预加载营销组列表 - 开始获取数据')
    getMarketingGroupList()
  }
}

// 在挂载时检查是否需要预加载数据
onMounted(() => {
  preloadMarketingGroupList()
})

// 暴露方法给父组件
defineExpose({
  refreshList: getMarketingGroupList,
})
</script>

<style scoped>
.el-select {
  width: 90%; /* 与其他表单控件保持一致的宽度 */
}
</style>
