<!-- 配置标签局点页面 -->
<template>
  <div class="page-container">
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="tag-form"
        v-loading="loading"
      >
        <div class="form-content">
          <el-form-item label="标签名称：">
            <div class="info-text">{{ tagInfo.name }}</div>
          </el-form-item>
          <el-form-item label="标签类别：">
            <div class="info-text">{{ tagInfo.typeValue }}</div>
          </el-form-item>
          <el-form-item label="局点：" prop="companyList">
            <el-select
              v-model="formData.companyList"
              multiple
              collapse-tags-tooltip
              :max-collapse-tags="3"
              placeholder="请选择局点"
              class="form-select"
            >
              <el-option
                v-for="item in companyOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-footer">
          <div class="form-buttons">
            <el-button type="primary" @click="submitForm">确定</el-button>
            <el-popconfirm
              title="配置数据未保存，是否确定返回？"
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { configureTagCompany } from '@/api/tag'
import { fetchCompanyData } from '@/api/company'
import type { Tag } from '@/types/tag'
import type { Company } from '@/types/company'

defineOptions({ name: 'ConfigTagCompanyView' })

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const tagId = ref<number>(Number(route.params.id))

// 标签信息
const tagInfo = reactive({
  id: 0,
  name: '',
  type: 0,
  typeValue: '',
  companyIds: '',
  companyNames: '',
})

// 表单数据
const formData = reactive({
  companyList: [] as number[],
})

// 表单验证规则
const rules = {
  companyList: [{ required: true, message: '请选择局点', trigger: 'change' }],
}

// 局点选项
const companyOptions = ref<Array<{ value: number; label: string }>>([])

// 初始化局点选项
const initCompanyOptions = async (): Promise<void> => {
  try {
    loading.value = true
    const res = await fetchCompanyData({
      pageNo: 1,
      pageSize: 1000, // 设置足够大的数值，确保获取所有局点
    })

    if (res.code === '00000') {
      companyOptions.value = (res.data.records || []).map((item: Company) => ({
        value: item.id,
        label: item.name,
      }))
    } else {
      ElMessage.error(res.msg || '获取局点列表失败')
    }
  } catch {
    ElMessage.error('获取局点列表失败')
  } finally {
    loading.value = false
  }
}

// 获取标签详情
const getTagDetail = (): void => {
  if (!tagId.value) {
    ElMessage.error('标签ID无效')
    router.push('/tag')
    return
  }

  try {
    loading.value = true

    // 从URL查询参数中获取标签数据
    const tagDataParam = route.query.tagData as string

    if (tagDataParam) {
      // 解析URL传递过来的标签数据
      const tagData = JSON.parse(decodeURIComponent(tagDataParam)) as Tag

      if (tagData) {
        // 更新标签信息
        tagInfo.id = tagData.id
        tagInfo.name = tagData.name
        tagInfo.type = tagData.type
        tagInfo.typeValue = tagData.typeValue
        tagInfo.companyIds = tagData.companyIds
        tagInfo.companyNames = tagData.companyNames

        console.log('从URL获取到标签数据:', tagData)

        // 如果有已关联的局点，解析并设置为已选
        if (tagData.companyIds) {
          const companyIdList = tagData.companyIds.split(',').map((id) => parseInt(id.trim()))
          formData.companyList = companyIdList
        }
      } else {
        ElMessage.error('标签数据解析失败')
        router.push('/tag')
      }
    } else {
      ElMessage.error('未找到标签数据')
      router.push('/tag')
    }
  } catch (error) {
    console.error('解析标签数据失败:', error)
    ElMessage.error('获取标签信息失败')
    router.push('/tag')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async (): Promise<void> => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      return
    }

    try {
      loading.value = true
      const res = await configureTagCompany({
        id: tagId.value,
        companyList: formData.companyList,
      })

      if (res.code === '00000') {
        ElMessage.success('配置成功')
        router.push('/tag')
      } else {
        ElMessage.error(res.msg || '配置失败')
      }
    } catch {
      ElMessage.error('操作失败')
    } finally {
      loading.value = false
    }
  })
}

// 返回列表页
const goBack = (): void => {
  router.push('/tag')
}

// 页面加载时获取数据
onMounted(async () => {
  await initCompanyOptions()
  getTagDetail()
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

.form-select {
  width: 100%;
}

.form-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.info-text {
  line-height: 30px;
  font-size: 14px;
  color: #333;
  padding: 0 12px;
}
</style>
