<!-- 新增标签页面 -->
<template>
  <div class="page-container">
    <div class="form-container">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" class="tag-form">
        <div class="form-content">
          <el-form-item label="标签名称：" prop="name" required>
            <el-input
              v-model="formData.name"
              placeholder="请输入标签名称"
              class="form-input"
              clearable
            />
          </el-form-item>
          <el-form-item label="标签类别：" prop="type" required>
            <el-select v-model="formData.type" placeholder="请选择标签类别" class="form-select">
              <el-option :value="1" label="基础标签" />
              <el-option :value="2" label="高级标签" />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-footer">
          <div class="form-buttons">
            <el-button type="primary" @click="submitForm">确定</el-button>
            <el-popconfirm
              title="新建数据未保存，是否确定返回？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="goBack"
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
  type: 1,
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

.tag-form {
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
