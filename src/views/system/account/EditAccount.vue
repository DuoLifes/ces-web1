<template>
  <div class="page-container">
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="account-form"
      >
        <div class="form-content">
          <el-form-item label="运营商：" prop="tenantId" required>
            <TenantSelect
              v-model="formData.tenantId"
              placeholder="请选择运营商"
              class="form-select tenant-select"
              :showAll="false"
              :clearable="false"
              @update:modelValue="handleTenantChange"
              ref="tenantSelectRef"
            />
          </el-form-item>

          <el-form-item label="局点名称：" prop="companyId" required>
            <CompanySelect
              v-model="formData.companyId"
              placeholder="请选择局点"
              class="form-select company-select"
              :tenantId="formData.tenantId"
              :showAll="false"
              :clearable="false"
              :autoClearOnTenantChange="false"
              @update:modelValue="handleCompanyChange"
              ref="companySelectRef"
            />
          </el-form-item>

          <el-form-item label="营销组：" prop="marketingGroups" required>
            <MarketingGroupMultiSelect
              v-model="formData.marketingGroups"
              placeholder="请选择营销组"
              class="form-select marketing-group-select"
              :companyId="formData.companyId"
              :showAll="false"
              :clearable="true"
              :autoClearOnCompanyChange="false"
              ref="marketingGroupSelectRef"
            />
          </el-form-item>

          <el-form-item label="用户账号：" prop="username" required>
            <el-input
              v-model="formData.username"
              placeholder="请输入用户账号"
              class="form-input"
              clearable
            />
          </el-form-item>

          <el-form-item label="用户名称：" prop="realName" required>
            <el-input
              v-model="formData.realName"
              placeholder="请输入用户名称"
              class="form-input"
              clearable
            />
          </el-form-item>

          <el-form-item label="是否启用：" prop="enabled">
            <el-switch v-model="formData.enabled" />
          </el-form-item>

          <el-form-item label="有效期配置：" prop="validityType" required>
            <div class="validity-config">
              <el-radio-group v-model="formData.validityType" class="validity-radio-group">
                <el-radio :value="'permanent'">永久</el-radio>
                <el-radio :value="'custom'">自定义</el-radio>
              </el-radio-group>
              <el-form-item
                v-if="formData.validityType === 'custom'"
                prop="expireDate"
                class="date-form-item"
              >
                <template #default>
                  <div class="validity-date">
                    <span class="validity-text">截止到</span>
                    <div class="date-picker-wrapper">
                      <el-date-picker
                        v-model="formData.expireDate"
                        type="date"
                        placeholder="请选择日期"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                        :disabled-date="disablePastDates"
                      />
                    </div>
                    <span class="validity-text">前有效</span>
                  </div>
                </template>
              </el-form-item>
            </div>
          </el-form-item>
        </div>

        <div class="form-footer">
          <div class="form-buttons">
            <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
            <el-popconfirm
              title="修改数据未保存，是否确定返回？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleBack"
              width="300"
            >
              <template #reference>
                <el-button>返回</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { updateAccount } from '@/api/account'
import TenantSelect from '@/components/tenant/TenantSelect.vue'
import CompanySelect from '@/components/company/CompanySelect.vue'
import MarketingGroupMultiSelect from '@/components/marketing-group/MarketingGroupMultiSelect.vue'

// 组件名称
defineOptions({ name: 'EditAccountView' })

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
// 初始化状态标记
const isInitializing = ref(true)

// 组件引用类型定义
interface TenantSelectInstance {
  refreshTenantList: () => void
}

interface CompanySelectInstance {
  getCompanyList: () => void
}

interface MarketingGroupSelectInstance {
  refreshMarketingGroupList: () => void
}

// 组件引用
const tenantSelectRef = ref<TenantSelectInstance | null>(null)
const companySelectRef = ref<CompanySelectInstance | null>(null)
const marketingGroupSelectRef = ref<MarketingGroupSelectInstance | null>(null)

// 表单数据
const formData = reactive({
  id: '',
  tenantId: '',
  companyId: '',
  marketingGroups: [] as Array<number | string>,
  username: '',
  realName: '',
  roleId: '',
  enabled: true,
  validityType: 'permanent', // 永久 或 自定义
  expireDate: '',
})

