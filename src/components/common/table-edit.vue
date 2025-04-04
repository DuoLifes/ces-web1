<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    :label-width="options.labelWidth"
    :validate-on-rule-change="false"
    status-icon
  >
    <el-row>
      <el-col :span="options.span" v-for="item in options.list" :key="item.prop">
        <el-form-item :label="item.label" :prop="item.prop">
          <!-- 文本框、数字框、下拉框、日期框、开关、上传 -->
          <el-input
            v-if="item.type === 'input'"
            v-model="form[item.prop]"
            :disabled="item.disabled"
            :placeholder="item.placeholder"
            clearable
            @update:model-value="(value) => handleFieldChange(item.prop, value)"
          ></el-input>
          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="form[item.prop]"
            :disabled="item.disabled"
            controls-position="right"
            @update:model-value="(value) => handleFieldChange(item.prop, value)"
          ></el-input-number>
          <el-select
            v-else-if="item.type === 'select' && !item.component"
            v-model="form[item.prop]"
            :disabled="item.disabled"
            :placeholder="item.placeholder"
            clearable
            @update:model-value="(value) => handleFieldChange(item.prop, value)"
          >
            <el-option
              v-for="opt in item.opts"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            ></el-option>
          </el-select>
          <el-input
            v-else-if="item.type === 'textarea'"
            v-model="form[item.prop]"
            :disabled="item.disabled"
            :placeholder="item.placeholder"
            type="textarea"
            :rows="4"
            @update:model-value="(value) => handleFieldChange(item.prop, value)"
          ></el-input>
          <el-date-picker
            v-else-if="item.type === 'date'"
            type="date"
            v-model="form[item.prop]"
            :value-format="item.format"
            @update:model-value="(value) => handleFieldChange(item.prop, value)"
          ></el-date-picker>
          <el-switch
            v-else-if="item.type === 'switch'"
            v-model="form[item.prop]"
            :active-value="item.activeValue"
            :inactive-value="item.inactiveValue"
            :active-text="item.activeText"
            :inactive-text="item.inactiveText"
            @update:model-value="(value) => handleFieldChange(item.prop, value)"
          ></el-switch>
          <el-upload
            v-else-if="item.type === 'upload'"
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
          >
            <img v-if="form[item.prop]" :src="form[item.prop]" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
          <component
            v-else-if="item.type === 'custom' && item.component"
            :is="item.component"
            v-model="form[item.prop]"
            v-bind="item.props || {}"
            class="custom-component"
            @update:model-value="(value) => handleFieldChange(item.prop, value)"
          ></component>
          <slot :name="item.prop" v-else> </slot>
        </el-form-item>
      </el-col>
    </el-row>

    <div class="dialog-footer">
      <el-button type="primary" @click="submitForm(formRef)">确 定</el-button>
      <el-button @click="cancelEdit">取 消</el-button>
    </div>
  </el-form>
</template>
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script lang="ts" setup>
import type { FormOption } from '@/types/form-option'
import type { FormInstance, FormRules, UploadProps, FormItemRule } from 'element-plus'
import type { PropType } from 'vue'
import { ref, watch, markRaw } from 'vue'

// 扩展表单选项接口以支持依赖字段
interface ExtendedFormOptionItem {
  type: string
  label: string
  prop: string
  placeholder?: string
  component?: unknown
  props?: Record<string, unknown>
  required?: boolean
  disabled?: boolean
  dependOn?: string // 依赖的字段名
}

