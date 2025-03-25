<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    @update:model-value="handleChange"
    @click="handleClick"
  >
    <el-option v-for="item in companyList" :key="item.id" :label="item.name" :value="item.id" />
    <!-- 如果当前值不在companyList中但有效，添加一个临时选项 -->
    <el-option
      v-if="tempCompanyName && shouldShowTempOption"
      :key="modelValue"
      :label="tempCompanyName"
      :value="modelValue"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchCompanyData } from '@/api/company'
import type { Company } from '@/types/company'
import type { PropType } from 'vue'

/**
 * 简化的局点数据项接口
 */
interface CompanyItem {
  /** 局点ID */
  id: number
  /** 局点名称 */
  name: string
  /** 运营商ID */
  tenantId: number
  /** 运营商名称 */
  tenantName: string
}

/**
 * 定义组件名称
 */
defineOptions({
  name: 'CompanySelect',
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
    default: '请选择局点',
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
   * 运营商ID，用于过滤局点列表
   */
  tenantId: {
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
   * 是否在租户ID变化时自动清空选择
   */
  autoClearOnTenantChange: {
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
   * 当选择被清空时触发的事件(特别是因为租户ID变化)
   */
  selectionCleared: []
}>()

/**
 * 局点列表数据
 */
const companyList = ref<CompanyItem[]>([])

/**
 * 所有局点列表（未经过滤）
 */
const allCompanies = ref<CompanyItem[]>([])

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 临时存储的公司名称，用于回写显示
 */
const tempCompanyName = ref('')

/**
 * 判断是否需要显示临时选项
 */
const shouldShowTempOption = computed(() => {
  // 如果modelValue有值，但不在companyList中
  if (!props.modelValue) return false

  const currentValue =
    typeof props.modelValue === 'string' ? parseInt(props.modelValue) : props.modelValue

  return !companyList.value.some((item) => item.id === currentValue)
})

/**
 * 清空当前选择
 */
function clearSelection(): void {
  console.log('清空当前局点选择')
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
 * 验证当前选择在新的局点列表中是否有效
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
  if (companyList.value.length === 0 && currentValue) {
    console.log('列表为空但有当前值，尝试加载局点数据')
    return
  }

  // 检查当前选择是否在过滤后的列表中
  const isValid = companyList.value.some((item) => item.id === currentValue)

  console.log('验证当前局点选择:', {
    value: currentValue,
    isValid: isValid,
    availableIds: companyList.value.map((item) => item.id),
  })

  // 如果当前选择无效，但我们可能需要从服务器获取更多数据
  if (!isValid) {
    console.log('当前局点选择在列表中无效')
    // 如果有有效的租户ID，可以尝试重新获取数据
    const validTenantId =
      props.tenantId !== undefined &&
      props.tenantId !== null &&
      props.tenantId !== '' &&
      props.tenantId !== 0 &&
      props.tenantId !== '0' &&
      String(props.tenantId) !== 'undefined'

    if (validTenantId) {
      console.log('有有效的租户ID，尝试重新获取数据后再次验证选择')
      return
    }

    // 否则清空选择
    console.log('当前局点选择在新的运营商下无效，清空选择')
    clearSelection()
  }
}

/**
 * 处理选择框点击事件
 */
function handleClick(): void {
  // 检查是否已选择运营商，条件更严格以确保在任何情况下都能正确判断
  const validTenantId =
    props.tenantId !== undefined &&
    props.tenantId !== null &&
    props.tenantId !== '' &&
    props.tenantId !== 0 &&
    props.tenantId !== '0' &&
    String(props.tenantId) !== 'undefined'

  console.log(
    '点击局点选择框，当前tenantId:',
    props.tenantId,
    '类型:',
    typeof props.tenantId,
    '有效性:',
    validTenantId,
  )

  if (!validTenantId) {
    ElMessage.warning('请先选择运营商')
    return
  }
}

/**
 * 获取局点列表数据
 */
async function getCompanyList(): Promise<void> {
  // 检查是否已选择运营商，条件更严格以确保在任何情况下都能正确判断
  const validTenantId =
    props.tenantId !== undefined &&
    props.tenantId !== null &&
    props.tenantId !== '' &&
    props.tenantId !== 0 &&
    props.tenantId !== '0' &&
    String(props.tenantId) !== 'undefined'

  // 如果没有运营商ID，则清空局点列表并返回
  if (!validTenantId) {
    companyList.value = []
    console.log('无效的运营商ID，已清空局点列表')

    // 如果有当前选择，清空它
    if (props.modelValue !== '' && props.modelValue !== undefined && props.modelValue !== null) {
      clearSelection()
    }

    return
  }

  if (loading.value) return

  try {
    loading.value = true
    console.log('开始获取局点列表，运营商ID:', props.tenantId)

    // 调用接口，使用较大的pageSize确保能获取所有数据
    const res = await fetchCompanyData({
      tenantId: Number(props.tenantId),
      pageNo: 1,
      pageSize: 1000, // 设置足够大的数值，确保获取所有局点
    })

    if (res.code === '00000') {
      // 提取需要的字段保存到内部数据中
      allCompanies.value = (res.data.records || []).map((item: Company) => ({
        id: item.id,
        name: item.name,
        tenantId: item.tenantId,
        tenantName: item.tenantName,
      }))

      console.log('获取到局点列表数据:', allCompanies.value.length, '条')

      // 过滤局点列表
      filterCompaniesByTenant()

      // 验证当前选择是否有效
      validateCurrentSelection()
    } else {
      console.error('获取局点列表失败:', res.msg)
      ElMessage.error(res.msg || '获取局点列表失败')
    }
  } catch (error) {
    console.error('获取局点列表失败:', error)
    ElMessage.error('获取局点列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 根据租户ID过滤局点列表
 */
function filterCompaniesByTenant(): void {
  if (!props.tenantId || props.tenantId === '' || props.tenantId === 0) {
    // 如果没有指定租户ID，则显示所有局点
    companyList.value = [...allCompanies.value]
  } else {
    // 过滤出当前租户的局点
    const tenantId = typeof props.tenantId === 'string' ? parseInt(props.tenantId) : props.tenantId
    companyList.value = allCompanies.value.filter((item) => item.tenantId === tenantId)
  }

  // 如果需要添加全部选项
  if (props.showAll) {
    companyList.value.unshift({
      id: props.allValue as number,
      name: props.allLabel,
      tenantId: 0,
      tenantName: '',
    })
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
 * 监听租户ID变化，更新局点列表
 */
watch(
  () => props.tenantId,
  (newValue, oldValue) => {
    console.log('运营商ID变化:', {
      old: oldValue,
      new: newValue,
      oldType: typeof oldValue,
      newType: typeof newValue,
      currentSelection: props.modelValue,
      autoClear: props.autoClearOnTenantChange,
    })

    // 检查租户ID是否真的发生了变化（考虑类型转换）
    const oldId = oldValue === '' || oldValue === undefined ? 0 : Number(oldValue)
    const newId = newValue === '' || newValue === undefined ? 0 : Number(newValue)

    // 如果租户ID没有变化，不执行后续操作
    if (oldId === newId) {
      return
    }

    // 有当前选择，并且租户ID发生了变化
    const hasCurrentSelection =
      props.modelValue !== '' && props.modelValue !== undefined && props.modelValue !== null

    if (hasCurrentSelection) {
      // 根据配置决定是否自动清空
      if (props.autoClearOnTenantChange) {
        console.log(
          '自动清空当前局点选择，因为运营商已更改且autoClearOnTenantChange=true',
          props.modelValue,
        )
        clearSelection()
      } else {
        console.log('运营商已更改，但不自动清空局点选择，因为autoClearOnTenantChange=false')
        // 在获取新列表后，会检查当前选择是否有效
      }
    }

    // 立即调用getCompanyList获取新数据
    getCompanyList()
  },
  { immediate: false }, // 不立即执行，让onMounted中的preloadCompanyList处理初始加载
)

/**
 * 通过ID获取公司详情（如果不在列表中）
 */
async function getCompanyNameById(id: number | string): Promise<void> {
  if (!id) return

  // 先检查是否已在列表中
  const currentValue = typeof id === 'string' ? parseInt(id) : id
  const existingCompany = companyList.value.find((item) => item.id === currentValue)

  if (existingCompany) {
    tempCompanyName.value = existingCompany.name
    return
  }

  console.log('尝试获取公司详情:', id)

  // 如果有有效的租户ID，尝试加载该租户下的所有局点
  const validTenantId =
    props.tenantId !== undefined &&
    props.tenantId !== null &&
    props.tenantId !== '' &&
    props.tenantId !== 0 &&
    props.tenantId !== '0' &&
    String(props.tenantId) !== 'undefined'

  if (validTenantId && companyList.value.length === 0) {
    // 尝试加载数据
    await getCompanyList()

    // 再次检查是否在列表中
    const companyAfterLoad = companyList.value.find((item) => item.id === currentValue)
    if (companyAfterLoad) {
      tempCompanyName.value = companyAfterLoad.name
      return
    }
  }

  // 暂时使用ID作为临时显示
  tempCompanyName.value = `ID: ${id}`
}

/**
 * 监听modelValue变化，确保能正确显示名称
 */
watch(
  () => props.modelValue,
  (newValue) => {
    console.log('CompanySelect modelValue变化:', newValue)

    // 当modelValue有值，尝试获取名称
    if (newValue) {
      getCompanyNameById(newValue)
    } else {
      tempCompanyName.value = ''
    }

    // 当modelValue有值且tenantId有值，预加载数据确保能够显示正确的名称
    if (newValue && props.tenantId) {
      preloadCompanyList()
    }
  },
  { immediate: true }, // 立即执行一次，处理初始值
)

/**
 * 预加载局点列表，确保能正确显示已选局点名称
 */
function preloadCompanyList(): void {
  // 检查是否有有效的tenantId和modelValue
  const validTenantId =
    props.tenantId !== undefined &&
    props.tenantId !== null &&
    props.tenantId !== '' &&
    props.tenantId !== 0 &&
    props.tenantId !== '0' &&
    String(props.tenantId) !== 'undefined'

  const validModelValue =
    props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== ''

  console.log('预加载局点列表检查:', {
    tenantId: props.tenantId,
    modelValue: props.modelValue,
    validTenantId,
    validModelValue,
    hasCompanyList: companyList.value.length > 0,
  })

  // 如果tenantId有效且modelValue有值，但局点列表为空，主动加载数据
  if (validTenantId && validModelValue && companyList.value.length === 0) {
    console.log('预加载局点列表 - 开始获取数据')
    getCompanyList()
  }
}

// 在挂载时检查是否需要预加载数据
onMounted(() => {
  preloadCompanyList()
})
</script>

<style scoped>
.el-select {
  width: 90%; /* 与其他表单控件保持一致的宽度 */
}
</style>
