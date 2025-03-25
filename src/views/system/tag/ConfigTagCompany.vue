<!-- 配置标签局点页面 -->
<template>
  <div class="page-container">
    <div class="container">
      <div class="form-header">
        <div class="title-bar"></div>
        <h2 class="title">配置标签局点</h2>
      </div>
      <el-form ref="formRef" label-width="120px" class="tag-form" v-loading="loading">
        <el-form-item label="标签名称">
          <div class="info-text">{{ tagInfo.name }}</div>
        </el-form-item>
        <el-form-item label="标签类别">
          <div class="info-text">{{ tagInfo.typeValue }}</div>
        </el-form-item>
        <el-form-item label="关联局点" prop="companyList">
          <el-select
            v-model="selectedCompanies"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择关联局点"
            style="width: 100%"
          >
            <el-option
              v-for="item in companyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { fetchTagData, configureTagCompany } from '@/api/tag'
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

// 局点选项
const companyOptions = ref<Array<{ value: number; label: string }>>([])
// 已选择的局点
const selectedCompanies = ref<number[]>([])

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
const getTagDetail = async (): Promise<void> => {
  if (!tagId.value) {
    ElMessage.error('标签ID无效')
    router.push('/tag')
    return
  }

  try {
    loading.value = true
    const res = await fetchTagData({
      pageNo: 1,
      pageSize: 10,
    })

    if (res.code === '00000') {
      // 找到当前ID的标签
      const tag = res.data.records.find((item: Tag) => item.id === tagId.value)
      if (tag) {
        // 更新标签信息
        tagInfo.id = tag.id
        tagInfo.name = tag.name
        tagInfo.type = tag.type
        tagInfo.typeValue = tag.typeValue
        tagInfo.companyIds = tag.companyIds
        tagInfo.companyNames = tag.companyNames

        // 如果有已关联的局点，解析并设置为已选
        if (tag.companyIds) {
          const companyIdList = tag.companyIds.split(',').map((id) => parseInt(id.trim()))
          selectedCompanies.value = companyIdList
        }
      } else {
        ElMessage.error('未找到标签信息')
        router.push('/tag')
      }
    } else {
      ElMessage.error(res.msg || '获取标签信息失败')
      router.push('/tag')
    }
  } catch {
    ElMessage.error('获取标签信息失败')
    router.push('/tag')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async (): Promise<void> => {
  try {
    loading.value = true
    const res = await configureTagCompany({
      id: tagId.value,
      companyList: selectedCompanies.value,
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
}

// 返回列表页
const goBack = (): void => {
  router.push('/tag')
}

// 页面加载时获取数据
onMounted(async () => {
  await initCompanyOptions()
  await getTagDetail()
})
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

.info-text {
  line-height: 30px;
  font-size: 14px;
}
</style>