const { options, formData, edit, update } = defineProps({
  options: {
    type: Object as PropType<FormOption>,
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  edit: {
    type: Boolean,
    required: false,
  },
  update: {
    type: Function,
    required: true,
  },
})

// 触发取消事件
const emit = defineEmits(['cancel', 'update:form-data'])

// 取消编辑的方法
const cancelEdit = () => {
  emit('cancel')
}

const form = ref({ ...(edit ? formData : {}) })
const formRef = ref<FormInstance>()

// 确保选项中的组件不会被设置为响应式
watch(
  () => options,
  (newOptions) => {
    if (newOptions && newOptions.list) {
      // 处理组件以确保它们不是响应式的
      newOptions.list.forEach((item) => {
        if (item.type === 'custom' && item.component) {
          // 确保组件使用markRaw包装
          item.component = markRaw(item.component)
        }
      })
    }
  },
  { deep: true, immediate: true },
)

// 监听formData的变化，确保表单数据同步更新
watch(
  () => formData,
  (newFormData) => {
    console.log('TableEdit: formData变化', JSON.stringify(newFormData))
    // 确保深拷贝所有属性，以防止引用问题
    form.value = JSON.parse(JSON.stringify(newFormData))
    console.log('TableEdit: 更新后的表单数据', JSON.stringify(form.value))
  },
  { deep: true, immediate: true },
)

// 处理表单字段值变化
const handleFieldChange = (prop: string, value: unknown) => {
  console.log(`字段 ${prop} 值变化:`, value)

  // 更新表单数据
  form.value[prop] = value

  // 处理依赖字段的更新
  if (options.list && Array.isArray(options.list)) {
    // 查找依赖于当前变化字段的表单项
    const dependentItems = options.list.filter(
      (item: ExtendedFormOptionItem) => item.dependOn === prop,
    )

    // 更新依赖字段的props
    if (dependentItems.length > 0) {
      console.log(`找到 ${dependentItems.length} 个依赖于 ${prop} 的字段`)

      dependentItems.forEach((item: ExtendedFormOptionItem) => {
        if (item.props) {
          // 特殊处理：当字段为companyId，依赖于tenantId时
          if (prop === 'tenantId' && item.prop === 'companyId') {
            console.log(`更新 ${item.prop} 的 tenantId 为:`, value)
            item.props.tenantId = value

            // 如果tenantId变化了，可能需要清空companyId的值
            if (item.props.autoClearOnTenantChange) {
              console.log('由于运营商变化，清空局点选择')
              form.value[item.prop] = ''

              // 清空网格选择和营销组选择
              if (form.value['gridId']) {
                form.value['gridId'] = ''

                // 清空所有网格组件中的companyId属性
                const gridItem = options.list.find(
                  (gi: ExtendedFormOptionItem) => gi.prop === 'gridId',
                )

                if (gridItem && gridItem.props) {
                  console.log('*** 清空网格选择器的companyId属性 ***')
                  gridItem.props.companyId = ''
                }
              }

              // 处理营销组选择（如果存在）
              if (form.value['marketingGroupId']) {
                form.value['marketingGroupId'] = ''

                // 清空所有营销组组件中的companyId属性
                const marketingGroupItem = options.list.find(
                  (gi: ExtendedFormOptionItem) => gi.prop === 'marketingGroupId',
                )

                if (marketingGroupItem && marketingGroupItem.props) {
                  console.log('*** 清空营销组选择器的companyId属性 ***')
                  marketingGroupItem.props.companyId = ''
                }
              }

              // 立即触发更新，确保UI同步
              emit('update:form-data', { ...form.value })
            }
          }

          // 特殊处理：当字段为gridId，依赖于companyId时
          if (prop === 'companyId' && item.prop === 'gridId') {
            console.log(`更新 ${item.prop} 的 companyId 为:`, value)
            item.props.companyId = value

            // 如果companyId变化了，可能需要清空gridId的值
            if (item.props.autoClearOnCompanyChange) {
              console.log('由于局点变化，清空网格选择')
              form.value[item.prop] = ''
            }
          }

          // 特殊处理：当字段为marketingGroupId，依赖于companyId时
          if (prop === 'companyId' && item.prop === 'marketingGroupId') {
            console.log(`更新 ${item.prop} 的 companyId 为:`, value)
            item.props.companyId = value

            // 如果companyId变化了，可能需要清空marketingGroupId的值
            if (item.props.autoClearOnCompanyChange) {
              console.log('由于局点变化，清空营销组选择')
              form.value[item.prop] = ''
            }
          }
        }
      })
    }
  }

  // 触发update:form-data事件
  emit('update:form-data', { ...form.value })
}

// 生成校验规则
const rules: FormRules = options.list.reduce((acc, item) => {
  if (item.required) {
    const baseRule: FormItemRule = {
      required: true,
      message: `请选择${item.label}`,
      trigger: item.type === 'select' || item.type === 'custom' ? 'change' : 'blur',
    }

    // 根据字段类型添加额外的校验规则
    const fieldRules: FormItemRule[] = [baseRule]

    if (item.type === 'input') {
      baseRule.whitespace = true // 不允许纯空格
      baseRule.message = `请输入${item.label}`
    } else if (item.type === 'number') {
      fieldRules.push({
        type: 'number',
        message: `${item.label}必须是数字`,
        trigger: 'change',
      })
    } else if (item.type === 'custom') {
      // 为自定义组件添加特殊验证，允许数字0作为有效值
      baseRule.validator = (rule, value, callback) => {
        if (value === 0 || value) {
          callback()
        } else {
          callback(new Error(baseRule.message as string))
        }
      }
    }

    acc[item.prop] = fieldRules
  }
  return acc
}, {} as FormRules)

// 提交表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  try {
    await formEl.validate((valid) => {
      if (valid) {
        update(form.value)
      } else {
      }
    })
  } catch (e) {}
}

// 重置表单方法
const resetFields = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 暴露方法给父组件
defineExpose({
  resetFields,
})

const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
  form.value.thumb = URL.createObjectURL(uploadFile.raw!)
}
</script>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer :deep(.el-form-item__content) {
  justify-content: center;
  margin-left: 0 !important;
}

.dialog-footer .el-button {
  padding-left: 25px;
  padding-right: 25px;
  margin: 0 10px;
}

/* 确保所有表单控件宽度一致 */
:deep(.el-select),
:deep(.el-input),
:deep(.el-textarea),
:deep(.el-date-picker),
:deep(.el-input-number) {
  width: 90%;
}

/* 自定义组件也应用相同的宽度限制 */
:deep(.custom-component) {
  width: 90% !important; /* 强制应用此宽度，覆盖组件内部样式 */
  display: inline-block;
}
</style>