// 表单验证规则
const rules = {
  tenantId: [{ required: true, message: '请选择运营商', trigger: 'change' }],
  companyId: [{ required: true, message: '请选择局点', trigger: 'change' }],
  marketingGroups: [{ required: true, message: '请选择营销组', trigger: 'change' }],
  username: [
    { required: true, message: '请输入用户账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入用户名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  validityType: [{ required: true, message: '请选择有效期类型', trigger: 'change' }],
  expireDate: [
    {
      validator: (rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (formData.validityType === 'custom' && !value) {
          callback(new Error('请选择有效期'))
        } else {
          callback()
        }
      },
      trigger: 'change',
      required: true,
    },
  ],
}

// 禁用过去的日期
const disablePastDates = (date: Date) => {
  return date.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
}

// 运营商变化处理
const handleTenantChange = () => {
  // 只在非初始化状态下清空依赖值
  if (!isInitializing.value) {
    formData.companyId = ''
    formData.marketingGroups = []
  }
}

// 局点变化处理
const handleCompanyChange = () => {
  // 只在非初始化状态下清空依赖值
  if (!isInitializing.value) {
    formData.marketingGroups = []
  }
}

// 从查询参数中初始化表单数据
const initFormDataFromQuery = async () => {
  try {
    // 设置为初始化状态，避免触发级联清空
    isInitializing.value = true

    const dataParam = route.query.data as string
    if (dataParam) {
      const accountData = JSON.parse(decodeURIComponent(dataParam))

      // 按顺序设置非级联字段
      formData.id = String(accountData.id)
      formData.username = accountData.username
      formData.realName = accountData.realName
      formData.roleId = accountData.roleId ? accountData.roleId : ''
      formData.enabled = accountData.enabled === 1 || accountData.enabled === true

      // 设置有效期 - 修改判断条件以兼容带时间的日期格式
      if (accountData.expireDate && accountData.expireDate.includes('2099-12-31')) {
        formData.validityType = 'permanent'
        formData.expireDate = ''
      } else {
        formData.validityType = 'custom'
        formData.expireDate = accountData.expireDate
      }

      // 按特定顺序设置级联字段，保持原始数据类型
      formData.tenantId = accountData.tenantId
      formData.companyId = accountData.companyId

      // 确保营销组数据是数字ID数组
      if (accountData.marketingGroups && Array.isArray(accountData.marketingGroups)) {
        formData.marketingGroups = accountData.marketingGroups.map((id: number | string) =>
          Number(id),
        )
      } else {
        formData.marketingGroups = []
      }

      // 使用nextTick确保各组件已渲染，然后刷新组件数据
      await nextTick()

      // 刷新租户选择器数据
      if (tenantSelectRef.value?.refreshTenantList) {
        tenantSelectRef.value.refreshTenantList()
      }

      // 刷新公司选择器数据
      if (companySelectRef.value?.getCompanyList) {
        companySelectRef.value.getCompanyList()
      }

      // 刷新营销组选择器数据
      if (marketingGroupSelectRef.value?.refreshMarketingGroupList) {
        marketingGroupSelectRef.value.refreshMarketingGroupList()
      }

      // 初始化完成
      isInitializing.value = false
    } else {
      ElMessage.error('获取账号信息失败')
      router.push('/account')
    }
  } catch {
    ElMessage.error('获取账号信息失败')
    router.push('/account')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true

        // 处理永久有效期
        const finalExpireDate =
          formData.validityType === 'permanent' ? '2099-12-31' : formData.expireDate

        // 处理提交数据 - 确保类型正确转换
        const params = {
          id: Number(formData.id),
          tenantId: Number(formData.tenantId),
          companyId: Number(formData.companyId),
          marketingGroups: Array.isArray(formData.marketingGroups)
            ? formData.marketingGroups.map((id) => Number(id))
            : [],
          roleId: formData.roleId ? Number(formData.roleId) : undefined,
          enabled: formData.enabled ? 1 : 0,
          expireDate: finalExpireDate,
          username: formData.username,
          realName: formData.realName,
        }

        // 调用更新账号API
        const res = await updateAccount(params)

        if (res.code === '00000') {
          ElMessage.success('更新账号成功')
          router.push('/account')
        } else {
          ElMessage.error(res.msg || '更新账号失败')
        }
      } catch {
        ElMessage.error('更新账号失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 返回账号列表
const handleBack = () => {
  router.push('/account')
}

// 组件挂载时初始化数据
onMounted(() => {
  initFormDataFromQuery()
})
</script>

<style scoped>
.page-container {
  height: calc(100vh - 120px); /* 减去头部和面包屑的高度 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.form-container {
  background-color: #fff;
  border-radius: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 50px;
}

.account-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-content {
  flex: 1;
  padding: 20px 0;
}

.form-footer {
  border-top: 1px solid #dcdfe6;
  padding: 16px 0;
  background-color: #fff;
  margin-top: auto; /* 将按钮区域推到底部 */
}

.form-select,
.form-input,
.form-date-picker {
  width: 100%;
}

.validity-config {
  display: flex;
  flex-direction: column;
}

.validity-radio-group {
  display: flex;
  align-items: center;
  height: 32px; /* 与输入框高度保持一致 */
}

.validity-date {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.validity-text {
  color: #606266;
  white-space: nowrap;
}

:deep(.el-radio) {
  margin-right: 30px;
}

:deep(.el-date-editor.el-input) {
  width: 180px;
}

.form-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.required-mark {
  color: var(--el-color-danger);
  margin-right: 4px;
}

.date-form-item {
  margin-bottom: 0;
  margin-top: 8px;
}

.date-picker-wrapper {
  display: flex;
  flex-direction: column;
}

.date-form-item :deep(.el-form-item__error) {
  padding-top: 2px;
  position: absolute;
  top: 100%;
  left: 50px; /* 调整为与日期选择器前缘对齐，再向右移动4px */
}
</style>
