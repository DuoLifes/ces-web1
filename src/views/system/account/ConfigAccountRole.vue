<!-- 账号角色配置页面 -->
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
          <el-form-item label="运营商：" prop="tenantName">
            <el-input v-model="formData.tenantName" disabled class="form-input" />
          </el-form-item>

          <el-form-item label="局点：" prop="companyName">
            <el-input v-model="formData.companyName" disabled class="form-input" />
          </el-form-item>

          <el-form-item label="用户账号：" prop="username">
            <el-input v-model="formData.username" disabled class="form-input" />
          </el-form-item>

          <el-form-item label="用户名称：" prop="name">
            <el-input v-model="formData.name" disabled class="form-input" />
          </el-form-item>

          <el-form-item label="角色：" prop="roleIds" required>
            <el-select
              v-model="formData.roleIds"
              placeholder="请选择角色"
              class="form-select"
              :loading="loading.role"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
            >
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-footer">
          <div class="form-buttons">
            <el-button type="primary" @click="handleSubmit">确定</el-button>
            <el-popconfirm
              title="角色配置未保存，是否确定返回？"
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { fetchRoleData, getAccountDetail, updateAccountRole } from '@/api/account'
import type { RoleOption, Account } from '@/types/account'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive({
  tenantName: '',
  companyName: '',
  username: '',
  name: '',
  roleIds: [] as number[],
})

// 加载状态
const loading = reactive({
  role: false,
  detail: false,
})

// 角色选项
const roleOptions = ref<{ label: string; value: number }[]>([])

// 表单验证规则
const rules = {
  roleIds: [{ required: true, message: '请选择至少一个角色', trigger: 'change' }],
}

// 获取角色列表
const getRoleList = async () => {
  try {
    loading.role = true
    const res = await fetchRoleData()
    if (res.code === '00000') {
      roleOptions.value = (res.data || []).map((role: RoleOption) => ({
        label: role.name,
        value: role.id,
      }))
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.role = false
  }
}

// 获取账号详情
const getDetail = async (id: string) => {
  try {
    loading.detail = true
    const res = await getAccountDetail(Number(id))
    if (res.code === '00000') {
      const detail = res.data as Account
      // 设置表单数据
      Object.assign(formData, {
        tenantName: detail.tenantName,
        companyName: detail.companyName,
        username: detail.username,
        name: detail.name,
        roleIds: detail.roleIds || [],
      })
    } else {
      ElMessage.error(res.msg || '获取账号详情失败')
      handleBack()
    }
  } catch (error) {
    console.error('获取账号详情失败:', error)
    ElMessage.error('获取账号详情失败')
    handleBack()
  } finally {
    loading.detail = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const id = Number(route.params.id)
        const res = await updateAccountRole(id, formData.roleIds)
        if (res.code === '00000') {
          ElMessage.success('角色配置成功')
          router.push('/account')
        } else {
          ElMessage.error(res.msg || '角色配置失败')
        }
      } catch (error) {
        console.error('角色配置失败:', error)
        ElMessage.error('角色配置失败')
      }
    }
  })
}

// 返回上一页
const handleBack = () => {
  router.push('/account')
}

// 页面加载时获取数据
onMounted(() => {
  const id = route.params.id as string
  if (!id) {
    ElMessage.error('账号ID不能为空')
    handleBack()
    return
  }

  getRoleList()
  getDetail(id)
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
.form-input {
  width: 100%;
}

.form-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
