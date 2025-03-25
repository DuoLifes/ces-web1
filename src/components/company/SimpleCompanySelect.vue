<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    @update:model-value="handleChange"
    @click="handleClick"
  >
    <el-option v-if="showAll" :key="allValue" :label="allLabel" :value="allValue" />
    <el-option v-for="item in companyList" :key="item.id" :label="item.name" :value="item.id" />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchCompanyData } from '@/api/company'
import type { PropType } from 'vue'

/**
 * 简化的局点数据项接口
 */
interface CompanyItem {
  /** 局点ID */
  id: number
  /** 局点名称 */
  name: string
}

/**
 * 定义组件名称
 */
defineOptions({
  name: 'SimpleCompanySelect',
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
    type: [Number, String],
    default: '',
  },
  /**
   * 全部选项的标签
   */
  allLabel: {
    type: String,
    default: '全部',
  },
  /**
   * 值变化时的回调函数
   */
  onChange: {
    type: Function as PropType<(value: number | string) => void>,
    default: null,
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
}>()

/**
 * 局点列表数据
 */
const companyList = ref<CompanyItem[]>([])

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 初始化局点数据
 */
const initCompanyList = async (): Promise<void> => {
  try {
    loading.value = true
    const res = await fetchCompanyData({
      pageNo: 1,
      pageSize: 1000, // 设置足够大的数值，确保获取所有局点
    })

    if (res.code === '00000') {
      companyList.value = res.data.records || []
    } else {
      ElMessage.error(res.msg || '获取局点列表失败')
    }
  } catch {
    ElMessage.error('获取局点列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 选择值变化处理函数
 */
const handleChange = (value: number | string): void => {
  emit('update:modelValue', value)
  emit('change', value)
  // 如果有onChange回调，则调用
  if (props.onChange) {
    props.onChange(value)
  }
}

/**
 * 组件点击事件处理函数
 */
const handleClick = (): void => {
  // 如果列表为空，则尝试加载数据
  if (companyList.value.length === 0) {
    initCompanyList()
  }
}

// 组件挂载时，初始化局点列表
onMounted(() => {
  initCompanyList()
})
</script>
