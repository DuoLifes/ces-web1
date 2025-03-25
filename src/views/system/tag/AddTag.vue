<!-- 新增标签页面 -->
<template>
  <div class="page-container">
    <div class="container">
      <div class="form-header">
        <div class="title-bar"></div>
        <h2 class="title">新增标签</h2>
      </div>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" class="tag-form">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签类别" prop="type">
          <el-select v-model="formData.type" placeholder="请选择标签类别">
            <el-option :value="0" label="基础标签" />
            <el-option :value="1" label="高级标签" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { addTag } from '@/api/tag'

defineOptions({ name: 'AddTagView' })

const router = useRouter()
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive({
  name: '',
  type: 0,
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 50, message: '标签名称长度应在1-50个字符之间', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择标签类别', trigger: 'change' }],
}

// 提交表单
const submitForm = async (): Promise<void> => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        const res = await addTag({
          name: formData.name,
          type: formData.type,
        })

        if (res.code === '00000') {
          ElMessage.success('添加成功')
          router.push('/tag')
        } else {
          ElMessage.error(res.msg || '添加失败')
        }
      } catch {
        ElMessage.error('操作失败')
      }
    } else {
      console.log('表单验证失败:', fields)
    }
  })
}

// 返回列表页
const goBack = (): void => {
  router.push('/tag')
}
</script>

<style scoped>
.form-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.title-bar {
  width: 4px;
  height: 20px;
  background-color: var(--el-color-primary);
  margin-right: 8px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.tag-form {
  max-width: 600px;
}

.tag-form :deep(.el-input),
.tag-form :deep(.el-select) {
  width: 300px;
}
</style>
