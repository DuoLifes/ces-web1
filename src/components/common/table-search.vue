<template>
  <div class="search-container">
    <el-form ref="searchRef" :model="localQuery" :inline="true">
      <div class="form-items" :style="{ '--form-items-per-row': props.layout }">
        <el-form-item
          :label="item.label"
          :prop="item.prop"
          v-for="item in options"
          :key="item.prop"
        >
          <el-input
            v-if="item.type === 'input'"
            v-model="localQuery[item.prop]"
            :name="item.prop"
            :disabled="item.disabled"
            :placeholder="item.placeholder"
            clearable
            @update:modelValue="(value) => handleInputChange(item, value)"
          ></el-input>
          <el-select
            v-else-if="item.type === 'select'"
            v-model="localQuery[item.prop]"
            :name="item.prop"
            :disabled="item.disabled"
            :placeholder="item.placeholder"
            clearable
            @update:modelValue="(value) => updateQueryField(item.prop, value)"
          >
            <el-option
              v-for="opt in item.opts"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            ></el-option>
          </el-select>
          <el-date-picker
            v-else-if="item.type === 'date'"
            type="date"
            v-model="localQuery[item.prop]"
            :name="item.prop"
            :value-format="item.format"
            @update:modelValue="(value) => updateQueryField(item.prop, value)"
          ></el-date-picker>
          <component
            v-else-if="item.type === 'custom' && item.component"
            :is="item.component"
            :model-value="localQuery[item.prop]"
            :name="item.prop"
            v-bind="item.props || {}"
            @update:model-value="updateQueryField(item.prop, $event)"
          ></component>
        </el-form-item>
        <div class="button-wrapper">
          <div class="button-group">
            <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
            <el-button :icon="Refresh" @click="resetForm(searchRef)">重置</el-button>
          </div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TableSearch',
}
</script>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import type { PropType } from 'vue'
import { ref, reactive, watch } from 'vue'
import type { FormOptionList } from '@/types/form-option'

const emit = defineEmits(['update:query'])

const props = defineProps({
  query: { type: Object, required: true },
  options: { type: Array as PropType<Array<FormOptionList>>, required: true },
  search: { type: Function, default: () => {} },
  reset: { type: Function, default: () => {} },
  layout: { type: Number, default: 3 },
  fixedButtons: { type: Boolean, default: false },
})

// 使用本地状态来跟踪查询条件
const localQuery = reactive<Record<string, string | number | boolean>>({ ...props.query })

// 监听props.query的变化，同步到本地状态
watch(
  () => props.query,
  (newQuery) => {
    Object.keys(localQuery).forEach((key) => {
      delete localQuery[key]
    })
    Object.assign(localQuery, JSON.parse(JSON.stringify(newQuery)))
  },
  { deep: true, immediate: true },
)

// 监听本地状态的变化，同步到父组件
watch(
  localQuery,
  (newLocalQuery) => {
    emit('update:query', { ...newLocalQuery })
  },
  { deep: true },
)

const searchRef = ref<FormInstance>()

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  // 重置本地查询条件
  Object.keys(localQuery).forEach((key) => {
    localQuery[key] = ''
  })
  // 同步到父组件
  emit('update:query', { ...localQuery })
  // 重置表单DOM状态
  formEl.resetFields()
  // 调用父组件的reset方法
  props.reset()
}

const search = () => {
  props.search(localQuery)
}

// 更新查询字段的通用方法
const updateQueryField = (field: string, value: string | number | boolean | null): void => {
  localQuery[field] = value !== null ? value : ''
}

// 处理输入框变化，简化版本
const handleInputChange = (item: FormOptionList, value: string): void => {
  localQuery[item.prop] = value
}
</script>

<style scoped>
.search-container {
  background-color: #fff;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

:deep(.el-form) {
  display: flex;
  flex-wrap: wrap;
  padding-right: 30px;
}

.form-items {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(var(--form-items-per-row), minmax(0, 1fr));
  gap: 20px;
  align-items: start;
  padding-top: 15px;
}

:deep(.el-form-item) {
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
  min-height: 32px;
  max-width: 100%;
}

:deep(.el-form-item__label) {
  width: 100px !important;
  text-align: right;
  flex-shrink: 0;
  line-height: 32px;
  padding-right: 12px;
}

:deep(.el-form-item__content) {
  flex: 1;
  margin-left: 0 !important;
  line-height: 32px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

:deep(.el-input),
:deep(.el-select),
:deep(.el-date-picker) {
  width: 100%;
  max-width: 100%;
}

:deep(.el-select) {
  width: 100% !important;
}

:deep(.el-select .el-input) {
  width: 100% !important;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  line-height: 32px;
  width: 100%;
}

.button-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 32px;
  grid-column: -2 / -1;
}

.button-group {
  display: flex;
  gap: 10px;
  padding-left: 100px;
}

:deep(.el-select__wrapper),
:deep(.el-input__wrapper) {
  width: 100% !important;
  box-sizing: border-box !important;
}
</style>
